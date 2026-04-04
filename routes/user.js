import express from "express";
import ImagePost from "../models/ImagePost.js";
import Poetry from "../models/Poetry.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  return res.status(200).json({
    username: req.user.username,
    email: req.user.email,
    age: req.user.age,
    interests: req.user.interests,
    poetryStyle: req.user.poetryStyle,
    profilePic: req.user.profilePic,
    createdAt: req.user.createdAt,
  });
});

router.put(
  "/update",
  protect,
  upload.single("profilePic"),
  async (req, res, next) => {
    try {
      const profilePic = req.file;

      if (profilePic) {
        req.user.profilePic = `/uploads/${profilePic.filename}`;
      }

      if (typeof req.body.age !== "undefined") {
        req.user.age = req.body.age ? Number(req.body.age) : null;
      }

      if (typeof req.body.interests !== "undefined") {
        req.user.interests = req.body.interests.trim();
      }

      if (typeof req.body.poetryStyle !== "undefined") {
        req.user.poetryStyle = req.body.poetryStyle.trim();
      }

      await req.user.save();

      return res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          username: req.user.username,
          email: req.user.email,
          age: req.user.age,
          interests: req.user.interests,
          poetryStyle: req.user.poetryStyle,
          profilePic: req.user.profilePic,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/posts", protect, async (req, res, next) => {
  try {
    const poems = await Poetry.find({ author: req.user.username }).sort({ createdAt: -1 }).lean();
    const images = await ImagePost.find({ user: req.user.username }).sort({ createdAt: -1 }).lean();

    const posts = [
      ...poems.map((poem) => ({
        ...poem,
        type: "poem",
      })),
      ...images.map((image) => ({
        ...image,
        type: "image",
      })),
    ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return res.status(200).json(posts);
  } catch (error) {
    return next(error);
  }
});

export default router;
