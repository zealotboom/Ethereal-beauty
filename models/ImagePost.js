import mongoose from "mongoose";

const imagePostSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  caption: {
    type: String,
    trim: true,
    default: "",
  },
  user: {
    type: String,
    trim: true,
    default: "Anonymous",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ImagePost = mongoose.model("ImagePost", imagePostSchema);

export default ImagePost;
