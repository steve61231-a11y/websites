import type { DefaultProps } from "../../types";

/**
 * `expect-cards` default (everyone, server-rendered): Cards fade up; touch press scales to 0.98 (CSS).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
