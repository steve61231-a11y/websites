import type { DefaultProps } from "../../types";

/**
 * `process-line` default (everyone, server-rendered): Steps fade up; the connecting line is drawn in full.
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
