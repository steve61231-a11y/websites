import Link from "next/link";
import type { Activity } from "@/content/activities";
import { ActivityGlyph } from "@/components/ui/ActivityGlyph";
import { StatusChip } from "@/components/ui/Chip";

/** Programme card (PRD 7.1): the whole card is the link. */
export function ProgrammeCard({ activity, cta = "programme-card" }: { activity: Activity; cta?: string }) {
  return (
    <Link
      href={`/programmes/${activity.slug}`}
      data-cta={cta}
      data-cursor-label="View"
      className="press flex h-full flex-col rounded-[24px] border border-hairline bg-surface p-6 hover:border-green-600/40 lg:p-7"
    >
      <span className="flex items-start justify-between gap-3">
        <ActivityGlyph id={activity.glyph} size={32} className="text-accent-text" />
        {activity.status !== "hidden" && <StatusChip status={activity.status} />}
      </span>
      <span className="mt-8 type-h3">{activity.name}</span>
      <span className="mt-2 text-fg-2">{activity.oneLiner}</span>
      {activity.ageRange && <span className="mt-3 type-small text-fg-3">{activity.ageRange}</span>}
      <span className="mt-auto pt-8 font-semibold text-accent-text">
        {activity.status === "available" ? "Explore" : "Register interest"} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
