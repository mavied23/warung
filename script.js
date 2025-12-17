// ==== SETUP ====
const grid = document.getElementById('products');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const lastUpdateEl = document.getElementById('last-update');
const loadingEl = document.getElementById('loading');

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ==== LOAD DATA ====
async function loadProducts() {
  try {
    const res = await fetch('data/stock.json?' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    render();
    updateLastModified();
  } catch (err) {
    console.error('Gagal muat data:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="card" style="grid-column:1/-1;text-align:center;padding:30px">
          <p style="color:#ef5350;font-weight:600">❌ Gagal memuat produk</p>
          <small>Periksa file stock.json</small>
        </div>
      `;
    }
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// ==== UPDATE TERAKHIR ====
function updateLastModified() {
  if (!lastUpdateEl) return;
  const now = new Date();
  lastUpdateEl.textContent = now.toLocaleDateString('id-ID');
}

// ==== RENDER ====
function render() {
  if (!grid) return;

  const keyword = searchInput?.value.toLowerCase() || '';
  const category = categorySelect?.value || '';

  const filtered = products.filter(p =>
    p.nama?.toLowerCase().includes(keyword) &&
    (category === '' || p.kategori === category)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column:1/-1;text-align:center;padding:30px">
        <p>Tidak ada barang ditemukan</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(i => i.id === p.id);
    const qty = inCart ? inCart.qty : 0;

    return `
      <div class="card">
        <h3>${p.nama}</h3>
        <div class="price">Rp ${p.harga.toLocaleString('id-ID')}</div>
        <div class="stock ${p.stok <= 0 ? 'out' : p.stok <= 3 ? 'low' : 'ok'}">
          Stok: ${p.stok <= 0 ? 'Habis' : p.stok}
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty('${p.id}', -1)">-</button>
          <span class="qty-value">${qty}</span>
          <button class="qty-btn" onclick="updateQty('${p.id}', 1)">+</button>
        </div>
        <small>${p.kategori}</small>
      </div>
    `;
  }).join('');

  updateCartUI();
}

// ==== KERANJANG ====
function updateQty(id, delta) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  } else if (delta > 0) {
    cart.push({ id, nama: product.nama, harga: product.harga, qty: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  render();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);

  // Modal
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = count;

  const cartTotalEl = document.getElementById('cartTotal');
  if (cartTotalEl) cartTotalEl.textContent = total.toLocaleString('id-ID');

  const cartItemsEl = document.getElementById('cartItems');
  if (cartItemsEl) {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p>Keranjang kosong.</p>';
    } else {
      cartItemsEl.innerHTML = cart.map(item => `
        <div class="cart-item">
          <span class="name">${item.nama}</span>
          <span class="qty">x${item.qty}</span>
          <span class="price">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</span>
        </div>
      `).join('');
    }
  }

  // Footer total (di index.html)
  const cartCountFooter = document.getElementById('cartCountFooter');
  const cartTotalFooter = document.getElementById('cartTotalFooter');
  if (cartCountFooter) cartCountFooter.textContent = count;
  if (cartTotalFooter) cartTotalFooter.textContent = total.toLocaleString('id-ID');
}


function clearCart() {
  cart = [];
  localStorage.removeItem('cart');
  render();
}

// ==== EVENT ====
searchInput?.addEventListener('input', () => {
  if (loadingEl) loadingEl.style.display = 'block';
  setTimeout(render, 150);
});

categorySelect?.addEventListener('change', () => {
  if (loadingEl) loadingEl.style.display = 'block';
  setTimeout(render, 150);
});

// ==== INIT ====
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartUI();
});
// ==== MODE TOGGLE — DEFAULT LIGHT ====
function initModeToggle() {
  const toggleBtn = document.querySelector('.mode-toggle');
  if (!toggleBtn) return;

  // Baca dari localStorage, default = 'light'
  const savedMode = localStorage.getItem('theme') || 'light';
  
  // Terapkan mode
  if (savedMode === 'dark') {
    document.body.classList.remove('light'); // dark = tanpa class
    toggleBtn.textContent = '🌑'; // ikon gelap aktif
  } else {
    document.body.classList.add('light'); // light = ada class
    toggleBtn.textContent = '🌕'; // ikon terang aktif
  }

  // Event listener
  toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('light')) {
      // Ganti ke dark
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      toggleBtn.textContent = '🌑';
    } else {
      // Ganti ke light
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
      toggleBtn.textContent = '🌕';
    }
  });
}

  // Baca preferensi dari localStorage atau sistem
  const savedMode = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Tentukan mode awal
  const initialMode = savedMode 
    ? savedMode 
    : (systemPrefersDark ? 'dark' : 'light');

  // Terapkan mode
  document.body.className = initialMode === 'dark' ? '' : 'light'; // dark = default (tanpa class), light = ada class 'light'

  // Update teks tombol
  toggleBtn.textContent = initialMode === 'dark' ? '🌗' : '🌘';

  // Pasang event listener
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Update ikon
    toggleBtn.textContent = isLight ? '🌘' : '🌗';
  });


document.addEventListener('DOMContentLoaded', () => {
  initModeToggle(); // ✅ jalankan dulu
  loadProducts();
  updateCartUI();
});