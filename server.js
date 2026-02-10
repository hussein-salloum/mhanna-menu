import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve admin.html, index.html, etc.

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log("🚨 SERVER FILE LOADED 🚨");

// ---------------- ADMIN LOGIN ----------------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    return res.json({ success: true });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// ---------------- GET ITEMS ----------------
app.get("/api/items", async (req, res) => {
  const { data, error } = await supabase
    .from("Mhanna-items")
    .select("*")
    .order("category_order", { ascending: true })
    .order("item_order", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------------- CREATE ITEM ----------------
app.post("/api/items", async (req, res) => {
  const { data, error } = await supabase
    .from("Mhanna-items")
    .insert([req.body])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// ---------------- UPDATE ITEM ----------------
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("Mhanna-items")
    .update(req.body)
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ---------------- DELETE ITEM ----------------
app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("Mhanna-items")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ---------------- REORDER ITEMS + CATEGORIES ----------------
app.post("/api/items/reorder", async (req, res) => {
  console.log("🔥 REORDER ENDPOINT HIT");

  const { updates } = req.body; // [{ id, item_order, category_order }]

  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    for (const row of updates) {
      await supabase
        .from("Mhanna-items")
        .update({
          item_order: row.item_order,
          category_order: row.category_order
        })
        .eq("id", row.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ REORDER ERROR:", err);
    res.status(500).json({ error: "Reorder failed" });
  }
});



// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
