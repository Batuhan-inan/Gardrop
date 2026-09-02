# 👗 Gardırop & Kombin Asistanı (Wardrobe Assistant)

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![Dapper](https://img.shields.io/badge/ORM-Dapper-e36209?style=flat)](https://github.com/DapperLib/Dapper)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![JavaScript](https://img.shields.io/badge/Frontend-Vanilla%20JS-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Dolabınızdaki kıyafetleri fotoğraflarıyla dijitalleştiren, unuttuğunuz parçaları gün yüzüne çıkaran, akıllı renk ve stil eşleşmeleriyle kombinler yapıp kullanım geçmişinizi takip etmenizi sağlayan **C# (ASP.NET Core) + Dapper + SQLite** tabanlı modern bir web uygulamasıdır.

Uygulama, **çok kullanıcılı (multi-user)** mimarisi sayesinde evdeki aile bireylerinin (ör. kardeşler/farklı cihazlar) birbirinin verisine karışmadan kendi kişisel gardırobunu yönetmesine imkan tanır.

---

## 💡 Projenin Doğuş Hikayesi ve Amacı

### ❓ Hangi Problemi Çözüyoruz?
Günlük hayatımızda gardıroplarımız onlarca parça kıyafetle dolu olmasına rağmen çoğumuz sabahları aynanın karşısında **"Giyecek hiçbir şeyim yok!"** hissini yaşarız. Bunun en büyük sebebi dolabımızın arkalarında kalan, askılarda gözden kaçan ve varlığını unuttuğumuz onlarca kıyafetin olmasıdır.

Ayrıca belirli bir parçayı (örneğin *Siyah Kot Pantolon*) giymeye karar verdiğimizde:
* *"Bunun üstüne uyumlu elimde hangi renk tişörtler veya gömlekler vardı?"* sorusunun cevabını bulmak için dolabı baştan aşağı karıştırmak zorunda kalırız.
* Aynı evde yaşayan aile bireyleri (örneğin bir abla ve kardeş) farklı telefon ve bilgisayarlardan kendi kıyafetlerini düzenli bir şekilde takip etmek ister.

### 🎯 Çözümümüz ve Vizyonumuz
Bu uygulama, fiziksel dolabınızı dijital cebinize taşımak için tasarlandı:
1. **Dolabı Dijitalleştirmek:** Dolabın karşısına geçip telefonunuzla kıyafetlerin fotoğraflarını saniyeler içinde çekerek kişisel moda envanterinizi oluşturursunuz.
2. **Akıllı Eşleştirme & Kombin:** Örneğin siyah bir pantolon seçtiğinizde sistem elinizdeki tüm üst giyimleri ve uyumlu renkleri filtreleyerek saniyeler içinde yeni kombinler keşfetmenizi sağlar.
3. **Sürdürülebilir Dolap Yönetimi:** "Dolapta Unutulanlar" algoritması sayesinde hiç giymediğiniz kıyafetleri size hatırlatarak gereksiz alışverişin önüne geçer ve elinizdekileri en verimli şekilde değerlendirmenizi sağlar.
4. **Bağımsız Kullanım:** Tek bir sunucu üzerinden her kullanıcı kendi şifresiyle oturum açar ve birbirinin alanına müdahale etmeden kendi gardırobunun hakimi olur.

---

## ✨ Temel Özellikler

* 📸 **Mobil Kamera Entegrasyonu:** Dolabın karşısındayken telefondan arka kamerayı açarak tek tıkla kıyafet fotoğrafı çekip yükleyebilme (`capture="environment"`).
* 👔 **Kategori & Renk Sistemi:** Üst giyim, alt giyim, dış giyim, ayakkabı ve aksesuarlar için dinamik filtreleme ve renk paleti seçimi.
* 🪄 **İnteraktif Kombin Stüdyosu:** 
  * Parçaları görsel yuvalara (Üst, Alt, Ceket, Ayakkabı, Aksesuar) yerleştirerek canlı önizleme.
  * **Akıllı Öneri Sistemi:** Bir alt giyim (ör. Siyah Kot) seçildiğinde, uyumlu renkteki üst giyim ve parçaları otomatik filtreleme ve ipucu gösterme.
  * Kombinleri isimlendirerek kaydetme (ör. *"Hafta Sonu Rahatlığı"*).
* ⏳ **"Dolapta Unutulanlar" & Giyim Takibi:** 
  * Her kıyafetin giyilme sayısı ve son giyilme tarihi takip edilir.
  * *"Bugün Bunu Giydim"* butonuyla kombindeki tüm parçaların giyim sayaçları tek seferde güncellenir.
  * Uzun süredir giyilmemiş hazineler özel sekmede hatırlatılır ve tek tıkla stüdyoya taşınabilir.
* 🔒 **Gizlilik & Çoklu Oturum (Multi-User):**
  * PBKDF2 + SHA256 + Salt ile güvenli şifreleme.
  * Güvenli Cookie Authentication.
  * Her kullanıcının dolabı tamamen kendine özeldir; hiçbir kullanıcı bir diğerinin kıyafetlerini göremez.
* 👤 **Profil & Şifre Yönetimi:** Kullanıcılar sağ üstteki profil menüsünden kullanıcı adı, ad-soyad ve şifrelerini kolayca güncelleyebilir.
* 🌐 **Yerel Ağda Cihazlar Arası Erişim:** Bilgisayarda çalışan sunucuya aynı Wi-Fi ağındaki herhangi bir telefon veya tabletten tarayıcı ile doğrudan bağlanabilme.

---

## 🏗️ Mimari ve Teknolojiler

| Katman | Teknoloji / Kütüphane | Açıklama |
| :--- | :--- | :--- |
| **Backend** | **C# (.NET 10)** ASP.NET Core | Minimal APIs mimarisiyle hafif, modüler ve yüksek performanslı uç noktalar |
| **Veri Tabanı** | **SQLite** (`gardirop.db`) | Kurulumsuz (serverless), sıfır kaynak tüketen, tek dosya veritabanı |
| **Micro-ORM** | **Dapper** | Saf SQL sorguları, multi-mapping ve transaction kontrolü |
| **Şifreleme** | **PBKDF2 (Rfc2898DeriveBytes)** | 100.000 iterasyonlu endüstri standardı şifre hashleme |
| **Frontend** | **HTML5, CSS3, Vanilla JS (ES6+)** | Framework bağımlılığı olmayan, responsive (mobil öncelikli) SPA mimarisi |
| **İkon & Font** | FontAwesome 6, Plus Jakarta Sans | Modern lüks moda tasarım estetiği |

---

## 📁 Proje Dizin Yapısı

```
Gardırop/
│
├── Data/
│   ├── DatabaseInitializer.cs   # SQLite tabloları ve varsayılan verilerin otomatik kurulumu
│   └── DbConnectionFactory.cs   # Dapper bağlantı fabrikası (IDbConnection)
│
├── Models/
│   ├── User.cs                  # Kullanıcı modeli
│   ├── Category.cs              # Giyim kategorisi modeli
│   ├── ClothingItem.cs          # Kıyafet modeli
│   ├── Outfit.cs                # Kombin ve ara tablo modelleri
│   └── DTOs.cs                  # İstek/Yanıt veri transfer nesneleri
│
├── Repositories/
│   ├── UserRepository.cs        # Kullanıcı veritabanı işlemleri
│   ├── CategoryRepository.cs    # Kategori sorguları
│   ├── ClothingRepository.cs    # Kıyafet filtreleme, ekleme, giyim sayacı
│   └── OutfitRepository.cs      # Multi-mapping ile kombin ve parça ilişkileri
│
├── Services/
│   └── PasswordHasher.cs        # PBKDF2 parola hashleme ve doğrulama servisi
│
├── wwwroot/                     # Statik Web Ön Yüzü
│   ├── css/style.css            # Lüks koyu tema, glassmorphism ve responsive CSS
│   ├── js/app.js                # Durum yönetimi (State), API istemcisi ve Stüdyo motoru
│   ├── images/                  # Varsayılan ikonlar ve SVG görseller
│   ├── uploads/                 # Kullanıcıların yüklediği fotoğraflar
│   └── index.html               # Ana SPA sayfası
│
├── Program.cs                   # API uç noktaları, Cookie Auth ve DI konfigürasyonu
└── GardiropApp.csproj           # Proje ayarları ve NuGet paketleri
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
* [.NET 10 SDK](https://dotnet.microsoft.com/download) kurulu olmalıdır.
* Herhangi bir harici veritabanı sunucusu kurmanıza **gerek yoktur** (SQLite uygulama açıldığında otomatik oluşturulur).

### Adımlar

1. **Projeyi Klonlayın veya İndirin:**
   ```bash
   git clone https://github.com/KULLANICI_ADINIZ/Gardirop.git
   cd Gardirop
   ```

2. **Paketleri Geri Yükleyin:**
   ```bash
   dotnet restore
   ```

3. **Uygulamayı Başlatın:**
   ```bash
   dotnet run --launch-profile "http"
   ```

4. **Tarayıcınızdan Erişin:**
   * **Kendi Bilgisayarınızdan:** [http://localhost:5041](http://localhost:5041)
   * **Aynı Wi-Fi Ağındaki Telefondan / Başka Cihazdan:** `http://<BILGISAYAR_IP_ADRESINIZ>:5041` (Örn: `http://192.168.1.111:5041`)

---

## 💡 Demo Giriş Bilgileri

Sistemi hızlıca test edebilmeniz için giriş ekranında tek tıkla doldurulabilen hazır hesaplar mevcuttur:

* **Batu:** `batu` / `password123`
* **Abla:** `abla` / `password123`

*İstediğiniz zaman "Yeni Hesap Aç" sekmesinden kendi özel hesabınızı oluşturabilirsiniz.*

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. Dilediğiniz gibi geliştirebilir, değiştirebilir ve kişisel gardırobunuz için kullanabilirsiniz.
