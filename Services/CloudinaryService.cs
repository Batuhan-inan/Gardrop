using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace GardiropApp.Services;

public class CloudinaryService
{
    private readonly Cloudinary? _cloudinary;

    public bool IsConfigured => _cloudinary != null;

    public CloudinaryService(IConfiguration config)
    {
        var cloudinaryUrl = Environment.GetEnvironmentVariable("CLOUDINARY_URL") 
                            ?? config["Cloudinary:Url"];

        var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") 
                        ?? config["Cloudinary:CloudName"];
        var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") 
                     ?? config["Cloudinary:ApiKey"];
        var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") 
                        ?? config["Cloudinary:ApiSecret"];

        if (!string.IsNullOrEmpty(cloudinaryUrl))
        {
            _cloudinary = new Cloudinary(cloudinaryUrl);
            _cloudinary.Api.Secure = true;
        }
        else if (!string.IsNullOrEmpty(cloudName) && !string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
        {
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }
    }

    public async Task<string?> UploadAsync(IFormFile file)
    {
        if (_cloudinary == null) return null;

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "gardirop",
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        return result.SecureUrl?.ToString();
    }
}
