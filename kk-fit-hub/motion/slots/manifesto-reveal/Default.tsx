import type { DefaultProps } from "../../types";

/**
 * `manifesto-reveal` default (everyone, server-rendered): Fade up as the statement enters view ([data-reveal]).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
