console.log("✅ admin.js loaded");

// ---------------- DOM Elements ----------------
const loginModal = document.getElementById("loginModal");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const itemsTable = document.getElementById("items");
const addItemBtn = document.getElementById("addItemBtn");

const formModal = document.getElementById("formModal");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");

const inputName = document.getElementById("name");
const inputCategory = document.getElementById("category");
const inputPrice = document.getElementById("price");
const inputDescription = document.getElementById("description");

let editingItemId = null;
let dragSrc = null;

// ---------------- LOGIN ----------------
loginBtn.onclick = async () => {
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    loginError.textContent = "Wrong credentials";
    return;
  }

  loginModal.style.display = "none";
  adminPanel.hidden = false;
  loadItems();
};

// ---------------- LOAD ITEMS ----------------
async function loadItems() {
  const res = await fetch("/api/items");
  const items = await res.json();

  itemsTable.innerHTML = "";

  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.dataset.category = item.category;
    tr.dataset.item_order = item.item_order;
    tr.dataset.category_order = item.category_order;
    tr.draggable = true;

    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.price}</td>
      <td>${item.description || ""}</td>
      <td>
        <button class="editBtn">✏️</button>
        <button class="deleteBtn">🗑</button>
      </td>
    `;

    enableDrag(tr);
    itemsTable.appendChild(tr);
  });

  // Edit/Delete
  document.querySelectorAll(".editBtn").forEach(btn =>
    btn.onclick = e => editItem(e.target.closest("tr").dataset.id)
  );
  document.querySelectorAll(".deleteBtn").forEach(btn =>
    btn.onclick = e => deleteItem(e.target.closest("tr").dataset.id)
  );
}

// ---------------- ADD / EDIT ----------------
addItemBtn.onclick = () => openForm();
saveBtn.onclick = saveItem;

function openForm(item = null) {
  formModal.style.display = "flex";
  editingItemId = item?.id || null;
  formTitle.textContent = item ? "Edit Item" : "Add Item";

  inputName.value = item?.name || "";
  inputCategory.value = item?.category || "";
  inputPrice.value = item?.price || "";
  inputDescription.value = item?.description || "";
}

async function saveItem() {
  const payload = {
    name: inputName.value,
    category: inputCategory.value,
    price: inputPrice.value,
    description: inputDescription.value
  };

  // --- Determine item_order ---
  const allItems = await fetch("/api/items").then(r => r.json());
  const itemsInCategory = allItems.filter(i => i.category === payload.category);
  payload.item_order = editingItemId
    ? undefined // keep order if editing
    : itemsInCategory.length + 1;

  // --- Determine category_order ---
  const uniqueCategories = [...new Set(allItems.map(i => i.category))];
  if (!uniqueCategories.includes(payload.category)) {
    // new category -> assign last + 1
    payload.category_order = uniqueCategories.length + 1;
  } else {
    // existing category -> find its order
    const firstItem = allItems.find(i => i.category === payload.category);
    payload.category_order = firstItem.category_order;
  }

  const url = editingItemId ? `/api/items/${editingItemId}` : "/api/items";
  const method = editingItemId ? "PUT" : "POST";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  formModal.style.display = "none";
  loadItems();
}

const cancelBtn = document.getElementById("cancelBtn");

cancelBtn.addEventListener("click", () => {
  closeForm(); // reuse your existing closeForm() function
});

function closeForm() {
  formModal.style.display = "none";
}



// ---------------- EDIT / DELETE ----------------
async function editItem(id) {
  const res = await fetch("/api/items");
  const items = await res.json();
  const item = items.find(i => i.id == id);
  if (item) openForm(item);
}

async function deleteItem(id) {
  if (!confirm("Delete item?")) return;
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  loadItems();
}

// ---------------- DRAG & DROP ----------------
function enableDrag(tr) {
  tr.addEventListener("dragstart", () => dragSrc = tr);
  tr.addEventListener("dragover", e => e.preventDefault());

  tr.addEventListener("drop", e => {
    e.preventDefault();
    if (dragSrc !== tr) {
      itemsTable.insertBefore(dragSrc, tr);
      reorderSequential();
    }
  });
}

// ---------------- REORDER SEQUENTIAL ----------------
async function reorderSequential() {
  const rows = [...itemsTable.children];

  // Group by category
  const grouped = {};
  rows.forEach(tr => {
    const cat = tr.dataset.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(tr);
  });

  // Assign category_order sequentially
  let catCounter = 1;
  for (const cat of Object.keys(grouped)) {
    grouped[cat].forEach(tr => tr.dataset.category_order = catCounter);
    catCounter++;
  }

  // Assign item_order within category
  Object.values(grouped).forEach(items => {
    items.forEach((tr, idx) => tr.dataset.item_order = idx + 1);
  });

  // Prepare updates for backend
  const updates = rows.map(tr => ({
    id: tr.dataset.id,
    item_order: Number(tr.dataset.item_order),
    category_order: Number(tr.dataset.category_order)
  }));

  await fetch("/api/items/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates })
  });
}
