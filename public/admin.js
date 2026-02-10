console.log("✅ admin.js loaded");

// ---------------- DOM ELEMENTS ----------------
const loginModal = document.getElementById("loginModal");
const adminPanel = document.getElementById("adminPanel");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const cancelLoginBtn = document.getElementById("cancelLoginBtn");

const addItemBtn = document.getElementById("addItemBtn");
const formModal = document.getElementById("formModal");
const formTitle = document.getElementById("formTitle");
const inputName = document.getElementById("name");
const inputCategory = document.getElementById("category");
const inputPrice = document.getElementById("price");
const inputDescription = document.getElementById("description");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

const itemsTable = document.getElementById("items");
const itemsCards = document.getElementById("itemsCards");

let editingItemId = null;

// ---------------- LOGIN ----------------
loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  } catch (err) {
    console.error(err);
    loginError.textContent = "Login failed";
  }
});

cancelLoginBtn.addEventListener("click", () => loginModal.style.display = "none");

// ---------------- ADD / EDIT MODAL ----------------
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

// ---------------- LOAD ITEMS ----------------
async function loadItems() {
  try {
    const res = await fetch("/api/items");
    const data = await res.json();
    renderTable(data);
    renderCards(data);
    enableDragAndDrop();
  } catch (err) {
    console.error("Failed to load items:", err);
  }
}

// ---------------- RENDER TABLE ----------------
function renderTable(data) {
  itemsTable.innerHTML = "";
  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
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
    itemsTable.appendChild(tr);
  });
  attachRowButtons();
}

// ---------------- RENDER MOBILE CARDS ----------------
function renderCards(data) {
  itemsCards.innerHTML = "";
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = item.id;
    card.innerHTML = `
      <strong>${item.name}</strong>
      <p>Category: ${item.category}</p>
      <p>Price: ${item.price}</p>
      <p>${item.description || ""}</p>
      <div class="actions">
        <button class="editBtn">✏️</button>
        <button class="deleteBtn">🗑</button>
      </div>
    `;
    itemsCards.appendChild(card);
  });
  attachRowButtons(true);
}

// ---------------- ATTACH BUTTON EVENTS ----------------
function attachRowButtons(isCard = false) {
  const container = isCard ? itemsCards : itemsTable;
  container.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.closest("[data-id]").dataset.id;
      editItem(id);
    });
  });

  container.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = e.target.closest("[data-id]").dataset.id;
      deleteItem(id);
    });
  });
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
  const body = {
    name: inputName.value,
    category: inputCategory.value,
    price: Number(inputPrice.value),
    description: inputDescription.value
  };

  try {
    if (editingItemId) {
      await fetch(`/api/items/${editingItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } else {
      await fetch(`/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }
    closeForm();
    loadItems();
  } catch (err) {
    console.error("Save failed:", err);
  }
}

// ---------------- DRAG & DROP ----------------
function enableDragAndDrop() {
  const rows = document.querySelectorAll("#items tr");
  const cards = document.querySelectorAll(".card");

  // DESKTOP TABLE
  let draggedRow = null;
  rows.forEach(row => {
    row.addEventListener("dragstart", e => { draggedRow = row; });
    row.addEventListener("dragover", e => { e.preventDefault(); row.style.borderTop = "2px solid #2196f3"; });
    row.addEventListener("dragleave", () => { row.style.borderTop = ""; });
    row.addEventListener("drop", async e => {
      e.preventDefault();
      row.style.borderTop = "";
      if (!draggedRow || draggedRow === row) return;
      row.parentNode.insertBefore(draggedRow, row);
      await reorderSequential();
    });
  });

  // MOBILE CARDS
  let draggedCard = null;
  cards.forEach(card => {
    card.draggable = true;
    card.addEventListener("dragstart", e => { draggedCard = card; });
    card.addEventListener("dragover", e => { e.preventDefault(); card.style.borderTop = "2px solid #2196f3"; });
    card.addEventListener("dragleave", () => { card.style.borderTop = ""; });
    card.addEventListener("drop", async e => {
      e.preventDefault();
      card.style.borderTop = "";
      if (!draggedCard || draggedCard === card) return;
      itemsCards.insertBefore(draggedCard, card);
      await reorderSequential();
    });
  });
}

// ---------------- REORDER SEQUENTIALLY ----------------
async function reorderSequential() {
  try {
    const rows = document.querySelectorAll("#items tr");
    const updates = Array.from(rows).map((tr, index) => ({
      id: tr.dataset.id,
      item_order: index + 1
    }));
    console.log("Reorder payload:", updates);

    const res = await fetch("/api/items/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Reorder failed:", data);
    } else {
      loadItems();
    }
  } catch (err) {
    console.error("Reorder error:", err);
  }
}
