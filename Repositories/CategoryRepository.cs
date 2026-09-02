using Dapper;
using GardiropApp.Data;
using GardiropApp.Models;

namespace GardiropApp.Repositories;

public class CategoryRepository
{
    private readonly DbConnectionFactory _db;

    public CategoryRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT * FROM Categories ORDER BY DisplayOrder ASC;";
        return await conn.QueryAsync<Category>(sql);
    }
}
