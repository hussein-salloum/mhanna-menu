import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- API --------------------

// Get all items
app.get("/api/items", async (req, res) => {
  const { data, error } = await supabase.from("Mhanna-items").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create new item
app.post("/api/items", async (req, res) => {
  const { name, description, price, category, image_url } = req.body;
  const { data, error } = await supabase.from("Mhanna-items").insert([
    { name, description, price, category, image_url },
  ]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Update item
app.put("/api/items/:id", async (req, res) => {
  const id = req.params.id;
  const { name, description, price, category, image_url } = req.body;
  const { data, error } = await supabase
    .from("Mhanna-items")
    .update({ name, description, price, category, image_url })
    .eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Delete item
app.delete("/api/items/:id", async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from("Mhanna-items").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Upload image from device to Supabase
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileName = Date.now() + "-" + req.file.originalname;
    const file = fs.createReadStream(filePath);

    const { data, error } = await supabase.storage
      .from("mhanna-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    fs.unlinkSync(filePath); // delete temp file

    if (error) throw error;

    const publicURL = supabase.storage.from("mhanna-images").getPublicUrl(fileName).data.publicUrl;

    res.json({ url: publicURL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
