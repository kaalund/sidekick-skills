---
name: statusline
description: Set up the design-memory status line, a two-line tracker at the bottom of Claude Code showing the current workflow stage (start, review, triage, fix, checkpoint, export) and the next options. Use once per machine, or again to update the script after a plugin update.
---

# Design Statusline

Install the status line script and wire it into the user's Claude Code settings. Plugins cannot set `statusLine` themselves, so this is a one-time step per machine. Keep messages short and casual.

1. **Install the script.** Find `scripts/statusline.sh` in this plugin (two directories up from this skill's base directory). Copy it to `~/.design-memory/statusline.sh` (create the directory if needed) and make it executable. Copying keeps the path stable when the plugin updates; running this skill again refreshes the copy.

2. **Read `~/.claude/settings.json`** (create it as `{}` if missing). Back it up once to `~/.claude/settings.json.bak` before the first change. Preserve every other key when editing.

3. **Choose the wiring** by what `statusLine` holds:
   - Missing: set `{ "type": "command", "command": "sh \"$HOME/.design-memory/statusline.sh\"" }`.
   - Already points at `~/.design-memory/statusline.sh` or the combined wrapper: nothing to change, just report the script is refreshed.
   - Another status line exists: tell them what it is and ask: **combine** (keep theirs, add the stage tracker as extra lines below it; default), **replace**, or **skip**.
     - Combine: save their current `command` string to `~/.design-memory/original-statusline.txt`, write `~/.design-memory/statusline-combined.sh` with the content below, and set `command` to `sh "$HOME/.design-memory/statusline-combined.sh"`. Keep their other `statusLine` keys (such as `padding`).
     - Replace: save their current `command` string to `~/.design-memory/original-statusline.txt` first, then set the command as in "Missing".

   ```sh
   #!/bin/sh
   input=$(cat)
   orig=$(cat "$HOME/.design-memory/original-statusline.txt")
   printf '%s' "$input" | sh -c "$orig"
   printf '%s' "$input" | sh "$HOME/.design-memory/statusline.sh"
   ```

4. **Verify.** Run `printf '{}' | sh ~/.design-memory/statusline.sh`. It prints nothing unless a `.design-memory.state` exists nearby, which is expected. If a state file exists here, show the output.

5. **Tell them** in two lines: it appears after the next interaction (restart Claude Code if not), and how to undo it (restore the saved command from `~/.design-memory/original-statusline.txt`, or `~/.claude/settings.json.bak`). Mention the line stays hidden outside design-memory projects.
