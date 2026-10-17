---
name: export
description: Export the design memory from a Figma file into a repo as markdown (docs/decisions/*.md) when a design becomes a prototype or a production-code branch. After this the repo copy is canonical. Use when handing a design off to code.
---

# Design Export

Export the memory from Figma into a repo. This is a one-way transfer; afterwards the repo copy is canonical.

1. Load `resolve`, `memory-format` and `figma-use`. Confirm the target folder or linked repo with the designer, and the target directory (default `docs/decisions/`).

2. **Existing ADL.** Check whether the target directory already has an ADL (any `*.md` or an index). If so, ask: write alongside under `docs/decisions/design-memory/`, or merge into the existing numbering. Default to alongside. Never overwrite existing files.

3. Read every card from the six card frames with `use_figma`; read findings with `readFindings` (instances placed under frames on the design pages, plus legacy text cards). `06 Components` is not exported.

4. **Write** these files to the target directory:
   - `README.md`: the file-level brief, the flow map, and the Figma URL and file key.
   - `decisions.md`: all decision cards, active first; superseded ones in a separate section with their `superseded_by` links.
   - `change-log.md`: change log cards in order.
   - `findings.md`: the findings (from `readFindings`) as a markdown table (`id | skill | severity | scope | claim | status | reason | date`), using card statuses (`open`, `accepted`, `deferred`; dismissed and done findings are pruned, so the change log digest covers them).
   - `open-questions.md`: open and closed questions.
   - `flows/<flowId>-<slug>.md`: one file per flow with its mini-brief and its scoped cards.

   Preserve all IDs, scope values and Figma node links. Node links use `https://www.figma.com/design/<fileKey>/?node-id=<id with ':' replaced by '-'>`.

5. Ask the designer to review the export in the folder.

6. **After approval, mark Figma.** Set `canonical: repo:<path>` in `memory/index/project` and add a line to the text of `memory/index/project`: `exported: <date> to <path>; the repo copy is canonical from now on`. If the registry `kind` was `new` and the target is a different repo, update it to `linked-repo`.

7. Do not delete or alter any other Figma memory.

8. **Stage line** (`memory-format`). Set `stage=export`, `detail=exporting to <path>` at step 4, and after step 6 `stage=idle`, `detail=repo copy is canonical`. Copy `last`, `open`, `p1`, `p2`, `p3`, `f1`, `f2` and `f3` over from the existing state file.
