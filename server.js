import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import feedRoutes from "./routes/feed.js";
import imageRoutes from "./routes/images.js";
import poemRoutes from "./routes/poems.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corsOptions = {
  origin: "http://localhost:5173",
};
const conversations = {};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "Poetry API is running." });
});

app.get("/api/celebrities", async (req, res) => {
  try {
    const query = req.query.query;

    if (!String(query || "").trim()) {
      return res.json([]);
    }

    const response = await axios.get("https://api.themoviedb.org/3/search/person", {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query,
      },
    });

    const results = (response.data.results || [])
      .filter((person) => person.profile_path)
      .map((person) => ({
        name: person.name,
        image: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
      }));

    return res.json(results);
  } catch (error) {
    console.error("CELEB ERROR:", error.response?.data || error.message);
    return res.json([]);
  }
});

app.get("/api/trending-celebrities", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const response = await axios.get("https://api.themoviedb.org/3/trending/person/week", {
      params: {
        api_key: process.env.TMDB_API_KEY,
        page,
      },
    });

    const results = (response.data.results || [])
      .filter((person) => person.profile_path)
      .map((person) => ({
        name: person.name,
        image: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
      }));

    return res.json(results);
  } catch (error) {
    console.error("TRENDING CELEB ERROR:", error.response?.data || error.message);
    return res.json([]);
  }
});

app.post("/ai-chat", async (req, res) => {
  try {
    const { message, userId = "default" } = req.body ?? {};

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    if (!String(message || "").trim()) {
      return res.status(400).json({ reply: "Zealot unavailable." });
    }

    if (!conversations[userId]) {
      conversations[userId] = [
        {
          role: "system",
          content:
            "You are Zealot, a helpful and intelligent assistant. Maintain context across messages and respond naturally.",
        },
      ];
    }

    const history = conversations[userId];
    history.push({ role: "user", content: message });

    // Keep the system prompt plus only the most recent 10 turns to avoid oversized requests.
    const trimmedHistory = [history[0], ...history.slice(-10)];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: trimmedHistory,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    history.push({ role: "assistant", content: reply });
    conversations[userId] = [history[0], ...history.slice(-10)];

    return res.json({ reply });
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error);
    return res.status(500).json({
      reply: "Zealot unavailable.",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/poems", poemRoutes);
app.use("/api/user", userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({
    message: err.message || "Something went wrong on the server.",
  });
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });
});

connectDB().then(() => {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
