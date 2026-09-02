using Microsoft.Data.Sqlite;
using Npgsql;
using System.Data;

namespace GardiropApp.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;
    private readonly bool _isPostgres;

    public bool IsPostgres => _isPostgres;

    public DbConnectionFactory(IConfiguration configuration)
    {
        var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL") 
                    ?? configuration["Postgres:ConnectionString"];

        if (!string.IsNullOrWhiteSpace(dbUrl))
        {
            _connectionString = ConvertPostgresUrlToConnectionString(dbUrl);
            _isPostgres = true;
        }
        else
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                                ?? "Data Source=gardirop.db";
            _isPostgres = false;
        }
    }

    public IDbConnection CreateConnection()
    {
        if (_isPostgres)
        {
            return new NpgsqlConnection(_connectionString);
        }
        return new SqliteConnection(_connectionString);
    }

    private static string ConvertPostgresUrlToConnectionString(string url)
    {
        if (url.StartsWith("postgres://") || url.StartsWith("postgresql://"))
        {
            var uri = new Uri(url);
            var userInfo = uri.UserInfo.Split(':');
            var user = userInfo[0];
            var password = userInfo.Length > 1 ? userInfo[1] : "";
            var database = uri.AbsolutePath.TrimStart('/');
            var port = uri.Port > 0 ? uri.Port : 5432;
            return $"Host={uri.Host};Port={port};Username={user};Password={password};Database={database};SSL Mode=Prefer;Trust Server Certificate=true;";
        }
        return url;
    }
}
