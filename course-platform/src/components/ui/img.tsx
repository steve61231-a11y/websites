"use client";

import type { ComponentPropsWithoutRef } from "react";

/**
 * An <img> that fades in once it has loaded rather than painting in strips.
 * Cached images (already complete before hydration) show at once.
 */
export function Img({ className = "", alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={alt}
      decoding="async"
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0) el.dataset.loaded = "";
      }}
      onLoad={(e) => {
        e.currentTarget.dataset.loaded = "";
        props.onLoad?.(e);
      }}
      className={`img-fade ${className}`}
    />
  );
}
