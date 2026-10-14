import { MapPin } from "lucide-react";
import { whereWeWork } from "@/content/home";
import { TextLink } from "@/components/ui/Button";
import { SectionShell } from "@/components/site/SectionShell";
import { KenyaMap } from "@/components/sections/shared/KenyaMap";

/** 6.11 Where we work (CONFIRM Homa Bay). */
export function WhereWeWork({ counties }: { counties: string[] }) {
  return (
    <SectionShell theme="light" aria-labelledby="where-title">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <h2 id="where-title" className="type-display-l">
            {whereWeWork.h2(counties.length)}
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-[19px] font-semibold">
            {counties.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={20} strokeWidth={1.5} className="text-green-700" />
                {c}
              </li>
            ))}
          </ul>
          <TextLink href={whereWeWork.link.href} cta={whereWeWork.link.cta} className="mt-8">
            {whereWeWork.link.label}
          </TextLink>
        </div>
        <div className="mx-auto w-full max-w-[460px] lg:col-span-6 lg:col-start-7">
          <KenyaMap served={counties} />
        </div>
      </div>
    </SectionShell>
  );
}
