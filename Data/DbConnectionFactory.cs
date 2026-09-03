using System.Data;
using Npgsql;

namespace GardiropApp.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public bool IsPostgres => true;

    public DbConnectionFactory(IConfiguration configuration)
    {
        var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL") 
                    ?? configuration["Postgres:ConnectionString"]
                    ?? "postgresql://gardirop_db_user:n0UxkpeTYlbnZNAPhEMAFcqefFcY5oi8@dpg-dac27bfavr4c73b71rr0-a/gardirop_db";

        _connectionString = ConvertPostgresUrlToConnectionString(dbUrl);
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
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
            var sslMode = uri.Host.Contains(".render.com") ? "Require" : "Prefer";
            return $"Host={uri.Host};Port={port};Username={user};Password={password};Database={database};SSL Mode={sslMode};Trust Server Certificate=true;";
        }
        return url;
    }
}