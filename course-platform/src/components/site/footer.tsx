import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-black pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="wrap grid gap-12 pt-20 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="max-w-xs text-[15px] leading-relaxed text-muted">
            {brand.subtitle}. A course by {brand.organisation}, Nairobi.
          </p>
        </div>
        <div className="space-y-3 text-[14px]">
          <p className="eyebrow !text-faint">Course</p>
          <Link href="/#course" className="block text-ink-2 hover:text-white">Curriculum</Link>
          <Link href="/sign-in" className="block text-ink-2 hover:text-white">Sign in</Link>
          <Link href="/verify" className="block text-ink-2 hover:text-white">Verify a certificate</Link>
        </div>
        <div className="space-y-3 text-[14px]">
          <p className="eyebrow !text-faint">Contact</p>
          <p className="select-all text-ink-2">{brand.email}</p>
          <p className="select-all text-ink-2">WhatsApp {brand.whatsapp}</p>
          <a href={brand.website} className="block text-ink-2 hover:text-white" target="_blank" rel="noreferrer">productphotography.co.ke</a>
        </div>
      </div>
      {/* Oversized sign-off wordmark */}
      <div className="wrap mt-16">
        <Wordmark className="w-full text-white/[0.07]" />
      </div>
      <div className="wrap mt-6 flex flex-col gap-2 text-[12px] text-faint sm:flex-row sm:justify-between">
        <p>© 2026 {brand.organisation}</p>
        <p>Payments secured by Paystack</p>
      </div>
    </footer>
  );
}
