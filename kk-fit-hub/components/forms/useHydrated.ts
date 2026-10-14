"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once the form is interactive. Submit buttons stay disabled until
 * then, so an early tap can't trigger a native (data-losing) submit. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
