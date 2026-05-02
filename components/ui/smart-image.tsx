"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface SmartImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80";

export function SmartImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  ...props
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
