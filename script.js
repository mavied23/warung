// ==== SETUP ====
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const lastUpdateEl = document.getElementById('last-update');

// Gunakan localStorage untuk data (bisa ganti ke stock.json jika mau)
let products = JSON.parse(localStorage.getItem('warung_products')) || [
  { id: '001', name: 'Indomie Soto', price: 5500, stock: 12, category: 'Makanan Instan' },
  { id: '002', name: 'Aqua 600ml', price: 3500, stock: 5, category: 'Minuman' },
  { id: '003', name: 'Gula Pasir', price: 8500, stock: 10, category: 'Sembako' },
  { id: '004', name: 'Chitato', price: 6000, stock: 0, category: 'Snack' },
];

// ==== RENDER ====
function render() {
  const searchTerm = searchInput.value.toLowerCase();
  const categoryFilter = categorySelect.value;

  const filtered = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm)) &&
    (categoryFilter === '' || p.category === categoryFilter)
  );

  grid.innerHTML = filtered.map(p => `
    <div class="card" data-id="${p.id}">
      <h3 data-text="${p.name}">${p.name}</h3>
      <div class="price">Rp ${p.price.toLocaleString('id')}</div>
      <div class="stock ${p.stock <= 0 ? 'out' : p.stock <= 3 ? 'low' : 'ok'}">
        Stok: ${p.stock <= 0 ? 'Habis' : p.stock}
      </div>
      <small>${p.category}</small>
    </div>
  `).join('') || '<div class="card" style="grid-column:1/-1;padding:30px;">Tidak ada barang.</div>';

  // Simpan ke localStorage
  localStorage.setItem('warung_products', JSON.stringify(products));

  // Update waktu
  lastUpdateEl.textContent = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

// ==== EVENT LISTENERS ====
searchInput.addEventListener('input', render);
categorySelect.addEventListener('change', render);

// Mode toggle
document.querySelector('.mode-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Custom cursor
const cursor = document.querySelector('.cursor');
const trail = document.querySelector('.cursor-trail');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  trail.style.left = e.clientX + 'px';
  trail.style.top = e.clientY + 'px';
});

// 3D Tilt (opsional — aktifkan jika mau)
/*
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
*/

// ==== INIT ====
// Set theme from localStorage
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
}

render();