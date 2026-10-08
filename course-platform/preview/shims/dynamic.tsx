import { lazy, Suspense, type ComponentType } from "react";

// Stand-in for next/dynamic: lazy-load a component, client-side only.
export default function dynamic<P extends object>(load: () => Promise<{ default: ComponentType<P> }>, _opts?: { ssr?: boolean }) {
  void _opts;
  const Lazy = lazy(load);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
