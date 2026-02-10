document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ admin.js loaded");

  const loginModal = document.getElementById("loginModal");
  const adminPanel = document.getElementById("adminPanel");
  const loginError = document.getElementById("loginError");
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

  cancelBtn.addEventListener("click", () => formModal.style.display = "none");

  // ---------------- LOAD ITEMS ----------------
  async function loadItems() {
    const res = await fetch("/api/items");
    const data = await res.json();

    itemsTbody.innerHTML = "";
    itemsCards.innerHTML = "";

    data.forEach(item => {
      // --- Desktop table ---
      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
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

      // --- Mobile card ---
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

    attachItemEvents();
    enableDragDrop();
  }

  // ---------------- ADD / EDIT ----------------
  addItemBtn.addEventListener("click", () => openForm());
  saveBtn.addEventListener("click", saveItem);

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

  // ---------------- DRAG & DROP ----------------
  function enableDragDrop() {
    const rows = Array.from(itemsTbody.querySelectorAll("tr"));

    let dragSrc = null;

    rows.forEach(row => {
      row.draggable = true;

      row.addEventListener("dragstart", e => {
        dragSrc = row;
        e.dataTransfer.effectAllowed = "move";
      });

      row.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      row.addEventListener("drop", e => {
        e.preventDefault();
        if (row === dragSrc) return;

        const parent = row.parentNode;
        parent.insertBefore(dragSrc, row.nextSibling);
        reorderSequential();
      });
    });
  }

  async function reorderSequential() {
  const rows = Array.from(itemsTbody.querySelectorAll("tr"));
  const updates = [];
  const seenCategories = [];

  rows.forEach((tr, index) => {
    const id = Number(tr.dataset.id);
    if (!id || isNaN(id)) return; // <-- skip invalid ids!

    const category = tr.querySelector("td:nth-child(2)").textContent.trim();
    if (!seenCategories.includes(category)) seenCategories.push(category);
    const category_order = seenCategories.indexOf(category) + 1;

    updates.push({
      id,
      item_order: index + 1,
      category_order
    });
  });

  console.log("🔥 Reorder payload (filtered):", updates);

  if (updates.length === 0) return;

  try {
    const res = await fetch("/api/items/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (data.error) console.error("Reorder failed:", data);
    else console.log("✅ Items reordered successfully");
  } catch (err) {
    console.error("Reorder failed:", err);
  }
}

});
