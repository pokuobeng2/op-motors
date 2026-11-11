import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Image with a shimmer placeholder while it loads. */
export function SmartImage({
  className,
  wrapperClassName,
  onLoad,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { wrapperClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-surface", wrapperClassName)}>
      {!loaded && <div className="skeleton-shimmer absolute inset-0" aria-hidden="true" />}
      <img
        {...props}
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn("transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0", className)}
      />
    </div>
  );
}
