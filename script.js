// ============================================================
//  WARUNG AMANAH MANDIRI — script.js
//  Features: Fortune quotes, Mood filter, Tebak Harga game,
//  Combo suggestion, Confetti, Toast, Visit counter
// ============================================================

// ===== STATE =====
let products = [];
let cart = JSON.parse(localStorage.getItem('wam_cart')) || [];
let activeMood = '';
let gameScore = { correct: 0, total: 0 };
let currentGameProduct = null;
let gameAnswered = false;

// ===== DOM REFS =====
const grid       = document.getElementById('products');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const loadingEl  = document.getElementById('loading');

// ===== FORTUNE QUOTES =====
const FORTUNES = [
  { icon: '🍜', text: 'Indomie itu bukan sekadar makan — itu pelukan dari ibu dalam bentuk mie.' },
  { icon: '🌙', text: 'Jam 2 pagi, lapar, uang pas-pasan? Tenang, warung ini ada buat kamu.' },
  { icon: '📚', text: 'Belajar setelah makan itu lebih masuk ke otak. Jajan dulu yuk!' },
  { icon: '🎯', text: 'Target bulan ini: bayar kos. Tapi snack dulu sebentar, nggak apa-apa.' },
  { icon: '💪', text: 'Mahasiswa sejati: tidur 4 jam, mie tiap hari, tetap semangat kuliah!' },
  { icon: '🍫', text: 'Coklat bukan kemewahan. Coklat adalah kebutuhan dasar penghuni kos.' },
  { icon: '☕', text: 'Selamat berjuang, penghuni Moluska! Kalau lelah, makan dulu.' },
  { icon: '🔥', text: 'Stok bon cabe sudah diisi ulang. Hidup pedasmu berlanjut!' },
  { icon: '🛁', text: 'Mandi dulu baru jajan, atau jajan dulu baru mandi? Pilihan hidupmu.' },
  { icon: '✨', text: 'Setiap pahlawan butuh bahan bakar. Ini warungnya, hero.' },
];

let fortuneIndex = Math.floor(Math.random() * FORTUNES.length);

function initFortune() {
  const banner = document.getElementById('fortuneBanner');
  if (!banner) return;
  applyFortune(banner, fortuneIndex);
  setInterval(() => {
    banner.classList.add('fade-out');
    setTimeout(() => {
      fortuneIndex = (fortuneIndex + 1) % FORTUNES.length;
      applyFortune(banner, fortuneIndex);
      banner.classList.remove('fade-out');
    }, 300);
  }, 8000);
  banner.addEventListener('click', () => {
    banner.classList.add('fade-out');
    setTimeout(() => {
      fortuneIndex = (fortuneIndex + 1) % FORTUNES.length;
      applyFortune(banner, fortuneIndex);
      banner.classList.remove('fade-out');
    }, 300);
  });
}
function applyFortune(banner, i) {
  const f = FORTUNES[i];
  banner.querySelector('.fortune-icon').textContent = f.icon;
  banner.querySelector('.fortune-text').textContent = f.text;
}

// ===== GREETING =====
function initGreeting() {
  const el = document.getElementById('greetingText');
  if (!el) return;
  const hour = new Date().getHours();
  let greet, emoji;
  if (hour >= 4 && hour < 11)       { greet = 'Selamat pagi'; emoji = '☀️'; }
  else if (hour >= 11 && hour < 15)  { greet = 'Selamat siang'; emoji = '🌤️'; }
  else if (hour >= 15 && hour < 18)  { greet = 'Selamat sore'; emoji = '🌇'; }
  else                                { greet = 'Selamat malam'; emoji = '🌙'; }
  el.innerHTML = `${emoji} ${greet}, <span>Penghuni Moluska!</span>`;

  const visitKey = 'wam_visits';
  const visits = (parseInt(localStorage.getItem(visitKey)) || 0) + 1;
  localStorage.setItem(visitKey, visits);
  const badge = document.getElementById('visitBadge');
  if (badge) badge.textContent = `Kunjungan ke-${visits} 🎉`;
}

