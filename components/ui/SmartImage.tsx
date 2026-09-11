"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | null | undefined;
  alt?: string;
  /** Fallback when src missing or image errors. */
  fallback?: React.ReactNode;
};

function isLocalSrc(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

function shouldUnoptimize(src: string) {
  if (isLocalSrc(src)) return false;
  try {
    const host = new URL(src).hostname.toLowerCase();
    // Hosts configured in next.config images.remotePatterns
    if (
      host.includes("susercontent.com") ||
      host.includes("shopee.") ||
      host.endsWith("googleusercontent.com")
    ) {
      return false;
    }
  } catch {
    return true;
  }
  // Unknown remotes — avoid next/image domain errors.
  return true;
}

/**
 * next/image wrapper with safe fallback for unknown remote hosts.
 */
export function SmartImage({
  src,
  alt = "",
  fallback = null,
  className,
  onError,
  ...rest
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  const unoptimized = shouldUnoptimize(src);

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      unoptimized={unoptimized}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
