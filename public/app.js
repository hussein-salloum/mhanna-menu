let menu = [];
let cart = {};
let categories = [];

// ---------- Fetch items ----------
fetch("/api/items")
  .then(res => res.json())
  .then(data => {
    menu = data;
    categories = [...new Set(menu.map(i => i.category))].sort();
    renderCategories();
    renderMenu(menu);
  });

// ---------- Format numbers with commas ----------
function formatCurrency(num) {
  return num.toLocaleString('en-US');
}

// ---------- Render Categories ----------
function renderCategories() {
  const container = document.getElementById("filters");
  container.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = () => scrollToCategory(cat);
    container.appendChild(btn);
  });
}

// ---------- Render Menu ----------
function renderMenu(items) {
  const container = document.getElementById("menu");
  container.innerHTML = "";

  categories.forEach(cat => {
    const section = document.createElement("section");
    section.id = `cat-${cat}`;

    const h2 = document.createElement("h2");
    h2.textContent = cat;
    section.appendChild(h2);

    const catItems = items.filter(i => i.category === cat);
    catItems.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.name}">
        <div class="card-info">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <strong>${formatCurrency(item.price)} L.L.</strong>
        </div>
      `;
      card.onclick = () => addToCart(item.id);
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}

// ---------- Scroll to Category ----------
function scrollToCategory(category) {
  const section = document.getElementById(`cat-${category}`);
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Cart ----------
function addToCart(id) {
  const item = menu.find(i => i.id === id);
  if (!cart[id]) cart[id] = { ...item, qty: 1 };
  else cart[id].qty++;
  renderCart();
}

function openCart() {
  document.getElementById("cart-modal").style.display = "flex";
}

function closeCart(e) {
  if (e.target.id === "cart-modal") e.target.style.display = "none";
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";
  let total = 0;

Object.values(cart).forEach(item => {
  total += item.price * item.qty;
  const div = document.createElement("div");
  div.innerHTML = `
    <span>${item.name}</span>
    <button onclick="changeQty('${item.id}', -1)">-</button>
    <span class="qty">${item.qty}</span>
    <button onclick="changeQty('${item.id}', 1)">+</button>
    <span>${formatCurrency(item.price * item.qty)} L.L.</span>
  `;
  cartItems.appendChild(div);
});

  document.getElementById("total").textContent = formatCurrency(total);
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}

// ---------- WhatsApp Checkout ----------
function checkout() {
  if (Object.keys(cart).length === 0) {
    alert("السلة فارغة!");
    return;
  }

  let message = "طلب من مطعم المنقل:\n\n";
  let total = 0;
  Object.values(cart).forEach(item => {
    message += `${item.name} × ${item.qty}\n`;
    total += item.price * item.qty;
  });
  message += `\nالإجمالي: ${formatCurrency(total)} L.L.`;

  // Use your WhatsApp number here in international format
  const phone = "96170320107"; 
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
