namespace GardiropApp.Models;

public record RegisterRequest(string Username, string Password, string FullName);
public record LoginRequest(string Username, string Password);
public record UpdateProfileRequest(string Username, string FullName);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record CreateClothingRequest(
    string Name,
    int CategoryId,
    string Color,
    string? ColorHex,
    string Season,
    string ImageUrl,
    string? Brand,
    string? Notes
);

public record UpdateClothingRequest(
    string Name,
    int CategoryId,
    string Color,
    string? ColorHex,
    string Season,
    string ImageUrl,
    string? Brand,
    string? Notes,
    bool IsFavorite
);

public record CreateOutfitRequest(
    string Name,
    string? Description,
    List<int> ClothingItemIds
);

public record FilterClothingRequest(
    int? CategoryId,
    string? Color,
    string? Season,
    string? Search,
    bool? OnlyUnworn,
    bool? OnlyFavorites
);

public class AdminUserSummaryDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ClothingCount { get; set; }
    public int OutfitCount { get; set; }
    public string? LastActiveDate { get; set; }
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalClothes { get; set; }
    public int TotalOutfits { get; set; }
    public int TotalWornCount { get; set; }
}
