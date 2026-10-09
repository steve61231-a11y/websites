"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ComponentPropsWithoutRef, createContext, type ReactNode, useContext } from "react";

// A receipt printer that prints the payment receipt. Compose it from parts:
//
//   <ReceiptPrinter.Root stage="processing" | "printing" | "complete">
//     <ReceiptPrinter.Machine>
//       <ReceiptPrinter.Header>…</ReceiptPrinter.Header>
//       <ReceiptPrinter.Screen><ReceiptPrinter.Status /></ReceiptPrinter.Screen>
//     </ReceiptPrinter.Machine>
//     <ReceiptPrinter.Output><ReceiptPrinter.Paper>…</ReceiptPrinter.Paper></ReceiptPrinter.Output>
//   </ReceiptPrinter.Root>
//
// The machine and paper keep their own colours in both themes, like a real
// device. Textures are inline SVG (.printer-plastic, .receipt-paper in
// globals.css) so nothing extra has to load.

export type ReceiptPrinterStage = "processing" | "printing" | "complete";
export type ReceiptFeedMotion = "smooth" | "stepped";

type RootProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  /** Disables all stage transitions when false. */
  animate?: boolean;
  children: ReactNode;
  /** Paper feeds continuously ("smooth") or a line at a time ("stepped"). */
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
};

type StatusProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Custom status text. Defaults to a label for the current stage. */
  children?: ReactNode;
};

type Ctx = { animate: boolean; feedMotion: ReceiptFeedMotion; shouldMove: boolean; stage: ReceiptPrinterStage };
const PrinterContext = createContext<Ctx | null>(null);

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

