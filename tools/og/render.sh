#!/usr/bin/env bash
# Renders the OG image and PNG icons from HTML with headless Chrome.
# Usage: tools/og/render.sh   (needs google-chrome or chromium on PATH)
set -euo pipefail
cd "$(dirname "$0")"
CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
OUT=../../artifacts/portfolio/public
TMP=$(mktemp -d)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox --user-data-dir="$TMP" \
  --window-size=1200,630 --screenshot="$OUT/og.png" "file://$PWD/og.html" 2>/dev/null
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox --user-data-dir="$TMP" \
  --window-size=180,180 --default-background-color=00000000 --screenshot="$OUT/apple-touch-icon.png" "file://$PWD/icon.html" 2>/dev/null
rm -rf "$TMP"
echo "wrote $OUT/og.png and $OUT/apple-touch-icon.png"
