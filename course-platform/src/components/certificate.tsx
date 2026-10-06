// The certificate template. Sized with container query units so it renders
// identically as a thumbnail, on screen, and when printed to PDF.

type Props = {
  name: string;
  course: string;
  instructor?: string;
  date?: string;
  number?: string;
};

export function Certificate({
  name,
  course,
  instructor = "Daniel Kiprono",
  date = "6 October 2026",
  number = "CERT-2026-PHOTO-000142",
}: Props) {
  return (
    <div className="@container w-full">
      <div className="relative aspect-[297/210] w-full overflow-hidden rounded-[1.2cqw] bg-[#fbf8f1] text-[#2b2620] print:rounded-none">
        {/* Paper texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.9),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(176,141,87,0.10),transparent_50%)]" />
        <div className="absolute inset-[2.6cqw] rounded-[0.6cqw] border-[0.18cqw] border-[#c9b07f]" />
        <div className="absolute inset-[3.2cqw] rounded-[0.4cqw] border-[0.08cqw] border-[#c9b07f]/60" />

        <div className="relative flex h-full flex-col items-center px-[9cqw] pb-[6.5cqw] pt-[7cqw] text-center">
          <div className="flex items-center gap-[0.8cqw] text-[1.9cqw] font-semibold tracking-[-0.02em]">
            <Emblem className="size-[2.4cqw]" />
            Lumen
          </div>
          <p className="mt-[3.2cqw] text-[1.25cqw] font-medium uppercase tracking-[0.42em] text-[#8a7350]">
            Certificate of Completion
          </p>
          <div className="flex flex-1 flex-col items-center justify-center pb-[2cqw]">
          <p className="text-[1.5cqw] text-[#6b6255]">This certifies that</p>
          <p className="mt-[0.6cqw] font-serif text-[6.4cqw] leading-[1.05] tracking-[-0.01em]">{name}</p>
          <div className="mt-[1.4cqw] h-px w-[34cqw] bg-[#c9b07f]/70" />
          <p className="mt-[1.8cqw] text-[1.5cqw] text-[#6b6255]">has successfully completed</p>
          <p className="mt-[0.6cqw] text-[2.4cqw] font-semibold tracking-[-0.02em]">{course}</p>
          </div>

          <div className="grid w-full grid-cols-3 items-end text-[1.15cqw] text-[#6b6255]">
            <div className="text-left">
              <p className="text-[1.5cqw] font-medium text-[#2b2620]">{date}</p>
              <div className="mt-[0.5cqw] h-px w-[16cqw] bg-[#2b2620]/25" />
              <p className="mt-[0.5cqw]">Date of completion</p>
            </div>
            <div className="flex justify-center">
              <Seal className="size-[10cqw]" />
            </div>
            <div className="text-right">
              <p className="font-serif text-[2.6cqw] italic leading-none text-[#2b2620]">{instructor}</p>
              <div className="ml-auto mt-[0.5cqw] h-px w-[16cqw] bg-[#2b2620]/25" />
              <p className="mt-[0.5cqw]">Instructor</p>
            </div>
          </div>
          <p className="absolute bottom-[3.9cqw] left-0 right-0 text-[0.95cqw] tracking-[0.08em] text-[#8a7350]">
            {number} · Verify at lumen.academy/verify
          </p>
        </div>
      </div>
    </div>
  );
}

export function CertificateMini({ name, course }: { name: string; course: string }) {
  return <Certificate name={name} course={course} />;
}

function Emblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6.5 16.8 9.25v5.5L12 17.5l-4.8-2.75v-5.5Z" fill="currentColor" />
    </svg>
  );
}

function Seal({ className }: { className?: string }) {
  const points = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r = i % 2 === 0 ? 48 : 44;
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9bf8c" />
          <stop offset="50%" stopColor="#b08d57" />
          <stop offset="100%" stopColor="#8e6b3a" />
        </linearGradient>
      </defs>
      <polygon points={points} fill="url(#seal-gold)" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#fbf8f1" strokeWidth="0.8" opacity="0.8" />
      <path d="M50 30 67.3 40v20L50 70 32.7 60V40Z" fill="none" stroke="#fbf8f1" strokeWidth="2" />
      <path d="M50 38 60.4 44v12L50 62 39.6 56V44Z" fill="#fbf8f1" opacity="0.9" />
    </svg>
  );
}
