"use client";

/** Admin error boundary: keeps the shell and offers a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-[20px] border border-hairline bg-paper p-6">
      <h1 className="text-[28px] font-bold">Something went wrong</h1>
      <p className="mt-2 text-text-2">{error.digest ? `Reference ${error.digest}. ` : ""}Try again, or reload the page.</p>
      <button type="button" onClick={reset} className="mt-4 min-h-11 rounded-full bg-ink-900 px-5 font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
