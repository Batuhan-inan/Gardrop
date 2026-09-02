using System.Security.Claims;
using GardiropApp.Data;
using GardiropApp.Models;
using GardiropApp.Repositories;
using GardiropApp.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Render / Bulut ortamları için dinamik PORT desteği
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// Veritabanı ve Repository bağımlılıklarını ekle
builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddSingleton<DatabaseInitializer>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<CategoryRepository>();
builder.Services.AddScoped<ClothingRepository>();
builder.Services.AddScoped<OutfitRepository>();

// Çerez (Cookie) tabanlı kimlik doğrulama
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "GardiropApp_Auth";
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// JSON serileştirme ayarları
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

var app = builder.Build();

// Veritabanını ve varsayılan tabloları/kategorileri başlat
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    initializer.Initialize();
}

// Statik dosyaları (HTML, CSS, JS ve uploads) sun
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Yardımcı metod: Kullanıcı kimliğini claim'den al
int GetUserId(ClaimsPrincipal user)
{
    var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return int.TryParse(claim, out var id) ? id : 0;
}

#region AUTH ENDPOINTS
var authGroup = app.MapGroup("/api/auth");

authGroup.MapPost("/register", async (
    [FromBody] RegisterRequest request,
    UserRepository userRepo,
    HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { message = "Kullanıcı adı ve şifre zorunludur." });

    if (request.Username.Length < 3)
        return Results.BadRequest(new { message = "Kullanıcı adı en az 3 karakter olmalıdır." });

    if (request.Password.Length < 4)
        return Results.BadRequest(new { message = "Şifre en az 4 karakter olmalıdır." });

    if (await userRepo.ExistsAsync(request.Username))
        return Results.Conflict(new { message = "Bu kullanıcı adı zaten kullanılıyor." });

    var user = new User
    {
        Username = request.Username.Trim(),
        PasswordHash = PasswordHasher.Hash(request.Password),
        FullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Username : request.FullName.Trim()
    };

    user.Id = await userRepo.CreateAsync(user);

    // Otomatik giriş yaptır
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Username),
        new("FullName", user.FullName)
    };

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

    return Results.Ok(new { id = user.Id, username = user.Username, fullName = user.FullName });
});

authGroup.MapPost("/login", async (
    [FromBody] LoginRequest request,
    UserRepository userRepo,
    HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { message = "Kullanıcı adı ve şifre zorunludur." });

    var user = await userRepo.GetByUsernameAsync(request.Username);
    if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        return Results.Unauthorized();

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Username),
        new("FullName", user.FullName)
    };

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

    return Results.Ok(new { id = user.Id, username = user.Username, fullName = user.FullName });
});

authGroup.MapPost("/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { message = "Başarıyla çıkış yapıldı." });
}).RequireAuthorization();

authGroup.MapGet("/me", (ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == 0) return Results.Unauthorized();

    return Results.Ok(new
    {
        id = userId,
        username = user.FindFirst(ClaimTypes.Name)?.Value,
        fullName = user.FindFirst("FullName")?.Value
    });
}).RequireAuthorization();

authGroup.MapPut("/profile", async (
    [FromBody] UpdateProfileRequest request,
    UserRepository userRepo,
    ClaimsPrincipal userPrincipal,
    HttpContext httpContext) =>
{
    var userId = GetUserId(userPrincipal);
    if (userId == 0) return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(request.Username))
        return Results.BadRequest(new { message = "Kullanıcı adı boş bırakılamaz." });

    if (request.Username.Trim().Length < 3)
        return Results.BadRequest(new { message = "Kullanıcı adı en az 3 karakter olmalıdır." });

    if (await userRepo.ExistsExceptUserAsync(request.Username, userId))
        return Results.Conflict(new { message = "Bu kullanıcı adı başka bir hesap tarafından kullanılıyor." });

    var fullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Username.Trim() : request.FullName.Trim();
    var success = await userRepo.UpdateProfileAsync(userId, request.Username, fullName);
    if (!success) return Results.StatusCode(500);

    // Oturum çerezini güncelle
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, userId.ToString()),
        new(ClaimTypes.Name, request.Username.Trim()),
        new("FullName", fullName)
    };
    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

    return Results.Ok(new { id = userId, username = request.Username.Trim(), fullName });
}).RequireAuthorization();

