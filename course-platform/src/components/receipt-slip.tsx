"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { ReceiptPrinter } from "@/components/receipt-printer";
import { brand, formatPrice } from "@/lib/catalog";
import { paidWith, receiptDate, type Receipt } from "@/lib/receipt";

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-[13px] font-bold" : ""}`}>
      <span className={strong ? "" : "text-[#161616]/55"}>{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

/** What prints on the paper. */
export function ReceiptSlip({ receipt: r }: { receipt: Receipt }) {
  const total = formatPrice(r.amount, r.currency);
  return (
    <ReceiptPrinter.Paper className="text-[11px] leading-[1.7]">
      <div className="flex flex-col items-center text-center">
        <Wordmark className="h-7 w-auto text-[#161616]" />
        <p className="mt-2 uppercase tracking-[0.18em]">{brand.organisation}</p>
        <p className="text-[#161616]/55">productphotography.co.ke</p>
      </div>
      <div className="my-4 border-t border-dashed border-[#161616]/25" />
      <Row k="Receipt" v={r.number} />
      <Row k="Date" v={receiptDate(r)} />
      <div className="my-4 border-t border-dashed border-[#161616]/25" />
      <p className="font-bold">{r.courseTitle}</p>
      {r.detail && <p className="text-[#161616]/55">{r.detail}</p>}
      <div className="flex justify-between">
        <span className="text-[#161616]/55">{r.courseId === "session" ? `1 × ${brand.session.minutes}-min session` : "1 × lifetime access"}</span>
        <span>{total}</span>
      </div>
      <div className="my-4 border-t border-dashed border-[#161616]/25" />
      <Row k="Total" v={total} strong />
      <Row k="Paid with" v={paidWith(r)} />
      <Row k="Ref" v={r.reference} />
      <div className="my-4 border-t border-dashed border-[#161616]/25" />
      <p className="text-center">Thank you, {r.name.split(" ")[0]}!</p>
      <svg viewBox="0 0 120 22" className="mx-auto mt-3 h-6 w-40" aria-hidden>
        {Array.from({ length: 46 }, (_, i) => {
          const w = [1, 2, 1, 3, 1, 2][(i * 7 + r.number.length) % 6];
          return <rect key={i} x={i * 2.6} y="0" width={w * 0.7} height="22" fill="#161616" />;
        })}
      </svg>
    </ReceiptPrinter.Paper>
  );
}
