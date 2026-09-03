# 1. Build Aşaması (.NET 8 SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Bağımlılıkları geri yükle
COPY ["GardiropApp.csproj", "./"]
RUN dotnet restore "GardiropApp.csproj"

# Tüm kaynak kodları kopyala ve derle
COPY . .
RUN dotnet publish "GardiropApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Çalışma Aşaması (Hafif ve Kararlı Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Derlenen dosyaları kopyala
COPY --from=build /app/publish .

# Çalışma ortamı ayarları
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "GardiropApp.dll"]