---
name: start
description: Set up design memory for a Figma file. Creates the memory spec next to the designs and writes a first file-level brief silently from the Sidekick form and what the file shows, marking guesses as inferred. No interview. Use at the start of a design project or when adopting design memory in an existing file.
---

# Design Start

Set up the design memory for a Figma file and write a first project brief from the form answers and what the file shows. Work silently and keep your messages short and casual.

⚠️ **Auto mode warning.** If auto mode is active, warn the designer up front that this skill cannot create Figma files or specs in auto mode. Ask them to switch off auto mode, or to create the spec themselves, before continuing.

1. Load `resolve` and resolve the file and folder. Load `memory-format` and `figma-use`.

2. **Detect existing memory** with `use_figma`: `findMemorySpec`, then the legacy page `🤖 Agentic Memory` (or `Memory (agent-maintained)`).
   - Spec exists: say it is already set up and create nothing, but still run the rest of step 3 (the library check) and steps 4 to 6. On a re-run, never overwrite a brief value the designer edited or commented on (`memory-format`, Inferred content): only fill keys that are missing or still `unknown` or `(inferred)`. A Retry after `needs=library` and a restarted onboarding both land here.
   - Only the legacy page exists: migrate it into a new spec (`memory-format`, Legacy memory page), then carry on as above.
   - Never create a second spec.

3. **Create what is missing**: check `whoami` for `specs_enabled` (`memory-format`, Memory spec), then the spec with `createMemorySpec`, seeded with the five sections. The anchor is the node in the start link (or the seed's `url`), else the current selection, else the page; switch to its page first. Seed these entries if absent:
   - `### project` under `## Index`: `intent: unknown`, `last_checkpoint: none`, `workspace_folder: <folderPath>`.
   - `### flows`: a single bullet `(no flows registered yet)`.
   - `### status`: a single bullet `(no flows registered yet)`.

   Then resolve the `Finding` library (`memory-format`, Findings, Finding library). On a Retry call `get_libraries` again: the designer enabled the library after the first stop, so a result from earlier in the conversation is stale. Do not build the component set. If the `Sidekick` library is not enabled in the file, follow Missing library: write `stage=start`, `needs=library` and `detail=enable the Sidekick library in Figma` (the line is ignored without a stage) and stop. Everything above is already in place, so the designer's Retry on the card runs this skill again and carries on from here.

4. **Read before writing.** Call `get_metadata` for the file's pages and sections, call `get_libraries` for linked libraries. If the seed from the Sidekick card exists (`~/Library/Application Support/Sidekick/seeds/<slug>.md`, the one `resolve` found), read it with the Read tool, never with shell `cat` or other shell reads (the auto-mode safety check blocks those outside the folder): every section that is not `unknown` is an answer you already have. Then update the stage line (`memory-format`): `stage=start`, `detail=brief interview`. Do this here: the spec, the library and the entries are in place, and this write is what tells the Sidekick card it is now safe to switch to auto mode. The value is only a marker, no interview follows. Never write it before step 3 has finished, and never when step 3 stopped on `needs=library`.

5. **Look at the first screens.** Take at most the first 3 top-level frames in the file (from the `get_metadata` result) and call `get_design_context` on each for the visible copy. Together with the names of the pages, sections and frames, that is all you have to go on. Never ask the designer anything: this skill is silent.

6. **Write the brief.** Write the `### file` entry under `## Brief` straight to the spec, with no approval step and no questions; the designer reads it there next to the flows and corrects it with a comment (`setKey` for each key of an existing entry, `addEntry` for a new one). Per key:
   - The seed's sections map to the brief keys: Purpose and problem to `purpose`, Users and audience to `users`, Goals and success to `goals`, Platform to `platform`, Brand to `brand`. A seed answer that is not `unknown` is written verbatim, with no marker.
   - `constraints` is always `WCAG compliance is mandatory`, plus any limit the seed's Scope of this file section names; with no limit, the seed's scope goes into `purpose`.
   - Every other key (`purpose`, `users`, `goals`, `platform`, `brand`, `references`, `risks`) that the seed did not answer is inferred from what steps 4 and 5 showed, with `(inferred)` appended (`memory-format`, Inferred content). Only when there is nothing to go on, write `unknown` and add a `Q-###` line for it under `## Open questions` (`nextMemoryId(md, "Q")`, scope `file`, one line per unknown key, for example `Which platform is this for?`).
   - Then update the `project` entry (a one-line `intent`).
   - Do not copy the brief to disk: Figma is the only copy, so teammates see it. Do not delete the seed either, Sidekick removes it once the stage line says `brief written`.

7. **Folder.** `resolve` already registered the file. In the shared design folder there is nothing more to set up: the folder, its git repo and its `.claude/settings.json` already exist (the Sidekick card sets them up).

8. End with two lines: what was created (and that the brief is in the memory spec next to the flows to read), and the suggested next step: select a single frame or journey section in Figma, then press Review on the card. Update the stage line (`memory-format`): `stage=start`, `detail=brief written`.
