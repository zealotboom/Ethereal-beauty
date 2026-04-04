import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ImageCard from "../components/ImageCard.jsx";
import ImageModal from "../components/ImageModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_PIXABAY_KEY || "REPLACE_WITH_PIXABAY_KEY";
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "";
const FEED_LIMIT = 20;
const FEED_COPY = {
  explore: {
    label: "Explore Images",
    title: "Discover Visual Content",
  },
  visage: {
    label: "Visage",
    title: "Visage",
  },
  community: {
    label: "Community",
    title: "User Image Feed",
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const mergeUniqueItems = (current, incoming) => {
  const seen = new Set(current.map((item) => item.id || item._id || item.imageUrl));
  const merged = [...current];

  incoming.forEach((item) => {
    const key = item.id || item._id || item.imageUrl;

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });

  return merged;
};

const fetchUnsplashImages = async (query, page) => {
  try {
    if (!UNSPLASH_KEY) {
      return [];
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=${FEED_LIMIT}&page=${page}&client_id=${UNSPLASH_KEY}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.results)
      ? data.results.map((photo) => ({
          id: `unsplash-${photo.id}`,
          imageUrl: photo.urls?.regular,
          caption: photo.alt_description || "Unsplash image",
          source: "api",
        }))
      : [];
  } catch (_error) {
    return [];
  }
};

const fetchPixabayImages = async (query, page) => {
  try {
    if (!API_KEY || API_KEY === "REPLACE_WITH_PIXABAY_KEY") {
      return [];
    }

    const response = await fetch(
      `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(
        query
      )}&image_type=photo&per_page=${FEED_LIMIT}&page=${page}`
    );

    const data = await response.json();
    return Array.isArray(data.hits)
      ? data.hits.map((image) => ({
          id: `pixabay-${image.id}`,
          imageUrl: image.webformatURL || image.largeImageURL || image.previewURL,
          caption: image.tags || "Pixabay image",
          source: "api",
        }))
      : [];
  } catch (_error) {
    return [];
  }
};

const fetchPixabayVideos = async (query = "nature", page = 1) => {
  const currentKey = import.meta.env.VITE_PIXABAY_KEY || "REPLACE_WITH_PIXABAY_KEY";

  const res = await fetch(
    `https://pixabay.com/api/videos/?key=${currentKey}&q=${query}&page=${page}&per_page=5`
  );

  const data = await res.json();

  console.log("API RESPONSE:", data);

  return data.hits || [];
};

const fetchCommunityImages = async (page) => {
  try {
    const response = await fetch(`${API_URL}/api/images?page=${page}&limit=${FEED_LIMIT}`);

    if (!response.ok) {
      throw new Error("Unable to load community images right now.");
    }

    const data = await response.json();
    return Array.isArray(data)
      ? data.map((image) => ({
          ...image,
          id: image._id || image.imageUrl,
          source: "user",
        }))
      : [];
  } catch (error) {
    throw new Error(error.message || "Unable to load community images right now.");
  }
};

function HomePage() {
  const [activeFeed, setActiveFeed] = useState("explore");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("nature");
  const [exploreFeed, setExploreFeed] = useState({
    items: [],
    page: 1,
    isLoading: true,
    isFetchingMore: false,
    error: "",
  });
  const [communityFeed, setCommunityFeed] = useState({
    items: [],
    page: 1,
    isLoading: false,
    isFetchingMore: false,
    error: "",
    isInitialized: false,
  });
  const [videos, setVideos] = useState([]);
  const [videoPage, setVideoPage] = useState(1);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const audioRef = useRef(null);
  const observerRef = useRef(null);

  const activeTab = activeFeed;
  const heading = FEED_COPY[activeFeed];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeFeed]);

  useEffect(() => {
    let isCurrent = true;

    const loadExplore = async () => {
      setExploreFeed({
        items: [],
        page: 1,
        isLoading: true,
        isFetchingMore: false,
        error: "",
      });

      const [unsplashImages, pixabayImages] = await Promise.all([
        fetchUnsplashImages(query, 1),
        fetchPixabayImages(query, 1),
      ]);

      if (!isCurrent) {
        return;
      }

      setExploreFeed({
        items: [...unsplashImages, ...pixabayImages],
        page: 1,
        isLoading: false,
        isFetchingMore: false,
        error: "",
      });
    };

    loadExplore();

    return () => {
      isCurrent = false;
    };
  }, [query]);

  useEffect(() => {
    if (activeFeed !== "community" || communityFeed.isInitialized) {
      return undefined;
    }

    let isCurrent = true;

    const loadCommunity = async () => {
      try {
        setCommunityFeed((current) => ({
          ...current,
          isLoading: true,
          error: "",
        }));
        const items = await fetchCommunityImages(1);

        if (!isCurrent) {
          return;
        }

        setCommunityFeed({
          items,
          page: 1,
          isLoading: false,
          isFetchingMore: false,
          error: "",
          isInitialized: true,
        });
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setCommunityFeed((current) => ({
          ...current,
          isLoading: false,
          isFetchingMore: false,
          error: error.message,
          isInitialized: true,
        }));
      }
    };

    loadCommunity();

    return () => {
      isCurrent = false;
    };
  }, [activeFeed, communityFeed.isInitialized]);

  const loadVideos = async () => {
    if (loadingVideos) return;

    try {
      setLoadingVideos(true);

      const results = await fetchPixabayVideos("nature", videoPage);

      console.log("Fetched Videos:", results);

      if (results && results.length > 0) {
        setVideos((prev) => [...prev, ...results]);
      } else {
        console.warn("No videos returned from API");
      }
    } catch (error) {
      console.error("Video loading error:", error);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "visage") {
      loadVideos();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "visage" && videoPage > 1) {
      loadVideos();
    }
  }, [videoPage, activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        if (activeFeed === "explore" && !exploreFeed.isLoading && !exploreFeed.isFetchingMore) {
          setExploreFeed((current) => ({
            ...current,
            isFetchingMore: true,
          }));

          Promise.all([
            fetchUnsplashImages(query, exploreFeed.page + 1),
            fetchPixabayImages(query, exploreFeed.page + 1),
          ])
            .then(([unsplashImages, pixabayImages]) => {
              setExploreFeed((current) => ({
                ...current,
                items: mergeUniqueItems(current.items, [...unsplashImages, ...pixabayImages]),
                page: current.page + 1,
                isFetchingMore: false,
              }));
            })
            .catch(() => {
              setExploreFeed((current) => ({
                ...current,
                isFetchingMore: false,
              }));
            });
        }

        if (activeFeed === "community" && !communityFeed.isLoading && !communityFeed.isFetchingMore) {
          setCommunityFeed((current) => ({
            ...current,
            isFetchingMore: true,
          }));

          fetchCommunityImages(communityFeed.page + 1)
            .then((items) => {
              setCommunityFeed((current) => ({
                ...current,
                items: mergeUniqueItems(current.items, items),
                page: current.page + 1,
                isFetchingMore: false,
              }));
            })
            .catch((error) => {
              setCommunityFeed((current) => ({
                ...current,
                isFetchingMore: false,
                error: error.message,
              }));
            });
        }
      },
      { rootMargin: "240px 0px" }
    );

    const target = observerRef.current;

    if (target) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [
    activeFeed,
    communityFeed.isFetchingMore,
    communityFeed.isLoading,
    communityFeed.page,
    exploreFeed.isFetchingMore,
    exploreFeed.isLoading,
    exploreFeed.page,
    query,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (activeFeed === "visage") {
          setVideoPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeFeed]);

  const handleSearch = () => {
    setActiveFeed("explore");
    const trimmedQuery = queryInput.trim();
    setQuery(trimmedQuery || "nature");
  };

  const currentItems = activeFeed === "community" ? communityFeed.items : exploreFeed.items;
  const currentError = activeFeed === "community" ? communityFeed.error : exploreFeed.error;
  const currentLoading = activeFeed === "community" ? communityFeed.isLoading : exploreFeed.isLoading;
  const currentFetchingMore =
    activeFeed === "community" ? communityFeed.isFetchingMore : exploreFeed.isFetchingMore;

  return (
    <section className="page-stack">
      <audio
        ref={audioRef}
        loop
        src={musicUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"}
      />

      <section className="soft-nav-shell">
        <div className="soft-nav-topline">
          <div className="soft-brand-lockup">
            <div className="brand-mark soft-brand-mark" aria-hidden="true">
              <span className="brand-mark-halo" />
              <span className="brand-mark-silhouette" />
            </div>
            <div className="soft-brand-copy">
              <p className="section-label">Curated visual atmosphere</p>
              <h1 className="brand-title soft-hero-title">Ethereal Beauty</h1>
            </div>
          </div>

          <div className="soft-nav-tools">
            <button
              className="violin-btn soft-hero-music"
              onClick={() => setShowMusicInput((prev) => !prev)}
              aria-label="Open music controls"
            >
              ♫
            </button>
            {showMusicInput && (
              <div className="music-input-box">
                <input
                  type="text"
                  placeholder="Paste music URL..."
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                />

                <button
                  onClick={() => {
                    if (!audioRef.current) return;

                    audioRef.current.pause();
                    audioRef.current.load();
                    audioRef.current.play().catch(() => {});
                  }}
                >
                  Play
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="soft-search-bar">
          <span className="soft-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button className="primary-button soft-search-button" type="button" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="soft-blob-nav">
          <button
            className={`soft-blob-button ${activeFeed === "explore" ? "soft-blob-button-active" : ""}`}
            type="button"
            onClick={() => setActiveFeed("explore")}
          >
            <span className="soft-blob-icon" aria-hidden="true">
              ✦
            </span>
            <span className="soft-blob-copy">
              <span className="soft-blob-title">Discover</span>
              <span className="soft-blob-subtitle">Explore visuals</span>
            </span>
          </button>
          <button
            className={`soft-blob-button soft-blob-button-alt ${activeFeed === "visage" ? "soft-blob-button-active" : ""}`}
            type="button"
            onClick={() => setActiveFeed("visage")}
          >
            <span className="soft-blob-icon" aria-hidden="true">
              ◌
            </span>
            <span className="soft-blob-copy">
              <span className="soft-blob-title">Visage</span>
              <span className="soft-blob-subtitle">Moving imagery</span>
            </span>
          </button>
          <button
            className={`soft-blob-button soft-blob-button-calm ${activeFeed === "community" ? "soft-blob-button-active" : ""}`}
            type="button"
            onClick={() => setActiveFeed("community")}
          >
            <span className="soft-blob-icon" aria-hidden="true">
              ◎
            </span>
            <span className="soft-blob-copy">
              <span className="soft-blob-title">Community</span>
              <span className="soft-blob-subtitle">Shared moments</span>
            </span>
          </button>
          <Link className="soft-blob-button soft-blob-button-alt" to="/celebrities">
            <span className="soft-blob-icon" aria-hidden="true">
              ★
            </span>
            <span className="soft-blob-copy">
              <span className="soft-blob-title">Celebrities</span>
              <span className="soft-blob-subtitle">Portrait feed</span>
            </span>
          </Link>
          <Link className="soft-blob-button soft-blob-button-profile" to="/profile">
            <span className="soft-blob-icon" aria-hidden="true">
              ◇
            </span>
            <span className="soft-blob-copy">
              <span className="soft-blob-title">Profile</span>
              <span className="soft-blob-subtitle">Your space</span>
            </span>
          </Link>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <p className="section-label">{heading.label}</p>
          <h2>{heading.title}</h2>
        </div>
      </div>

      {activeFeed !== "visage" && currentLoading ? (
        <div className="image-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={`image-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {activeFeed !== "visage" && !currentLoading && currentError ? (
        <div className="status-card error">{currentError}</div>
      ) : null}
      {activeFeed !== "visage" && !currentLoading && !currentError && currentItems.length === 0 ? (
        <div className="status-card">No images available right now.</div>
      ) : null}

      <AnimatePresence mode="wait">
        {activeFeed === "visage" ? (
          <motion.div
            key="visage-feed"
            className="page-stack"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            {loadingVideos && <p>Loading videos...</p>}

            <div className="video-grid">
              {videos.map((video, index) => {
                const videoUrl = video.videos?.small?.url || video.videos?.medium?.url;

                if (!videoUrl) return null;

                return (
                  <div className="video-card" key={index}>
                    <video
                      muted
                      loop
                      playsInline
                      preload="none"
                      className="video-element"
                      src={videoUrl}
                      onMouseEnter={(e) => {
                        e.target.play();
                      }}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {!loadingVideos && videos.length === 0 && <p>No videos found</p>}
          </motion.div>
        ) : null}

        {activeFeed !== "visage" && !currentLoading && !currentError ? (
          <motion.div
            key={`image-feed-${activeFeed}`}
            className="page-stack"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.div className="image-grid" variants={containerVariants} initial="hidden" animate="visible">
              {currentItems.map((item, index) => (
                <ImageCard
                  key={`${item.id || item._id || item.imageUrl}-${index}`}
                  item={item}
                  label={activeFeed === "community" ? "Community" : "Images"}
                  onOpen={setSelectedImage}
                />
              ))}
            </motion.div>

            {currentFetchingMore ? <div className="loading-spinner" aria-label="Loading more images" /> : null}
            <div className="observer-anchor" ref={observerRef} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ImageModal item={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

export default HomePage;
