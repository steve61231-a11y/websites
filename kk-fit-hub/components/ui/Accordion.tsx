import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type FaqItem = { q: string; a: ReactNode };

/** FAQ accordion built on <details>: keyboard and screen-reader friendly with
 * no JavaScript. */
export function Accordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[19px] font-semibold [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <ChevronDown
              aria-hidden="true"
              size={22}
              strokeWidth={1.5}
              className="shrink-0 transition-transform duration-(--dur-small) group-open:rotate-180"
            />
          </summary>
          <div className="measure pb-6 text-fg-2">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
