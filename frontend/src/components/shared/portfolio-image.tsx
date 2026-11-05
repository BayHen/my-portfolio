"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function PortfolioImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  fallback,
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
