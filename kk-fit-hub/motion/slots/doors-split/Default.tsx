import type { DefaultProps } from "../../types";

/**
 * `doors-split` default (everyone, server-rendered): Panels fade up ([data-reveal]).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
