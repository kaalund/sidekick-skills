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
   - `memory/index/project`: `intent: unknown`, `last_checkpoint: none`, `workspace_folder: <folderPath>`.
   - `memory/index/flows`: a single line `(no flows registered yet)`.
   - `memory/index/status`: a single line `(no flows registered yet)`.

   Then resolve the `Finding` library (`memory-format`, Findings, Finding library). Do not build the component set. If the `Sidekick` library is not enabled in the file, follow Missing library: write `needs=library` and stop. Everything above is already in place, so the designer's Retry on the card runs this skill again and carries on from here.

4. **Read before asking.** Call `get_metadata` for the file's pages and sections, call `get_libraries` for linked libraries. If the seed from the Sidekick card exists (`~/Library/Application Support/Sidekick/seeds/<slug>.md`, the one `resolve` found), read it: every section that is not `unknown` is an answer you already have. Summarize what you found in one line. Do not ask about anything you already know. Then update the stage line (`memory-format`): `stage=start`, `detail=brief interview`. Do this here, whether or not you still have questions: the page, the frames and the library are in place, and this write is what tells the Sidekick card it is now safe to switch to auto mode. Never write it before step 3 has finished, and never when step 3 stopped on `needs=library`.

5. **Interview.** One question at a time, adaptive and skippable. "Don't know yet" is a valid answer: record `unknown` and add a `Q-###` entry in `05 Open questions` for it. Cover:
   - purpose and the problem being solved
   - users and audience
   - goals and what success looks like
   - platform (web, iOS, Android, desktop)
   - brand and design system
   - references
   - known risks and unknowns
   Never ask about tech, timeline or accessibility. WCAG compliance is mandatory, so it is a fixed assumption, not a question.
   Skip any topic already answered by step 4, including the seed's answers. Ask only about the topics the seed marks `unknown` and the ones it does not cover; if the seed answers everything, go straight to step 6. Keep it a conversation, not a form.

6. **Write.** There is no approval step: write the brief straight to Figma, and the designer reads it on the Memory page. Write `memory/brief/file` (file-level keys). The seed's sections map to the brief keys: Purpose and problem to `purpose`, Users and audience to `users`, Goals and success to `goals`, Platform to `platform`, Brand to `brand`. `constraints` is always `WCAG compliance is mandatory`, plus any limit the seed's Scope of this file section names; with no limit, the seed's scope goes into `purpose`. Then update `memory/index/project` (a one-line `intent`), and write the open questions. Do not copy the brief to disk: Figma is the only copy, so teammates see it. Do not delete the seed either, Sidekick removes it once the stage line says `brief written`.

7. **Folder.** `resolve` already registered the file. In the shared design folder there is nothing more to set up: the folder, its git repo and its `.claude/settings.json` already exist (the Sidekick card sets them up).

8. End with two lines: what was created (and that the brief is on the Memory page to read), and the suggested next step: select a single frame or journey section in Figma, then run `/review`. Update the stage line (`memory-format`): `stage=start`, `detail=brief written`.
