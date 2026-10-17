---
name: checkpoint
description: Check in after a meaningful design change. Compares the current frames to the last checkpoint, drafts change log and decision entries for approval, and checks whether accepted findings landed. Use after finishing a chunk of work in a flow.
---

# Design Checkpoint

Log a meaningful change in the design memory. You draft; the designer approves. Keep messages short and casual.

1. Load `context` and resolve the scope (frame or flow). Load `memory-format` and `figma-use`.

2. **Current state.** For the frames in scope, call `get_metadata` for structure and, for at most 3 key frames, `get_screenshot`. Compute a fingerprint for every frame in scope: `nodeId|name|childCount|WxH`, joined by ` ; `.

3. **Diff.** Read the flow's line in `memory/index/fingerprint`. If it does not exist, fall back to the `fingerprint` on the newest `C-` card for this scope (legacy). If neither exists, say this is the first checkpoint and skip the diff. Otherwise list: frames added or removed, renamed, child count changed, size changed.

4. **Ask the designer one question:** "What did you change, in a sentence?" The fingerprint diff is evidence, not the whole story: it cannot see visual edits. Combine both.

5. **Draft** (nothing is written yet):
   - one `C-` change log card (`changed`, a likely `why` marked `(inferred)`, `nodes`, and `dismissed:` for findings the designer set to `Dismissed` in Figma), but only if something changed, was dismissed or landed. If nothing did, say so, propose no card, and only update the index
   - the new fingerprint, which goes into `memory/index/fingerprint`, never on the card
   - findings whose status in Figma no longer matches the last card's story, listed as a one-line reconciliation
   - any new decisions, or existing ones to supersede (name the old ID)
   - open questions to open or close

6. **Soft check.** For each finding in scope (`readFindings`) with status `accepted` (`Will do`), use the diff and screenshots to say whether it appears to have landed. Offer to set `landed` for those that did. Flag the rest as "accepted but not visible yet". Do not change statuses without approval.

7. **Approval.** Show all drafts in chat and ask for approval or edits. Write nothing before approval.

8. **Write** the approved entries. Allocate each ID immediately before writing. For approved `landed` findings and any findings the designer set to `Dismissed` or `Done` in Figma, mention them in the `C-` card (`changed`, `dismissed:`) and remove those instances (pruning rule in `memory-format`). To supersede a decision, update the old card: `status: superseded` and `superseded_by: <new ID>`. Never delete other cards.

9. **Index.** Update `last_checkpoint` in `memory/index/project` (`<date> (C-###)` when a card was written, otherwise `<date> (no changes)`), the flow's line in `memory/index/status` including the next suggested review, and the flow's line in `memory/index/fingerprint` (create the card if missing). If legacy `fingerprint:` lines remain on `C-` cards, offer once to remove them; do it only with approval.

10. **PM note.** Finish with one or two lines on what looks neglected (reviews never run, questions open a long time, decisions without a `why`) and the suggested next step. Suggestions only.

11. **Stage line** (`memory-format`). At step 2 set `stage=checkpoint`, `detail=comparing to last checkpoint`. After step 10 set `open`, `p1`, `p2`, `p3`, `f1`, `f2` and `f3` from `readFindings`, copy `last` over from the existing state file, and set `stage=triage` (`detail=<n> findings waiting in Figma`) if open findings remain, otherwise `stage=idle`.
