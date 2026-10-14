import { Check, Clock } from "lucide-react";
import type { ActivityStatus } from "@/content/activities";
import { statusLabel } from "@/content/activities";
import { cn } from "@/lib/cn";

/** Status chip: always text plus icon; colour never carries meaning alone
 * (PRD 10.1, 10.7). Reads the section theme for its dark equivalent. */
export function StatusChip({
  status,
  className,
}: {
  status: Exclude<ActivityStatus, "hidden">;
  className?: string;
}) {
  if (status === "available") {
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-full bg-(--chip-ok-bg) px-3 text-[14px] font-semibold text-(--chip-ok-fg)",
          className,
        )}
      >
        <Check aria-hidden="true" size={16} strokeWidth={2} />
        {statusLabel.available}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border border-hairline px-3 text-[14px] font-semibold text-fg-2",
        className,
      )}
    >
      <Clock aria-hidden="true" size={16} strokeWidth={1.75} />
      {statusLabel.soon}
    </span>
  );
}

/** Plain pill chip, e.g. "Now recruiting" disciplines and filter chips. */
export const chipClass =
  "press inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline bg-surface px-5 text-[16px] font-semibold text-fg " +
  "hover:border-current";
