using Dapper;
using GardiropApp.Data;
using GardiropApp.Models;

namespace GardiropApp.Repositories;

public class UserRepository
{
    private readonly DbConnectionFactory _db;

    public UserRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT * FROM Users WHERE Id = @Id;";
        return await conn.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT * FROM Users WHERE Username = @Username;";
        return await conn.QuerySingleOrDefaultAsync<User>(sql, new { Username = username.Trim() });
    }

    public async Task<bool> ExistsAsync(string username)
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT COUNT(1) FROM Users WHERE Username = @Username;";
        return await conn.ExecuteScalarAsync<bool>(sql, new { Username = username.Trim() });
    }

    public async Task<int> CreateAsync(User user)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            INSERT INTO Users (Username, PasswordHash, FullName, CreatedAt)
            VALUES (@Username, @PasswordHash, @FullName, @CreatedAt);
            SELECT last_insert_rowid();
        ";
        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            Username = user.Username.Trim(),
            user.PasswordHash,
            FullName = user.FullName.Trim(),
            CreatedAt = user.CreatedAt.ToString("o")
        });
    }

    public async Task<bool> ExistsExceptUserAsync(string username, int excludeUserId)
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT COUNT(1) FROM Users WHERE Username = @Username AND Id != @ExcludeUserId;";
        return await conn.ExecuteScalarAsync<bool>(sql, new { Username = username.Trim(), ExcludeUserId = excludeUserId });
    }

    public async Task<bool> UpdateProfileAsync(int id, string username, string fullName)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            UPDATE Users 
            SET Username = @Username,
                FullName = @FullName
            WHERE Id = @Id;
        ";
        var rows = await conn.ExecuteAsync(sql, new 
        { 
            Id = id, 
            Username = username.Trim(), 
            FullName = fullName.Trim() 
        });
        return rows > 0;
    }

    public async Task<bool> UpdatePasswordAsync(int id, string newPasswordHash)
    {
        using var conn = _db.CreateConnection();
        const string sql = "UPDATE Users SET PasswordHash = @PasswordHash WHERE Id = @Id;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id, PasswordHash = newPasswordHash });
        return rows > 0;
    }

    public async Task<IEnumerable<AdminUserSummaryDto>> GetAllUsersWithStatsAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT 
                u.Id,
                u.Username,
                u.FullName,
                u.IsAdmin,
                u.CreatedAt,
                COUNT(DISTINCT c.Id) AS ClothingCount,
                COUNT(DISTINCT o.Id) AS OutfitCount,
                CAST(MAX(c.LastWornDate) AS TEXT) AS LastActiveDate
            FROM Users u
            LEFT JOIN ClothingItems c ON u.Id = c.UserId
            LEFT JOIN Outfits o ON u.Id = o.UserId
            GROUP BY u.Id
            ORDER BY u.Id ASC;
        ";
        return await conn.QueryAsync<AdminUserSummaryDto>(sql);
    }

    public async Task<AdminStatsDto> GetSystemStatsAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            SELECT 
                (SELECT COUNT(*) FROM Users) AS TotalUsers,
                (SELECT COUNT(*) FROM ClothingItems) AS TotalClothes,
                (SELECT COUNT(*) FROM Outfits) AS TotalOutfits,
                (SELECT COALESCE(SUM(WearCount), 0) FROM ClothingItems) AS TotalWornCount;
        ";
        return await conn.QuerySingleAsync<AdminStatsDto>(sql);
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        using var conn = _db.CreateConnection();
        conn.Execute("PRAGMA foreign_keys = ON;");
        const string sql = "DELETE FROM Users WHERE Id = @Id;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}
