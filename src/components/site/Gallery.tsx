import { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import type { VehicleImage } from "@/lib/public-types";
import { SmartImage } from "./SmartImage";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: VehicleImage[]; title: string }) {
  const count = images.length;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const thumbsContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: count > 1,
    duration: 25,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIndex);

    // Keep active thumbnail scrolled into view
    const activeThumb = thumbRefs.current[newIndex];
    if (activeThumb && thumbsContainerRef.current) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (idx: number) => {
      emblaApi?.scrollTo(idx);
    },
    [emblaApi],
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (count < 2 || isViewerOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollPrev, scrollNext, count, isViewerOpen]);

  if (count === 0) {
    return <div className="aspect-[3/2] rounded-[2rem] bg-surface" />;
  }

  return (
    <div>
      {/* Main Showcase with Touch-Swipe and Click to Open Large Viewer */}
      <div className="group relative aspect-[3/2] overflow-hidden rounded-[2rem] bg-surface select-none shadow-sm">
        <div ref={emblaRef} className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing">
          <div className="flex h-full touch-pan-y">
            {images.map((img, i) => (
              <div
                key={img.id || i}
                className="relative h-full min-w-0 flex-[0_0_100%] cursor-zoom-in"
                onClick={() => {
                  if (emblaApi && !emblaApi.clickAllowed()) return;
                  setIsViewerOpen(true);
                }}
                aria-hidden={i !== selectedIndex}
              >
                <SmartImage
                  src={img.url}
                  alt={img.alt ?? `${title} photo ${i + 1}`}
                  width={1600}
                  height={1072}
                  loading={i <= 1 ? "eager" : "lazy"}
                  wrapperClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Expand full viewer button */}
        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          aria-label="View larger photos"
          className="glass absolute top-3 sm:top-4 right-3 sm:right-4 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold backdrop-blur shadow-sm transition-all hover:bg-background/80 active:scale-95 z-10 cursor-pointer"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Expand</span>
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous photo"
              className="glass absolute left-3 sm:left-4 top-1/2 inline-flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border opacity-90 sm:opacity-0 transition-all duration-300 sm:group-hover:opacity-100 hover:scale-105 active:scale-95 focus-visible:opacity-100 z-10 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next photo"
              className="glass absolute right-3 sm:right-4 top-1/2 inline-flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border opacity-90 sm:opacity-0 transition-all duration-300 sm:group-hover:opacity-100 hover:scale-105 active:scale-95 focus-visible:opacity-100 z-10 shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="glass absolute bottom-3 sm:bottom-4 right-3 sm:right-4 rounded-full border border-border px-3 py-1 text-xs font-semibold backdrop-blur shadow-sm z-10">
              {selectedIndex + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Synchronized Animated Thumbnail Strip */}
      {count > 1 && (
        <div
          ref={thumbsContainerRef}
          className="mt-3.5 flex gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 scrollbar-none"
        >
          {images.map((img, i) => {
            const isActive = i === selectedIndex;
            return (
              <button
                key={img.id || i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={isActive}
                className={cn(
                  "relative h-16 w-24 sm:h-20 sm:w-28 shrink-0 overflow-hidden rounded-xl transition-all duration-300 cursor-pointer",
                  isActive
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.03] shadow-md opacity-100"
                    : "opacity-50 hover:opacity-90 hover:scale-[1.01]"
                )}
              >
                <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover pointer-events-none" />
              </button>
            );
          })}
        </div>
      )}

      {/* Large Fullscreen Image Viewer Lightbox */}
      {count > 0 && (
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          images={images}
          title={title}
          initialIndex={selectedIndex}
          onIndexChange={(newIndex) => {
            setSelectedIndex(newIndex);
            emblaApi?.scrollTo(newIndex, true);
          }}
        />
      )}
    </div>
  );
}

/** Fullscreen Interactive Image Viewer Lightbox Modal */
function ImageViewerModal({
  isOpen,
  onClose,
  images,
  title,
  initialIndex,
  onIndexChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  images: VehicleImage[];
  title: string;
  initialIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const count = images.length;
  const [modalIndex, setModalIndex] = useState(initialIndex);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const thumbItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: count > 1,
    duration: 20,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const current = emblaApi.selectedScrollSnap();
    setModalIndex(current);
    onIndexChange(current);

    thumbItemsRef.current[current]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [emblaApi, onIndexChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (isOpen && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setModalIndex(initialIndex);
    }
  }, [isOpen, initialIndex, emblaApi]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        emblaApi?.scrollNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, emblaApi, onClose]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md transition-opacity duration-200 animate-in fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col justify-between p-3 sm:p-5 outline-none text-white select-none transition-all duration-200 animate-in zoom-in-95"
          aria-label={`Expanded image viewer for ${title}`}
        >
          <DialogPrimitive.Title className="sr-only">
            {title} - Photo Gallery
          </DialogPrimitive.Title>

          {/* Top Bar Header */}
          <div className="flex items-center justify-between gap-4 z-20">
            <div className="min-w-0 flex items-center gap-3">
              <span className="font-semibold text-sm sm:text-base text-white/90 truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
                {title}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80 shrink-0">
                {modalIndex + 1} / {count}
              </span>
            </div>

            <DialogPrimitive.Close
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/25 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close image viewer"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Main Stage (Swipable Fullscreen Carousel) */}
          <div className="relative flex-1 flex items-center justify-center my-2 overflow-hidden">
            <div ref={emblaRef} className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing">
              <div className="flex h-full touch-pan-y">
                {images.map((img, i) => (
                  <div
                    key={img.id || i}
                    className="relative h-full min-w-0 flex-[0_0_100%] flex items-center justify-center px-1 sm:px-4"
                  >
                    <img
                      src={img.url}
                      alt={img.alt ?? `${title} large photo ${i + 1}`}
                      className="max-h-[66vh] sm:max-h-[76vh] max-w-full w-auto object-contain rounded-xl shadow-2xl transition-transform duration-300 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Left & Right Arrow Buttons */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur hover:bg-black/80 hover:text-white border border-white/10 shadow-lg transition-transform active:scale-95 z-20 cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  aria-label="Next photo"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur hover:bg-black/80 hover:text-white border border-white/10 shadow-lg transition-transform active:scale-95 z-20 cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Synchronized Thumbnail Strip */}
          {count > 1 && (
            <div
              ref={thumbsRef}
              className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none max-w-full mx-auto z-20"
            >
              {images.map((img, i) => {
                const isActive = i === modalIndex;
                return (
                  <button
                    key={img.id || i}
                    ref={(el) => {
                      thumbItemsRef.current[i] = el;
                    }}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(i)}
                    aria-label={`Jump to photo ${i + 1}`}
                    className={cn(
                      "relative h-12 w-16 sm:h-16 sm:w-22 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer",
                      isActive
                        ? "border-white ring-2 ring-white/40 scale-105 opacity-100 shadow-md"
                        : "border-transparent opacity-40 hover:opacity-80"
                    )}
                  >
                    <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover pointer-events-none" />
                  </button>
                );
              })}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
