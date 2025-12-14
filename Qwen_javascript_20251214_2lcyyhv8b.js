// Muat data dari stock.json
async function loadProducts() {
  try {
    const res = await fetch('data/stock.json?' + new Date().getTime()); // cache busting
    if (!res.ok) throw new Error('Gagal memuat data');
    const products = await res.json();
    
    displayProducts(products);
    updateLastModified();
  } catch (err) {
    document.getElementById('products').innerHTML = 
      `<p style="text-align:center; color:#c62828; padding:20px;">❌ Error: ${err.message}<br>Cek koneksi atau file <code>data/stock.json</code></p>`;
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
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#777;">Barang tidak ditemukan.</p>';
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
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
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