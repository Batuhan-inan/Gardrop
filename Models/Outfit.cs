namespace GardiropApp.Models;

public class Outfit
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? LastWornDate { get; set; }
    public int WearCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Kombine dahil olan kıyafetler listesi
    public List<ClothingItem> Items { get; set; } = new();
}

public class OutfitItemRecord
{
    public int OutfitId { get; set; }
    public int ClothingItemId { get; set; }
}