// ===== MOOD TABS =====
const MOODS = [
  { key: 'all',    label: '✨ Semua',       kategori: '' },
  { key: 'mie',    label: '🍜 Mie-an',      kategori: 'Mie Instan' },
  { key: 'ngemil', label: '🍿 Ngemil',      kategori: 'Makanan Ringan' },
  { key: 'minum',  label: '💧 Minum',       kategori: 'Minuman' },
  { key: 'bersih', label: '🧼 Bebersih',    kategori: 'Kebersihan' },
  { key: 'masak',  label: '🍳 Masak',       kategori: 'Bumbu & Masak' },
  { key: 'lain',   label: '📦 Lain-lain',   kategori: 'Lain-Lain' },
];

function initMoodTabs() {
  const container = document.getElementById('moodTabs');
  if (!container) return;
  container.innerHTML = MOODS.map(m => `
    <button class="mood-tab ${m.key === 'all' ? 'active' : ''}"
      data-key="${m.key}" data-kategori="${m.kategori}">
      ${m.label}
    </button>
  `).join('');

  container.querySelectorAll('.mood-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.mood-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMood = btn.dataset.kategori;
      if (categorySelect) categorySelect.value = '';
      render();
    });
  });
}

// ===== LOAD DATA =====
async function loadProducts() {
  try {
    // NOTE: Jika halaman dibuka via file://, fetch() ke file:// biasanya gagal (CORS).
    // Solusi: pakai fetch() hanya untuk http/https, dan kalau file:// pakai dynamic import JSON lewat bundler dev/server.
    // Karena di sini kita tetap harus berjalan tanpa server,
    // maka kita lakukan fallback: baca JSON dari variable global jika ada, atau tampilkan error yang jelas.

    // Cek origin
    const isFileOrigin = window.location.protocol === 'file:';

    if (isFileOrigin) {
      // Fallback untuk mode file://
      // Ambil dari script tag inline jika user menjalankan via editor yang meng-copy JSON jadi global.
      // Kalau tidak ada, beri pesan agar user menjalankan via server.
      const inline = window.__STOCK_JSON__;
      if (Array.isArray(inline) && inline.length) {
        products = inline;
      } else {
        throw new Error('Jalankan melalui server (bukan file://) agar fetch data/stock.json berfungsi.');
      }
    } else {
      const url = new URL('data/stock.json', window.location.href);
      const res = await fetch(url.toString() + '?' + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      products = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      if (!products.length) throw new Error('stock.json tidak berisi array produk');
    }

    render();
  } catch (err) {
    console.error('Gagal muat data:', err);
    if (grid) {
      const msg = (String(err && err.message) || '').toLowerCase();
      const extra = msg.includes('file://') || msg.includes('server')
        ? '<br><br><b>Fix:</b> buka index.html lewat http server (mis. VSCode Live Server) agar tidak kena CORS.'
        : '';
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">❌</span>
          Gagal memuat produk. Periksa file <code>data/stock.json</code>
          ${extra}
        </div>`;
    }
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// ===== RENDER PRODUCTS =====
function render() {
  if (!grid) return;
  const keyword  = (searchInput?.value || '').toLowerCase().trim();
  const catFilter = categorySelect?.value || activeMood;

  let filtered = products.filter(p => {
    const matchName = (p.nama || '').toLowerCase().includes(keyword);
    const matchCat  = catFilter === '' || (p.kategori || '').toLowerCase() === catFilter.toLowerCase();
    return matchName && matchCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        Barang tidak ditemukan.<br>Coba kata kunci lain!
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(i => i.id === p.id);
    const qty = inCart ? inCart.qty : 0;
    let stockClass, stockLabel;
    if (p.stok <= 0)      { stockClass = 'stock-out'; stockLabel = '⚠️ Habis'; }
    else if (p.stok <= 3) { stockClass = 'stock-low'; stockLabel = `🔥 Sisa ${p.stok}!`; }
    else                   { stockClass = 'stock-ok';  stockLabel = `Stok: ${p.stok}`; }

    return `
      <div class="card">
        <img src="${p.image || 'https://via.placeholder.com/150x150?text=?'}"
             alt="${escHtml(p.nama)}" class="product-image"
             onerror="this.src='https://via.placeholder.com/150x150?text=${encodeURIComponent(p.nama || '?')}'">
        <h3>${escHtml(p.nama || '-')}</h3>
        <div class="price">Rp ${(p.harga || 0).toLocaleString('id-ID')}</div>
        <span class="stock-badge ${stockClass}">${stockLabel}</span>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty('${p.id}',-1)" ${qty === 0 ? 'style="opacity:0.4"' : ''}>−</button>
          <span class="qty-value ${qty === 0 ? 'zero' : ''}">${qty}</span>
          <button class="qty-btn" onclick="updateQty('${p.id}',1)" ${p.stok <= 0 ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>+</button>
        </div>
        <div class="kategori-chip">${escHtml(p.kategori || '')}</div>
      </div>
    `;
  }).join('');

  updateCartUI();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== CART LOGIC =====
function updateQty(id, delta) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  if (delta > 0 && product.stok <= 0) {
    showToast('⚠️ Stok habis!');
    return;
  }

  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  } else if (delta > 0) {
    cart.push({ id, nama: product.nama, harga: product.harga, qty: 1 });
    launchConfetti();
    showToast(`🛒 ${product.nama} ditambahkan!`, 'success');
    checkCombo(product);
  }

  saveCart();
  render();
}

function saveCart() {
  localStorage.setItem('wam_cart', JSON.stringify(cart));
}

function clearCart() {
  cart = [];
  saveCart();
  render();
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);

  document.querySelectorAll('.js-cart-count').forEach(el => el.textContent = count);
  document.querySelectorAll('.js-cart-total').forEach(el => el.textContent = total.toLocaleString('id-ID'));
}

// ===== COMBO SUGGESTION =====
const COMBOS = {
  'Mie Instan': ['mk30', 'bm03', 'bm13'],  // Sosis, Minyak, Saus
  'Bumbu & Masak': ['bm03', 'bm13', 'bm05'],
};

function checkCombo(product) {
  const comboIds = COMBOS[product.kategori];
  if (!comboIds) return;
  const suggestions = comboIds
    .map(id => products.find(p => p.id === id))
    .filter(p => p && p.stok > 0 && !cart.find(c => c.id === p.id));
  if (suggestions.length === 0) return;

  setTimeout(() => openComboModal(product, suggestions.slice(0, 3)), 600);
}

function openComboModal(trigger, suggestions) {
  const modal = document.getElementById('comboModal');
  if (!modal) return;
  document.getElementById('comboTrigger').textContent = trigger.nama;
  const list = document.getElementById('comboList');
  list.innerHTML = suggestions.map(p => `
    <div class="combo-item">
      <div>
        <div class="combo-item-name">${escHtml(p.nama)}</div>
        <div class="combo-item-price">Rp ${p.harga.toLocaleString('id-ID')}</div>
      </div>
      <button class="combo-add-btn" onclick="addComboItem('${p.id}')">+ Tambah</button>
    </div>
  `).join('');
  modal.classList.add('open');
}

function addComboItem(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  const item = cart.find(i => i.id === id);
  if (item) { item.qty++; }
  else { cart.push({ id, nama: product.nama, harga: product.harga, qty: 1 }); }
  saveCart();
  render();
  launchConfetti();
  showToast(`✅ ${product.nama} ditambahkan!`, 'success');
  const btn = document.querySelector(`.combo-add-btn[onclick="addComboItem('${id}')"]`);
  if (btn) { btn.textContent = '✓ Added'; btn.disabled = true; btn.style.background = 'var(--success)'; }
}

function closeComboModal() {
  document.getElementById('comboModal')?.classList.remove('open');
}

// ===== GAME: TEBAK HARGA =====
function openGame() {
  const modal = document.getElementById('gameModal');
  if (!modal) return;
  modal.classList.add('open');
  loadGameQuestion();
}

function closeGame() {
  document.getElementById('gameModal')?.classList.remove('open');
}

function loadGameQuestion() {
  const availProducts = products.filter(p => p.stok > 0);
  if (availProducts.length < 4) return;

  gameAnswered = false;
  const idx = Math.floor(Math.random() * availProducts.length);
  currentGameProduct = availProducts[idx];

  // Generate 3 wrong prices (±20-80% of real price)
  const correctPrice = currentGameProduct.harga;
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const factor = [0.3, 0.5, 0.7, 1.4, 1.7, 2.0, 2.5][Math.floor(Math.random() * 7)];
    const w = Math.round((correctPrice * factor) / 500) * 500;
    if (w !== correctPrice && w > 0) wrongs.add(w);
  }
  const options = [...wrongs, correctPrice].sort(() => Math.random() - 0.5);

  document.getElementById('gameImg').src = currentGameProduct.image ||
    `https://via.placeholder.com/150x150?text=${encodeURIComponent(currentGameProduct.nama)}`;
  document.getElementById('gameProductName').textContent = currentGameProduct.nama;
  document.getElementById('gameResult').textContent = '';
  document.getElementById('gameScore').textContent =
    `Skor: ${gameScore.correct} / ${gameScore.total} 🎯`;

  const optContainer = document.getElementById('gameOptions');
  optContainer.innerHTML = options.map(price => `
    <button class="game-option" onclick="answerGame(this, ${price}, ${correctPrice})">
      Rp ${price.toLocaleString('id-ID')}
    </button>
  `).join('');
}

function answerGame(btn, chosen, correct) {
  if (gameAnswered) return;
  gameAnswered = true;
  gameScore.total++;

  const allBtns = document.querySelectorAll('.game-option');
  allBtns.forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('correct');
    gameScore.correct++;
    document.getElementById('gameResult').textContent = '🎉 Betul banget! Kamu tau harga-harganya!';
    launchConfetti();
  } else {
    btn.classList.add('wrong');
    // Show correct answer
    allBtns.forEach(b => {
      const priceText = b.textContent.replace(/\D/g,'');
      if (parseInt(priceText.replace(/\./g,'')) === correct ||
          b.textContent.includes(correct.toLocaleString('id-ID'))) {
        b.classList.add('correct');
      }
    });
    document.getElementById('gameResult').textContent = `😅 Kurang tepat! Harganya Rp ${correct.toLocaleString('id-ID')}`;
  }
  document.getElementById('gameScore').textContent =
    `Skor: ${gameScore.correct} / ${gameScore.total} 🎯`;
}

function nextGameQuestion() {
  loadGameQuestion();
}

// ===== CONFETTI =====
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#FF6B35','#FFB347','#56CF8A','#42A5F5','#EC407A','#FFEB3B'];
  const pieces = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 60,
    r: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.15,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));

  let frame = 0;
  const maxFrames = 120;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.angle += p.spin; p.vy += 0.08;
      const alpha = Math.max(0, 1 - frame / maxFrames);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 350);
  }, 2200);
}

// ===== DARK / LIGHT TOGGLE =====
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('wam_theme') || 'dark';
  applyTheme(saved, btn);
  btn?.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('light');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('wam_theme', next);
    applyTheme(next, btn);
  });
}
function applyTheme(theme, btn) {
  if (theme === 'light') { document.body.classList.add('light'); if (btn) btn.textContent = '🌑'; }
  else                   { document.body.classList.remove('light'); if (btn) btn.textContent = '🌕'; }
}

// ===== CURSOR =====
function initCursor() {
  const dot   = document.querySelector('.cursor');
  const ring  = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    ring.style.left = e.clientX + 'px';
    ring.style.top  = e.clientY + 'px';
  });
}

// ===== SEARCH & FILTER EVENTS =====
function initEvents() {
  searchInput?.addEventListener('input', () => {
    activeMood = '';
    document.querySelectorAll('.mood-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.mood-tab[data-key="all"]')?.classList.add('active');
    render();
  });
  categorySelect?.addEventListener('change', () => {
    activeMood = '';
    document.querySelectorAll('.mood-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.mood-tab[data-key="all"]')?.classList.add('active');
    render();
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCursor();
  initGreeting();
  initFortune();
  initMoodTabs();
  initEvents();
  loadProducts();
});