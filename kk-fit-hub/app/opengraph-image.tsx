import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { photos } from "@/content/media";
import { brand } from "@/content/site";

/** Open Graph image (PRD 16.2): the strike cutout on ink, the headline and the
 * wordmark, 1200 × 630. Until the cutout exists, the stage glow stands in. */
export const alt = "KK Fit Hub. Beyond the books.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const strike = photos["kennedy-strike"];
  let photo: string | null = null;
  if (strike.src) {
    const file = await readFile(path.join(process.cwd(), "public", strike.src));
    const mime = strike.src.endsWith(".png") ? "image/png" : strike.src.endsWith(".webp") ? "image/webp" : "image/jpeg";
    photo = `data:${mime};base64,${file.toString("base64")}`;
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(60% 70% at 75% 65%, rgba(58,166,85,0.35), rgba(11,11,12,0) 70%), radial-gradient(18% 22% at 58% 42%, rgba(228,87,46,0.35), rgba(11,11,12,0) 70%), #0b0b0c",
          color: "#f2f2f0",
          fontFamily: "sans-serif",
        }}
      >
        {photo && (
          <img src={photo} alt="" style={{ position: "absolute", right: 0, bottom: 0, height: 630, objectFit: "contain" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, width: 720 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1.2 }}>
            <span style={{ color: "#3aa655" }}>KK</span>
            <span>&nbsp;Fit Hub</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>Beyond the books.</div>
            <div style={{ fontSize: 30, color: "#a1a1a6", marginTop: 28, lineHeight: 1.3 }}>{brand.line}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
