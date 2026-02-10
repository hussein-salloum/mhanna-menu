console.log("✅ admin.js loaded");

// ---------------- DOM ----------------
const loginModal = document.getElementById("loginModal");
const adminPanel = document.getElementById("adminPanel");
const loginError = document.getElementById("loginError");
const itemsTable = document.getElementById("items");
const loginBtn = document.getElementById("loginBtn");
const addItemBtn = document.getElementById("addItemBtn");
const formModal = document.getElementById("formModal");
const formTitle = document.getElementById("formTitle");
const inputName = document.getElementById("name");
const inputCategory = document.getElementById("category");
const inputPrice = document.getElementById("price");
const inputDescription = document.getElementById("description");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

let editingItemId = null;
let draggedRow = null;

// ---------------- LOGIN ----------------
loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    loginModal.style.display = "none";
    adminPanel.hidden = false;
    loadItems();
  } else {
    const data = await res.json();
    loginError.textContent = data.message || "Wrong credentials";
  }
});

// ---------------- LOAD ITEMS ----------------
async function loadItems() {
  const res = await fetch("/api/items");
  const data = await res.json();

  itemsTable.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.setAttribute("draggable", "true");

    tr.innerHTML = `
      <td data-label="Name">${item.name}</td>
      <td data-label="Category">${item.category}</td>
      <td data-label="Price">${item.price}</td>
      <td data-label="Description">${item.description || ""}</td>
      <td data-label="Actions">
        <button class="editBtn">✏️</button>
        <button class="deleteBtn">🗑</button>
      </td>
    `;

    // Drag events
    tr.addEventListener("dragstart", () => tr.classList.add("dragging"));
    tr.addEventListener("dragend", () => {
      tr.classList.remove("dragging");
      saveNewOrder();
    });

    tr.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      const bounding = tr.getBoundingClientRect();
      const offset = e.clientY - bounding.top + window.scrollY;
      if (offset < bounding.height / 2) {
        tr.before(dragging);
      } else {
        tr.after(dragging);
      }
    });

    itemsTable.appendChild(tr);
  });

  attachRowButtons();
}

// ---------------- ROW BUTTONS ----------------
function attachRowButtons() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.closest("tr").dataset.id;
      editItem(id);
    });
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.closest("tr").dataset.id;
      deleteItem(id);
    });
  });
}

// ---------------- ADD / EDIT ----------------
addItemBtn.addEventListener("click", () => openForm());
saveBtn.addEventListener("click", saveItem);
cancelBtn.addEventListener("click", closeForm);

function openForm(item = null) {
  formModal.style.display = "flex";
  if (item) {
    editingItemId = item.id;
    formTitle.textContent = "Edit Item";
    inputName.value = item.name;
    inputCategory.value = item.category;
    inputPrice.value = item.price;
    inputDescription.value = item.description || "";
  } else {
    editingItemId = null;
    formTitle.textContent = "Add Item";
    inputName.value = "";
    inputCategory.value = "";
    inputPrice.value = "";
    inputDescription.value = "";
  }
}

function closeForm() {
  formModal.style.display = "none";
}

// ---------------- EDIT / DELETE ----------------
async function editItem(id) {
  const res = await fetch("/api/items");
  const data = await res.json();
  const item = data.find(i => i.id == id);
  if (item) openForm(item);
}

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  loadItems();
}

// ---------------- SAVE ITEM ----------------
async function saveItem() {
  const payload = {
    name: inputName.value,
    category: inputCategory.value,
    price: inputPrice.value,
    description: inputDescription.value
  };

  if (editingItemId) {
    await fetch(`/api/items/${editingItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  closeForm();
  loadItems();
}

// ---------------- REORDER ----------------
async function saveNewOrder() {
  const rows = Array.from(itemsTable.querySelectorAll("tr"));
  const updates = rows.map((tr, index) => ({
    id: tr.dataset.id,
    item_order: index + 1
  }));

  await fetch("/api/items/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
}

// ---------------- INITIAL ----------------
document.addEventListener("DOMContentLoaded", () => {
  adminPanel.hidden = true;
});
