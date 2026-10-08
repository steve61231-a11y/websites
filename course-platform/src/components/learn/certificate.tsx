import { Wordmark } from "@/components/brand/wordmark";
import { brand, course } from "@/lib/catalog";

// The certificate, sized in container units so it renders the same as a
// thumbnail, full screen, or a printed A4 page.

export function Certificate({ name, date, number }: { name: string; date: string; number: string }) {
  return (
    <div className="@container w-full">
      <div className="relative aspect-[297/210] w-full overflow-hidden rounded-[1.4cqw] bg-[#070707] text-white print:rounded-none">
        <div className="absolute -right-[20cqw] -top-[30cqw] size-[70cqw] rounded-full bg-[radial-gradient(circle,rgba(194,106,18,0.32),transparent_62%)]" />
        <div className="absolute -bottom-[40cqw] -left-[20cqw] size-[70cqw] rounded-full bg-[radial-gradient(circle,rgba(194,106,18,0.14),transparent_62%)]" />
        <div className="absolute inset-[2.6cqw] rounded-[0.8cqw] border-[0.12cqw] border-amber/50" />

        <div className="relative flex h-full flex-col px-[8cqw] pb-[6cqw] pt-[7cqw]">
          <div className="flex items-start justify-between">
            <Wordmark className="h-auto w-[18cqw]" />
            <p className="text-right font-[family-name:var(--font-display)] text-[1.15cqw] font-bold uppercase tracking-[0.32em] text-amber">
              Certificate
              <br />
              of completion
            </p>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <p className="text-[1.6cqw] text-white/55">This certifies that</p>
            <p className="mt-[1cqw] font-[family-name:var(--font-display)] text-[6.2cqw] font-bold leading-[1.02] tracking-[-0.035em]">{name}</p>
            <p className="mt-[1.8cqw] max-w-[60cqw] text-[1.7cqw] leading-relaxed text-white/70">
              has completed <span className="font-semibold text-white">{course.title}</span>, the seven-day course by {brand.organisation},
              and passed every assessment.
            </p>
          </div>

          <div className="grid grid-cols-3 items-end gap-[3cqw] text-[1.2cqw] text-white/55">
            <div>
              <p className="text-[1.6cqw] font-semibold text-white">{date}</p>
              <div className="mt-[0.6cqw] h-px bg-white/20" />
              <p className="mt-[0.6cqw]">Date</p>
            </div>
            <div>
              <p className="text-[1.6cqw] font-semibold text-white">{course.instructor.name}</p>
              <div className="mt-[0.6cqw] h-px bg-white/20" />
              <p className="mt-[0.6cqw]">Instructor</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[1.35cqw] text-white">{number}</p>
              <div className="mt-[0.6cqw] h-px bg-white/20" />
              <p className="mt-[0.6cqw]">Verify at productphotography.co.ke/verify</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
