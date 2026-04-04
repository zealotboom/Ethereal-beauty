import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import Poetry from "../models/Poetry.js";

const router = express.Router();

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { title, content, author } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "Title and content are required.",
      });
    }

    const poem = await Poetry.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user?.username || author?.trim() || "",
    });

    return res.status(201).json(poem);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const poems = await Poetry.find().sort({ createdAt: -1 });
    return res.status(200).json(poems);
  } catch (error) {
    return next(error);
  }
});

export default router;
