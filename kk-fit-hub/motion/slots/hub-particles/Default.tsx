import type { DefaultProps } from "../../types";

/**
 * `hub-particles` default (everyone, server-rendered): A grid of the seven activity glyphs; the active card's glyph highlights (HubStage).
 * The markup inside carries the default motion; this wrapper marks the slot
 * so the enhanced version can attach without changing layout.
 */
export default function Default({ children }: DefaultProps) {
  return <>{children}</>;
}
