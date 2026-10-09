"use client";

import { useEffect, useState } from "react";
import type { CertificateField, CertificateTemplate } from "./types";

// Draws a student's certificate: the template image with their name, the
// completion date and the certificate number written on top. Runs in the
// browser for the instant on-screen certificate and download. The server
// version for the email attachment uses the same template config.

export type CertificateData = { name: string; date: string; number: string };

function fontFamily(kind: CertificateField["font"]) {
  const css = getComputedStyle(document.documentElement);
  if (kind === "display") return css.getPropertyValue("--font-montserrat").trim() || "Montserrat, Arial, sans-serif";
  if (kind === "sans") return css.getPropertyValue("--font-inter").trim() || "Inter, Arial, sans-serif";
  return 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load the certificate template: ${src}`));
    img.src = src;
  });
}

async function drawField(ctx: CanvasRenderingContext2D, t: CertificateTemplate, f: CertificateField, raw: string) {
  const text = f.uppercase ? raw.toUpperCase() : raw;
  const family = fontFamily(f.font);
  const weight = f.weight ?? 400;
  let px = f.size * t.width;
  const font = () => `${weight} ${px}px ${family}`;
  try {
    await document.fonts.load(font(), text);
  } catch {
    // A missing web font falls back to the next family in the list.
  }
  ctx.font = font();
  const spacing = () => ("letterSpacing" in ctx ? ((ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(f.tracking ?? 0) * px}px`) : null);
  spacing();
  if (f.maxWidth) {
    const max = f.maxWidth * t.width;
    const w = ctx.measureText(text).width;
    if (w > max) {
      px *= max / w;
      ctx.font = font();
      spacing();
    }
  }
  ctx.fillStyle = f.color;
  ctx.textAlign = f.align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, f.x * t.width, f.y * t.height);
}

export async function renderCertificate(t: CertificateTemplate, data: CertificateData) {
  const canvas = document.createElement("canvas");
  canvas.width = t.width;
  canvas.height = t.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(await loadImage(t.image), 0, 0, t.width, t.height);
  await drawField(ctx, t, t.fields.name, data.name);
  await drawField(ctx, t, t.fields.date, data.date);
  if (t.fields.number) await drawField(ctx, t, t.fields.number, data.number);
  return canvas;
}

export function formatCertificateDate(t: CertificateTemplate, iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", t.dateFormat ?? { day: "numeric", month: "long", year: "numeric" });
}

/** The rendered certificate as an image URL (and Blob, for downloading). */
export function useCertificateImage(t: CertificateTemplate | undefined, data: CertificateData | null) {
  const [out, setOut] = useState<{ url: string; blob: Blob; key: string } | null>(null);
  const key = t && data ? `${t.image}|${data.name}|${data.date}|${data.number}` : "";

  useEffect(() => {
    if (!t || !data) return;
    let cancelled = false;
    let url = "";
    renderCertificate(t, data)
      .then((canvas) => new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png")))
      .then((blob) => {
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setOut({ url, blob, key });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // `key` captures every input that changes the picture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return out && out.key === key ? out : null;
}
