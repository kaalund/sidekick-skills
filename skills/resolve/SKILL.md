---
name: resolve
description: Internal helper for design-memory skills. Resolves which Figma file and local folder the user means, creating the user config on first use. Load before any other design-memory skill.
---

# Design Resolve

Work out which Figma file and which local folder this session is about. Keep it quick: ask only what you cannot find.

1. Load `memory-format`.

2. **Figma file key.** Take it from, in order: a Figma URL the user gave; otherwise ask for the URL. The key is the path segment after `/design/`. For `/design/<fileKey>/branch/<branchKey>/...` URLs use the branch key.

3. **Config.** The config lives in the shared design folder, at `<folder>/.design-memory/config.json`. Find the folder in this order: the current directory, if it has `.design-memory/config.json` or a `.claude/settings.json` that enables `design-memory`; else `folder` in `~/Library/Application Support/Sidekick/environment.json` (expand `~`); else `~/design-workspace`. If the user names another path for testing, use that. If the config does not exist, create the directory and file with `version: 1`, `files: {}`, `catalog: []`.

4. **Folder.** Every file lives in one shared design folder (a git repo with the design plugins enabled in its `.claude/settings.json`). Resolve in this order:
   a. `files[<fileKey>]` exists in the config, has a `slug`, and its `path` exists on disk: use it. An entry without a `slug` is from the retired per-file layout: treat the file as not registered, so steps 4b to 7 replace it.
   b. Otherwise find the shared design folder:
      - `workspaceFolder` in the config, if it is set and exists on disk.
      - Else, if the current directory has a `files/` folder holding a seed whose `fileKey` matches, or a `.claude/settings.json` that enables `design-memory`: use the current directory and save it as `workspaceFolder`.
      - Else ask once: "Which folder is your shared design workspace?" (suggest the current directory). Create it if needed, offer `git init`, and save it as `workspaceFolder`.

5. **Slug.** The file's name in the folder: `files/<slug>.state` and `files/<slug>.md`. Use the `slug` from the seed (`files/*.md` whose `fileKey` matches) if there is one. Otherwise take the Figma file name, lowercase, every run of other characters as one hyphen (keep letters such as æøå, drop emoji), `file` if nothing is left. If `files/<slug>.md` or a registry entry already exists for a different `fileKey`, append `-` and the first six characters of the file key, lowercase.

6. **Moved or deleted folder.** If a registry entry exists but its path is missing on disk, say so and ask: relink to a new path, recreate the folder, or continue without a folder. Never silently create a duplicate folder or registry entry.

7. **Register.** Write `files[<fileKey>]` in the config: `{ "name", "path": <folder>, "slug": <slug> }`. Every entry has a `slug`.

Return to the calling skill: `fileKey`, `name`, `folderPath` (or none), `slug`.
