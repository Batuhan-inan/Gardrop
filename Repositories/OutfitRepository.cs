using Dapper;
using GardiropApp.Data;
using GardiropApp.Models;

namespace GardiropApp.Repositories;

public class OutfitRepository
{
    private readonly DbConnectionFactory _db;

    public OutfitRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Outfit>> GetAllForUserAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT 
                o.Id, o.UserId, o.Name, o.Description, o.LastWornDate, o.WearCount, o.CreatedAt,
                c.Id, c.UserId, c.Name, c.CategoryId, cat.Name AS CategoryName,
                c.Color, c.ColorHex, c.Season, c.ImageUrl, c.Brand, c.Notes,
                c.LastWornDate, c.WearCount, c.IsFavorite, c.CreatedAt
            FROM Outfits o
            LEFT JOIN OutfitItems oi ON o.Id = oi.OutfitId
            LEFT JOIN ClothingItems c ON oi.ClothingItemId = c.Id
            LEFT JOIN Categories cat ON c.CategoryId = cat.Id
            WHERE o.UserId = @UserId
            ORDER BY o.Id DESC;
        ";

        var outfitDict = new Dictionary<int, Outfit>();

        await conn.QueryAsync<Outfit, ClothingItem, Outfit>(sql, (outfit, item) =>
        {
            if (!outfitDict.TryGetValue(outfit.Id, out var currentOutfit))
            {
                currentOutfit = outfit;
                currentOutfit.Items = new List<ClothingItem>();
                outfitDict.Add(currentOutfit.Id, currentOutfit);
            }

            if (item != null && item.Id > 0)
            {
                currentOutfit.Items.Add(item);
            }

            return currentOutfit;
        }, new { UserId = userId }, splitOn: "Id");

        return outfitDict.Values;
    }

    public async Task<Outfit?> GetByIdAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT 
                o.Id, o.UserId, o.Name, o.Description, o.LastWornDate, o.WearCount, o.CreatedAt,
                c.Id, c.UserId, c.Name, c.CategoryId, cat.Name AS CategoryName,
                c.Color, c.ColorHex, c.Season, c.ImageUrl, c.Brand, c.Notes,
                c.LastWornDate, c.WearCount, c.IsFavorite, c.CreatedAt
            FROM Outfits o
            LEFT JOIN OutfitItems oi ON o.Id = oi.OutfitId
            LEFT JOIN ClothingItems c ON oi.ClothingItemId = c.Id
            LEFT JOIN Categories cat ON c.CategoryId = cat.Id
            WHERE o.Id = @Id AND o.UserId = @UserId;
        ";

        Outfit? result = null;

        await conn.QueryAsync<Outfit, ClothingItem, Outfit>(sql, (outfit, item) =>
        {
            if (result == null)
            {
                result = outfit;
                result.Items = new List<ClothingItem>();
            }

            if (item != null && item.Id > 0)
            {
                result.Items.Add(item);
            }

            return result;
        }, new { Id = id, UserId = userId }, splitOn: "Id");

        return result;
    }

    public async Task<int> CreateAsync(Outfit outfit, List<int> clothingItemIds)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var transaction = conn.BeginTransaction();

        try
        {
            const string insertOutfitSql = @"
                INSERT INTO Outfits (UserId, Name, Description, WearCount, CreatedAt)
                VALUES (@UserId, @Name, @Description, @WearCount, @CreatedAt);
                SELECT last_insert_rowid();
            ";

            var outfitId = await conn.ExecuteScalarAsync<int>(insertOutfitSql, new
            {
                outfit.UserId,
                Name = outfit.Name.Trim(),
                Description = outfit.Description?.Trim(),
                outfit.WearCount,
                CreatedAt = outfit.CreatedAt.ToString("o")
            }, transaction);

            if (clothingItemIds != null && clothingItemIds.Count > 0)
            {
                const string insertItemsSql = @"
                    INSERT INTO OutfitItems (OutfitId, ClothingItemId)
                    VALUES (@OutfitId, @ClothingItemId);
                ";

                foreach (var itemId in clothingItemIds.Distinct())
                {
                    await conn.ExecuteAsync(insertItemsSql, new { OutfitId = outfitId, ClothingItemId = itemId }, transaction);
                }
            }

            transaction.Commit();
            return outfitId;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = "DELETE FROM Outfits WHERE Id = @Id AND UserId = @UserId;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id, UserId = userId });
        return rows > 0;
    }

    public async Task<bool> MarkAsWornAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        conn.Open();
        using var transaction = conn.BeginTransaction();

        try
        {
            var now = DateTime.UtcNow.ToString("o");

            // 1. Kombinin giyilme sayısını ve tarihini güncelle
            const string updateOutfitSql = @"
                UPDATE Outfits 
                SET WearCount = WearCount + 1,
                    LastWornDate = @Now
                WHERE Id = @Id AND UserId = @UserId;
            ";
            await conn.ExecuteAsync(updateOutfitSql, new { Id = id, UserId = userId, Now = now }, transaction);

            // 2. Kombindeki tüm kıyafetlerin de giyilme sayısını ve tarihini güncelle
            const string updateItemsSql = @"
                UPDATE ClothingItems
                SET WearCount = WearCount + 1,
                    LastWornDate = @Now
                WHERE Id IN (
                    SELECT ClothingItemId FROM OutfitItems WHERE OutfitId = @Id
                ) AND UserId = @UserId;
            ";
            await conn.ExecuteAsync(updateItemsSql, new { Id = id, UserId = userId, Now = now }, transaction);

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
