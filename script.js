async function loadProducts() {
  try {
    const res = await fetch('data/stock.json?' + Date.now());
    const products = await res.json();
    displayProducts(products);
    updateLastModified();
  } catch (err) {
    document.getElementById('products').innerHTML = 
      `<p style="text-align:center; color:#c62828; padding:20px;">❌ Error: ${err.message}<br>Periksa file <code>data/stock.json</code></p>`;
    document.getElementById('loading').style.display = 'none';
  }
}

function displayProducts(products) {
  const container = document.getElementById('products');
  const search = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('category').value;

  const filtered = products.filter(p => 
    p.nama.toLowerCase().includes(search) && 
    (cat === '' || p.kategori === cat)
  );

  container.innerHTML = filtered.length ? 
    filtered.map(p => `
      <div class="card">
        <h3>${p.nama}</h3>
        <div class="price">Rp ${p.harga.toLocaleString('id')}</div>
        <div class="stock ${p.stok <= 0 ? 'out' : p.stok <= 3 ? 'low' : 'ok'}">
          Stok: ${p.stok <= 0 ? 'Habis' : p.stok}
        </div>
        <small>${p.kategori}</small>
      </div>
    `).join('') :
    '<p style="text-align:center; padding:20px; color:#777;">Tidak ada barang.</p>';

  document.getElementById('loading').style.display = 'none';
}

document.getElementById('search')?.addEventListener('input', loadProducts);
document.getElementById('category')?.addEventListener('change', loadProducts);

function updateLastModified() {
  fetch('data/stock.json')
    .then(res => {
      const lm = res.headers.get('last-modified');
      document.getElementById('last-update').textContent = 
        lm ? new Date(lm).toLocaleString('id-ID') : '–';
    });
}

document.addEventListener('DOMContentLoaded', loadProducts);