const API_URL = import.meta.env.VITE_API_URL;
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const FALLBACK_BIRDS = [
  { id: "fallback-1", name: "Kingfisher sitting on branch", imageUrl: "https://loremflickr.com/1200/800/bird?lock=31" },
  { id: "fallback-2", name: "Owl in soft light", imageUrl: "https://loremflickr.com/1200/800/bird?lock=32" },
  { id: "fallback-3", name: "Blue jay in forest", imageUrl: "https://loremflickr.com/1200/800/bird?lock=33" },
  { id: "fallback-4", name: "Robin on garden wall", imageUrl: "https://loremflickr.com/1200/800/bird?lock=34" },
  { id: "fallback-5", name: "Egret beside water", imageUrl: "https://loremflickr.com/1200/800/bird?lock=35" },
  { id: "fallback-6", name: "Falcon against the sky", imageUrl: "https://loremflickr.com/1200/800/bird?lock=36" },
  { id: "fallback-7", name: "Parakeet on green branch", imageUrl: "https://loremflickr.com/1200/800/bird?lock=37" },
  { id: "fallback-8", name: "Heron near the reeds", imageUrl: "https://loremflickr.com/1200/800/bird?lock=38" },
  { id: "fallback-9", name: "Macaw with bright feathers", imageUrl: "https://loremflickr.com/1200/800/bird?lock=39" },
  { id: "fallback-10", name: "Sparrow in morning sun", imageUrl: "https://loremflickr.com/1200/800/bird?lock=40" },
  { id: "fallback-11", name: "Cardinal on winter branch", imageUrl: "https://loremflickr.com/1200/800/bird?lock=41" },
  { id: "fallback-12", name: "Wild bird beside lake", imageUrl: "https://loremflickr.com/1200/800/bird?lock=42" },
];
const BIRD_INCLUDE_TERMS = ["bird", "avian", "wildlife"];
const BIRD_EXCLUDE_TERMS = ["ship", "boat", "logo", "text", "illustration"];
const MAX_BIRD_RESULTS = 50;
let birdDatasetCache = null;

const parseJson = async (response) => response.json().catch(() => ({}));

const getToken = () => localStorage.getItem("poetry-token");

const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchPoems = async (page = 1, limit = 10, feed = "all") => {
  const response = await fetch(`${API_URL}/api/feed?page=${page}&limit=${limit}&feed=${feed}`);

  if (!response.ok) {
    throw new Error("Unable to load poems right now.");
  }

  return response.json();
};

export const resetBirdFeedCache = () => {
  birdDatasetCache = null;
};

const toTitleCase = (value) =>
  value.replace(/\b\w/g, (character) => character.toUpperCase());

const cleanBirdName = (value) => {
  if (!value) {
    return "Beautiful Bird";
  }

  const cleaned = value
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 5)
    .join(" ");

  return cleaned ? toTitleCase(cleaned) : "Beautiful Bird";
};

const isValidBirdPhoto = (photo) => {
  const altText = photo.alt_description?.toLowerCase();

  if (!altText || !photo.urls?.regular) {
    return false;
  }

  const includesAllowedTerm = BIRD_INCLUDE_TERMS.some((term) => altText.includes(term));
  const includesBlockedTerm = BIRD_EXCLUDE_TERMS.some((term) => altText.includes(term));

  return includesAllowedTerm && !includesBlockedTerm;
};

const buildUnsplashBirdDataset = async () => {
  const combined = [];
  const seenIds = new Set();

  for (let page = 1; page <= 5; page += 1) {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=bird%20wildlife%20nature&per_page=10&page=${page}&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      throw new Error("Unable to load bird images right now.");
    }

    const payload = await response.json();
    const results = Array.isArray(payload.results) ? payload.results : [];

    results.forEach((photo) => {
      if (!isValidBirdPhoto(photo) || seenIds.has(photo.id)) {
        return;
      }

      seenIds.add(photo.id);
      combined.push({
        id: photo.id,
        name: cleanBirdName(photo.alt_description),
        caption: photo.user?.name || "Wild Bird",
        imageUrl: photo.urls.regular,
      });
    });

    if (combined.length >= MAX_BIRD_RESULTS) {
      break;
    }
  }

  return combined.slice(0, MAX_BIRD_RESULTS);
};

