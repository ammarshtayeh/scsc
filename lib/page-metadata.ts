import type { Metadata } from "next";

const DEFAULT_OG_IMAGE = "/opengraph-image";

function pickShareImage(image?: string | null) {
  return image && /^https:\/\//i.test(image) ? image : DEFAULT_OG_IMAGE;
}

function clip(text: string | undefined, max = 180) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  type = "website"
}: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const summary = clip(description);
  const shareImage = pickShareImage(image);

  return {
    title,
    description: summary || undefined,
    alternates: { canonical: path },
    openGraph: {
      type,
      title,
      description: summary || undefined,
      url: path,
      images: [shareImage]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary || undefined,
      images: [shareImage]
    }
  };
}
