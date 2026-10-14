import { CalendarClock, Handshake, Phone, Sparkles } from "lucide-react";
import type { Step } from "@/content/home";
import { MotionSlot } from "@/motion/MotionSlot";

const icons = [Handshake, CalendarClock, Sparkles, Phone];

/** "What every school can count on" cards (PRD 6.8): 2 × 2 on desktop. */
export function ExpectCards({ cards }: { cards: Step[] }) {
  return (
    <MotionSlot id="expect-cards">
      <ul className="grid gap-4 md:grid-cols-2 lg:gap-6">
        {cards.map((c, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li
              key={c.title}
              data-reveal
              data-expect-card
              style={{ "--i": i } as React.CSSProperties}
              className="rounded-[24px] border border-hairline bg-surface p-6 transition-transform duration-(--dur-micro) active:scale-[0.98] lg:p-8"
            >
              <Icon aria-hidden="true" size={24} strokeWidth={1.5} className="text-accent-text" />
              <h3 className="mt-6 type-h3">{c.title}</h3>
              <p className="mt-2 text-fg-2">{c.body}</p>
            </li>
          );
        })}
      </ul>
    </MotionSlot>
  );
}
