export const SITE_URL = "https://opmotors.vercel.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * Ensures any image URL (relative or absolute) is formatted as an absolute HTTPS URL
 * required by social platforms (WhatsApp, iMessage, Facebook, Twitter/X, LinkedIn, Slack, etc.).
 */
export function toAbsoluteImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return DEFAULT_OG_IMAGE;
  }
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  const cleanPath = clean.startsWith("/") ? clean : `/${clean}`;
  return `${SITE_URL}${cleanPath}`;
}

export interface MetaTagOptions {
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
  url?: string;
  type?: "website" | "article" | "product";
}

/**
 * Generates comprehensive Open Graph and Twitter Card meta tags with absolute image URLs.
 */
export function buildMetaTags({
  title,
  description,
  image,
  imageAlt,
  url,
  type = "website",
}: MetaTagOptions) {
  const absoluteImage = toAbsoluteImageUrl(image);
  const absoluteUrl = url
    ? url.startsWith("http")
      ? url
      : `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`
    : SITE_URL;
  const altText = imageAlt || title;

  return [
    { title },
    { name: "description", content: description },
    // Open Graph standard tags
    { property: "og:site_name", content: "OP Motors" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: absoluteUrl },
    { property: "og:image", content: absoluteImage },
    { property: "og:image:secure_url", content: absoluteImage },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: altText },
    // Twitter Card standard tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: absoluteImage },
    { name: "twitter:image:alt", content: altText },
  ];
}
