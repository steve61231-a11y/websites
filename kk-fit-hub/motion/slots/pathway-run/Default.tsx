import type { DefaultProps } from "../../types";

/**
 * `pathway-run` default (everyone, server-rendered): Milestones fade up ([data-reveal]).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
