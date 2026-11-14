import { useState, useEffect, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Image with a shimmer placeholder while it loads, and graceful fallback if loading fails. */
export function SmartImage({
  className,
  wrapperClassName,
  onLoad,
  onError,
  src,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { wrapperClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || "/placeholder.svg");

  useEffect(() => {
    setImgSrc(src || "/placeholder.svg");
    setHasError(false);
    setLoaded(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-surface", wrapperClassName)}>
      {!loaded && <div className="skeleton-shimmer absolute inset-0" aria-hidden="true" />}
      <img
        {...props}
        src={imgSrc}
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0 && !loaded) {
            setLoaded(true);
          }
        }}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            setImgSrc("/placeholder.svg");
            setLoaded(true);
          }
          onError?.(e);
        }}
        className={cn("transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
      />
    </div>
  );
}
