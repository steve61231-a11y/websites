import type { CSSProperties, ReactNode } from "react";
import { slotDefaults } from "./slots/defaults";
import type { SlotId } from "./types";

/**
 * A named motion slot (PRD 11.4). Renders the slot's Default on the server.
 * The enhanced version attaches to this container later without changing
 * its size, so supplied animation code drops in without restructuring.
 */
export function MotionSlot({
  id,
  children,
  className,
  style,
}: {
  id: SlotId;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const Default = slotDefaults[id];
  return (
    <div data-motion-slot={id} className={className} style={style}>
      <Default>{children}</Default>
    </div>
  );
}
