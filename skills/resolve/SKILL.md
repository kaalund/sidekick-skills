---
name: resolve
description: Internal helper for design-memory skills. Resolves which Figma file and local folder the user means, creating the user config on first use. Load before any other design-memory skill.
---

# Design Resolve

Work out which Figma file and which local folder this session is about. Keep it quick: ask only what you cannot find.

1. Load `memory-format`.

2. **Figma file key.** Take it from, in order: a Figma URL the user gave; the `fileKey` in a `.design-memory.json` in the current directory (older projects); otherwise ask for the URL. The key is the path segment after `/design/`. For `/design/<fileKey>/branch/<branchKey>/...` URLs use the branch key.

3. **Config.** The config lives in the shared design folder, at `<folder>/.design-memory/config.json`. Find the folder in this order: the current directory, if it has `.design-memory/config.json` or a `.claude/settings.json` that enables `design-memory`; else `folder` in `~/Library/Application Support/Sidekick/environment.json` (expand `~`); else `~/design-workspace`. If the user names another path for testing, use that. If the config does not exist, create the directory and file with `version: 1`, `files: {}`, `catalog: []`. Do not ask about `workspaceRoot`: leave it unset unless a skill needs it for a separate project folder (step 4d).

4. **Folder.** Every file normally lives in one shared design folder (a git repo with the design plugins enabled in its `.claude/settings.json`). Resolve in this order:
   a. `files[<fileKey>]` exists in the config and its `path` exists on disk: use it, and its `slug` if it has one.
   b. Otherwise find the shared design folder:
      - `workspaceFolder` in the config, if it is set and exists on disk.
      - Else, if the current directory has a `files/` folder holding a seed whose `fileKey` matches, or a `.claude/settings.json` that enables `design-memory`: use the current directory and save it as `workspaceFolder`.
      - Else ask once: "Which folder is your shared design workspace?" (suggest the current directory). Create it if needed, offer `git init`, and save it as `workspaceFolder`.
   c. Only if the user asks for a separate project folder: create a new folder under `workspaceRoot` (ask for it once, name the folder from the Figma file name, lowercase, hyphens) or link an existing folder or repo. That is `kind: linked-repo` for a linked repo, and the old per-file layout (a `.design-memory.json` pointer, no `slug`).

5. **Slug** (shared folder only). The file's name in the folder: `files/<slug>.state` and `files/<slug>.md`. Use the `slug` from the seed (`files/*.md` whose `fileKey` matches) if there is one. Otherwise take the Figma file name, lowercase, every run of other characters as one hyphen (keep letters such as æøå, drop emoji), `file` if nothing is left. If `files/<slug>.md` or a registry entry already exists for a different `fileKey`, append `-` and the first six characters of the file key, lowercase.

6. **Moved or deleted folder.** If a registry entry exists but its path is missing on disk, say so and ask: relink to a new path, recreate the folder, or continue without a folder. Never silently create a duplicate folder or registry entry.

7. **Register.** Write `files[<fileKey>]` in the config: `{ "name", "path": <folder>, "slug": <slug>, "kind": "new" }` for the shared folder. For a linked repo or a separate project folder, write the entry without `slug`, and write the `.design-memory.json` pointer in it too. Keep them consistent.

Return to the calling skill: `fileKey`, `name`, `folderPath` (or none), `slug` (or none), `kind` (`new` or `linked-repo`).
