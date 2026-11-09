---
name: start
description: Set up design memory for a Figma file. Creates the memory spec next to the designs and writes a first file-level brief silently from the Sidekick form and what the file shows, marking guesses as inferred. No interview. Use at the start of a design project or when adopting design memory in an existing file.
---

# Design Start

Set up the design memory for a Figma file and write a first project brief from the form answers and what the file shows. Work silently and keep your messages short and casual.

1. Load `resolve` and resolve the file and folder. Load `memory-format` and read its `spec.md`, `state.md`, `findings.md` and `spec-helpers.js`. Load `figma-use`. If there is no seed and the file is not in the registry yet, stop and tell the designer to press Get started on the Sidekick card: the form writes the seed with the real file name, and `resolve` would otherwise guess a name from the URL (`figma.root.name` is "Document"). Write nothing.

2. **Detect existing memory** with `use_figma` (read-only; nothing is created until the step 3 preflight passes): `findMemorySpec`.
   - Spec exists: say it is already set up and create nothing, but the preflight at the start of step 3 still runs, and so do steps 4 to 6. A Retry after a blocker (`needs=...`), a restarted onboarding, and a review that found no memory spec (`needs=memory`, via Retry on the card) all land here. On a re-run only fill brief keys that are missing or still `unknown` or `(inferred)`, and never overwrite the designer's text (`spec.md`, Inferred content), and add no second `Q-` line for a key (`spec.md`, Open questions).
   - No spec yet: step 3 creates it. Never create a second spec.

3. **Preflight, then create what is missing.** Run the Preflight (`state.md`) with `specs`, `login` and `library`; skip `memory` and `empty-target`. This is the first thing that can stop `start`: create nothing before it passes. If a check fails, stop as the Preflight says, with `stage=start`. Retry on the card runs this skill again.

   Then create the spec with `createMemorySpec`, seeded with the five sections in the order of `spec.md` (`## Open questions` first, left empty). The anchor is the node in the start link (or the seed's `url`), else the current selection, else the page; switch to its page first. Seed these entries under `## What I know` if absent: `### Flows` with the bullet `(no flows registered yet)`, and `### Not covered yet` with the bullet `- I have not looked at any frame yet.` (step 5 replaces it).

   Last, resolve the `Finding` key (`findings.md`, Finding library). Do not build the component set.

4. **Read before writing.** List the file's pages and the first-level nodes of the first page with one `use_figma` script (`memory-format`, Figma access), and call `get_libraries` for linked libraries. If the seed exists (`resolve` found it), read it: every section that is not `unknown` is an answer you already have. Then update the stage line (`state.md`): `stage=start`, `detail=brief interview`, here and never when step 3 stopped on a blocker (`state.md`, Stage meanings).

5. **Look at the first screens.** Take at most the first 3 top-level frames in the file (from the first-level list) and read the visible copy of each with `use_figma` (its text nodes). `get_design_context` is not needed here and needs `figma-design-to-code` loaded first. Together with the names of the pages, sections and frames, that is all you have to go on. Then say what you did and did not see in `### Not covered yet`, in plain words, for example "So far I have only looked at the first 3 frames (<names>). The other <n> frames are not described yet, and no flows are registered until you press Review on a frame or section." Only replace the seeded placeholder or a line `start` wrote earlier (`replaceLines`); once a review has written its own gaps there, leave them.

6. **Write the brief.** Write the `### file` entry under `## Brief` straight to the spec, with no approval step and no questions; the designer reads it there next to the flows and corrects it with a comment (`setKey` for each key of an existing entry, `addEntry` for a new one). Per key:
   - The seed's sections map to the brief keys: Purpose and problem to `purpose`, Users and audience to `users`, Goals and success to `goals`, Platform to `platform`, Brand to `brand`. A seed answer that is not `unknown` is written verbatim, with no marker.
   - `constraints` is always `WCAG compliance is mandatory`, plus any limit the seed's Scope of this file section names; with no limit, the seed's scope goes into `purpose`.
   - Every other key (`purpose`, `users`, `goals`, `platform`, `brand`, `references`, `risks`) that the seed did not answer is inferred from what steps 4 and 5 showed, with `(inferred)` appended. Only when there is nothing to go on, write `unknown` and add a `Q-###` line for it under `## Open questions` (`nextMemoryId(md, "Q")`, scope `file`, one line per unknown key, for example `Which platform is this for?`).
   - Do not copy the brief to disk: Figma is the only copy, so teammates see it. Do not delete the seed either, Sidekick removes it once the stage line says `brief written`.

7. **Folder.** `resolve` already registered the file: read the config once more and check that `files[<fileKey>]` is there with this slug before you report done. A re-run that finds the spec and the stage line already done still gets here, because the card stays on "Setting up" until the file is registered. The shared folder, its git repo and its `.claude/settings.json` already exist (the Sidekick card sets them up).

8. End with two lines: what was created (and that the brief and what I know are in the memory spec next to the flows to read, open questions on top), and the suggested next step: select a single frame or journey section in Figma, then press Review on the card. Update the stage line: `stage=start`, `detail=brief written`.
