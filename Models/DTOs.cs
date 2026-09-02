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
