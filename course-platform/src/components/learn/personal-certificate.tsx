"use client";

import { motion } from "motion/react";
import type { CertificateTemplate } from "@/lib/types";

/**
 * A student's certificate. Shows the blank template straight away, then the
 * personalised render fades in over it once it's drawn.
 */
export function CertificateImage({ template, url, name, className = "" }: { template: CertificateTemplate; url?: string; name: string; className?: string }) {
  return (
    <div
      className={`theme-dark relative w-full overflow-hidden rounded-[1.4%] bg-[#070707] print:rounded-none ${className}`}
      style={{ aspectRatio: `${template.width} / ${template.height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={template.image} alt="" className="absolute inset-0 h-full w-full" />
      {url && (
        <motion.img
          key={url}
          src={url}
          alt={`Certificate of completion for ${name}`}
          className="absolute inset-0 h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        />
      )}
    </div>
  );
}

export function certificateFileName(name: string) {
  return `THE PROD certificate - ${name.replace(/[^\p{L}\p{N} .'-]/gu, "").trim() || "student"}.png`;
}
