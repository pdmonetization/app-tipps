#!/usr/bin/env bash
# Pull the 994 images still referenced by live articles out of the old VM.
# Run this on your machine, or on the VM and rsync the result down.
set -euo pipefail
DEST="${1:-./public/images}"
mkdir -p "$DEST"
fail=0
while IFS= read -r p; do
  mkdir -p "$DEST/$(dirname "$p")"
  if ! curl -fsS --retry 2 -o "$DEST/$p" "https://app-tipps.com/wp-content/uploads/$p"; then
    echo "MISSING: $p" >&2; fail=$((fail+1))
  fi
done < images.txt
echo "done. missing: $fail"
