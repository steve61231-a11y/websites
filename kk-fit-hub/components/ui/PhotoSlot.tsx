import Image from "next/image";
import type { Photo } from "@/content/media";
import { cn } from "@/lib/cn";

/**
 * A photo, or a plain dark placeholder until the photo exists (PRD 9).
 * The placeholder is decorative and hidden from assistive technology.
 */
export function PhotoSlot({
  photo,
  sizes,
  priority = false,
  className,
  imgClassName,
  rounded = true,
  fill = true,
}: {
  photo: Photo;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  rounded?: boolean;
  fill?: boolean;
}) {
  const radius = rounded ? "rounded-[28px]" : "";
  if (!photo.src) {
    return (
      <div
        aria-hidden="true"
        data-photo-placeholder={photo.id}
        className={cn(
          "relative overflow-hidden bg-ink-800",
          "bg-[radial-gradient(80%_60%_at_50%_30%,rgb(255_255_255/0.06),transparent_70%)]",
          radius,
          className,
        )}
      />
    );
  }
  return (
    <div className={cn("relative overflow-hidden", radius, className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        {...(fill ? { fill: true } : { width: photo.width, height: photo.height })}
        className={cn("object-cover", imgClassName)}
      />
    </div>
  );
}
