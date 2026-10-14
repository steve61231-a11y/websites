import type { DefaultProps } from "../../types";

/**
 * `map-rise` default (everyone, server-rendered): Served counties fade in, Nairobi first ([data-reveal] with a stagger).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