const buildFallbackBirdDataset = () =>
  Array.from({ length: MAX_BIRD_RESULTS }, (_, index) => {
    const bird = FALLBACK_BIRDS[index % FALLBACK_BIRDS.length];

    return {
      id: `${bird.id}-${index + 1}`,
      name: bird.name,
      caption: "Wild Bird",
      imageUrl: bird.imageUrl,
    };
  });

const getBirdDataset = async () => {
  if (birdDatasetCache) {
    return birdDatasetCache;
  }

  if (UNSPLASH_ACCESS_KEY) {
    birdDatasetCache = await buildUnsplashBirdDataset();

    if (birdDatasetCache.length > 0) {
      return birdDatasetCache;
    }
  }

  birdDatasetCache = buildFallbackBirdDataset();
  return birdDatasetCache;
};

export const fetchBirdPosts = async (page = 1, limit = 10) => {
  const dataset = await getBirdDataset();
  const safePage = Math.max(page, 1);
  const startIndex = (safePage - 1) * limit;
  const endIndex = startIndex + limit;
  const data = dataset.slice(startIndex, endIndex);

  return {
    data,
    hasMore: endIndex < dataset.length,
    page: safePage,
  };
};

export const getBirdInitialLimit = () => 10;

export const getBirdLoadMoreLimit = () => 10;

export const getBirdDatasetSize = async () => {
  const dataset = await getBirdDataset();
  return dataset.length;
};

export const fetchUniversalPosts = async (page = 1, limit = 10, seenIds = []) => {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("Universal Feed requires a valid Unsplash Access Key.");
  }

  const seen = new Set(seenIds);
  const response = await fetch(
    `https://api.unsplash.com/photos?per_page=${limit}&page=${page}&client_id=${UNSPLASH_ACCESS_KEY}`
  );

  if (!response.ok) {
    throw new Error("Unable to load universal images right now.");
  }

  const payload = await response.json();
  const results = Array.isArray(payload) ? payload : [];
  const data = results
    .filter((photo) => photo.id && photo.urls?.regular && !seen.has(photo.id))
    .map((photo) => ({
      id: photo.id,
      imageUrl: photo.urls.regular,
      caption: photo.alt_description || "Beautiful Image",
    }));

  return {
    data,
    hasMore: results.length === limit,
    page,
  };
};

export const createPoem = async (payload) => {
  const response = await fetch(`${API_URL}/api/poems`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to submit poem.");
  }

  return data;
};

export const createImagePost = async ({ image, caption, user }) => {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("caption", caption || "");
  formData.append("user", user || "Anonymous");

  const response = await fetch(`${API_URL}/api/images`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to upload image.");
  }

  return data;
};

export const signup = async (payload) => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to create account.");
  }

  return data;
};

export const login = async (payload) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to log in.");
  }

  return data;
};

export const fetchProfile = async () => {
  const response = await fetch(`${API_URL}/api/user/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to load your profile.");
  }

  return data;
};

export const updateProfile = async ({ age, interests, poetryStyle, profilePic }) => {
  const formData = new FormData();

  if (profilePic) {
    formData.append("profilePic", profilePic);
  }

  if (typeof age !== "undefined") {
    formData.append("age", age ?? "");
  }

  if (typeof interests !== "undefined") {
    formData.append("interests", interests ?? "");
  }

  if (typeof poetryStyle !== "undefined") {
    formData.append("poetryStyle", poetryStyle ?? "");
  }

  const response = await fetch(`${API_URL}/api/user/update`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to update profile.");
  }

  return data;
};

export const fetchProfilePosts = async () => {
  const response = await fetch(`${API_URL}/api/user/posts`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to load your posts.");
  }

  return data;
};

export const fetchCelebrities = async (query) => {
  const response = await fetch(`${API_URL}/api/celebrities?query=${encodeURIComponent(query)}`);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to search celebrities right now.");
  }

  return Array.isArray(data) ? data : [];
};

export const fetchTrendingCelebrities = async (page = 1) => {
  const response = await fetch(`${API_URL}/api/trending-celebrities?page=${page}`);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Unable to load trending celebrities right now.");
  }

  return Array.isArray(data) ? data : [];
};

export const getAssetUrl = (path) => {
  if (!path) {
    return "";
  }

  return `${API_URL}${path}`;
};
