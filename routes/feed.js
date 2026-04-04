import express from "express";
import ImagePost from "../models/ImagePost.js";
import Poetry from "../models/Poetry.js";

const router = express.Router();
const MAX_LIMIT = 10;
const VALID_FEEDS = new Set(["all", "famous", "community"]);

const normalizeApiPoem = (poem, index) => ({
  title: poem.title || "Untitled",
  content: Array.isArray(poem.lines) ? poem.lines.join("\n") : poem.content || "",
  author: poem.author || "Unknown",
  source: "api",
  type: "poem",
  createdAt: new Date(Date.now() - index * 1000),
});

const normalizeUserPoem = (poem) => ({
  title: poem.title,
  content: poem.content,
  author: poem.author || "Anonymous",
  source: "user",
  type: "poem",
  createdAt: poem.createdAt,
});

const normalizeUserImage = (image) => ({
  imageUrl: image.imageUrl,
  caption: image.caption || "",
  user: image.user || "Anonymous",
  source: "user",
  type: "image",
  createdAt: image.createdAt,
});

const interleaveFeedItems = (apiPoems, userItems) => {
  const combined = [];
  const longestLength = Math.max(apiPoems.length, userItems.length);

  for (let index = 0; index < longestLength; index += 1) {
    if (apiPoems[index]) {
      combined.push(apiPoems[index]);
    }

    if (userItems[index]) {
      combined.push(userItems[index]);
    }
  }

  return combined;
};

const getPaginatedUserItems = async (page, limit) => {
  const endIndex = page * limit;
  const fetchLimit = endIndex + 1;

  const [userPoems, userImages] = await Promise.all([
    Poetry.find().sort({ createdAt: -1 }).limit(fetchLimit).lean(),
    ImagePost.find().sort({ createdAt: -1 }).limit(fetchLimit).lean(),
  ]);

  const mergedItems = [...userPoems.map(normalizeUserPoem), ...userImages.map(normalizeUserImage)].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );

  return {
    items: mergedItems.slice(endIndex - limit, endIndex),
    hasMore: mergedItems.length > endIndex,
  };
};

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const feed = VALID_FEEDS.has(req.query.feed) ? req.query.feed : "all";
    let apiPoems = [];
    let userItems = [];
    let userHasMore = false;

    try {
      if (feed !== "community") {
        const response = await fetch(`https://poetrydb.org/random/${limit}`);

        if (!response.ok) {
          throw new Error("PoetryDB request failed.");
        }

        const data = await response.json();
        apiPoems = Array.isArray(data) ? data.slice(0, limit).map(normalizeApiPoem) : [];
      }
    } catch (_error) {
      apiPoems = [];
    }

    if (feed !== "famous") {
      const paginatedUserItems = await getPaginatedUserItems(page, limit);
      userItems = paginatedUserItems.items;
      userHasMore = paginatedUserItems.hasMore;
    }

    let data = [];
    let hasMore = false;

    if (feed === "community") {
      data = userItems;
      hasMore = userHasMore;
    } else if (feed === "famous") {
      data = apiPoems;
      hasMore = apiPoems.length === limit;
    } else {
      data = interleaveFeedItems(apiPoems, userItems);
      hasMore = userHasMore || apiPoems.length === limit;
    }

    return res.status(200).json({
      data,
      feed,
      hasMore,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