// Torn edge along the bottom of the paper.
const TEETH = 40;
const TOOTH_DEPTH = 4;
const toothPoints = Array.from({ length: TEETH * 2 }, (_, i) => {
  const x = 100 - ((i + 1) * 100) / (TEETH * 2);
  const y = i % 2 === 0 ? "100%" : `calc(100% - ${TOOTH_DEPTH}px)`;
  return `${x}% ${y}`;
}).join(", ");
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${TOOTH_DEPTH}px), ${toothPoints})`;

// Line-by-line feed: move, pause, move, pause…
const feedKeyframes = [
  "translateY(calc(-100% + 2px))",
  "translateY(-91%)",
  "translateY(-91%)",
  "translateY(-81%)",
  "translateY(-81%)",
  "translateY(-70%)",
  "translateY(-70%)",
  "translateY(-58%)",
  "translateY(-58%)",
  "translateY(-45%)",
  "translateY(-45%)",
  "translateY(-32%)",
  "translateY(-32%)",
  "translateY(-20%)",
  "translateY(-20%)",
  "translateY(-10%)",
  "translateY(-10%)",
  "translateY(-3%)",
  "translateY(-3%)",
  "translateY(0%)",
];
const feedTimes = [0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6, 0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1];

const statusLabels: Record<ReceiptPrinterStage, ReactNode> = {
  processing: "Processing your order",
  printing: "Printing your receipt",
  complete: "Order complete",
};

function usePrinter(component: string) {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  return ctx;
}

function Root({ "aria-label": ariaLabel = "Receipt printer", animate = true, children, className, feedMotion = "stepped", stage, ...props }: RootProps) {
  const reduce = useReducedMotion();
  return (
    <PrinterContext.Provider value={{ animate, feedMotion, shouldMove: animate && !reduce, stage }}>
      <section aria-label={ariaLabel} className={clsx("relative isolate flex w-full max-w-sm flex-col items-center", className)} data-stage={stage} {...props}>
        {children}
      </section>
    </PrinterContext.Provider>
  );
}

function Machine({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "printer-plastic relative isolate w-full overflow-hidden rounded-[1.5rem] border border-[#0d0d0e] bg-[#242427] p-3 pb-8",
        "shadow-[0_20px_36px_-20px_rgba(0,0,0,0.55),0_6px_14px_-8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.55)]",
        className,
      )}
      {...props}
    >
      {children}
      {/* Paper slot */}
      <div aria-hidden className="absolute inset-x-6 bottom-3 z-40 h-2 rounded-[0.25rem] border border-[#050505] bg-[#050505] shadow-inner shadow-black" />
    </div>
  );
}

function Header({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={clsx("relative z-10 flex h-11 items-start justify-between", className)} {...props}>
      {children}
    </div>
  );
}

function Screen({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "relative isolate z-10 overflow-hidden rounded-[0.75rem] border border-[#050505] bg-[#0a0a0b] p-4 text-[#f2f2f2] shadow-inner shadow-black/80",
        "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:shadow-[inset_0_0_24px_4px_rgba(0,0,0,0.52)] after:content-['']",
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] animate-spin motion-reduce:animate-none" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#0a0a0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusIndicator({ animate, move, stage }: { animate: boolean; move: boolean; stage: ReceiptPrinterStage }) {
  const done = stage === "complete";
  const motionProps = {
    animate: { opacity: 1, transform: "scale(1)" },
    exit: { opacity: animate ? 0 : 1, transform: move ? "scale(0.96)" : "scale(1)" },
    initial: { opacity: animate ? 0 : 1, transform: move ? "scale(0.94)" : "scale(1)" },
    transition: { duration: animate ? 0.16 : 0, ease: easeOut },
  };
  return (
    <span aria-hidden className="relative grid size-5 shrink-0 place-items-center">
      <AnimatePresence initial={false} mode="sync">
        {done ? (
          <motion.span key="complete" className="col-start-1 row-start-1 grid place-items-center text-[#30d158]" {...motionProps}>
            <CheckCircle />
          </motion.span>
        ) : (
          <motion.span key="working" className="col-start-1 row-start-1 grid place-items-center text-[#8e8e93]" {...motionProps}>
            <Spinner />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function Status({ children, className, ...props }: StatusProps) {
  const { animate, shouldMove, stage } = usePrinter("ReceiptPrinter.Status");
  const label = children ?? statusLabels[stage];
  return (
    <div className={clsx("flex min-w-0 items-center gap-2", className)} {...props}>
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div aria-live="polite" role="status" className="grid min-w-0 flex-1 items-center">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={typeof label === "string" ? label : stage}
            className="col-start-1 row-start-1 truncate text-xs font-medium leading-none text-[#a1a1a6]"
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: animate ? 0 : 1, transform: shouldMove ? "translateY(-4px)" : "translateY(0px)" }}
            initial={{ opacity: animate ? 0 : 1, transform: shouldMove ? "translateY(4px)" : "translateY(0px)" }}
            transition={{ duration: animate ? 0.18 : 0, ease: easeOut }}
          >
            {label}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Paper({ children, className, style, ...props }: ComponentPropsWithoutRef<"article">) {
  return (
    <article
      className={clsx("receipt-paper relative z-10 min-h-80 bg-[#fbfaf6] px-6 pb-8 pt-7 font-mono text-[#161616]", className)}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {children}
    </article>
  );
}

function Output({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  const { animate, feedMotion, shouldMove, stage } = usePrinter("ReceiptPrinter.Output");
  const visible = stage !== "processing";
  const stepped = feedMotion === "stepped" && stage === "printing" && shouldMove;
  return (
    <div className={clsx("relative z-50 -mt-4 h-[32rem] w-[calc(80%+3rem)] max-w-full overflow-hidden px-6", className)} {...props}>
      {visible ? <div aria-hidden className="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-black/75 blur-[6px]" /> : null}
      <motion.div
        initial={false}
        aria-hidden={stage !== "complete"}
        animate={{
          opacity: visible ? 1 : 0,
          transform:
            stage === "printing" && shouldMove
              ? stepped
                ? feedKeyframes
                : "translateY(0%)"
              : visible || !shouldMove
                ? "translateY(0%)"
                : "translateY(calc(-100% + 2px))",
        }}
        transition={{
          opacity: { duration: animate ? 0.16 : 0, ease: easeOut },
          transform: { duration: shouldMove ? 1.75 : 0, ease: stepped ? "linear" : easeInOut, times: stepped ? feedTimes : undefined },
        }}
        className="relative isolate before:pointer-events-none before:absolute before:inset-x-3 before:bottom-4 before:top-3 before:z-0 before:rounded-sm before:shadow-[0_8px_24px_rgba(0,0,0,0.24)] before:content-[''] after:pointer-events-none after:absolute after:bottom-0 after:left-[8%] after:right-[8%] after:z-0 after:h-3 after:translate-y-1.5 after:rounded-full after:bg-black/10 after:blur-lg after:content-['']"
      >
        {children}
      </motion.div>
    </div>
  );
}

export const ReceiptPrinter = { Header, Machine, Output, Paper, Root, Screen, Status };
