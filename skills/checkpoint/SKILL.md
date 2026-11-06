---
name: checkpoint
description: Catch up the design memory without running a critique. Looks at what changed (digest), logs edits, picks up the triage done in Figma, marks findings that look fixed, and refreshes the card's counts. Works silently. Use when the designer wants the memory and the card up to date without a review. Every review does the same catch-up first.
---

# Design Catch-up

The first half of `review`, without the critique. Silent: no questions, no drafts to approve. Keep messages short and casual.

1. **Scope.** Load `memory-format` and `figma-use`. Load `context` with the target node, or with the file's registered flows when there is no link. It may ask a new flow's purpose; that is the only question.

2. **Digest.** Load `digest` for each flow in scope. Print its summary lines.

3. **Catch up.** Do exactly what `review` step 3 describes: triage done in Figma, design edits, findings that landed, direction, index. Same rules: never infer why something was dismissed, mark every guess as inferred.

4. **Parked findings.** If the digest says a flow's stage moved to `polish`, bring its parked findings back as `review` step 8 describes, and write the ones that still apply with `review` step 9.

5. **Hand over.** One or two lines: what was logged, what looks fixed, what is still open. If nothing changed, say "Nothing new since <date>."

6. **Status.** Update the flow's bullet in the `status` entry (keep `next`, refresh `open_q`).

7. **Stage line** (`memory-format`). At step 1 set `stage=checkpoint`, `detail=catching up`, `progress=1/2`; at step 3 `progress=2/2`. At the end clear `progress`, set `open`, `p1`, `p2`, `p3`, `f1`, `f2` and `f3` from `readFindings`, copy `last` over, and keep the existing `actions` (they still point at the next review). Then:
   - findings `Will do`: `stage=fix`, `detail=<n> changes to apply`
   - findings `Open` or `On hold`: `stage=triage`, `detail=<n> findings waiting in Figma`
   - nothing pending: `stage=idle`, `detail=` (empty)
