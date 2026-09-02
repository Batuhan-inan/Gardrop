namespace GardiropApp.Models;

public class ClothingItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string Season { get; set; } = string.Empty; // Yazlık, Kışlık, Baharlık, Dört Mevsim
    public string ImageUrl { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Notes { get; set; }
    public DateTime? LastWornDate { get; set; }
    public int WearCount { get; set; } = 0;
    public bool IsFavorite { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
