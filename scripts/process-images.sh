#!/usr/bin/env bash
# process-images.sh — crop/optimize raw art dropped in incoming/ into the exact
# public/ asset names the app expects. Safe to re-run.
#
# Character images: trim transparent/solid padding around the subject,
#   scale to max 1024px on the longest edge, PNG.
# World backgrounds: scale to 1920px wide, mild sharpen, WebP q82.
#
# Filename detection: file must contain a milestone tag (l1, l2, l5, l7, l10,
# l15, l20, l30) AND a kind marker ("char"/"character" or "world"/"bg"/"background").
# Examples it understands: character-l15.png, char_l10 final.jpg, WORLD_L30.webp,
# bg-l5.png. Ambiguous files are reported and skipped.

set -euo pipefail
cd "$(dirname "$0")/.."

IN="incoming"
mkdir -p "$IN" "public/character" "public/world"

log() { printf '%s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }

detect() {
  # $1 = filename -> echoes "char|<level>" / "world|<level>" / "" (ambiguous)
  local base level kind
  base="$(basename "$1")"; base="${base%.*}"
  if printf '%s' "$base" | grep -qiE 'char'; then kind="char"
  elif printf '%s' "$base" | grep -qiE 'world|bg|background'; then kind="world"
  else echo ""; return; fi
  if   printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l30([^0-9a-z]|$)'; then level=30
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l20([^0-9a-z]|$)'; then level=20
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l15([^0-9a-z]|$)'; then level=15
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l10([^0-9a-z]|$)'; then level=10
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l7([^0-9a-z]|$)';  then level=7
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l5([^0-9a-z]|$)';  then level=5
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l2([^0-9a-z]|$)';  then level=2
  elif printf '%s' "$base" | grep -qiE '(^|[^0-9a-z])l1([^0-9a-z]|$)';  then level=1
  else echo ""; return; fi
  echo "$kind|$level"
}

process_char() {
  local src="$1" level="$2"
  local dst="public/character/character-l${level}.png"
  log "  CHAR  l${level}: $(basename "$src") -> ${dst}"
  magick "$src" -trim +repage -resize '1024x1024>' \
    -define png:compression-level=9 "$dst"
}

process_world() {
  local src="$1" level="$2"
  local dst="public/world/world-l${level}.webp"
  log "  WORLD l${level}: $(basename "$src") -> ${dst}"
  magick "$src" -resize '1920x' -unsharp 0x0.75+0.75+0.008 \
    -quality 82 "$dst"
}

log "Processing raw art from ${IN}/ ..."
count=0
for f in "$IN"/*; do
  [[ -e "$f" ]] || continue
  [[ -f "$f" ]] || continue
  [[ "$f" == *README.txt ]] && continue
  magick identify -quiet "$f" >/dev/null 2>&1 || { warn "skip non-image: $(basename "$f")"; continue; }

  detected="$(detect "$f")"
  if [[ -z "$detected" ]]; then
    warn "ambiguous name (need char/world marker + lN tag): $(basename "$f")"
    continue
  fi
  kind="${detected%%|*}"; level="${detected##*|}"
  if [[ "$kind" == "char" ]]; then process_char "$f" "$level"; else process_world "$f" "$level"; fi
  count=$((count+1))
done

log "Done. ${count} file(s) processed."
[[ $count -eq 0 ]] && log "Nothing to do. Drop images into ${IN}/ and re-run: bash scripts/process-images.sh"
exit 0
