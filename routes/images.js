import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import ImagePost from "../models/ImagePost.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", optionalAuth, upload.single("image"), async (req, res, next) => {
  try {
    const caption = req.body.caption?.trim() || "";
    const user = req.user?.username || req.body.user?.trim() || "Anonymous";

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const imagePost = await ImagePost.create({
      imageUrl: `/uploads/${req.file.filename}`,
      caption,
      user,
    });

    return res.status(201).json(imagePost);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 20);
    const skip = (page - 1) * limit;

    const images = await ImagePost.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return res.status(200).json(images);
  } catch (error) {
    return next(error);
  }
});

export default router;
