#!/usr/bin/env bash
# Grab one frame from each video to use as its thumbnail.
#
#   scripts/grab-frames.sh <videos-folder> <out-folder> [seconds]   (default 8 s in)
#
# Videos must start with their number ("2.3 - Camera Sensor.mp4"); each frame
# is saved as <out-folder>/2.3.jpg. Then run:
#   node scripts/import-thumbnails.mjs <out-folder>
# To pick a better moment for one video, re-run ffmpeg by hand:
#   ffmpeg -ss 00:01:05 -i "2.3 - Camera Sensor.mp4" -frames:v 1 -q:v 2 out/2.3.jpg
set -euo pipefail
src="${1:?videos folder}"; out="${2:?output folder}"; at="${3:-8}"
mkdir -p "$out"
shopt -s nullglob nocaseglob
for f in "$src"/*.{mp4,mov,m4v,mkv,webm}; do
  name="$(basename "$f")"
  code="$(echo "$name" | grep -oE '^[0-9]+\.[0-9]+' || true)"
  if [[ -z "$code" ]]; then echo "skip $name (no number at the start)"; continue; fi
  ffmpeg -loglevel error -y -ss "$at" -i "$f" -frames:v 1 -q:v 2 "$out/$code.jpg"
  echo "$name → $out/$code.jpg"
done
