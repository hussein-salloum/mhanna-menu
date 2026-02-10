import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve admin.html, index.html, etc.

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);



//////////////////////
// ADMIN LOGIN
//////////////////////
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    return res.json({ success: true });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

//////////////////////
// GET ITEMS
//////////////////////
app.get("/api/items", async (req, res) => {
  const { data, error } = await supabase
    .from("Mhanna-items")
    .select("*")
    .order("category_order", { ascending: true })
    .order("item_order", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

//////////////////////
// CREATE ITEM
//////////////////////
app.post("/api/items", async (req, res) => {
  try {
    // Get current max item_order and category_order
    const { data: items } = await supabase.from("Mhanna-items").select("*");

    let category_order = 1;
    const sameCategoryItems = items.filter(i => i.category === req.body.category);
    if (sameCategoryItems.length > 0) {
      category_order = sameCategoryItems[0].category_order || 1;
    } else if (items.length > 0) {
      category_order = Math.max(...items.map(i => i.category_order || 1)) + 1;
    }

    const item_order = items.length > 0 ? Math.max(...items.map(i => i.item_order || 0)) + 1 : 1;

    const { data, error } = await supabase
      .from("Mhanna-items")
      .insert([{ ...req.body, item_order, category_order }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//////////////////////
// UPDATE ITEM
//////////////////////
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("Mhanna-items").update(req.body).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

//////////////////////
// DELETE ITEM
//////////////////////
app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("Mhanna-items").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

//////////////////////
// REORDER ITEMS
//////////////////////
app.put("/api/items/reorder", async (req, res) => {
  console.log("🔥 REORDER ENDPOINT HIT");

  const updates = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const sanitizedUpdates = updates.map(u => ({
    id: Number(u.id),
    item_order: Number(u.item_order),
    category_order: Number(u.category_order)
  }));

  try {
    const { error } = await supabase
      .from("Mhanna-items")
      .upsert(sanitizedUpdates, { onConflict: "id" });

    if (error) {
      console.error("Reorder error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Reorder unexpected error:", err);
    res.status(500).json({ error: err.message });
  }
});

//////////////////////
// START SERVER
//////////////////////
const PORT = process.env.PORT || 3000;

// Serve admin.html on /admin (without .html)
app.get("/admin", (req, res) => {
  res.sendFile("admin.html", { root: "public" });
});


app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
