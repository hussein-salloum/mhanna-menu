import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve index.html, style.css, app.js

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// API endpoint to fetch all items
app.get("/api/items", async (req, res) => {
  const { data, error } = await supabase
    .from("Mhanna-items")
    .select("*")
    .order("category", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
