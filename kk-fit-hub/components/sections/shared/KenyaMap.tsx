import map from "@/content/kenya-map.json";
import { MotionSlot } from "@/motion/MotionSlot";

/**
 * Simplified county map (PRD 6.11): served counties filled green, the rest as
 * hairlines. Decorative: the county list beside it carries the meaning.
 */
export function KenyaMap({ served }: { served: string[] }) {
  const servedSet = new Map(served.map((name, i) => [name.toLowerCase(), i]));
  // Nairobi first, then the order in settings.
  const order = (name: string) => {
    const i = servedSet.get(name.toLowerCase()) ?? 0;
    return name.toLowerCase() === "nairobi" ? -1 : i;
  };
  const counties = [...map.counties].sort(
    (a, b) => Number(servedSet.has(a.name.toLowerCase())) - Number(servedSet.has(b.name.toLowerCase())),
  );

  return (
    <MotionSlot id="map-rise">
      <svg viewBox={map.viewBox} className="h-auto w-full" aria-hidden="true" focusable="false">
        {counties.map((c) => {
          const isServed = servedSet.has(c.name.toLowerCase());
          return (
            <path
              key={c.name}
              d={c.d}
              data-county={c.name}
              data-served={isServed ? "" : undefined}
              {...(isServed
                ? {
                    "data-reveal": "",
                    style: { "--i": order(c.name) + 1 } as React.CSSProperties,
                  }
                : {})}
              fill={isServed ? "var(--green-600)" : "transparent"}
              stroke={isServed ? "var(--paper)" : "var(--text-3)"}
              strokeWidth={isServed ? 0.8 : 0.5}
              strokeOpacity={isServed ? 1 : 0.55}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </MotionSlot>
  );
}
