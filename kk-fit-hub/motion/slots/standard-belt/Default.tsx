import type { DefaultProps } from "../../types";

/**
 * `standard-belt` default (everyone, server-rendered): Segments appear in order on entering view ([data-reveal] with a stagger).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
