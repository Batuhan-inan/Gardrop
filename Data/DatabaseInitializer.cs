using Dapper;
using GardiropApp.Services;

namespace GardiropApp.Data;

public class DatabaseInitializer
{
    private readonly DbConnectionFactory _db;
    private readonly IWebHostEnvironment _environment;

    public DatabaseInitializer(DbConnectionFactory db, IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    public void Initialize()
    {
        // Uploads dizinini oluştur
        var uploadsPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        using var connection = _db.CreateConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        // Tabloları oluştur (PostgreSQL)
        const string createTablesSql = @"
            CREATE TABLE IF NOT EXISTS Users (
                Id SERIAL PRIMARY KEY,
                Username TEXT UNIQUE NOT NULL,
                PasswordHash TEXT NOT NULL,
                FullName TEXT NOT NULL,
                IsAdmin INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Categories (
                Id SERIAL PRIMARY KEY,
                Name TEXT NOT NULL,
                Slug TEXT NOT NULL UNIQUE,
                Icon TEXT NOT NULL,
                DisplayOrder INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ClothingItems (
                Id SERIAL PRIMARY KEY,
                UserId INTEGER NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
                Name TEXT NOT NULL,
                CategoryId INTEGER NOT NULL REFERENCES Categories(Id),
                Color TEXT NOT NULL,
                ColorHex TEXT,
                Season TEXT NOT NULL,
                ImageUrl TEXT NOT NULL,
                Brand TEXT,
                Notes TEXT,
                LastWornDate TEXT,
                WearCount INTEGER NOT NULL DEFAULT 0,
                IsFavorite INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Outfits (
                Id SERIAL PRIMARY KEY,
                UserId INTEGER NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
                Name TEXT NOT NULL,
                Description TEXT,
                LastWornDate TEXT,
                WearCount INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS OutfitItems (
                OutfitId INTEGER NOT NULL REFERENCES Outfits(Id) ON DELETE CASCADE,
                ClothingItemId INTEGER NOT NULL REFERENCES ClothingItems(Id) ON DELETE CASCADE,
                PRIMARY KEY (OutfitId, ClothingItemId)
            );

            CREATE TABLE IF NOT EXISTS DataProtectionKeys (
                Id SERIAL PRIMARY KEY,
                FriendlyName TEXT,
                Xml TEXT NOT NULL
            );
        ";

        connection.Execute(createTablesSql);

        // Varsayılan Kategorileri Ekle (Eğer yoksa)
        var categoryCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM Categories;");
        if (categoryCount == 0)
        {
            const string insertCategoriesSql = @"
                INSERT INTO Categories (Name, Slug, Icon, DisplayOrder) VALUES
                ('Üst Giyim', 'ust-giyim', 'fa-shirt', 1),
                ('Alt Giyim', 'alt-giyim', 'fa-person', 2),
                ('Dış Giyim', 'dis-giyim', 'fa-vest-patches', 3),
                ('Ayakkabı', 'ayakkabi', 'fa-shoe-prints', 4),
                ('Aksesuar', 'aksesuar', 'fa-glasses', 5);
            ";
            connection.Execute(insertCategoriesSql);
        }

        // 'admin' kullanıcısı yoksa oluştur
        var adminExists = connection.ExecuteScalar<int>("SELECT COUNT(1) FROM Users WHERE LOWER(Username) = 'admin';");
        if (adminExists == 0)
        {
            var adminHash = PasswordHasher.Hash("admin123");
            const string insertAdminSql = @"
                INSERT INTO Users (Username, PasswordHash, FullName, IsAdmin, CreatedAt)
                VALUES ('admin', @Hash, 'Admin', 1, @CreatedAt);
            ";
            connection.Execute(insertAdminSql, new { Hash = adminHash, CreatedAt = DateTime.UtcNow.ToString("o") });
        }

        // 'batuhan' kullanıcısı yoksa oluştur
        var batuhanExists = connection.ExecuteScalar<int>("SELECT COUNT(1) FROM Users WHERE LOWER(Username) = 'batuhan';");
        if (batuhanExists == 0)
        {
            var batuhanHash = PasswordHasher.Hash("password123");
            const string insertBatuhanSql = @"
                INSERT INTO Users (Username, PasswordHash, FullName, IsAdmin, CreatedAt)
                VALUES ('batuhan', @Hash, 'Batuhan İnan', 1, @CreatedAt);
            ";
            connection.Execute(insertBatuhanSql, new { Hash = batuhanHash, CreatedAt = DateTime.UtcNow.ToString("o") });
        }

        // Rolleri güncelle
        connection.Execute("UPDATE Users SET IsAdmin = 0 WHERE LOWER(Username) = 'batu';");
        connection.Execute("UPDATE Users SET IsAdmin = 1 WHERE LOWER(Username) IN ('admin', 'batuhan', 'batuhaninan');");
    }
}