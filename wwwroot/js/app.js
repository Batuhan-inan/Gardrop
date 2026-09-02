// State Management
const state = {
  currentUser: null,
  categories: [],
  clothes: [],
  outfits: [],
  filters: {
    categoryId: null,
    color: '',
    season: '',
    search: '',
    onlyFavorites: false,
    onlyUnworn: false
  },
  // Kombin Stüdyosu yuvaları
  studioSlots: {
    top: null,       // Üst Giyim
    bottom: null,    // Alt Giyim
    outerwear: null, // Dış Giyim
    shoes: null,     // Ayakkabı
    accessory: null  // Aksesuar
  },
  studioFilterCategory: null,
  studioFilterColor: ''
};

// API İstemcisi
const api = {
  async req(url, options = {}) {
    options.credentials = 'include';
    options.headers = options.headers || {};
    if (options.body && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, options);
    if (res.status === 401) {
      state.currentUser = null;
      renderAuth();
      throw new Error('Oturum süresi doldu.');
    }
    return res;
  },

  async getMe() {
    try {
      const res = await this.req('/api/auth/me');
      if (res.ok) return await res.json();
    } catch { }
    return null;
  },

  async login(username, password) {
    const res = await this.req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Giriş yapılamadı.');
    }
    return await res.json();
  },

  async register(username, password, fullName) {
    const res = await this.req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Kayıt yapılamadı.');
    }
    return await res.json();
  },

  async logout() {
    await this.req('/api/auth/logout', { method: 'POST' });
    state.currentUser = null;
    renderAuth();
  },

  async updateProfile(username, fullName) {
    const res = await this.req('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, fullName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Profil güncellenemedi.');
    }
    return await res.json();
  },

  async changePassword(currentPassword, newPassword) {
    const res = await this.req('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Şifre değiştirilemedi.');
    }
    return await res.json();
  },

  async getAdminStats() {
    const res = await this.req('/api/admin/stats');
    if (!res.ok) throw new Error('İstatistikler alınamadı.');
    return await res.json();
  },

  async getAdminUsers() {
    const res = await this.req('/api/admin/users');
    if (!res.ok) throw new Error('Kullanıcı listesi alınamadı.');
    return await res.json();
  },

  async adminResetPassword(userId, newPassword) {
    const res = await this.req(`/api/admin/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Şifre güncellenemedi.');
    }
    return await res.json();
  },

  async adminDeleteUser(userId) {
    const res = await this.req(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Kullanıcı silinemedi.');
    }
    return await res.json();
  },

  async getCategories() {
    const res = await this.req('/api/categories');
    return res.ok ? await res.json() : [];
  },

  async getClothes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.color) params.append('color', filters.color);
    if (filters.season) params.append('season', filters.season);
    if (filters.search) params.append('search', filters.search);
    if (filters.onlyFavorites) params.append('onlyFavorites', 'true');
    if (filters.onlyUnworn) params.append('onlyUnworn', 'true');

    const res = await this.req(`/api/clothes?${params.toString()}`);
    return res.ok ? await res.json() : [];
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.req('/api/clothes/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Fotoğraf yüklenemedi.');
    }
    const data = await res.json();
    return data.url;
  },

  async createClothing(item) {
    const res = await this.req('/api/clothes', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Kıyafet eklenemedi.');
    return await res.json();
  },

  async deleteClothing(id) {
    const res = await this.req(`/api/clothes/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async toggleFavorite(id) {
    const res = await this.req(`/api/clothes/${id}/favorite`, { method: 'POST' });
    return res.ok;
  },

  async markClothingWorn(id) {
    const res = await this.req(`/api/clothes/${id}/worn`, { method: 'POST' });
    return res.ok;
  },

  async getOutfits() {
    const res = await this.req('/api/outfits');
    return res.ok ? await res.json() : [];
  },

  async createOutfit(name, description, clothingItemIds) {
    const res = await this.req('/api/outfits', {
      method: 'POST',
      body: JSON.stringify({ name, description, clothingItemIds })
    });
    if (!res.ok) throw new Error('Kombin kaydedilemedi.');
    return await res.json();
  },

  async deleteOutfit(id) {
    const res = await this.req(`/api/outfits/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async markOutfitWorn(id) {
    const res = await this.req(`/api/outfits/${id}/worn`, { method: 'POST' });
    return res.ok;
  }
};

// Toast Mesajı
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Renk paleti eşleştirmeleri
const COLOR_PALETTE = [
  { name: 'Siyah', hex: '#111827' },
  { name: 'Beyaz', hex: '#F8FAFC' },
  { name: 'Gri', hex: '#64748B' },
  { name: 'Lacivert', hex: '#1E3A8A' },
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'Bej / Krem', hex: '#E5D3B3' },
  { name: 'Kahverengi', hex: '#78350F' },
  { name: 'Haki / Yeşil', hex: '#166534' },
  { name: 'Kırmızı / Bordo', hex: '#991B1B' },
  { name: 'Sarı / Hardal', hex: '#CA8A04' }
];

// BAŞLANGIÇ (INIT)
async function initApp() {
  state.currentUser = await api.getMe();
  if (!state.currentUser) {
    renderAuth();
    return;
  }

  renderAppLayout();
  state.categories = await api.getCategories();
  renderCategoryPills();
  renderCategorySelect();
  renderColorFilterChips();
  await loadWardrobe();
  await loadOutfits();
}

function getDeviceSavedAccounts() {
  try {
    const raw = localStorage.getItem('gardirop_saved_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccountToDevice(username, fullName) {
  try {
    let accounts = getDeviceSavedAccounts();
    accounts = accounts.filter(a => a.username.toLowerCase() !== username.toLowerCase());
    accounts.unshift({ username, fullName: fullName || username });
    if (accounts.length > 2) accounts = accounts.slice(0, 2);
    localStorage.setItem('gardirop_saved_accounts', JSON.stringify(accounts));
  } catch {}
}

function removeAccountFromDevice(username, event) {
  if (event) event.stopPropagation();
  try {
    let accounts = getDeviceSavedAccounts();
    accounts = accounts.filter(a => a.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem('gardirop_saved_accounts', JSON.stringify(accounts));
    renderAuth();
  } catch {}
}

function selectSavedAccount(username) {
  switchAuthTab('login');
  const userInp = document.getElementById('auth-username');
  const passInp = document.getElementById('auth-password');
  if (userInp) userInp.value = username;
  if (passInp) {
    passInp.value = '';
    passInp.focus();
  }
}

// AUTH GÖRÜNÜMÜ
function renderAuth() {
  const savedAccounts = getDeviceSavedAccounts();

  document.getElementById('app-root').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="modal-box" style="max-width: 440px; border-color: rgba(212, 175, 55, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
        <div style="text-align: center; margin-bottom: 0.5rem;">
          <div class="logo-icon" style="margin: 0 auto 1rem auto; width: 48px; height: 48px; font-size: 1.4rem;">
            <i class="fa-solid fa-shirt"></i>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">GARDIROP & STİL</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">Dolabını dijitalleştir, şık kombinler yarat.</p>
        </div>

        <div style="display: flex; gap: 0.5rem; background: rgba(255,255,255,0.04); padding: 0.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <button id="auth-tab-login" class="btn btn-sm" style="flex: 1; background: var(--accent-gold); color: #0B0F17; font-weight: 700;" onclick="switchAuthTab('login')">Giriş Yap</button>
          <button id="auth-tab-register" class="btn btn-sm btn-secondary" style="flex: 1;" onclick="switchAuthTab('register')">Yeni Hesap Aç</button>
        </div>

        <form id="auth-form" onsubmit="handleAuthSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
          <div class="form-group" id="fullname-group" style="display: none;">
            <label class="form-label">Adınız Soyadınız</label>
            <input type="text" id="auth-fullname" class="form-control" placeholder="ör. Adınız Soyadınız" />
          </div>

          <div class="form-group">
            <label class="form-label">Kullanıcı Adı</label>
            <input type="text" id="auth-username" class="form-control" placeholder="ör. batu, abla veya arkadas" required autocomplete="username" />
          </div>

          <div class="form-group">
            <label class="form-label">Şifre</label>
            <input type="password" id="auth-password" class="form-control" placeholder="••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" id="auth-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Giriş Yap
          </button>
        </form>

        ${savedAccounts.length > 0 ? `
        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.6rem; text-align: center;">Bu Cihazda Hatırlanan Hesaplar:</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${savedAccounts.map(acc => `
              <div class="saved-account-chip" onclick="selectSavedAccount('${escapeHtml(acc.username)}')" title="Tıkla ve şifreni gir">
                <div class="saved-account-avatar">${(acc.fullName || acc.username)[0].toUpperCase()}</div>
                <div style="flex: 1; text-align: left;">
                  <div style="font-weight: 600; font-size: 0.88rem; color: #fff;">${escapeHtml(acc.fullName || acc.username)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHtml(acc.username)}</div>
                </div>
                <button type="button" class="saved-account-remove" onclick="removeAccountFromDevice('${escapeHtml(acc.username)}', event)" title="Bu cihazdan kaldır">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

let isRegisterMode = false;
function switchAuthTab(mode) {
  isRegisterMode = mode === 'register';
  document.getElementById('auth-tab-login').className = isRegisterMode ? 'btn btn-sm btn-secondary' : 'btn btn-sm';
  document.getElementById('auth-tab-login').style.background = isRegisterMode ? 'transparent' : 'var(--accent-gold)';
  document.getElementById('auth-tab-login').style.color = isRegisterMode ? 'var(--text-secondary)' : '#0B0F17';

  document.getElementById('auth-tab-register').className = isRegisterMode ? 'btn btn-sm' : 'btn btn-sm btn-secondary';
  document.getElementById('auth-tab-register').style.background = isRegisterMode ? 'var(--accent-gold)' : 'transparent';
  document.getElementById('auth-tab-register').style.color = isRegisterMode ? '#0B0F17' : 'var(--text-secondary)';

  document.getElementById('fullname-group').style.display = isRegisterMode ? 'flex' : 'none';
  document.getElementById('auth-submit-btn').innerHTML = isRegisterMode
    ? '<i class="fa-solid fa-user-plus"></i> Hesap Oluştur'
    : '<i class="fa-solid fa-arrow-right-to-bracket"></i> Giriş Yap';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const fullName = document.getElementById('auth-fullname').value.trim();

  try {
    let loggedInUser;
    if (isRegisterMode) {
      loggedInUser = await api.register(username, password, fullName || username);
      showToast('Hesap başarıyla oluşturuldu!', 'success');
    } else {
      loggedInUser = await api.login(username, password);
      showToast('Giriş başarılı!', 'success');
    }
    // Sadece bu cihaza özel hatırla
    saveAccountToDevice(username, loggedInUser.fullName || fullName || username);
    await initApp();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ANA UYGULAMA DÜZENİ
function renderAppLayout() {
  document.getElementById('app-root').innerHTML = `
    <!-- NAVBAR -->
    <header class="navbar">
      <div class="nav-container">
        <a href="#" class="logo" onclick="switchView('wardrobe')">
          <div class="logo-icon">
            <i class="fa-solid fa-shirt"></i>
          </div>
          <span>GARDIROP</span>
        </a>

        <nav class="nav-tabs">
          <button class="nav-tab-btn active" id="tab-btn-wardrobe" onclick="switchView('wardrobe')">
            <i class="fa-solid fa-layer-group"></i> <span>Gardırobum</span>
          </button>
          <button class="nav-tab-btn" id="tab-btn-studio" onclick="switchView('studio')">
            <i class="fa-solid fa-wand-magic-sparkles"></i> <span>Kombin Stüdyosu</span>
          </button>
          <button class="nav-tab-btn" id="tab-btn-outfits" onclick="switchView('outfits')">
            <i class="fa-solid fa-bookmark"></i> <span>Kombinlerim</span>
          </button>
          <button class="nav-tab-btn" id="tab-btn-unworn" onclick="switchView('unworn')">
            <i class="fa-solid fa-clock-rotate-left"></i> <span>Unutulanlar</span>
          </button>
          ${state.currentUser && state.currentUser.isAdmin ? `
          <button class="nav-tab-btn nav-tab-admin" id="tab-btn-admin" onclick="switchView('admin')">
            <i class="fa-solid fa-shield-halved"></i> <span>Yönetim</span>
          </button>
          ` : ''}
        </nav>

        <div class="nav-user">
          <div class="user-badge" onclick="openProfileModal()" style="cursor: pointer;" title="Hesap ve Şifre Ayarları">
            <div class="user-avatar" id="nav-user-avatar">${(state.currentUser.fullName || state.currentUser.username)[0].toUpperCase()}</div>
            <span style="font-weight: 600;" id="nav-user-fullname">${state.currentUser.fullName || state.currentUser.username}</span>
            <i class="fa-solid fa-gear" style="font-size: 0.8rem; color: var(--text-muted); margin-left: 2px;"></i>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="api.logout()" title="Çıkış Yap">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- ANA İÇERİK ALANI -->
    <main class="main-content">
      <!-- 1. GARDIROBUM -->
      <section id="view-wardrobe" class="view-section active">
        <div class="section-header">
          <div>
            <h1 class="section-title">Gardırobum</h1>
            <p class="section-subtitle">Dolabındaki tüm giysiler, kategoriler ve renkler</p>
          </div>
          <button class="btn btn-primary" onclick="openAddClothingModal()">
            <i class="fa-solid fa-plus"></i> Yeni Kıyafet Ekle
          </button>
        </div>

        <!-- FİLTRE BARI -->
        <div class="filter-bar">
          <div class="filter-row">
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="wardrobe-search" class="search-input" placeholder="İsim, marka veya not ara..." oninput="handleSearch(this.value)" />
            </div>

            <select id="season-filter" class="select-input" onchange="handleSeasonFilter(this.value)">
              <option value="">Mevsim: Tümü</option>
              <option value="Yazlık">☀️ Yazlık</option>
              <option value="Kışlık">❄️ Kışlık</option>
              <option value="Baharlık">🍂 Baharlık</option>
              <option value="Dört Mevsim">🔄 Dört Mevsim</option>
            </select>

            <button id="fav-toggle-btn" class="btn btn-secondary btn-sm" onclick="toggleFavFilter()" style="padding: 0.65rem 1rem;">
              <i class="fa-solid fa-heart"></i> Sadece Favoriler
            </button>
          </div>

          <!-- KATEGORİ HAPLARI -->
          <div id="category-pills" class="category-pills"></div>

          <!-- RENK FİLTRELERİ -->
          <div id="color-chips" class="color-chips"></div>
        </div>

        <!-- KIYAFET KARTLARI -->
        <div id="clothing-grid" class="clothing-grid"></div>
      </section>

      <!-- 2. KOMBİN STÜDYOSU -->
      <section id="view-studio" class="view-section">
        <div class="section-header">
          <div>
            <h1 class="section-title">Kombin Stüdyosu</h1>
            <p class="section-subtitle">Parçaları yan yana getir, akıllı renk ve stil eşleşmeleriyle dene</p>
          </div>
          <div style="display: flex; gap: 0.6rem;">
            <button class="btn btn-secondary" onclick="clearStudio()">
              <i class="fa-solid fa-rotate-left"></i> Sıfırla
            </button>
            <button class="btn btn-primary" onclick="openSaveOutfitModal()">
              <i class="fa-solid fa-bookmark"></i> Kombini Kaydet
            </button>
          </div>
        </div>

        <div class="studio-layout">
          <!-- SOL: MANKEN / YUVA DÜZENİ -->
          <div class="mannequin-panel">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--accent-gold-light); display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-wand-magic"></i> Seçilen Parçalar
            </h3>

            <div class="outfit-slots-stack">
              <!-- Üst Giyim Yuvası -->
              <div class="outfit-slot" id="slot-top" onclick="selectStudioCategoryFilter('Üst Giyim')">
                <div class="slot-empty-icon"><i class="fa-solid fa-shirt"></i></div>
                <div class="slot-info">
                  <div class="slot-label">Üst Giyim (Tişört, Gömlek, Kazak)</div>
                  <div class="slot-name">Seçilmedi - Dokun ve Ekle</div>
                </div>
              </div>

              <!-- Alt Giyim Yuvası -->
              <div class="outfit-slot" id="slot-bottom" onclick="selectStudioCategoryFilter('Alt Giyim')">
                <div class="slot-empty-icon"><i class="fa-solid fa-person"></i></div>
                <div class="slot-info">
                  <div class="slot-label">Alt Giyim (Kot, Pantolon, Şort)</div>
                  <div class="slot-name">Seçilmedi - Dokun ve Ekle</div>
                </div>
              </div>

              <!-- Dış Giyim Yuvası -->
              <div class="outfit-slot" id="slot-outerwear" onclick="selectStudioCategoryFilter('Dış Giyim')">
                <div class="slot-empty-icon"><i class="fa-solid fa-vest-patches"></i></div>
                <div class="slot-info">
                  <div class="slot-label">Dış Giyim (Ceket, Mont, Kaban)</div>
                  <div class="slot-name">İsteğe Bağlı - Dokun ve Ekle</div>
                </div>
              </div>

              <!-- Ayakkabı Yuvası -->
              <div class="outfit-slot" id="slot-shoes" onclick="selectStudioCategoryFilter('Ayakkabı')">
                <div class="slot-empty-icon"><i class="fa-solid fa-shoe-prints"></i></div>
                <div class="slot-info">
                  <div class="slot-label">Ayakkabı</div>
                  <div class="slot-name">İsteğe Bağlı - Dokun ve Ekle</div>
                </div>
              </div>

              <!-- Aksesuar Yuvası -->
              <div class="outfit-slot" id="slot-accessory" onclick="selectStudioCategoryFilter('Aksesuar')">
                <div class="slot-empty-icon"><i class="fa-solid fa-glasses"></i></div>
                <div class="slot-info">
                  <div class="slot-label">Aksesuar</div>
                  <div class="slot-name">İsteğe Bağlı - Dokun ve Ekle</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SAĞ: DOLAPTAN SEÇİM VE AKILLI ÖNERİ PANELİ -->
          <div class="studio-picker-panel">
            <div id="smart-match-banner" class="smart-match-banner" style="display: none;">
              <div class="smart-match-icon"><i class="fa-solid fa-lightbulb"></i></div>
              <div class="smart-match-text">
                <h4 id="smart-match-title">Akıllı Kombin İpucu</h4>
                <p id="smart-match-desc">Seçtiğin parça ile uyumlu renkleri filtrelemek için aşağıdaki renk butonlarına tıklayabilirsin.</p>
              </div>
            </div>

            <!-- Stüdyo içi hızlı filtreler -->
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;" id="studio-quick-filters"></div>

            <!-- Stüdyo Giysi Grid -->
            <div id="studio-clothes-grid" class="clothing-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));"></div>
          </div>
        </div>
      </section>

      <!-- 3. KOMBİNLERİM -->
      <section id="view-outfits" class="view-section">
        <div class="section-header">
          <div>
            <h1 class="section-title">Kombinlerim</h1>
            <p class="section-subtitle">Daha önce kaydettiğin tüm kombinler ve giyme geçmişin</p>
          </div>
          <button class="btn btn-primary" onclick="switchView('studio')">
            <i class="fa-solid fa-plus"></i> Yeni Kombin Oluştur
          </button>
        </div>

        <div id="outfits-grid" class="outfit-grid"></div>
      </section>

      <!-- 4. UNUTULANLAR -->
      <section id="view-unworn" class="view-section">
        <div class="section-header">
          <div>
            <h1 class="section-title">Dolapta Unutulanlar</h1>
            <p class="section-subtitle">Uzun süredir giyilmemiş veya hiç dokunulmamış hazinelerin!</p>
          </div>
        </div>

        <div class="smart-match-banner" style="margin-bottom: 1.5rem;">
          <div class="smart-match-icon"><i class="fa-solid fa-sparkles"></i></div>
          <div class="smart-match-text">
            <h4>Dolabını Canlandır</h4>
            <p>Bu kıyafetleri giymeyeli epey zaman oldu. "Bununla Kombin Yap" butonuna basarak doğrudan stüdyoya taşıyabilir ve yepyeni bir stil oluşturabilirsin.</p>
          </div>
        </div>

        <div id="unworn-clothes-grid" class="clothing-grid"></div>
      </section>

      <!-- 5. YÖNETİM PANELİ (Sadece Admin) -->
      ${state.currentUser && state.currentUser.isAdmin ? `
      <section id="view-admin" class="view-section">
        <div class="section-header">
          <div>
            <h1 class="section-title"><i class="fa-solid fa-shield-halved" style="color: #fbbf24; margin-right: 8px;"></i>Yönetim Paneli</h1>
            <p class="section-subtitle">Sistemdeki tüm kullanıcılar, dolap dolulukları ve kullanım hareketleri</p>
          </div>
          <button class="btn btn-secondary" onclick="loadAdminData()">
            <i class="fa-solid fa-rotate"></i> Verileri Yenile
          </button>
        </div>

        <!-- KPI KARTLARI -->
        <div class="kpi-grid" id="admin-kpi-container">
          <div style="color: var(--text-muted); padding: 1rem;">İstatistikler yükleniyor...</div>
        </div>

        <!-- KULLANICI LİSTESİ TABLOSU -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 4px;">Kayıtlı Kullanıcılar</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted);">Sistemde kayıtlı tüm hesapların dolap ve kombin özetleri</p>
            </div>
            <div class="search-input-wrap" style="max-width: 320px;">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" class="search-input" placeholder="Kullanıcı veya ad ara..." oninput="handleAdminUserSearch(this.value)" />
            </div>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Yetki Rolü</th>
                  <th>Dolaptaki Kıyafet</th>
                  <th>Kayıtlı Kombin</th>
                  <th>Kayıt Tarihi</th>
                  <th>Son Aktivite</th>
                  <th style="text-align: right;">İşlemler</th>
                </tr>
              </thead>
              <tbody id="admin-users-tbody">
                <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Kullanıcılar yükleniyor...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      ` : ''}
    </main>

    <!-- KIYAFET EKLEME / DÜZENLEME MODALI -->
    <div id="clothing-modal" class="modal-backdrop">
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title" id="clothing-modal-title">Yeni Kıyafet Ekle</h2>
          <button class="modal-close-btn" onclick="closeModal('clothing-modal')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="clothing-form" onsubmit="handleSaveClothing(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- FOTOĞRAF ALANI -->
          <div class="form-group">
            <label class="form-label">Kıyafet Fotoğrafı (Telefondan çek veya seç)</label>
            <div class="upload-area" id="upload-dropzone" onclick="triggerFileInput()">
              <i class="fa-solid fa-camera upload-icon"></i>
              <div style="font-size: 0.9rem; font-weight: 600;">Fotoğraf Çek veya Yükle</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">JPG, PNG, WEBP (Maks 10 MB)</div>
              <!-- Gizli file input: Hem kamera hem galeri destekler -->
              <input type="file" id="clothing-file-input" accept="image/*" capture="environment" style="display: none;" onchange="handleFileSelected(this.files)" />
            </div>

            <div id="upload-preview-container" style="display: none;" class="upload-preview-wrap">
              <img id="upload-preview-img" class="upload-preview" src="" alt="Önizleme" />
              <button type="button" class="btn btn-danger btn-sm" style="position: absolute; top: 4px; right: 4px; padding: 2px 6px;" onclick="removeUploadedPhoto(event)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <input type="hidden" id="clothing-image-url" value="" />
          </div>

          <div class="form-group">
            <label class="form-label">Kıyafet Adı *</label>
            <input type="text" id="clothing-name" class="form-control" placeholder="ör. Siyah Slim Fit Kot Pantolon" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Kategori *</label>
              <select id="clothing-category" class="form-control" required></select>
            </div>

            <div class="form-group">
              <label class="form-label">Mevsim *</label>
              <select id="clothing-season" class="form-control" required>
                <option value="Dört Mevsim">🔄 Dört Mevsim</option>
                <option value="Yazlık">☀️ Yazlık</option>
                <option value="Kışlık">❄️ Kışlık</option>
                <option value="Baharlık">🍂 Baharlık</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Renk *</label>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" id="clothing-color" class="form-control" placeholder="ör. Siyah" required style="flex: 1;" />
              <input type="color" id="clothing-color-hex" value="#111827" style="width: 44px; height: 38px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: transparent; cursor: pointer;" />
            </div>
            <!-- Hızlı Renk Seçici -->
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.4rem;">
              ${COLOR_PALETTE.map(c => `
                <div class="color-dot" style="background: ${c.hex}; cursor: pointer; width: 22px; height: 22px;" title="${c.name}" onclick="pickQuickColor('${c.name}', '${c.hex}')"></div>
              `).join('')}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Marka (İsteğe bağlı)</label>
              <input type="text" id="clothing-brand" class="form-control" placeholder="ör. Zara, Mavi, vb." />
            </div>
            <div class="form-group">
              <label class="form-label">Notlar (İsteğe bağlı)</label>
              <input type="text" id="clothing-notes" class="form-control" placeholder="ör. Pamuklu kumaş, rahat kalıp" />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeModal('clothing-modal')">İptal</button>
            <button type="submit" id="save-clothing-btn" class="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </div>
    </div>

    <!-- KOMBİNİ KAYDET MODALI -->
    <div id="save-outfit-modal" class="modal-backdrop">
      <div class="modal-box" style="max-width: 460px;">
        <div class="modal-header">
          <h2 class="modal-title">Kombini Kaydet</h2>
          <button class="modal-close-btn" onclick="closeModal('save-outfit-modal')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="handleSaveOutfitSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Kombin Adı *</label>
            <input type="text" id="outfit-name-input" class="form-control" placeholder="ör. Cuma Ofis Şıklığı, Hafta Sonu Gezmesi" required />
          </div>

          <div class="form-group">
            <label class="form-label">Açıklama veya Etiketler (İsteğe bağlı)</label>
            <textarea id="outfit-desc-input" class="form-control" rows="2" placeholder="ör. Yağmurlu günlerde veya spor buluşmalarda giyilebilir"></textarea>
          </div>

          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; background: rgba(0,0,0,0.2);">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">Kombindeki Parçalar:</div>
            <div id="outfit-preview-items" style="display: flex; gap: 0.5rem; overflow-x: auto;"></div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeModal('save-outfit-modal')">İptal</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Kombinlerime Ekle</button>
          </div>
        </form>
      </div>
    </div>

    <!-- KULLANICI PROFİL VE ŞİFRE AYARLARI MODALI -->
    <div id="profile-modal" class="modal-backdrop">
      <div class="modal-box" style="max-width: 460px;">
        <div class="modal-header">
          <h2 class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-user-gear" style="color: var(--accent-gold);"></i> Profil & Şifre Ayarları
          </h2>
          <button class="modal-close-btn" onclick="closeModal('profile-modal')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Profil Bilgileri Formu -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.1rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--accent-gold-light); display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-id-card"></i> Profil Bilgileri
          </h3>
          <form onsubmit="handleUpdateProfile(event)" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Kullanıcı Adı</label>
              <input type="text" id="profile-username" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Ad Soyad</label>
              <input type="text" id="profile-fullname" class="form-control" required />
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" id="update-profile-btn" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-check"></i> Bilgileri Güncelle
              </button>
            </div>
          </form>
        </div>

        <!-- Şifre Değiştirme Formu -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.1rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--accent-gold-light); display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-key"></i> Şifre Değiştir
          </h3>
          <form onsubmit="handleChangePassword(event)" style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Mevcut Şifre</label>
              <input type="password" id="profile-curr-password" class="form-control" placeholder="Mevcut şifreniz" required />
            </div>
            <div class="form-group">
              <label class="form-label">Yeni Şifre</label>
              <input type="password" id="profile-new-password" class="form-control" placeholder="En az 4 karakter" required />
            </div>
            <div class="form-group">
              <label class="form-label">Yeni Şifre (Tekrar)</label>
              <input type="password" id="profile-new-password2" class="form-control" placeholder="Yeni şifrenizi tekrar girin" required />
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" id="update-password-btn" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-lock"></i> Şifreyi Güncelle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ADMIN KULLANICI ŞİFRESİ DEĞİŞTİRME MODALI -->
    <div id="admin-password-modal" class="modal-backdrop">
      <div class="modal-box" style="max-width: 420px;">
        <div class="modal-header">
          <h3 class="modal-title" style="font-size: 1.15rem;">
            <i class="fa-solid fa-key" style="color: var(--accent-gold); margin-right: 6px;"></i>
            Kullanıcı Şifresini Değiştir
          </h3>
          <button class="modal-close-btn" onclick="closeModal('admin-password-modal')"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form onsubmit="handleAdminResetPasswordSubmit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="admin-target-user-id" />
          <div style="background: rgba(255,255,255,0.04); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Hedef Hesap:</div>
            <div id="admin-target-user-name" style="font-weight: 700; color: #fff; margin-top: 2px;"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Atanacak Yeni Şifre *</label>
            <input type="password" id="admin-target-new-password" class="form-control" placeholder="En az 4 karakter" required />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeModal('admin-password-modal')">Vazgeç</button>
            <button type="submit" id="admin-reset-pw-btn" class="btn btn-primary">
              <i class="fa-solid fa-check"></i> Şifreyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// SEKMELER ARASI GEÇİŞ
function switchView(viewName) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(`view-view-${viewName}`) || document.getElementById(`view-${viewName}`);
  const targetBtn = document.getElementById(`tab-btn-${viewName}`);

  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  if (viewName === 'wardrobe') loadWardrobe();
  if (viewName === 'studio') renderStudio();
  if (viewName === 'outfits') loadOutfits();
  if (viewName === 'unworn') loadUnwornView();
  if (viewName === 'admin') loadAdminData();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// KATEGORİ SEÇİMLERİ
function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  let html = `
    <button class="cat-pill ${state.filters.categoryId === null ? 'active' : ''}" onclick="filterByCategory(null)">
      <i class="fa-solid fa-border-all"></i> Tümü (${state.clothes.length})
    </button>
  `;

  state.categories.forEach(cat => {
    const count = state.clothes.filter(c => c.categoryId === cat.id).length;
    html += `
      <button class="cat-pill ${state.filters.categoryId === cat.id ? 'active' : ''}" onclick="filterByCategory(${cat.id})">
        <i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name} (${count})
      </button>
    `;
  });

  container.innerHTML = html;
}

function renderCategorySelect() {
  const select = document.getElementById('clothing-category');
  if (!select) return;
  select.innerHTML = state.categories.map(c => `
    <option value="${c.id}">${c.name}</option>
  `).join('');
}

function renderColorFilterChips() {
  const container = document.getElementById('color-chips');
  if (!container) return;

  // Dolapta var olan renkleri çek
  const distinctColors = [...new Set(state.clothes.map(c => c.color).filter(Boolean))];

  let html = `
    <div class="color-chip ${state.filters.color === '' ? 'active' : ''}" onclick="filterByColor('')">
      <span>Tüm Renkler</span>
    </div>
  `;

  distinctColors.forEach(col => {
    const itemWithCol = state.clothes.find(c => c.color === col);
    const hex = itemWithCol?.colorHex || '#64748B';
    html += `
      <div class="color-chip ${state.filters.color === col ? 'active' : ''}" onclick="filterByColor('${col}')">
        <div class="color-dot" style="background: ${hex};"></div>
        <span>${col}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// FİLTRELEME İŞLEMLERİ
function filterByCategory(catId) {
  state.filters.categoryId = catId;
  renderCategoryPills();
  loadWardrobe();
}

function filterByColor(color) {
  state.filters.color = color;
  renderColorFilterChips();
  loadWardrobe();
}

function handleSeasonFilter(season) {
  state.filters.season = season;
  loadWardrobe();
}

let searchDebounce = null;
function handleSearch(val) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.filters.search = val;
    loadWardrobe();
  }, 250);
}

function toggleFavFilter() {
  state.filters.onlyFavorites = !state.filters.onlyFavorites;
  const btn = document.getElementById('fav-toggle-btn');
  if (state.filters.onlyFavorites) {
    btn.style.borderColor = 'var(--accent-gold)';
    btn.style.color = 'var(--accent-gold)';
    btn.innerHTML = '<i class="fa-solid fa-heart" style="color:#EF4444;"></i> Favoriler Açık';
  } else {
    btn.style.borderColor = 'var(--border-color)';
    btn.style.color = 'var(--text-primary)';
    btn.innerHTML = '<i class="fa-solid fa-heart"></i> Sadece Favoriler';
  }
  loadWardrobe();
}

// GARDIROP VERİLERİNİ YÜKLE VE ÇİZ
async function loadWardrobe() {
  state.clothes = await api.getClothes(state.filters);
  renderCategoryPills();
  renderColorFilterChips();

  const grid = document.getElementById('clothing-grid');
  if (!grid) return;

  if (state.clothes.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-vest-patches"></i>
        <h3>Bu filtreye uygun kıyafet bulunamadı</h3>
        <p style="font-size: 0.9rem;">Yeni kıyafet ekleyerek dolabını doldurabilir veya filtreleri temizleyebilirsin.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddClothingModal()">
          <i class="fa-solid fa-plus"></i> Kıyafet Ekle
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.clothes.map(item => `
    <div class="clothing-card">
      <div class="card-img-wrap">
        <img src="${item.imageUrl}" class="card-img" alt="${item.name}" onerror="this.src='/images/placeholder.svg'" />
        <span class="card-badge">${item.categoryName}</span>
        <button class="card-fav-btn ${item.isFavorite ? 'active' : ''}" onclick="toggleFav(${item.id})" title="Favori">
          <i class="fa-${item.isFavorite ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>

      <div class="card-body">
        <h3 class="card-title" title="${item.name}">${item.name}</h3>
        
        <div class="card-meta">
          <span class="card-color-tag">
            <span class="color-dot" style="background: ${item.colorHex || '#64748B'};"></span>
            <span>${item.color}</span>
          </span>
          <span>•</span>
          <span>${item.season}</span>
          ${item.brand ? `<span>• ${item.brand}</span>` : ''}
        </div>

        <div class="card-stats">
          <span><i class="fa-solid fa-repeat"></i> ${item.wearCount > 0 ? `${item.wearCount} kez giyildi` : 'Hiç giyilmedi'}</span>
          <span>${formatLastWorn(item.lastWornDate)}</span>
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="markWorn(${item.id})" title="Bugün giyildi olarak işaretle">
            <i class="fa-solid fa-check"></i> Giydim
          </button>
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="sendToStudio(${item.id})" title="Bu parçayla kombin yap">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Kombinle
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})" title="Sil">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function formatLastWorn(dateStr) {
  if (!dateStr) return 'Hiç giyilmedi';
  const d = new Date(dateStr);
  const diffDays = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Bugün giyildi';
  if (diffDays === 1) return 'Dün giyildi';
  if (diffDays < 30) return `${diffDays} gün önce`;
  return `${d.toLocaleDateString('tr-TR')}`;
}

// KART AKSİYONLARI
async function toggleFav(id) {
  await api.toggleFavorite(id);
  loadWardrobe();
}

async function markWorn(id) {
  await api.markClothingWorn(id);
  showToast('Kıyafet giyildi olarak işaretlendi!', 'success');
  loadWardrobe();
}

async function deleteItem(id) {
  if (!confirm('Bu kıyafeti gardırobunuzdan silmek istediğinize emin misiniz?')) return;
  await api.deleteClothing(id);
  showToast('Kıyafet silindi.', 'info');
  loadWardrobe();
}

// KIYAFET EKLEME MODAL VE FOTOĞRAF
function openAddClothingModal() {
  document.getElementById('clothing-modal-title').textContent = 'Yeni Kıyafet Ekle';
  document.getElementById('clothing-form').reset();
  document.getElementById('clothing-image-url').value = '';
  document.getElementById('upload-preview-container').style.display = 'none';
  document.getElementById('upload-dropzone').style.display = 'flex';
  openModal('clothing-modal');
}

function triggerFileInput() {
  document.getElementById('clothing-file-input').click();
}

function pickQuickColor(name, hex) {
  document.getElementById('clothing-color').value = name;
  document.getElementById('clothing-color-hex').value = hex;
}

async function handleFileSelected(files) {
  if (!files || files.length === 0) return;
  const file = files[0];

  const dropzone = document.getElementById('upload-dropzone');
  dropzone.innerHTML = `<i class="fa-solid fa-spinner fa-spin upload-icon"></i><div>Fotoğraf yükleniyor...</div>`;

  try {
    const url = await api.uploadPhoto(file);
    document.getElementById('clothing-image-url').value = url;
    document.getElementById('upload-preview-img').src = url;
    document.getElementById('upload-preview-container').style.display = 'block';
    dropzone.style.display = 'none';
    showToast('Fotoğraf başarıyla yüklendi!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    dropzone.innerHTML = `
      <i class="fa-solid fa-camera upload-icon"></i>
      <div style="font-size: 0.9rem; font-weight: 600;">Fotoğraf Çek veya Yükle</div>
      <div style="font-size: 0.78rem; color: var(--text-muted);">JPG, PNG, WEBP (Maks 10 MB)</div>
    `;
  }
}

function removeUploadedPhoto(e) {
  e.stopPropagation();
  document.getElementById('clothing-image-url').value = '';
  document.getElementById('upload-preview-container').style.display = 'none';
  document.getElementById('upload-dropzone').style.display = 'flex';
  document.getElementById('clothing-file-input').value = '';
}

async function handleSaveClothing(e) {
  e.preventDefault();
  const name = document.getElementById('clothing-name').value.trim();
  const categoryId = parseInt(document.getElementById('clothing-category').value);
  const color = document.getElementById('clothing-color').value.trim();
  const colorHex = document.getElementById('clothing-color-hex').value;
  const season = document.getElementById('clothing-season').value;
  const imageUrl = document.getElementById('clothing-image-url').value.trim();
  const brand = document.getElementById('clothing-brand').value.trim();
  const notes = document.getElementById('clothing-notes').value.trim();

  const btn = document.getElementById('save-clothing-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

  try {
    await api.createClothing({
      name,
      categoryId,
      color,
      colorHex,
      season,
      imageUrl: imageUrl || '/images/placeholder.svg',
      brand,
      notes
    });

    closeModal('clothing-modal');
    showToast('Kıyafet gardırobuna eklendi!', 'success');
    await loadWardrobe();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Kaydet';
  }
}

// KOMBİN STÜDYOSU MANTIĞI
function renderStudio() {
  renderStudioSlots();
  renderStudioClothes();
}

function renderStudioSlots() {
  const slotMappings = [
    { key: 'top', id: 'slot-top', label: 'Üst Giyim (Tişört, Gömlek, Kazak)', defaultIcon: 'fa-shirt' },
    { key: 'bottom', id: 'slot-bottom', label: 'Alt Giyim (Kot, Pantolon, Şort)', defaultIcon: 'fa-person' },
    { key: 'outerwear', id: 'slot-outerwear', label: 'Dış Giyim (Ceket, Mont)', defaultIcon: 'fa-vest-patches' },
    { key: 'shoes', id: 'slot-shoes', label: 'Ayakkabı', defaultIcon: 'fa-shoe-prints' },
    { key: 'accessory', id: 'slot-accessory', label: 'Aksesuar', defaultIcon: 'fa-glasses' }
  ];

  slotMappings.forEach(mapping => {
    const el = document.getElementById(mapping.id);
    const item = state.studioSlots[mapping.key];

    if (item) {
      el.className = 'outfit-slot filled';
      el.innerHTML = `
        <img src="${item.imageUrl}" class="slot-img-thumb" alt="${item.name}" onerror="this.src='/images/placeholder.svg'" />
        <div class="slot-info">
          <div class="slot-label">${mapping.label}</div>
          <div class="slot-name">${item.name} (${item.color})</div>
        </div>
        <button class="slot-remove-btn" onclick="removeFromStudio(event, '${mapping.key}')" title="Kaldır">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
    } else {
      el.className = 'outfit-slot';
      el.innerHTML = `
        <div class="slot-empty-icon"><i class="fa-solid ${mapping.defaultIcon}"></i></div>
        <div class="slot-info">
          <div class="slot-label">${mapping.label}</div>
          <div class="slot-name">Boş - Dokun ve Dolaptan Seç</div>
        </div>
      `;
    }
  });

  updateSmartMatchAdvice();
}

function selectStudioCategoryFilter(catName) {
  state.studioFilterCategory = catName;
  renderStudioClothes();
}

// Akıllı Kombin Öneri Sistemi
function updateSmartMatchAdvice() {
  const banner = document.getElementById('smart-match-banner');
  const title = document.getElementById('smart-match-title');
  const desc = document.getElementById('smart-match-desc');

  const bottom = state.studioSlots.bottom;
  const top = state.studioSlots.top;

  if (bottom && !top) {
    banner.style.display = 'flex';
    title.textContent = `Seçilen Alt Giyim: ${bottom.name} (${bottom.color})`;
    desc.textContent = `${bottom.color} alt giyim ile harika duracak uyumlu renkteki tişört ve gömlekleri aşağıdaki listeden tek tıkla ekleyebilirsin!`;
    if (!state.studioFilterCategory) state.studioFilterCategory = 'Üst Giyim';
  } else if (top && !bottom) {
    banner.style.display = 'flex';
    title.textContent = `Seçilen Üst Giyim: ${top.name} (${top.color})`;
    desc.textContent = `Şimdi bu üst parçanın altına yakışacak pantolon veya şortları inceleyebilirsin.`;
    if (!state.studioFilterCategory) state.studioFilterCategory = 'Alt Giyim';
  } else if (top && bottom) {
    banner.style.display = 'flex';
    title.textContent = 'Mükemmel Temel Kombin Hazır!';
    desc.textContent = `Üst ve alt seçildi! Şimdi kombini tamamlamak için bir dış giyim (ceket/mont) veya ayakkabı ekleyebilirsin.`;
  } else {
    banner.style.display = 'none';
  }
}

function renderStudioClothes() {
  const filterRow = document.getElementById('studio-quick-filters');
  const grid = document.getElementById('studio-clothes-grid');
  if (!filterRow || !grid) return;

  // Hızlı Kategori Seçimi
  filterRow.innerHTML = `
    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">Görüntülenen:</span>
    <button class="cat-pill ${!state.studioFilterCategory ? 'active' : ''}" onclick="setStudioCategory(null)">Tümü</button>
    ${state.categories.map(c => `
      <button class="cat-pill ${state.studioFilterCategory === c.name ? 'active' : ''}" onclick="setStudioCategory('${c.name}')">
        ${c.name}
      </button>
    `).join('')}
  `;

  // Filtreleme
  let items = state.clothes;
  if (state.studioFilterCategory) {
    items = items.filter(c => c.categoryName.toLowerCase().includes(state.studioFilterCategory.toLowerCase()));
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem;">
        <i class="fa-solid fa-shirt"></i>
        <h3>Bu kategoride kıyafet yok</h3>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="clothing-card" style="font-size: 0.85rem;">
      <div class="card-img-wrap" style="aspect-ratio: 1 / 1;">
        <img src="${item.imageUrl}" class="card-img" alt="${item.name}" onerror="this.src='/images/placeholder.svg'" />
        <span class="card-badge">${item.categoryName}</span>
      </div>
      <div class="card-body" style="padding: 0.75rem;">
        <div style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
          <span class="color-dot" style="background: ${item.colorHex || '#64748B'};"></span>
          <span>${item.color}</span>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%;" onclick="addItemToStudio(${item.id})">
          <i class="fa-solid fa-plus"></i> Kombine Ekle
        </button>
      </div>
    </div>
  `).join('');
}

function setStudioCategory(cat) {
  state.studioFilterCategory = cat;
  renderStudioClothes();
}

function addItemToStudio(id) {
  const item = state.clothes.find(c => c.id === id);
  if (!item) return;

  const catLower = item.categoryName.toLowerCase();
  if (catLower.includes('üst') || catLower.includes('tişört') || catLower.includes('gömlek') || catLower.includes('kazak')) {
    state.studioSlots.top = item;
  } else if (catLower.includes('alt') || catLower.includes('pantolon') || catLower.includes('şort') || catLower.includes('etek')) {
    state.studioSlots.bottom = item;
  } else if (catLower.includes('dış') || catLower.includes('ceket') || catLower.includes('mont') || catLower.includes('kaban')) {
    state.studioSlots.outerwear = item;
  } else if (catLower.includes('ayakkabı') || catLower.includes('bot') || catLower.includes('spor')) {
    state.studioSlots.shoes = item;
  } else {
    state.studioSlots.accessory = item;
  }

  showToast(`${item.name} kombine eklendi!`, 'info');
  renderStudioSlots();
}

function removeFromStudio(e, slotKey) {
  e.stopPropagation();
  state.studioSlots[slotKey] = null;
  renderStudioSlots();
}

function clearStudio() {
  state.studioSlots = { top: null, bottom: null, outerwear: null, shoes: null, accessory: null };
  renderStudioSlots();
}

function sendToStudio(id) {
  addItemToStudio(id);
  switchView('studio');
}

// KOMBİNİ KAYDET MODAL VE İŞLEMLERİ
function openSaveOutfitModal() {
  const selectedItems = Object.values(state.studioSlots).filter(Boolean);
  if (selectedItems.length === 0) {
    showToast('Lütfen önce kombine en az bir kıyafet ekleyin!', 'error');
    return;
  }

  const previewContainer = document.getElementById('outfit-preview-items');
  previewContainer.innerHTML = selectedItems.map(item => `
    <div style="width: 50px; height: 55px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0;" title="${item.name}">
      <img src="${item.imageUrl}" style="width:100%; height:100%; object-fit: cover;" onerror="this.src='/images/placeholder.svg'" />
    </div>
  `).join('');

  // Otomatik isim önerisi
  const defaultName = `${selectedItems[0].name}${selectedItems[1] ? ` & ${selectedItems[1].name}` : ''} Kombini`;
  document.getElementById('outfit-name-input').value = defaultName;
  document.getElementById('outfit-desc-input').value = '';

  openModal('save-outfit-modal');
}

async function handleSaveOutfitSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('outfit-name-input').value.trim();
  const description = document.getElementById('outfit-desc-input').value.trim();
  const selectedItems = Object.values(state.studioSlots).filter(Boolean);
  const ids = selectedItems.map(i => i.id);

  try {
    await api.createOutfit(name, description, ids);
    closeModal('save-outfit-modal');
    showToast('Kombin başarıyla kaydedildi!', 'success');
    await loadOutfits();
    switchView('outfits');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// KOMBİNLERİMİ YÜKLE VE ÇİZ
async function loadOutfits() {
  state.outfits = await api.getOutfits();
  const grid = document.getElementById('outfits-grid');
  if (!grid) return;

  if (state.outfits.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-bookmark"></i>
        <h3>Henüz kayıtlı bir kombin yok</h3>
        <p style="font-size: 0.9rem;">Kombin Stüdyosu'nda parçaları bir araya getirip ilk kombinini oluşturabilirsin.</p>
        <button class="btn btn-primary btn-sm" onclick="switchView('studio')">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Kombin Stüdyosuna Git
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.outfits.map(outfit => `
    <div class="outfit-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">${outfit.name}</h3>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${new Date(outfit.createdAt).toLocaleDateString('tr-TR')} • ${outfit.wearCount > 0 ? `${outfit.wearCount} kez giyildi` : 'Hiç giyilmedi'}
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteOutfitItem(${outfit.id})" title="Kombini Sil">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>

      ${outfit.description ? `<p style="font-size: 0.85rem; color: var(--text-secondary);">${outfit.description}</p>` : ''}

      <!-- Kıyafet Görselleri Yan Yana -->
      <div class="outfit-items-row">
        ${(outfit.items || []).map(item => `
          <div class="outfit-thumb-wrap" title="${item.name} (${item.categoryName})">
            <img src="${item.imageUrl}" class="outfit-thumb" alt="${item.name}" onerror="this.src='/images/placeholder.svg'" />
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 0.85rem;">
        <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="markOutfitWorn(${outfit.id})">
          <i class="fa-solid fa-star"></i> Bugün Bunu Giydim
        </button>
      </div>
    </div>
  `).join('');
}

async function markOutfitWorn(id) {
  await api.markOutfitWorn(id);
  showToast('Harika! Kombin ve içindeki tüm kıyafetler giyildi olarak güncellendi.', 'success');
  await loadOutfits();
  await loadWardrobe();
}

async function deleteOutfitItem(id) {
  if (!confirm('Bu kombini silmek istediğinize emin misiniz?')) return;
  await api.deleteOutfit(id);
  showToast('Kombin silindi.', 'info');
  await loadOutfits();
}

// DOLAPTA UNUTULANLAR
async function loadUnwornView() {
  const unwornItems = await api.getClothes({ onlyUnworn: true });
  const grid = document.getElementById('unworn-clothes-grid');
  if (!grid) return;

  if (unwornItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-circle-check" style="color: var(--success);"></i>
        <h3>Tebrikler! Dolabında hiç unutulmuş kıyafet yok.</h3>
        <p style="font-size: 0.9rem;">Tüm kıyafetlerini aktif ve dengeli şekilde giyiyorsun.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = unwornItems.map(item => `
    <div class="clothing-card">
      <div class="card-img-wrap">
        <img src="${item.imageUrl}" class="card-img" alt="${item.name}" onerror="this.src='/images/placeholder.svg'" />
        <span class="card-badge" style="background: rgba(239, 68, 68, 0.85); color: white;">Unutulmuş</span>
      </div>

      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <div class="card-meta">
          <span>${item.categoryName}</span>
          <span>•</span>
          <span>${item.color}</span>
        </div>

        <div class="card-stats">
          <span style="color: #F87171;"><i class="fa-solid fa-triangle-exclamation"></i> Hiç giyilmedi</span>
        </div>

        <div class="card-actions" style="margin-top: 0.75rem;">
          <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="sendToStudio(${item.id})">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Bununla Kombin Yap
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// MODAL YARDIMCILARI
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// PROFİL VE HESAP AYARLARI
function openProfileModal() {
  if (!state.currentUser) return;
  document.getElementById('profile-username').value = state.currentUser.username || '';
  document.getElementById('profile-fullname').value = state.currentUser.fullName || '';
  document.getElementById('profile-curr-password').value = '';
  document.getElementById('profile-new-password').value = '';
  document.getElementById('profile-new-password2').value = '';
  openModal('profile-modal');
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const username = document.getElementById('profile-username').value.trim();
  const fullName = document.getElementById('profile-fullname').value.trim();

  const btn = document.getElementById('update-profile-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Güncelleniyor...';

  try {
    const updated = await api.updateProfile(username, fullName);
    state.currentUser.username = updated.username;
    state.currentUser.fullName = updated.fullName;

    // Navbar'daki kullanıcı adını ve baş harfi güncelle
    const navName = document.getElementById('nav-user-fullname');
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navName) navName.textContent = updated.fullName || updated.username;
    if (navAvatar) navAvatar.textContent = (updated.fullName || updated.username)[0].toUpperCase();

    showToast('Profil bilgileriniz güncellendi!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Bilgileri Güncelle';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('profile-curr-password').value;
  const newPassword = document.getElementById('profile-new-password').value;
  const newPassword2 = document.getElementById('profile-new-password2').value;

  if (newPassword !== newPassword2) {
    showToast('Yeni şifreler birbiriyle eşleşmiyor!', 'error');
    return;
  }

  if (newPassword.length < 4) {
    showToast('Yeni şifre en az 4 karakter olmalıdır.', 'error');
    return;
  }

  const btn = document.getElementById('update-password-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Güncelleniyor...';

  try {
    const res = await api.changePassword(currentPassword, newPassword);
    showToast(res.message || 'Şifreniz başarıyla değiştirildi!', 'success');
    document.getElementById('profile-curr-password').value = '';
    document.getElementById('profile-new-password').value = '';
    document.getElementById('profile-new-password2').value = '';
    closeModal('profile-modal');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> Şifreyi Güncelle';
  }
}

// ==========================================================================
// YÖNETİM PANELİ (ADMIN DASHBOARD)
// ==========================================================================
let adminState = {
  stats: null,
  users: [],
  search: ''
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadAdminData() {
  const kpiContainer = document.getElementById('admin-kpi-container');
  const tbody = document.getElementById('admin-users-tbody');
  
  if (kpiContainer) {
    kpiContainer.innerHTML = '<div style="color: var(--text-muted); padding: 1rem;"><i class="fa-solid fa-spinner fa-spin"></i> İstatistikler yükleniyor...</div>';
  }
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Kullanıcılar yükleniyor...</td></tr>';
  }

  try {
    const [stats, users] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers()
    ]);
    adminState.stats = stats;
    adminState.users = users;
    renderAdminContent();
  } catch (err) {
    showToast(err.message || 'Yönetim verileri yüklenirken hata oluştu', 'error');
  }
}

function handleAdminUserSearch(query) {
  adminState.search = (query || '').toLowerCase().trim();
  renderAdminUsersTable();
}

function renderAdminContent() {
  const stats = adminState.stats;
  const kpiContainer = document.getElementById('admin-kpi-container');
  if (kpiContainer && stats) {
    kpiContainer.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
          <i class="fa-solid fa-users"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Kayıtlı Kullanıcı</span>
          <span class="kpi-value">${stats.totalUsers}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
          <i class="fa-solid fa-shirt"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Toplam Kıyafet</span>
          <span class="kpi-value">${stats.totalClothes}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Kayıtlı Kombinler</span>
          <span class="kpi-value">${stats.totalOutfits}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(236, 72, 153, 0.15); color: #f472b6;">
          <i class="fa-solid fa-fire"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Toplam Giyim Hareketi</span>
          <span class="kpi-value">${stats.totalWornCount}</span>
        </div>
      </div>
    `;
  }

  renderAdminUsersTable();
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  const filtered = adminState.users.filter(u => {
    if (!adminState.search) return true;
    return (u.username && u.username.toLowerCase().includes(adminState.search)) ||
           (u.fullName && u.fullName.toLowerCase().includes(adminState.search));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Aradığınız kriterlere uygun kullanıcı bulunamadı.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(user => {
    const createdDate = new Date(user.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const lastActive = user.lastActiveDate 
      ? new Date(user.lastActiveDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '<span style="color: var(--text-muted); font-size: 0.8rem;">Henüz yok</span>';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="admin-user-avatar">${(user.fullName || user.username)[0].toUpperCase()}</div>
            <div>
              <div style="font-weight: 600; color: #fff;">${escapeHtml(user.fullName || user.username)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHtml(user.username)}</div>
            </div>
          </div>
        </td>
        <td>
          ${user.isAdmin 
            ? '<span class="role-badge role-admin"><i class="fa-solid fa-shield-halved"></i> Yönetici</span>' 
            : '<span class="role-badge role-user"><i class="fa-solid fa-user"></i> Kullanıcı</span>'}
        </td>
        <td>
          <span class="count-pill"><i class="fa-solid fa-shirt"></i> ${user.clothingCount} parça</span>
        </td>
        <td>
          <span class="count-pill"><i class="fa-solid fa-wand-magic-sparkles"></i> ${user.outfitCount} kombin</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${createdDate}
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${lastActive}
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="openAdminResetPasswordModal(${user.id}, '${escapeHtml(user.username)}', '${escapeHtml(user.fullName || user.username)}')" title="Şifre Belirle">
              <i class="fa-solid fa-key" style="color: var(--accent-gold);"></i> Şifre Değiştir
            </button>
            ${user.username.toLowerCase() !== 'admin' && user.id !== state.currentUser?.id ? `
            <button class="btn btn-danger btn-sm" onclick="handleAdminDeleteUser(${user.id}, '${escapeHtml(user.fullName || user.username)}', '${escapeHtml(user.username)}')" title="Kullanıcıyı ve dolabını sil">
              <i class="fa-solid fa-trash"></i> Sil
            </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleAdminDeleteUser(userId, fullName, username) {
  const confirmed = confirm(`DİKKAT: "${fullName} (@${username})" kullanıcısını ve bu kullanıcıya ait TÜM dolap/kombin verilerini kalıcı olarak silmek istediğinize emin misiniz?`);
  if (!confirmed) return;

  try {
    const res = await api.adminDeleteUser(userId);
    showToast(res.message || 'Kullanıcı başarıyla silindi!', 'success');
    await loadAdminData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAdminResetPasswordModal(userId, username, fullName) {
  document.getElementById('admin-target-user-id').value = userId;
  document.getElementById('admin-target-user-name').innerText = `${fullName} (@${username})`;
  document.getElementById('admin-target-new-password').value = '';
  openModal('admin-password-modal');
}

async function handleAdminResetPasswordSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('admin-target-user-id').value;
  const newPassword = document.getElementById('admin-target-new-password').value.trim();

  if (newPassword.length < 4) {
    showToast('Yeni şifre en az 4 karakter olmalıdır!', 'error');
    return;
  }

  const btn = document.getElementById('admin-reset-pw-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

  try {
    const res = await api.adminResetPassword(userId, newPassword);
    showToast(res.message || 'Şifre başarıyla güncellendi!', 'success');
    closeModal('admin-password-modal');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Şifreyi Kaydet';
  }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', initApp);

