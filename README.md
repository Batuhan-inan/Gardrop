# 👗 Gardırop & Stil Asistanı (Smart Wardrobe Assistant)

[![.NET](https://img.shields.io/badge/.NET-8.0%20LTS-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![Dapper](https://img.shields.io/badge/ORM-Dapper-e36209?style=flat)](https://github.com/DapperLib/Dapper)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary%20CDN-3448C5?style=flat&logo=cloudinary)](https://cloudinary.com/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%7C%20Render-2496ED?style=flat&logo=docker)](https://render.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20(SPA)-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Fiziksel dolabınızdaki kıyafetleri fotoğraflarıyla dijitalleştiren, unuttuğunuz parçaları gün yüzüne çıkaran, akıllı renk ve stil eşleşmeleriyle kombinler yaratan, **C# (.NET 8 LTS) + Dapper + PostgreSQL/SQLite + Cloudinary** tabanlı modern, bulut uyumlu ve çok kullanıcılı bir gardırop yönetim platformudur.

---

## 💡 Projenin Doğuş Hikayesi ve Amacı

### ❓ Hangi Problemi Çözüyoruz?
Günlük hayatımızda gardıroplarımız onlarca parça kıyafetle dolu olmasına rağmen çoğumuz sabahları aynanın karşısında **"Giyecek hiçbir şeyim yok!"** stresini yaşarız. Bunun en büyük sebebi dolabımızın arkalarında kalan, askılarda gözden kaçan ve varlığını unuttuğumuz onlarca kıyafetin olmasıdır.

Ayrıca belirli bir parçayı (örneğin *Siyah Kot Pantolon*) giymek istediğimizde:
* *"Bunun üstüne uyumlu elimde hangi renk tişörtler veya gömlekler vardı?"* sorusunun cevabını bulmak için dolabı baştan aşağı karıştırmak zorunda kalırız.
* Aile bireyleri veya arkadaşlar kendi gardıroplarını başkalarının kıyafetlerine karışmadan, kişisel alanlarında bağımsızca yönetmek ister.
* Ücretsiz bulut dağıtımlarında sunucuların geçici diskleri (ephemeral storage) yüzünden fotoğrafların ve kullanıcı verilerinin silinme riski vardır.

### 🎯 Çözümümüz ve Vizyonumuz
Bu uygulama, fiziksel dolabınızı cebinize taşımak ve kalıcı kılmak için tasarlandı:
1. **Dolabı Dijitalleştirmek:** Dolabın karşısına geçip telefon kamerasıyla kıyafetlerin fotoğraflarını saniyeler içinde çekerek kişisel moda envanterinizi oluşturursunuz.
2. **Akıllı Eşleştirme & Kombin:** Seçtiğiniz bir alt giyime (ör. Siyah Kot) göre uyumlu renklerdeki üst giyim ve aksesuarlar dinamik olarak filtrelenir ve size kombin ipuçları sunar.
3. **Sürdürülebilir Dolap Yönetimi:** *"Dolapta Unutulanlar"* algoritması hiç giyilmemiş veya uzun süredir giyilmeyen kıyafetleri öne çıkararak gereksiz tüketimi önler.
4. **Ömür Boyu Kalıcı Bulut Mimarisi:** Fotoğraflar Cloudinary CDN'e, veriler ise Render PostgreSQL veritabanına kaydedilir; sunucu yeniden başlasa bile hiçbir veri asla kaybolmaz.
5. **Kapsamlı Yönetim (Admin) Paneli:** Sistem yöneticisi sistemdeki tüm kullanıcı sayılarını, dolap doluluklarını izleyebilir, şifre sıfırlayabilir ve istenmeyen hesapları silebilir.

---

## ✨ Temel Özellikler

### 👗 Gardırop ve Moda Yönetimi
* 📸 **Doğrudan Mobil Kamera Desteği:** Dolabın karşısındayken telefonunuzun arka kamerasını tek tıkla açarak fotoğraf çekme (`capture="environment"`).
* ☁️ **Cloudinary Bulut Depolama:** Yüklenen fotoğrafların otomatik boyutlandırma ve format optimizasyonuyla (WebP/Auto) ömür boyu saklanması.
* 🎨 **Kategori ve Renk Paleti:** Üst giyim, alt giyim, dış giyim, ayakkabı ve aksesuar kategorileri ile canlı renk çipleri üzerinden hızlı filtreleme.
* ⭐ **Favoriler ve Arama:** En sevilen parçaları işaretleme ve marka/not/kategori bazında anlık arama.

### 🪄 İnteraktif Kombin Stüdyosu
* Parçaları görsel vitrin yuvalarına yerleştirerek (Üst, Alt, Dış, Ayakkabı, Aksesuar) canlı önizleme yapabilme.
* **Akıllı Renk Uyumu Motoru:** Seçilen ana parçaya göre renk uyum rehberliğini devreye sokarak uyumlu alternatifleri vurgulama.
* Kombinleri isimlendirerek ve açıklama ekleyerek dolaba kaydetme.

### ⏳ "Dolapta Unutulanlar" & Giyim Sayacı
* Her kıyafetin kaç kez giyildiği ve en son ne zaman giyildiği takip edilir.
* **"Bugün Bunu Giydim" Butonu:** Kombinlerim sekmesinde bir kombine basıldığında, o kombindeki tüm parçaların giyim sayacı ve tarihi tek tıkla güncellenir.
* Uzun süredir giyilmeyen parçalar özel sekmede hatırlatılır ve tek tıkla *"Bununla Kombin Yap"* butonuyla stüdyoya aktarılır.

### 🛡️ Kapsamlı Yönetim (Admin) Paneli
* **4 Ana KPI Kartı:** Toplam Kayıtlı Kullanıcı, Toplam Kıyafet Sayısı, Kayıtlı Kombinler ve Toplam Giyim Hareketi.
* **Kullanıcı Takip Tablosu:** Tüm kullanıcıların kullanıcı adı, ad-soyad, yetki rolü, dolabındaki kıyafet sayısı, kombin sayısı ve kayıt/son aktivite tarihleri.
* **Kullanıcı Şifresi Değiştirme:** Admin panelinden herhangi bir kullanıcının şifresini eski şifreyi bilmeye gerek kalmadan anında sıfırlama/güncelleme.
* **Kullanıcı Silme:** İstenmeyen hesapları ve o hesaba bağlı tüm kıyafet/kombin verilerini kaskad olarak kalıcı silme (kazara kendini silme korumasıyla).

### 🔒 Güvenlik & Çoklu Kullanıcı
* **PBKDF2 (SHA-256 + Salt):** 100.000 iterasyonlu şifre güvenliği.
* **Güvenli Cookie Authentication:** HttpOnly, Secure oturum yönetimi.
* **Cihaza Özel Akıllı Hafıza:** Ortak cihazlarda kişisel gizliliği korumak adına sadece o tarayıcıda giriş yapılmış hesaplar hatırlanır.
* **Açık Kaynak Güvenliği:** Kod tabanında hiçbir gizli API anahtarı veya şifre tutulmaz; ortam değişkenleri (Environment Variables) üzerinden okunur.

---

## 🏗️ Mimari ve Teknolojiler

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Backend** | **C# (.NET 8 LTS)** ASP.NET Core | Minimal APIs mimarisiyle hafif, modüler ve yüksek performanslı uç noktalar |
| **Bulut Veritabanı** | **PostgreSQL** (`Npgsql`) | Render üzerinde 7/24 çalışan, ömür boyu kalıcı ilişkisel veritabanı |
| **Yerel Veritabanı** | **SQLite** (`gardirop.db`) | Geliştirme ortamında internetsiz ve kurulumsuz çalışma desteği |
| **Micro-ORM** | **Dapper** | Yüksek performanslı SQL sorguları, multi-mapping ve transaction desteği |
| **Medya Depolama** | **Cloudinary CDN** | Kalıcı görsel barındırma ve otomatik WebP optimizasyonu |
| **Container & Cloud** | **Docker + Render.com** | Debian Bookworm tabanlı multi-stage Dockerfile ile 7/24 canlı yayın |
| **Frontend** | **Vanilla JavaScript (ES6+), CSS3** | Framework bağımlılığı olmayan, modern responsive SPA mimarisi |
| **Tasarım & Font** | FontAwesome 6, Plus Jakarta Sans | Koyu tema (Dark Mode) ve glassmorphism lüks moda estetiği |

---

## 📁 Proje Dizin Yapısı

```
Gardırop/
│
├── Data/
│   ├── DatabaseInitializer.cs   # PostgreSQL & SQLite tabloları ve varsayılan seed kurulumu
│   └── DbConnectionFactory.cs   # Ortama göre PostgreSQL (Npgsql) veya SQLite (Dapper) fabrikası
│
├── Models/
│   ├── User.cs                  # Kullanıcı modeli (IsAdmin yetki alanı dahil)
│   ├── Category.cs              # Giyim kategorisi modeli
│   ├── ClothingItem.cs          # Kıyafet modeli (WearCount, LastWornDate)
│   ├── Outfit.cs                # Kombin ve ara tablo modelleri
│   └── DTOs.cs                  # Request/Response DTO'ları ve Admin modelleri
│
├── Repositories/
│   ├── UserRepository.cs        # Kullanıcı sorguları, admin kullanıcı istatistikleri ve silme
│   ├── CategoryRepository.cs    # Kategori listeleme
│   ├── ClothingRepository.cs    # Kıyafet CRUD, filtreleme, giyilme takibi
│   └── OutfitRepository.cs      # Multi-mapping ile kombin ve parça ilişkileri
│
├── Services/
│   ├── CloudinaryService.cs     # Cloudinary CDN görsel yükleme servisi
│   └── PasswordHasher.cs        # PBKDF2 parola hashleme ve doğrulama servisi
│
├── wwwroot/                     # Statik Web Ön Yüzü (SPA)
│   ├── css/style.css            # Lüks koyu tema, glassmorphism ve Admin Dashboard stilleri
│   ├── js/app.js                # State yönetimi, Admin Paneli, Stüdyo motoru ve API istemcisi
│   └── index.html               # Cache-buster destekli ana HTML sayfası
│
├── Dockerfile                   # .NET 8 Debian tabanlı çok aşamalı Docker yapılandırması
├── Program.cs                   # Minimal API rotaları, Admin uç noktaları ve DI tanımları
├── appsettings.json             # Güvenli şablon konfigürasyon dosyası
└── GardiropApp.csproj           # Proje ayarları ve NuGet bağımlılıkları
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Yerel Geliştirme (Local Development)

#### Gereksinimler:
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

#### Adımlar:
1. **Depoyu Klonlayın:**
   ```bash
   git clone https://github.com/Batuhan-inan/Gardrop.git
   cd Gardrop
   ```
2. **Uygulamayı Başlatın:**
   ```bash
   dotnet run --launch-profile "http"
   ```
3. **Tarayıcınızdan Açın:**  
   [http://localhost:5041](http://localhost:5041)

*(Harici veritabanı belirtilmediğinde uygulama yerel `gardirop.db` SQLite dosyasını otomatik olarak oluşturur).*

---

### 2. Bulut Dağıtımı (Docker & Render.com)

1. Projeyi GitHub'a pushlayın.
2. Render.com üzerinde **Web Service** oluşturup repoyu bağlayın (Runtime: **Docker**).
3. Render üzerinde **PostgreSQL** veritabanı oluşturun.
4. Web servisinin **Environment Variables** bölümüne şu iki gizli anahtarı tanımlayın:
   * `DATABASE_URL`: PostgreSQL Internal URL (`postgresql://...`)
   * `CLOUDINARY_URL`: Cloudinary API URL (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`)
5. Render otomatik olarak Docker container'ını derleyecek ve sitenizi 7/24 canlıya alacaktır.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. Açık kaynaklıdır, dilediğiniz gibi geliştirebilir ve kendi gardırobunuz için kullanabilirsiniz.
