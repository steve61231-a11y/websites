"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { inputSm } from "./ui";

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

/** Filters and search kept in the URL, so views can be shared and exported. */
export function FilterBar({ filters, searchLabel }: { filters: FilterDef[]; searchLabel: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", q.trim());
        }}
        className="flex gap-2"
      >
        <label htmlFor="admin-search" className="sr-only">
          {searchLabel}
        </label>
        <input
          id="admin-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchLabel}
          className={`${inputSm} min-w-0 flex-1`}
        />
        <button type="submit" className="press grid min-h-11 w-11 place-items-center rounded-xl bg-ink-900 text-white" aria-label="Search">
          <Search aria-hidden="true" size={18} />
        </button>
      </form>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
        {filters.map((f) => (
          <label key={f.name} className="shrink-0">
            <span className="sr-only">{f.label}</span>
            <select
              value={params.get(f.name) ?? ""}
              onChange={(e) => set(f.name, e.target.value)}
              className={`${inputSm} pr-8`}
            >
              <option value="">{f.label}: all</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
