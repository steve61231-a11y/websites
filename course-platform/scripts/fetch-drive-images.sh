#!/usr/bin/env bash
# Download the images listed in a manifest (name<TAB>drive-file-id) from a
# Google Drive folder shared as "anyone with the link".
#
#   scripts/fetch-drive-images.sh content/drive/the-prod-images.tsv <out-folder>
#
# Needs drive.google.com and drive.usercontent.google.com allowed in the
# environment's network settings. Get the file ids with the Google Drive
# connector (search_files with parentId = '<folder id>').
set -euo pipefail
manifest="${1:?manifest}"; out="${2:?output folder}"
mkdir -p "$out"
while IFS=$'\t' read -r name id; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  curl -fsSL --retry 3 -o "$out/$name" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
  echo "✓ $name ($(wc -c < "$out/$name") bytes)"
done < "$manifest"
