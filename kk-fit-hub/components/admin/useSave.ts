"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminResult } from "@/actions/admin";
import { useToast } from "./Toast";

/** Runs an admin action with a toast and a refresh. */
export function useSave() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const run = async (fn: () => Promise<AdminResult>, success: string) => {
    setPending(true);
    try {
      const res = await fn();
      if (!res.ok) toast({ message: res.error, tone: "error" });
      else {
        toast({ message: success });
        router.refresh();
      }
      return res;
    } finally {
      setPending(false);
    }
  };
  return { pending, run };
}