authGroup.MapPut("/change-password", async (
    [FromBody] ChangePasswordRequest request,
    UserRepository userRepo,
    ClaimsPrincipal userPrincipal) =>
{
    var userId = GetUserId(userPrincipal);
    if (userId == 0) return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        return Results.BadRequest(new { message = "Mevcut şifre ve yeni şifre zorunludur." });

    if (request.NewPassword.Length < 4)
        return Results.BadRequest(new { message = "Yeni şifre en az 4 karakter olmalıdır." });

    var user = await userRepo.GetByIdAsync(userId);
    if (user == null) return Results.NotFound();

    if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        return Results.BadRequest(new { message = "Mevcut şifrenizi hatalı girdiniz." });

    var newHash = PasswordHasher.Hash(request.NewPassword);
    var success = await userRepo.UpdatePasswordAsync(userId, newHash);
    return success 
        ? Results.Ok(new { message = "Şifreniz başarıyla değiştirildi." }) 
        : Results.StatusCode(500);
}).RequireAuthorization();
#endregion

#region CATEGORY ENDPOINTS
app.MapGet("/api/categories", async (CategoryRepository categoryRepo) =>
{
    var categories = await categoryRepo.GetAllAsync();
    return Results.Ok(categories);
});
#endregion

#region CLOTHING ENDPOINTS
var clothingGroup = app.MapGroup("/api/clothes").RequireAuthorization();

clothingGroup.MapGet("/", async (
    [FromQuery] int? categoryId,
    [FromQuery] string? color,
    [FromQuery] string? season,
    [FromQuery] string? search,
    [FromQuery] bool? onlyUnworn,
    [FromQuery] bool? onlyFavorites,
    ClothingRepository repo,
    ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var filter = new FilterClothingRequest(categoryId, color, season, search, onlyUnworn, onlyFavorites);
    var items = await repo.GetAllForUserAsync(userId, filter);
    return Results.Ok(items);
});

clothingGroup.MapGet("/colors", async (ClothingRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var colors = await repo.GetDistinctColorsForUserAsync(userId);
    return Results.Ok(colors);
});

clothingGroup.MapGet("/{id:int}", async (int id, ClothingRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var item = await repo.GetByIdAsync(id, userId);
    return item != null ? Results.Ok(item) : Results.NotFound();
});

clothingGroup.MapPost("/", async (
    [FromBody] CreateClothingRequest request,
    ClothingRepository repo,
    ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);

    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest(new { message = "Kıyafet adı zorunludur." });

    var item = new ClothingItem
    {
        UserId = userId,
        Name = request.Name.Trim(),
        CategoryId = request.CategoryId,
        Color = request.Color.Trim(),
        ColorHex = request.ColorHex?.Trim(),
        Season = string.IsNullOrWhiteSpace(request.Season) ? "Dört Mevsim" : request.Season.Trim(),
        ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? "/images/placeholder.svg" : request.ImageUrl.Trim(),
        Brand = request.Brand?.Trim(),
        Notes = request.Notes?.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    var id = await repo.CreateAsync(item);
    var created = await repo.GetByIdAsync(id, userId);
    return Results.Created($"/api/clothes/{id}", created);
});

clothingGroup.MapPut("/{id:int}", async (
    int id,
    [FromBody] UpdateClothingRequest request,
    ClothingRepository repo,
    ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var existing = await repo.GetByIdAsync(id, userId);
    if (existing == null) return Results.NotFound();

    existing.Name = request.Name.Trim();
    existing.CategoryId = request.CategoryId;
    existing.Color = request.Color.Trim();
    existing.ColorHex = request.ColorHex?.Trim();
    existing.Season = request.Season.Trim();
    existing.ImageUrl = request.ImageUrl.Trim();
    existing.Brand = request.Brand?.Trim();
    existing.Notes = request.Notes?.Trim();
    existing.IsFavorite = request.IsFavorite;

    var success = await repo.UpdateAsync(existing);
    return success ? Results.Ok(existing) : Results.StatusCode(500);
});

