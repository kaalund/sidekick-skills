---
name: digest
description: Internal helper for design-memory skills. Looks at the frames in scope, compares them with the local cache of screen descriptions, classifies each frame (edit, variant, state, new), infers the flow's stage, updates the cache and returns a change list, a short summary and a compact package for critique skills. Called by review. Not for direct use.
---

# Design Digest

Look at the screens before anyone critiques them, and remember what you saw. Work silently: never ask the designer anything. Everything you write goes to the local cache (`workspace.md`), never to Figma.

Input from the caller: `fileKey`, `slug`, `folderPath`, the target node id, the flow chain and the page structure (roles per top-level node) from `context`.

1. Load `memory-format` and read only its `workspace.md`. Load `figma-use`.

2. **Frames in scope.** Use the roles from `context`:
   - The target is a frame: that frame, even inside an `earlier:` or `reference` section (an explicit selection wins).
   - The target is a section: its frames. A section with role `earlier:` or `reference` is also reviewed when it is the target.
   - The target is the page: the frames of the top-level nodes with role `current`, `journey` or `unclear`, and the page's loose top-level frames that are not `earlier:` or `reference`. Nodes with role `earlier:` are not in scope, but their fingerprints stay in the cache so a later comparison can see what changed.
   Always minus Sidekick's own findings frames (`… - Sidekick Findings 🤖`) and any spec (the memory spec is a `SPEC_BLOCK`, never a frame in scope). Read every frame in scope with one `use_figma` script (never `get_metadata` on a section or page), in journey order (top to bottom by row, left to right within a row). Per frame it returns the fingerprint `nodeId|name|childCount|WxH`, the names of its top-level children, and its distinct text strings (trimmed, at most 40 per frame, each cut to 60 characters). This read has no cap: it is one call however many frames there are.

3. **Load the cache**: `<slug>/fingerprint`, `<slug>/flows/<flowId>.md`, and `<slug>/screens/<id>.md` for every frame in scope. A missing file is empty.

4. **Sort the frames.**
   - Same id, same fingerprint, description exists: **unchanged**. Do not describe it again.
   - Same id, fingerprint changed (or no description yet but a baseline line exists): **edit**. Describe it again.
   - New id: classify it (`workspace.md`, Relations) from the step 2 read, against the cached screens of the same flow and the other frames in scope: `state of <id>`, `variant of <id>`, or `new`.
   - Cached screen whose id is gone from the file: **removed**. Keep its description file; drop it from the flow's `screens` line.
   Fully describe at most 12 base screens (frames that are not a state or variant) in one run: edits first, then in journey order from the target. States and variants get a short diff instead (step 5) and do not count. Say in the summary how many base screens are left for next time.

5. **Describe** each base screen that needs it (`workspace.md`, Screen description). Use `get_design_context` or `use_figma` text reads for frames built from layers. Use `get_screenshot` only for frames that are a single image or have no readable text. Write `changes:` by comparing with the previous description: what a designer would notice (moved, added, removed, restyled, reworded), not layer counts. For a state or variant, write the short form with a one-line `diff:` from the step 2 read (what it adds, removes or replaces compared with the screen it relates to), with no extra tool call.

6. **Infer the stage** (`workspace.md`, Stage) from the fidelity of the frames in scope, not of the whole flow or page. A stage the designer stated in the flow mini-brief or in chat wins. Note the evidence in one short phrase.

7. **Write the cache**: each new or changed screen file, the flow file (purpose from the flow mini-brief or `unknown`, stage, screens, variants, states, `not_described`, `updated`; keep `anchor`, `parent`, `reviews` and `next` as they are), and the flow's line in `fingerprint`. Write `stage` and `stage_evidence` only when every screen of the flow is in scope or the flow file has no stage yet; a stage inferred from part of a flow is returned, not stored. Never write the fingerprint to Figma.

8. **Return** to the caller:
   - **changes:** a list of `{ id, name, kind (edit | variant | state | new | removed), what }`, only for frames that are not unchanged.
   - **gaps:** short plain-language sentences for what you could not or did not describe (base screens left over by the cap, `not_described`, loose images or screenshots you skipped), which `review` turns into `### Not covered yet`.
   - **stage** and its evidence, and whether it moved since the cached flow file (for example `explore → refine`).
   - **package** for the critique skill: the flow's purpose and stage; an outline of every frame in scope in journey order, one line each (name, then its purpose, or its relation and diff, or `not described yet`), so the critic sees the whole journey; then the full description of each base screen with its states and variants beneath it as diffs, so a critic reviews the set once.
   - **summary**, 1 to 4 short lines for the designer, for example:
     ```
     Since the last review: image 3 edited (primary action now filled, upload box is a drop zone).
     New: image 6, a variant of image 3. image 7 is a state of image 4 (error shown).
     Stage: explore, from screenshots and placeholder amounts.
     ```
     On the first run for a flow: `First look at <flow>: <n> screens described. Stage: <stage>.`

The caller prints the summary. Do not print descriptions or the package.
