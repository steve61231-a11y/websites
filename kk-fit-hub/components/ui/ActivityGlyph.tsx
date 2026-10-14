import type { GlyphId } from "@/content/activities";
import { glyphShapes } from "@/content/glyphs";

/** Activity glyph (decorative; the activity name is always shown as text). */
export function ActivityGlyph({
  id,
  size = 24,
  strokeWidth = 1.5,
  className,
}: {
  id: GlyphId;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {glyphShapes[id].map((s, i) => {
        if (s.kind === "path") return <path key={i} d={s.d} />;
        if (s.kind === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
        return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />;
      })}
    </svg>
  );
}
