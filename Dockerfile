# 1. Build Aşaması (LTS Debian tabanlı - Render ve tüm bulutlarda %100 kararlı)
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Bağımlılıkları geri yükle
COPY ["GardiropApp.csproj", "./"]
RUN dotnet restore "GardiropApp.csproj"

# Tüm kaynak kodları kopyala ve derle
COPY . .
RUN dotnet publish "GardiropApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Çalışma Aşaması (Hafif ve Kararlı Runtime)
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Derlenen dosyaları kopyala
COPY --from=build /app/publish .

# Çalışma ortamı ayarları
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "GardiropApp.dll"]
