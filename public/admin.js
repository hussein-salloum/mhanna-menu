const form = document.getElementById("itemForm");
const list = document.getElementById("adminItems");
const imageInput = document.getElementById("imageInput");
let editId = null;

fetchItems();

function fetchItems() {
  fetch("/api/items").then(res => res.json()).then(renderItems);
}

function renderItems(items) {
  list.innerHTML = "";
  items.forEach(item => {
    list.innerHTML += `
      <div class="admin-card">
        <div>
          <strong>${item.name}</strong> - ${item.price} د.ك
        </div>
        <div>
          <button onclick="editItem('${item.id}')">✏️</button>
          <button onclick="deleteItem('${item.id}')">🗑️</button>
        </div>
      </div>
    `;
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const [name, description, price, category] = [...form.querySelectorAll("input:not([type=file])")].map(i => i.value);
  let image_url = "";

  if (imageInput.files[0]) {
    const formData = new FormData();
    formData.append("image", imageInput.files[0]);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    image_url = data.url;
  }

  const payload = { name, description, price, category, image_url };

  if (editId) {
    await fetch(`/api/items/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    editId = null;
  } else {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  form.reset();
  fetchItems();
};

function deleteItem(id) {
  if (!confirm("حذف العنصر؟")) return;
  fetch(`/api/items/${id}`, { method: "DELETE" }).then(fetchItems);
}

function editItem(id) {
  fetch("/api/items")
    .then(res => res.json())
    .then(items => {
      const item = items.find(i => i.id === id);
      const inputs = form.querySelectorAll("input:not([type=file])");
      inputs[0].value = item.name;
      inputs[1].value = item.description;
      inputs[2].value = item.price;
      inputs[3].value = item.category;
      editId = id;
    });
}
