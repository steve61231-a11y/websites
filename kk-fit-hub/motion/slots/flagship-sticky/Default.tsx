import type { DefaultProps } from "../../types";

/**
 * `flagship-sticky` default (everyone, server-rendered): Benefits fade up one by one ([data-reveal] with a stagger).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
