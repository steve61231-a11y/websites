import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { brand } from "@/lib/catalog";

/**
 * Split layout for checkout and sign-in: the form on one side, a studio shot
 * on the other that pulls into focus as the page opens. On phones the photo
 * becomes a short band above the form.
 */
export function AuthShell({ image, caption, children }: { image: string; caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-black lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative h-[30svh] min-h-52 overflow-hidden lg:order-2 lg:m-3 lg:h-auto lg:rounded-[32px]">
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full animate-[focus-pull_2.2s_cubic-bezier(0.16,1,0.3,1)_both] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent lg:from-black/80" />
        {caption && <div className="absolute inset-x-0 bottom-0 hidden p-12 lg:block">{caption}</div>}
      </aside>

      <div className="relative flex flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-12 lg:px-16">
        <header className="flex h-20 items-center">
          <Link href="/" aria-label="THE PROD home" className="text-white">
            <Wordmark className="h-7 w-auto" />
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center py-6 lg:items-center">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
        <footer className="flex flex-col gap-1 text-[12px] text-faint sm:flex-row sm:justify-between">
          <span className="select-all">{brand.email}</span>
          <span>© {brand.organisation}</span>
        </footer>
      </div>
    </div>
  );
}
