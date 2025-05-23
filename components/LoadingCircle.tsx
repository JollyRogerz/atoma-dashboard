const LoadingCircle = ({
  isSpinning = false,
  size = "md",
}: {
  isSpinning?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    xs: "w-[0.8em] h-[0.8em]",
    sm: "w-[1em] h-[1em]",
    md: "w-[4em] h-[4em]",
    lg: "w-[8em] h-[8em]",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-4 border-primary ${
        isSpinning ? "animate-spin border-t-transparent" : ""
      }`}
    />
  );
};

export default LoadingCircle;
