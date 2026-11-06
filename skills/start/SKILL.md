---
name: start
description: Set up design memory for a Figma file. Creates the memory spec next to the designs and writes a first file-level brief silently from the Sidekick form and what the file shows, marking guesses as inferred. No interview. Use at the start of a design project or when adopting design memory in an existing file.
---

# Design Start

Set up the design memory for a Figma file and write a first project brief from the form answers and what the file shows. Work silently and keep your messages short and casual.

⚠️ **Auto mode warning.** If auto mode is active, warn the designer up front that this skill cannot create Figma files or specs in auto mode. Ask them to switch off auto mode, or to create the spec themselves, before continuing.

1. Load `resolve` and resolve the file and folder. Load `memory-format` and `figma-use`.

2. **Detect existing memory** with `use_figma` (read-only; nothing is created until the step 3 preflight passes): `findMemorySpec`, then the legacy page `🤖 Agentic Memory` (or `Memory (agent-maintained)`).
   - Spec exists: say it is already set up and create nothing, but the preflight at the start of step 3 still runs (including the library check), and so do steps 4 to 6. On a re-run, never overwrite a brief value the designer edited or commented on (`memory-format`, Inferred content): only fill keys that are missing or still `unknown` or `(inferred)`. Never overwrite a brief line that carries a designer comment, even when it still ends in `(inferred)`: `parseMemory` strips comment markers through `plain()`, so check the raw lines from `readMemoryMarkdown` for `[comment:` before overwriting a line. Never overwrite a `project` `intent` the designer edited: set it only when it is `unknown`. Never add a second `Q-` line for a key that already has one, open or closed: match on the key's question text (for example `Which platform ...`) against the existing `Q-` lines. A Retry after a blocker (`needs=...`) and a restarted onboarding both land here.
   - Only the legacy page exists: after the step 3 preflight has passed, migrate it into a new spec (`memory-format`, Legacy memory page), then carry on as above.
   - Never create a second spec.

3. **Preflight, then create what is missing.** First run the Preflight (`memory-format`, Preflight) with checks `specs`, `login` and `library` (a fresh `get_libraries`: on a Retry the designer enabled the library after the first stop, so a result from earlier in the conversation is stale). Skip `memory` (this step creates the spec) and `empty-target`. This is the first thing that can stop `start`, so create nothing before it passes. The library check does not need the spec, which is why it runs before `createMemorySpec`. If any check fails, print every blocker with its fix, write the state file with `stage=start`, `needs=<first failing check>`, `detail=<its fix>` and an empty `progress` (the stage line is ignored without a stage), and stop: never `detail=brief interview` while a blocker stands. Retry on the card runs this skill again.

   Then create the spec with `createMemorySpec`, seeded with the five sections. The anchor is the node in the start link (or the seed's `url`), else the current selection, else the page; switch to its page first. Seed these entries if absent:
   - `### project` under `## Index`: `intent: unknown`, `last_checkpoint: none`, `workspace_folder: <folderPath>`.
   - `### flows`: a single bullet `(no flows registered yet)`.
   - `### status`: a single bullet `(no flows registered yet)`.

   Last, resolve the `Finding` key from the library check above (`memory-format`, Findings, Finding library). Do not build the component set.

4. **Read before writing.** Call `get_metadata` for the file's pages and sections, call `get_libraries` for linked libraries. If the seed from the Sidekick card exists (`~/Library/Application Support/Sidekick/seeds/<slug>.md`, the one `resolve` found), read it with the Read tool, never with shell `cat` or other shell reads (the auto-mode safety check blocks those outside the folder): every section that is not `unknown` is an answer you already have. Then update the stage line (`memory-format`): `stage=start`, `detail=brief interview`. Do this here: the spec, the library and the entries are in place, and this write is what tells the Sidekick card it is now safe to switch to auto mode. The value is only a marker, no interview follows. Never write it before step 3 has finished, and never when step 3 stopped on a blocker (`needs=...`).

5. **Look at the first screens.** Take at most the first 3 top-level frames in the file (from the `get_metadata` result) and call `get_design_context` on each for the visible copy. Together with the names of the pages, sections and frames, that is all you have to go on. Never ask the designer anything: this skill is silent.

6. **Write the brief.** Write the `### file` entry under `## Brief` straight to the spec, with no approval step and no questions; the designer reads it there next to the flows and corrects it with a comment (`setKey` for each key of an existing entry, `addEntry` for a new one). On a re-run, apply the re-run rules of step 2 to every key. Per key:
   - The seed's sections map to the brief keys: Purpose and problem to `purpose`, Users and audience to `users`, Goals and success to `goals`, Platform to `platform`, Brand to `brand`. A seed answer that is not `unknown` is written verbatim, with no marker.
   - `constraints` is always `WCAG compliance is mandatory`, plus any limit the seed's Scope of this file section names; with no limit, the seed's scope goes into `purpose`.
   - Every other key (`purpose`, `users`, `goals`, `platform`, `brand`, `references`, `risks`) that the seed did not answer is inferred from what steps 4 and 5 showed, with `(inferred)` appended (`memory-format`, Inferred content). Only when there is nothing to go on, write `unknown` and add a `Q-###` line for it under `## Open questions` (`nextMemoryId(md, "Q")`, scope `file`, one line per unknown key, skipped when a `Q-` line for that key already exists, open or closed, for example `Which platform is this for?`).
   - Then update the `project` entry (a one-line `intent`, only when `intent` is `unknown`).
   - Do not copy the brief to disk: Figma is the only copy, so teammates see it. Do not delete the seed either, Sidekick removes it once the stage line says `brief written`.

7. **Folder.** `resolve` already registered the file. In the shared design folder there is nothing more to set up: the folder, its git repo and its `.claude/settings.json` already exist (the Sidekick card sets them up).

8. End with two lines: what was created (and that the brief is in the memory spec next to the flows to read), and the suggested next step: select a single frame or journey section in Figma, then press Review on the card. Update the stage line (`memory-format`): `stage=start`, `detail=brief written`.
