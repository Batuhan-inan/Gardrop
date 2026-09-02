using Dapper;
using Microsoft.Data.Sqlite;
using GardiropApp.Services;

namespace GardiropApp.Data;

public class DatabaseInitializer
{
    private readonly string _connectionString;
    private readonly IWebHostEnvironment _environment;

    public DatabaseInitializer(IConfiguration configuration, IWebHostEnvironment environment)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
                            ?? "Data Source=gardirop.db";
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

        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        // SQLite yabancı anahtar desteğini aktif et
        connection.Execute("PRAGMA foreign_keys = ON;");

        // Tabloları oluştur
        const string createTablesSql = @"
            CREATE TABLE IF NOT EXISTS Users (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                PasswordHash TEXT NOT NULL,
                FullName TEXT NOT NULL,
                IsAdmin INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Categories (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Slug TEXT NOT NULL UNIQUE,
                Icon TEXT NOT NULL,
                DisplayOrder INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ClothingItems (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                Name TEXT NOT NULL,
                CategoryId INTEGER NOT NULL,
                Color TEXT NOT NULL,
                ColorHex TEXT,
                Season TEXT NOT NULL,
                ImageUrl TEXT NOT NULL,
                Brand TEXT,
                Notes TEXT,
                LastWornDate TEXT,
                WearCount INTEGER NOT NULL DEFAULT 0,
                IsFavorite INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL,
                FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
            );

            CREATE TABLE IF NOT EXISTS Outfits (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                Name TEXT NOT NULL,
                Description TEXT,
                LastWornDate TEXT,
                WearCount INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL,
                FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS OutfitItems (
                OutfitId INTEGER NOT NULL,
                ClothingItemId INTEGER NOT NULL,
                PRIMARY KEY (OutfitId, ClothingItemId),
                FOREIGN KEY (OutfitId) REFERENCES Outfits(Id) ON DELETE CASCADE,
                FOREIGN KEY (ClothingItemId) REFERENCES ClothingItems(Id) ON DELETE CASCADE
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

        // Var olan veritabanlarında IsAdmin sütunu yoksa ekle (Migration)
        try
        {
            connection.Execute("ALTER TABLE Users ADD COLUMN IsAdmin INTEGER NOT NULL DEFAULT 0;");
        }
        catch
        {
            // Sütun zaten varsa hata vermez, devam eder
        }

        // 'admin' kullanıcısı yoksa oluştur
        var adminExists = connection.ExecuteScalar<int>("SELECT COUNT(1) FROM Users WHERE Username = 'admin';");
        if (adminExists == 0)
        {
            var adminHash = PasswordHasher.Hash("admin123");
            const string insertAdminSql = @"
                INSERT INTO Users (Username, PasswordHash, FullName, IsAdmin, CreatedAt)
                VALUES ('admin', @Hash, 'Admin', 1, @CreatedAt);
            ";
            connection.Execute(insertAdminSql, new { Hash = adminHash, CreatedAt = DateTime.UtcNow.ToString("o") });
        }

        // 'batu' kullanıcısının yetkisini kaldır
        connection.Execute("UPDATE Users SET IsAdmin = 0 WHERE Username = 'batu';");

        // 'Batuhan İnan' ve 'admin' kullanıcılarını Admin yap
        connection.Execute(@"
            UPDATE Users 
            SET IsAdmin = 1, FullName = 'Batuhan İnan' 
            WHERE Username IN ('batuhan', 'batuhaninan') OR Id = 1;
        ");
        connection.Execute("UPDATE Users SET IsAdmin = 1 WHERE Username = 'admin';");
    }
}
