"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Activity } from "@/content/activities";
import { programmesPage } from "@/content/pages";
import { cn } from "@/lib/cn";
import { ProgrammeCard } from "@/components/sections/shared/ProgrammeCard";

type Filter = (typeof programmesPage.filters)[number]["id"];

/** Filter chips (real radios underneath) and the programme grid (PRD 7.1).
 * The filter updates ?status= in place. */
export function ProgrammeGrid({ activities }: { activities: Activity[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get("status");
  const filter: Filter = raw === "available" || raw === "soon" ? raw : "all";

  const setFilter = (next: Filter) => {
    const q = new URLSearchParams(params.toString());
    if (next === "all") q.delete("status");
    else q.set("status", next);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return <GridView activities={activities} filter={filter} onChange={setFilter} />;
}

/** Server fallback before search params are known: the full grid, same layout. */
export function ProgrammeGridFallback({ activities }: { activities: Activity[] }) {
  return <GridView activities={activities} filter="all" />;
}

function GridView({
  activities,
  filter,
  onChange,
}: {
  activities: Activity[];
  filter: Filter;
  onChange?: (f: Filter) => void;
}) {
  const shown = activities.filter((a) => filter === "all" || a.status === filter);
  return (
    <>
      <fieldset className="mt-10">
        <legend className="sr-only">Show programmes</legend>
        <div className="flex flex-wrap gap-2">
          {programmesPage.filters.map((f) => (
            <label key={f.id} className="relative">
              <input
                type="radio"
                name="status"
                value={f.id}
                checked={filter === f.id}
                onChange={() => onChange?.(f.id)}
                readOnly={!onChange}
                data-cta={`filter-${f.id}`}
                className="peer absolute inset-0 cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  "press inline-flex min-h-11 items-center rounded-full border px-5 text-[16px] font-semibold",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus)",
                  filter === f.id ? "border-text bg-text text-canvas" : "border-hairline bg-surface text-fg",
                )}
              >
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="sr-only" aria-live="polite">
        {shown.length} programmes shown
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {shown.map((a) => (
          <li key={a.slug}>
            <ProgrammeCard activity={a} />
          </li>
        ))}
      </ul>
    </>
  );
}
