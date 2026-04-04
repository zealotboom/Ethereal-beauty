import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ImageCard from "../components/ImageCard.jsx";
import ImageModal from "../components/ImageModal.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { fetchCelebrities, fetchTrendingCelebrities } from "../lib/api.js";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const toCelebrityItem = (person, index) => ({
  id: `celebrity-${person.name}-${index}`,
  imageUrl: person.image,
  caption: person.name,
  name: person.name,
  source: "api",
});

const mergeCelebrityItems = (current, incoming) => {
  const seen = new Set(current.map((item) => `${item.caption}-${item.imageUrl}`));
  const merged = [...current];

  incoming.forEach((item) => {
    const key = `${item.caption}-${item.imageUrl}`;

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });

  return merged;
};

function CelebritiesPage() {
  const [queryInput, setQueryInput] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const observerRef = useRef(null);
  const isPagingRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    const loadTrendingCelebrities = async () => {
      try {
        setIsLoading(true);
        setError("");

        const trending = await fetchTrendingCelebrities(1);

        if (!isCurrent) {
          return;
        }

        setResults(trending.map(toCelebrityItem));
        setPage(1);
        setHasMore(trending.length > 0);
        setIsShowingSearchResults(false);
      } catch (loadError) {
        if (!isCurrent) {
          return;
        }

        setError(loadError.message || "Unable to load celebrities right now.");
        setResults([]);
        setHasMore(false);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadTrendingCelebrities();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (isShowingSearchResults || page === 1 || isLoading || isFetchingMore || !hasMore) {
      return undefined;
    }

    let isCurrent = true;

    const loadMoreTrendingCelebrities = async () => {
      try {
        isPagingRef.current = true;
        setIsFetchingMore(true);
        const nextPage = await fetchTrendingCelebrities(page);

        if (!isCurrent) {
          return;
        }

        const normalizedItems = nextPage.map(toCelebrityItem);
        setResults((current) => mergeCelebrityItems(current, normalizedItems));
        setHasMore(normalizedItems.length > 0);
      } catch (loadError) {
        if (!isCurrent) {
          return;
        }

        setError(loadError.message || "Unable to load more celebrities right now.");
        setHasMore(false);
      } finally {
        if (isCurrent) {
          setIsFetchingMore(false);
        }
        isPagingRef.current = false;
      }
    };

    loadMoreTrendingCelebrities();

    return () => {
      isCurrent = false;
    };
  }, [hasMore, isFetchingMore, isLoading, isShowingSearchResults, page]);

  useEffect(() => {
    if (isShowingSearchResults || isLoading || isFetchingMore || !hasMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isPagingRef.current) {
          return;
        }

        setPage((current) => current + 1);
      },
      { rootMargin: "240px 0px" }
    );

    const target = observerRef.current;

    if (target) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, isShowingSearchResults]);

  const handleSearch = async () => {
    const trimmedQuery = queryInput.trim();

    try {
      setIsLoading(true);
      setError("");
      setHasMore(false);

      if (!trimmedQuery) {
        const trending = await fetchTrendingCelebrities(1);
        setResults(trending.map(toCelebrityItem));
        setPage(1);
        setHasMore(trending.length > 0);
        setIsShowingSearchResults(false);
        return;
      }

      const celebrities = await fetchCelebrities(trimmedQuery);
      setResults(celebrities.map(toCelebrityItem));
      setIsShowingSearchResults(true);
    } catch (searchError) {
      setError(searchError.message || "Unable to search celebrities right now.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page-stack celebrities-page">
      <section className="soft-nav-shell celebrities-shell">
        <div className="soft-nav-topline">
          <div className="soft-brand-lockup">
            <div className="soft-brand-copy">
              <p className="section-label">Portrait archive</p>
              <h1 className="brand-title soft-hero-title celebrities-title">Celebrities</h1>
            </div>
          </div>
        </div>

        <div className="soft-search-bar celebrities-search-bar">
          <span className="soft-search-icon" aria-hidden="true">
            Search
          </span>
          <input
            type="text"
            placeholder="Search celebrity name..."
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
      </section>

      <div className="section-heading">
        <div>
          <p className="section-label">{isShowingSearchResults ? "Celebrity Search" : "Trending This Week"}</p>
          <h2>{isShowingSearchResults ? "Celebrity Results" : "Trending Celebrities"}</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="image-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonCard key={`celebrity-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {!isLoading && error ? <div className="status-card error">{error}</div> : null}

      {!isLoading && !error && results.length === 0 ? (
        <div className="status-card">No celebrities found</div>
      ) : null}

      {!isLoading && !error && results.length > 0 ? (
        <motion.div
          key={isShowingSearchResults ? "celebrity-search-results" : "trending-celebrities"}
          className="page-stack"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <motion.div className="image-grid celebrities-grid" variants={containerVariants} initial="hidden" animate="visible">
            {results.map((item, index) => (
              <div className="celebrity-card-shell" key={`${item.id}-${index}`}>
                <ImageCard item={item} label="Celebrity" onOpen={setSelectedImage} />
              </div>
            ))}
          </motion.div>

          {isFetchingMore ? <div className="loading-spinner" aria-label="Loading more celebrities" /> : null}
          {!isShowingSearchResults ? <div className="observer-anchor" ref={observerRef} /> : null}
        </motion.div>
      ) : null}

      <ImageModal item={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

export default CelebritiesPage;
