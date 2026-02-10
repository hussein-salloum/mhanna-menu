document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ admin.js loaded");

  const loginModal = document.getElementById("loginModal");
  const adminPanel = document.getElementById("adminPanel");
  const loginError = document.getElementById("loginError");
  const itemsTable = document.getElementById("itemsTable");
  const itemsTbody = document.getElementById("items");
  const itemsCards = document.getElementById("itemsCards");
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

  document.getElementById("cancelLoginBtn").addEventListener("click", () => {
    loginModal.style.display = "none";
  });

  // ---------------- ADD / EDIT ----------------
  addItemBtn.addEventListener("click", () => openForm());
  saveBtn.addEventListener("click", saveItem);
  cancelBtn.addEventListener("click", () => formModal.style.display = "none");

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

  // ---------------- LOAD ITEMS ----------------
  async function loadItems() {
    const res = await fetch("/api/items");
    const data = await res.json();
    itemsTbody.innerHTML = "";
    itemsCards.innerHTML = "";

    data.forEach(item => {
      // Table row
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
      itemsTbody.appendChild(tr);

      // Mobile card
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = item.id;
      card.draggable = true;
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

    attachItemEvents();
    enableDragAndDrop();
  }

  // ---------------- EDIT / DELETE ----------------
  function attachItemEvents() {
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.onclick = e => {
        const id = e.target.closest("[data-id]").dataset.id;
        editItem(id);
      };
    });
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.onclick = e => {
        const id = e.target.closest("[data-id]").dataset.id;
        deleteItem(id);
      };
    });
  }

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

  async function saveItem() {
    const payload = {
      name: inputName.value,
      category: inputCategory.value,
      price: Number(inputPrice.value),
      description: inputDescription.value
    };
    if (editingItemId) {
      await fetch(`/api/items/${editingItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(`/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    formModal.style.display = "none";
    loadItems();
  }

  // ---------------- DRAG & DROP ----------------
  function enableDragAndDrop() {
    // Desktop rows
    let draggedRow = null;
    itemsTbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("dragstart", () => { draggedRow = tr; });
      tr.addEventListener("dragover", e => { e.preventDefault(); tr.style.borderTop="2px solid #2196f3"; });
      tr.addEventListener("dragleave", () => { tr.style.borderTop=""; });
      tr.addEventListener("drop", async e => {
        e.preventDefault();
        tr.style.borderTop="";
        if (!draggedRow || draggedRow === tr) return;
        tr.parentNode.insertBefore(draggedRow, tr);
        await reorderSequential();
      });
    });

    // Mobile cards
    let draggedCard = null;
    itemsCards.querySelectorAll(".card").forEach(card => {
      card.addEventListener("dragstart", () => { draggedCard = card; });
      card.addEventListener("dragover", e => { e.preventDefault(); card.style.borderTop="2px solid #2196f3"; });
      card.addEventListener("dragleave", () => { card.style.borderTop=""; });
      card.addEventListener("drop", async e => {
        e.preventDefault();
        card.style.borderTop="";
        if (!draggedCard || draggedCard === card) return;
        itemsCards.insertBefore(draggedCard, card);
        await reorderSequential();
      });
    });
  }

  // ---------------- REORDER SEQUENTIAL ----------------
  async function reorderSequential() {
    try {
      const rows = itemsTbody.querySelectorAll("tr");
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

});
