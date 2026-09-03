using System.Xml.Linq;
using Dapper;
using Microsoft.AspNetCore.DataProtection.Repositories;

namespace GardiropApp.Data;

public class DbXmlRepository : IXmlRepository
{
    private readonly DbConnectionFactory _db;

    public DbXmlRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public IReadOnlyCollection<XElement> GetAllElements()
    {
        try
        {
            using var conn = _db.CreateConnection();
            var xmlList = conn.Query<string>("SELECT Xml FROM DataProtectionKeys;");
            return xmlList.Select(x => XElement.Parse(x)).ToList();
        }
        catch
        {
            return Array.Empty<XElement>();
        }
    }

    public void StoreElement(XElement element, string friendlyName)
    {
        if (element == null) return;
        try
        {
            using var conn = _db.CreateConnection();
            conn.Execute(
                "INSERT INTO DataProtectionKeys (FriendlyName, Xml) VALUES (@FriendlyName, @Xml);",
                new { FriendlyName = friendlyName, Xml = element.ToString() }
            );
        }
        catch { }
    }
}