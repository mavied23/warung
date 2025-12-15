// ==== SETUP ====
const grid = document.getElementById('products');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const lastUpdateEl = document.getElementById('last-update');
const loadingEl = document.getElementById('loading');

// Gunakan data dummy jika stock.json gagal
let products = [];

// Muat data dari stock.json
async function loadProducts() {
  try {
    const res = await fetch('data/stock.json?' + Date.now());
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    products = await res.json();
    render();
    updateLastModified();
  } catch (err) {
    console.error('Gagal muat data:', err);
    // Tampilkan pesan error
    if (grid) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
          <p style="color: #ef5350; font-weight: 600;">❌ Gagal muat daftar produk.</p>
          <p style="color: #a0a0a0; font-size: 0.9rem; margin-top: 10px;">
            Periksa file <code>data/stock.json</code> atau koneksi internet.
          </p>
        </div>
      `;
    }
    loadingEl.style.display = 'none';
  }
}

function render() {
  // Jika grid tidak ditemukan, hentikan
  if (!grid) {
    console.error('Elemen #products tidak ditemukan');
    return;
  }

  const searchTerm = searchInput?.value.toLowerCase() || '';
  const categoryFilter = categorySelect?.value || '';

  // Jika products belum diinisialisasi, tampilkan pesan
  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
        <p style="color: #a0a0a0;">Data produk kosong.</p>
      </div>
    `;
    loadingEl.style.display = 'none';
    return;
  }

  const filtered = products.filter(p => 
    (p.nama && p.nama.toLowerCase().includes(searchTerm)) &&
    (categoryFilter === '' || p.kategori === categoryFilter)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; padding: 30px; text-align: center;">
        <p style="color: #a0a0a0;">Tidak ada barang yang cocok.</p>
      </div>
    `;
  } else {
    grid.innerHTML = filtered.map(p => `
      <div class="card" data-id="${p.id}">
        <h3 data-text="${p.nama}">${p.nama}</h3>
        <div class="price">Rp ${p.harga.toLocaleString('id')}</div>
        <div class="stock ${p.stok <= 0 ? 'out' : p.stok <= 3 ? 'low' : 'ok'}">
          Stok: ${p.stok <= 0 ? 'Habis' : p.stok}
        </div>
        <small>${p.kategori}</small>
      </div>
    `).join('');
  }

  loadingEl.style.display = 'none';
}

function updateLastModified() {
  fetch('data/stock.json')
    .then(res => {
      const lastMod = res.headers.get('last-modified');
      if (lastMod) {
        const date = new Date(lastMod);
        lastUpdateEl.textContent = date.toLocaleString('id-ID', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
      } else {
        lastUpdateEl.textContent = 'Tidak diketahui';
      }
    })
    .catch(() => lastUpdateEl.textContent = 'Gagal memuat');
}

// Event Listeners
if (searchInput) {
  searchInput.addEventListener('input', () => {
    loadingEl.style.display = 'block';
    setTimeout(render, 100);
  });
}

if (categorySelect) {
  categorySelect.addEventListener('change', () => {
    loadingEl.style.display = 'block';
    setTimeout(render, 100);
  });
}

// Mode toggle
document.querySelector('.mode-toggle')?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Custom cursor
const cursor = document.querySelector('.cursor');
const trail = document.querySelector('.cursor-trail');

if (cursor && trail) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
  });
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', loadProducts);