using Dapper;
using GardiropApp.Data;
using GardiropApp.Models;
using System.Text;

namespace GardiropApp.Repositories;

public class ClothingRepository
{
    private readonly DbConnectionFactory _db;

    public ClothingRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ClothingItem>> GetAllForUserAsync(int userId, FilterClothingRequest? filter = null)
    {
        using var conn = _db.CreateConnection();
        var sql = new StringBuilder(@"
            SELECT 
                c.Id, c.UserId, c.Name, c.CategoryId, cat.Name AS CategoryName,
                c.Color, c.ColorHex, c.Season, c.ImageUrl, c.Brand, c.Notes,
                c.LastWornDate, c.WearCount, c.IsFavorite, c.CreatedAt
            FROM ClothingItems c
            JOIN Categories cat ON c.CategoryId = cat.Id
            WHERE c.UserId = @UserId
        ");

        var parameters = new DynamicParameters();
        parameters.Add("UserId", userId);

        if (filter != null)
        {
            if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
            {
                sql.Append(" AND c.CategoryId = @CategoryId");
                parameters.Add("CategoryId", filter.CategoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Color))
            {
                sql.Append(" AND LOWER(c.Color) = LOWER(@Color)");
                parameters.Add("Color", filter.Color.Trim());
            }

            if (!string.IsNullOrWhiteSpace(filter.Season))
            {
                sql.Append(" AND (c.Season = @Season OR c.Season = 'Dört Mevsim')");
                parameters.Add("Season", filter.Season.Trim());
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                sql.Append(" AND (c.Name LIKE @Search OR c.Brand LIKE @Search OR c.Notes LIKE @Search)");
                parameters.Add("Search", $"%{filter.Search.Trim()}%");
            }

            if (filter.OnlyFavorites == true)
            {
                sql.Append(" AND c.IsFavorite = 1");
            }

            if (filter.OnlyUnworn == true)
            {
                // Hiç giyilmemiş veya en az 30 gündür giyilmemiş olanlar
                sql.Append(" AND (c.LastWornDate IS NULL OR c.WearCount = 0)");
            }
        }

        sql.Append(" ORDER BY c.Id DESC;");

        return await conn.QueryAsync<ClothingItem>(sql.ToString(), parameters);
    }

    public async Task<ClothingItem?> GetByIdAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT 
                c.Id, c.UserId, c.Name, c.CategoryId, cat.Name AS CategoryName,
                c.Color, c.ColorHex, c.Season, c.ImageUrl, c.Brand, c.Notes,
                c.LastWornDate, c.WearCount, c.IsFavorite, c.CreatedAt
            FROM ClothingItems c
            JOIN Categories cat ON c.CategoryId = cat.Id
            WHERE c.Id = @Id AND c.UserId = @UserId;
        ";
        return await conn.QuerySingleOrDefaultAsync<ClothingItem>(sql, new { Id = id, UserId = userId });
    }

    public async Task<int> CreateAsync(ClothingItem item)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            INSERT INTO ClothingItems 
            (UserId, Name, CategoryId, Color, ColorHex, Season, ImageUrl, Brand, Notes, WearCount, IsFavorite, CreatedAt)
            VALUES 
            (@UserId, @Name, @CategoryId, @Color, @ColorHex, @Season, @ImageUrl, @Brand, @Notes, @WearCount, @IsFavorite, @CreatedAt)
            RETURNING Id;
        ";

        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            item.UserId,
            Name = item.Name.Trim(),
            item.CategoryId,
            Color = item.Color.Trim(),
            ColorHex = item.ColorHex?.Trim(),
            Season = item.Season.Trim(),
            ImageUrl = item.ImageUrl.Trim(),
            Brand = item.Brand?.Trim(),
            Notes = item.Notes?.Trim(),
            item.WearCount,
            IsFavorite = item.IsFavorite ? 1 : 0,
            CreatedAt = item.CreatedAt.ToString("o")
        });
    }

    public async Task<bool> UpdateAsync(ClothingItem item)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            UPDATE ClothingItems 
            SET Name = @Name,
                CategoryId = @CategoryId,
                Color = @Color,
                ColorHex = @ColorHex,
                Season = @Season,
                ImageUrl = @ImageUrl,
                Brand = @Brand,
                Notes = @Notes,
                IsFavorite = @IsFavorite
            WHERE Id = @Id AND UserId = @UserId;
        ";

        var rows = await conn.ExecuteAsync(sql, new
        {
            item.Id,
            item.UserId,
            Name = item.Name.Trim(),
            item.CategoryId,
            Color = item.Color.Trim(),
            ColorHex = item.ColorHex?.Trim(),
            Season = item.Season.Trim(),
            ImageUrl = item.ImageUrl.Trim(),
            Brand = item.Brand?.Trim(),
            Notes = item.Notes?.Trim(),
            IsFavorite = item.IsFavorite ? 1 : 0
        });

        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = "DELETE FROM ClothingItems WHERE Id = @Id AND UserId = @UserId;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id, UserId = userId });
        return rows > 0;
    }

    public async Task<bool> ToggleFavoriteAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            UPDATE ClothingItems 
            SET IsFavorite = CASE WHEN IsFavorite = 1 THEN 0 ELSE 1 END
            WHERE Id = @Id AND UserId = @UserId;
        ";
        var rows = await conn.ExecuteAsync(sql, new { Id = id, UserId = userId });
        return rows > 0;
    }

    public async Task<bool> MarkAsWornAsync(int id, int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            UPDATE ClothingItems 
            SET WearCount = WearCount + 1,
                LastWornDate = @LastWornDate
            WHERE Id = @Id AND UserId = @UserId;
        ";
        var rows = await conn.ExecuteAsync(sql, new 
        { 
            Id = id, 
            UserId = userId, 
            LastWornDate = DateTime.UtcNow.ToString("o") 
        });
        return rows > 0;
    }

    public async Task<IEnumerable<string>> GetDistinctColorsForUserAsync(int userId)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT DISTINCT Color 
            FROM ClothingItems 
            WHERE UserId = @UserId AND Color IS NOT NULL AND Color != ''
            ORDER BY Color ASC;
        ";
        return await conn.QueryAsync<string>(sql, new { UserId = userId });
    }
}
