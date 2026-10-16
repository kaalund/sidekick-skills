#!/bin/sh
# design-memory status line segment. Reads Claude Code's status JSON on stdin (optional),
# finds the nearest .design-memory.state (or, in a shared design folder, the newest files/*.state) and prints a two-line stage tracker. Prints nothing if none.

input=$(cat 2>/dev/null)

dir=$(printf '%s' "$input" | sed -n 's/.*"current_dir" *: *"\([^"]*\)".*/\1/p' | head -n 1)
[ -z "$dir" ] && dir=$PWD

state=""
d=$dir
while [ -n "$d" ]; do
  if [ -f "$d/.design-memory.state" ]; then state="$d/.design-memory.state"; break; fi
  [ "$d" = "/" ] && break
  d=$(dirname "$d")
done

# Shared design folder: one files/<slug>.state per Figma file. Use the most recently written one.
if [ -z "$state" ]; then
  d=$dir
  while [ -n "$d" ]; do
    newest=$(ls -t "$d"/files/*.state 2>/dev/null | head -n 1)
    if [ -n "$newest" ]; then state="$newest"; break; fi
    [ "$d" = "/" ] && break
    d=$(dirname "$d")
  done
fi

[ -z "$state" ] && exit 0

file="" flow="" stage="" detail="" open="" next=""
while IFS='=' read -r k v; do
  v=$(printf '%s' "$v" | tr -d '\033')
  case "$k" in
    file) file=$v ;;
    flow) flow=$v ;;
    stage) stage=$v ;;
    detail) detail=$v ;;
    open) open=$v ;;
    next) next=$v ;;
  esac
done < "$state"
[ -z "$stage" ] && exit 0

R='\033[0m'; DIM='\033[2m'; BOLD='\033[1m'; CYAN='\033[36m'; GREEN='\033[32m'

line="${CYAN}◆${R} ${BOLD}${file:-design-memory}${R}"
[ -n "$flow" ] && line="$line ${DIM}▸${R} $flow"
line="$line  "

seen_current=0
for s in start review triage fix checkpoint export; do
  if [ "$s" = "$stage" ]; then
    line="$line${CYAN}${BOLD}● $s${R}  "
    seen_current=1
  elif [ "$seen_current" = 0 ]; then
    line="$line${GREEN}✓${R}${DIM} $s${R}  "
  else
    line="$line${DIM}○ $s${R}  "
  fi
done
printf '%b\n' "$line"

info=""
[ -n "$detail" ] && info="$detail"
if [ -n "$open" ] && [ "$open" != "0" ]; then
  [ -n "$info" ] && info="$info · "
  info="$info$open open"
fi
if [ -n "$next" ]; then
  [ -n "$info" ] && info="$info · "
  info="${info}next: ${next}"
fi
[ -n "$info" ] && printf '%b\n' "  ${DIM}${info}${R}"
exit 0
