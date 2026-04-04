function SkeletonCard({ type = "image" }) {
  return (
    <div className={`skeleton-card ${type === "poem" ? "poem-skeleton" : "image-skeleton"}`}>
      <div className="skeleton-shimmer" />
    </div>
  );
}

export default SkeletonCard;