clothingGroup.MapDelete("/{id:int}", async (int id, ClothingRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var success = await repo.DeleteAsync(id, userId);
    return success ? Results.NoContent() : Results.NotFound();
});

clothingGroup.MapPost("/{id:int}/favorite", async (int id, ClothingRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var success = await repo.ToggleFavoriteAsync(id, userId);
    return success ? Results.Ok(new { message = "Favori durumu güncellendi." }) : Results.NotFound();
});

clothingGroup.MapPost("/{id:int}/worn", async (int id, ClothingRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var success = await repo.MarkAsWornAsync(id, userId);
    return success ? Results.Ok(new { message = "Giyildi olarak işaretlendi." }) : Results.NotFound();
});

// Dosya / Fotoğraf Yükleme Uç Noktası (Mobil kamera & galeriden gelen görseller)
clothingGroup.MapPost("/upload", async (IFormFile file, IWebHostEnvironment env) =>
{
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { message = "Lütfen geçerli bir görsel dosyası seçin." });

    if (file.Length > 10 * 1024 * 1024) // Maksimum 10 MB
        return Results.BadRequest(new { message = "Görsel boyutu en fazla 10 MB olabilir." });

    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

    if (!allowedExtensions.Contains(ext))
        return Results.BadRequest(new { message = "Yalnızca JPG, PNG, WEBP ve GIF formatları desteklenmektedir." });

    var uploadsFolder = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
    if (!Directory.Exists(uploadsFolder))
        Directory.CreateDirectory(uploadsFolder);

    var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    var relativeUrl = $"/uploads/{uniqueFileName}";
    return Results.Ok(new { url = relativeUrl });
}).DisableAntiforgery();
#endregion

#region OUTFIT ENDPOINTS
var outfitGroup = app.MapGroup("/api/outfits").RequireAuthorization();

outfitGroup.MapGet("/", async (OutfitRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var outfits = await repo.GetAllForUserAsync(userId);
    return Results.Ok(outfits);
});

outfitGroup.MapGet("/{id:int}", async (int id, OutfitRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var outfit = await repo.GetByIdAsync(id, userId);
    return outfit != null ? Results.Ok(outfit) : Results.NotFound();
});

outfitGroup.MapPost("/", async (
    [FromBody] CreateOutfitRequest request,
    OutfitRepository repo,
    ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);

    if (string.IsNullOrWhiteSpace(request.Name))
        return Results.BadRequest(new { message = "Kombin adı zorunludur." });

    if (request.ClothingItemIds == null || request.ClothingItemIds.Count == 0)
        return Results.BadRequest(new { message = "Kombin için en az bir kıyafet seçmelisiniz." });

    var outfit = new Outfit
    {
        UserId = userId,
        Name = request.Name.Trim(),
        Description = request.Description?.Trim(),
        CreatedAt = DateTime.UtcNow
    };

    var outfitId = await repo.CreateAsync(outfit, request.ClothingItemIds);
    var created = await repo.GetByIdAsync(outfitId, userId);
    return Results.Created($"/api/outfits/{outfitId}", created);
});

outfitGroup.MapDelete("/{id:int}", async (int id, OutfitRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var success = await repo.DeleteAsync(id, userId);
    return success ? Results.NoContent() : Results.NotFound();
});

outfitGroup.MapPost("/{id:int}/worn", async (int id, OutfitRepository repo, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    var success = await repo.MarkAsWornAsync(id, userId);
    return success ? Results.Ok(new { message = "Kombin giyildi olarak işaretlendi ve kıyafetlerin son giyilme tarihleri güncellendi." }) : Results.NotFound();
});
#endregion

app.Run();
