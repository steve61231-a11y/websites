"use client";

import { useRouter } from "next/navigation";
import { demo } from "@/lib/demo-store";

/** Demo only: wipe payment, sign-in and progress, and go back to the start. */
export function RestartDemo() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        demo.resetAll();
        router.push("/");
        window.scrollTo({ top: 0 });
      }}
      className="text-left text-faint underline-offset-4 transition-colors hover:text-white hover:underline"
    >
      Demo: restart from the beginning
    </button>
  );
}
