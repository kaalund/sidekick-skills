---
name: start
description: Set up design memory for a Figma file. Creates the Memory page, interviews the designer to write the file-level brief, and creates the local project folder. Use at the start of a design project or when adopting design memory in an existing file.
---

# Design Start

Set up the design memory for a Figma file, then interview the designer to capture the project brief. Keep your messages short and casual.

⚠️ **Auto mode warning.** If auto mode is active, warn the designer up front that this skill cannot create Figma files or pages in auto mode. Ask them to switch off auto mode, or to create the file or page themselves, before continuing.

1. Load `resolve` and resolve the file and folder. Load `memory-format` and `figma-use`.

2. **Detect existing memory** with `use_figma`: does the page `🤖 Agentic Memory` (or the legacy `Memory (agent-maintained)`) exist, and which of the seven frames exist?
   - Page and all frames exist: say it is already set up and offer only a brief re-interview (step 5 onwards).
   - Page exists but some frames are missing: create only the missing frames and say which.
   - Never create a second page or duplicate frames.

3. **Create what is missing**: the page (appended last), and each missing frame named exactly as in the format reference, left to right, vertical auto-layout, padding 24, 80px gaps. Seed these cards if absent:
   - `memory/index/project`: `intent: unknown`, `last_checkpoint: none`, `workspace_folder: <folderPath>`, `canonical: figma`.
   - `memory/index/flows`: a single line `(no flows registered yet)`.
   - `memory/index/status`: a single line `(no flows registered yet)`.

   Also make sure `06 Components` holds the `Finding` component set. If `findingComponentKey` is in the config, skip this and import from the library at write time. Otherwise, if the set is missing, build it (load `figma-use` and the component references) to the contract in `memory-format`: 15 variants (`Status` x `Severity`, named `Status=X, Severity=Y`), each 480 wide and hugging height, with a 4px severity accent bar, severity pill, ID, status pill with dot, claim, reason (visibility bound to `Show reason`), and a footer with Skill, Scope and Date. Add the TEXT and BOOLEAN properties before `combineAsVariants`, link them via `componentPropertyReferences`, and clear fills on the inner layout frames. Colour status and severity clearly (neutral open, blue will do, amber on hold, grey dismissed, green done; red, orange, grey for P1-P3). If a `Finding` set already exists in the file or a linked library, reuse it rather than building a second one.

4. **Read before asking.** Call `get_metadata` for the file's pages and sections, call `get_libraries` for linked libraries. If `files/<slug>.md` exists in the folder (the seed from the Sidekick card), read it: every section that is not `unknown` is an answer you already have. Summarize what you found in one line. Do not ask about anything you already know.

5. **Interview.** One question at a time, adaptive and skippable. "Don't know yet" is a valid answer: record `unknown` and add a `Q-###` entry in `05 Open questions` for it. Cover:
   - purpose and the problem being solved
   - users and audience
   - goals and what success looks like
   - constraints (tech, timeline, accessibility or compliance level)
   - platform (web, iOS, Android, desktop)
   - brand and design system
   - references
   - known risks and unknowns
   Skip any topic already answered by step 4, including the seed's answers. Ask only about the topics the seed marks `unknown` and the ones it does not cover; if the seed answers everything, go straight to the draft. Keep it a conversation, not a form.

6. **Draft and approve.** Show the drafted brief in chat and ask for approval or edits. Write nothing to Figma before approval.

7. **Write.** Write `memory/brief/file` (file-level keys). The seed's sections map to the brief keys: Purpose and problem to `purpose`, Users and audience to `users`, Goals and success to `goals`, Platform to `platform`, Brand to `brand`. Scope of this file goes into `constraints` when it names limits, otherwise into `purpose`. Then update `memory/index/project` (a one-line `intent`), and write the open questions. Then append the approved brief to `files/<slug>.md` under a `## Brief` heading, as a plain copy for reading and later export (Figma stays canonical).

8. **Folder.** `resolve` already registered the file. In the shared design folder there is nothing more to set up: the folder, its git repo and its `.claude/settings.json` already exist (the Sidekick card sets them up).

9. End with two lines: what was created, and the suggested next step (run `/review` on a frame). Update the stage line (`memory-format`): `stage=start`, `detail=brief written`. Also set `stage=start`, `detail=brief interview` when you start step 5, and mention once that `/statusline` shows the workflow stage in the status line if they have not set it up.
