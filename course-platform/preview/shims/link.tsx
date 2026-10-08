import type { AnchorHTMLAttributes } from "react";
import { useRouterCtx } from "./router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

export default function Link({ href, onClick, prefetch, ...rest }: Props) {
  void prefetch;
  const { push } = useRouterCtx();
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        if (/^https?:/.test(href)) return;
        e.preventDefault();
        push(href);
      }}
    />
  );
}
