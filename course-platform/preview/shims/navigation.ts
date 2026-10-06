import { useMemo } from "react";
import { useRouterCtx } from "./router";

export function useRouter() {
  const { push, replace, back } = useRouterCtx();
  return { push, replace, back, refresh() {}, prefetch() {} };
}

export function usePathname() {
  return useRouterCtx().loc.path;
}

export function useSearchParams() {
  const { query } = useRouterCtx().loc;
  return useMemo(() => new URLSearchParams(query), [query]);
}

export class NotFoundError extends Error {}

export function notFound(): never {
  throw new NotFoundError("not found");
}
