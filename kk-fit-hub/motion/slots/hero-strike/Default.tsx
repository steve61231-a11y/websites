import type { DefaultProps } from "../../types";

/**
 * `hero-strike` default (everyone, server-rendered): Text rises in with 70 ms stagger; photo fades and settles from scale 1.04 (CSS .rise-in / .settle-in on the hero markup).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
