// The invisible A/B fingerprint pattern, shared by package.ts (adds it) and
// trace-leak.ts (reads it back) so both use exactly the same shape.
//
// Variant a adds it to the brightness (luma) only, variant b subtracts it:
//   AMP * cos(2πu) * cos(2πv) * sin²(πt / 6)
// u, v run 0..1 across the frame, so it is one soft bright/dark swell per
// quarter of the picture. The sin² window is zero at every 6-second segment
// boundary, so switching between a and b never makes a visible jump.

import { SEGMENT_SECONDS } from "../../src/lib/video/derive.ts";

/** Spatial shape at pixel-centre coordinates u, v in 0..1. */
export function patternAt(u: number, v: number) {
  return Math.cos(2 * Math.PI * u) * Math.cos(2 * Math.PI * v);
}

/** Time window, 0 at each segment boundary and 1 in the middle. */
export function windowAt(t: number) {
  return Math.sin((Math.PI * t) / SEGMENT_SECONDS) ** 2;
}

/** The pattern as an ffmpeg geq expression centred on 128 (for blend
 *  grainmerge / grainextract). sin²(πt/6) is written (1-cos(2πt/6))/2 so the
 *  expression has no commas to escape. +0.5 rounds instead of truncating. */
export function geqExpression(amp: number) {
  return `128.5+${amp}*cos(2*PI*(X+0.5)/W)*cos(2*PI*(Y+0.5)/H)*(1-cos(2*PI*T/${SEGMENT_SECONDS}))/2`;
}
