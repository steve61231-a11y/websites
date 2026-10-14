import type { DefaultProps } from "../../types";

/**
 * `founder-counters` default (everyone, server-rendered): Numbers count up once over 1.2 s (CountUp); final numbers are server-rendered.
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
