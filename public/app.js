let cart = {};

// ---------------- LOAD MENU ----------------
async function loadMenu() {
  const res = await fetch("/api/items");
  const items = await res.json();

  const categories = [...new Set(items.map(i => i.category))];
  renderCategories(categories);
  renderMenu(items);
}

// ---------------- CATEGORIES ----------------
function renderCategories(categories) {
  const el = document.getElementById("categories");
  el.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.onclick = () => {
      const section = document.getElementById(cat);
      if (section) section.scrollIntoView({ behavior: "smooth" });
    };
    el.appendChild(btn);
  });
}

function scrollCategories(dir) {
  document.querySelector(".categories")
    .scrollBy({ left: dir * 160, behavior: "smooth" });
}

// ---------------- MENU ----------------
function renderMenu(items) {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";

  const grouped = {};
  items.forEach(i => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });

  for (const cat in grouped) {
    const section = document.createElement("section");
    section.id = cat;

    // add data-bg for stretched category background
    section.setAttribute("data-bg", `/img/${cat}.jpg`);

    // category title with background
    const title = document.createElement("h2");
    title.textContent = cat;
    title.style.backgroundImage = `url('/img/${cat}.jpg')`;
    section.appendChild(title);

    // items cards
    grouped[cat].forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-info">
          <h3>${item.name}</h3>
          <p>${item.description || ""}</p>
        </div>
        <div class="card-price">${format(item.price)} L.L.</div>
      `;
      card.onclick = () => addToCart(item);
      section.appendChild(card);
    });

    menu.appendChild(section);
  }
}

// ---------------- CART ----------------
function addToCart(item) {
  if (cart[item.id]) cart[item.id].qty++;
  else cart[item.id] = { ...item, qty: 1 };
  renderCart();
}

function changeQty(id, d) {
  cart[id].qty += d;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  renderCart();
}

function renderCart() {
  const el = document.getElementById("cart-items");
  el.innerHTML = "";

  let total = 0;
  Object.values(cart).forEach(item => {
    total += item.price * item.qty;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-name">${item.name}</div>

      <div class="cart-controls">
        <button onclick="changeQty('${item.id}',-1)">−</button>
        <span class="qty">${item.qty}</span>
        <button onclick="changeQty('${item.id}',1)">+</button>
      </div>

      <div class="cart-price">${format(item.price * item.qty)} L.L.</div>
      <div class="delete-item" onclick="removeItem('${item.id}')">🗑️</div>
    `;
    el.appendChild(row);
  });

  document.getElementById("cart-count").textContent =
    Object.values(cart).reduce((s, i) => s + i.qty, 0);
}

// ---------------- WHATSAPP ----------------
function checkout() {
  if (!Object.keys(cart).length) return alert("السلة فارغة");

  let msg = "طلب من مطعم المنقل:\n\n";
  let total = 0;

  Object.values(cart).forEach(i => {
    msg += `${i.name} × ${i.qty}\n`;
    total += i.price * i.qty;
  });

  msg += `\nالإجمالي: ${format(total)} L.L.`;
  window.open(
    `https://wa.me/96170320107?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

// ---------------- HELPERS ----------------
function format(n) {
  return n.toLocaleString("en-US");
}

// ---------------- POPUP ----------------
const modal = document.getElementById("cart-modal");
document.getElementById("cart-button").onclick = () => modal.style.display = "flex";
modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// expose
window.changeQty = changeQty;
window.removeItem = removeItem;
window.checkout = checkout;
window.scrollCategories = scrollCategories;

// init
loadMenu();


