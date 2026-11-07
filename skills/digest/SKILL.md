---
name: digest
description: Internal helper for design-memory skills. Looks at the frames in scope, compares them with the local cache of screen descriptions, classifies each frame (edit, variant, state, new), infers the flow's stage, updates the cache and returns a change list, a short summary and a compact package for critique skills. Called by review. Not for direct use.
---

# Design Digest

Look at the screens before anyone critiques them, and remember what you saw. Work silently: never ask the designer anything. Everything you write goes to the local cache (`memory-format`, Local cache), never to Figma.

Input from the caller: `fileKey`, `slug`, `folderPath`, the target node id, the flow chain and the page structure (roles per top-level node) from `context`.

1. Load `memory-format` and `figma-use`.

2. **Frames in scope.** Use the roles from `context`:
   - The target is a frame: that frame, even inside an `earlier:` or `reference` section (an explicit selection wins).
   - The target is a section: its frames. A section with role `earlier:` or `reference` is also reviewed when it is the target.
   - The target is the page: the frames of the top-level nodes with role `current`, `journey` or `unclear`, and the page's loose top-level frames that are not `earlier:` or `reference`. Nodes with role `earlier:` are not in scope, but their fingerprints stay in the cache so a later comparison can see what changed.
   Always minus Sidekick's own findings frames (`… - Sidekick Findings 🤖`) and any spec (the memory spec is a `SPEC_BLOCK`, never a frame in scope). Build a fingerprint per frame with one `use_figma` script that returns only `nodeId|name|childCount|WxH` for those frames. Never call `get_metadata` on a section or a page: it returns the whole tree.

3. **Load the cache** with the Read tool: `<slug>/fingerprint`, `<slug>/flows/<flowId>.md`, and `<slug>/screens/<id>.md` for every frame in scope. A missing file is empty. When the cache has no fingerprint line for the flow, read the legacy `memory/index/fingerprint` card (on a legacy memory page, if one still exists) or the newest `fingerprint:` on a `C-` card once as the baseline.

4. **Sort the frames.**
   - Same id, same fingerprint, description exists: **unchanged**. Do not describe it again.
   - Same id, fingerprint changed (or no description yet but a baseline line exists): **edit**. Describe it again.
   - New id: classify it (`memory-format`, Relations) against the cached screens of the same flow and its siblings in scope: `state of <id>`, `variant of <id>`, or `new`.
   - Cached screen whose id is gone from the file: **removed**. Keep its description file; drop it from the flow's `screens` line.
   Describe at most 12 frames in one run. When more need describing, take edits first, then the frames nearest the target, and say in the summary how many are left for next time.

5. **Describe** each frame that needs it (`memory-format`, Screen description). Use `get_design_context` or `use_figma` text reads for frames built from layers. Use `get_screenshot` only for frames that are a single image or have no readable text. Write `changes:` by comparing with the previous description: what a designer would notice (moved, added, removed, restyled, reworded), not layer counts. For a `state of` or `variant of` frame, write what differs from the screen it relates to.

6. **Infer the stage** (`memory-format`, Stage) from the fidelity of the frames in scope, not of the whole flow or page. A stage the designer stated in the flow mini-brief or in chat wins. Note the evidence in one short phrase.

7. **Write the cache** with the Write tool: each new or changed screen file, the flow file (purpose from the flow mini-brief or `unknown`, stage, screens, variants, states, `not_described`, `updated`; keep `anchor`, `parent`, `last_review` and `next` as they are), and the flow's line in `fingerprint`. Never write the fingerprint to Figma.

8. **Return** to the caller:
   - **changes:** a list of `{ id, name, kind (edit | variant | state | new | removed), what }`, only for frames that are not unchanged.
   - **gaps:** short plain-language sentences for what you could not or did not describe (frames left over by the 12-frame cap, `not_described`, loose images or screenshots you skipped), which `review` turns into `### Not covered yet`.
   - **stage** and its evidence, and whether it moved since the cached flow file (for example `explore → refine`).
   - **package** for the critique skill: the flow's purpose and stage, and for each screen in scope its description with the `relation` line. Group states under the screen they belong to, so a critic reviews the set once.
   - **summary**, 1 to 4 short lines for the designer, for example:
     ```
     Since the last review: image 3 edited (primary action now filled, upload box is a drop zone).
     New: image 6, a variant of image 3. image 7 is a state of image 4 (error shown).
     Stage: explore, from screenshots and placeholder amounts.
     ```
     On the first run for a flow: `First look at <flow>: <n> screens described. Stage: <stage>.`

The caller prints the summary. Do not print descriptions or the package.
