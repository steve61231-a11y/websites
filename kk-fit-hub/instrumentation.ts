import type { Instrumentation } from "next";

/**
 * Monitoring hook (PRD 17 phase 5): every server error is logged as one
 * structured line, which Vercel's log drains and alerts can pick up. Swap in
 * an error tracker here if one is added later.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const e = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      kind: "request_error",
      message: e.message,
      digest: e.digest,
      path: request.path,
      method: request.method,
      routeType: context.routeType,
      routePath: context.routePath,
    }),
  );
};
