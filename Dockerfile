# 1. Build Aşaması (SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Bağımlılıkları geri yükle (Önbellekleme için önce csproj kopyalanır)
COPY ["GardiropApp.csproj", "./"]
RUN dotnet restore "GardiropApp.csproj"

# Tüm kaynak kodları kopyala ve Release olarak derle
COPY . .
RUN dotnet publish "GardiropApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Çalışma Aşaması (Hafif Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Derlenen dosyaları kopyala
COPY --from=build /app/publish .

# Çalışma ortamı ayarları
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "GardiropApp.dll"]
