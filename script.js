// Muat data dari stock.json
async function loadProducts() {
  try {
    const res = await fetch('data/stock.json?' + new Date().getTime());
    if (!res.ok) throw new Error('Gagal memuat data');
    const products = await res.json();
    
    displayProducts(products);
    updateLastModified();
  } catch (err) {
    document.getElementById('products').innerHTML = 
      `<div class="card" style="grid-column: 1 / -1; background: #f8d7da; color: #721c24; padding: 20px;">
        ❌ Error: ${err.message}<br>
        Cek file <code>data/stock.json</code> atau koneksi internet.
      </div>`;
    document.getElementById('loading').style.display = 'none';
  }
}

function displayProducts(products) {
  const container = document.getElementById('products');
  const searchInput = document.getElementById('search').value.toLowerCase();
  const categoryFilter = document.getElementById('category').value;

  let filtered = products.filter(p => 
    (p.nama.toLowerCase().includes(searchInput)) &&
    (categoryFilter === '' || p.kategori === categoryFilter)
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
        <p style="font-size: 1.1rem; color: #777;">Barang tidak ditemukan.</p>
        <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">Coba ubah kata kunci atau filter kategori.</p>
      </div>
    `;
  } else {
    container.innerHTML = filtered.map(p => `
      <div class="card">
        <h3>${p.nama}</h3>
        <div class="price">Rp ${p.harga.toLocaleString('id')}</div>
        <div class="stock ${p.stok <= 0 ? 'out' : p.stok <= 3 ? 'low' : 'ok'}">
          Stok: ${p.stok <= 0 ? 'Habis' : p.stok}
        </div>
        <small>${p.kategori}</small>
      </div>
    `).join('');
  }

  document.getElementById('loading').style.display = 'none';
}

// Update tampilan saat input berubah
document.getElementById('search').addEventListener('input', loadProducts);
document.getElementById('category').addEventListener('change', loadProducts);

// Update waktu terakhir modifikasi file stock.json
function updateLastModified() {
  fetch('data/stock.json')
    .then(res => {
      const lastMod = res.headers.get('last-modified');
      if (lastMod) {
        const date = new Date(lastMod);
        document.getElementById('last-update').textContent = 
          date.toLocaleString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          });
      } else {
        document.getElementById('last-update').textContent = 'Tidak diketahui';
      }
    })
    .catch(() => document.getElementById('last-update').textContent = 'Gagal memuat');
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadProducts);