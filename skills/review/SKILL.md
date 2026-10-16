---
name: review
description: Guided design review for a Figma frame or flow. Picks the next best critique skill from memory, runs it with scoped context, writes the findings to Figma for triage there, and logs condensed findings. Use when the designer wants feedback on a screen or flow, or asks what to review next.
---

# Design Review

A guided sequence: one critique skill at a time, chosen from memory, followed by findings on the Figma canvas that the designer triages there. You suggest; the designer decides. Keep messages short and casual.

1. Load `context` and resolve the scope for the target node. Load `memory-format` and `figma-use`.

2. **Seed the catalog** if `catalog` in the config (`.design-memory/config.json` in the shared design folder) is empty. Check each skill name against the current skill list and drop entries whose skill is not installed:

   | name | aliases | skill | for | phases | order |
   |---|---|---|---|---|---|
   | Cognitive load | load, cognitive | `cognitive-accessibility:assess-load` | flow clarity and mental effort | explore, refine | 1 |
   | UX critique | ux | `visual-critique:critique-ux` | flow and interaction problems | explore, refine | 2 |
   | Content | content, copy | `accessible-content:review` | headings, labels, readability | refine, polish | 3 |
   | Visual critique | visual, critique | `visual-critique:critique-screen` | hierarchy, color, type, composition | refine, polish | 4 |
   | Accessibility decisions | a11y | `accessibility-decisions:review` | accessibility decisions and debt | polish, handoff | 5 |

   Store entries as `{ "name", "aliases", "skill", "for", "phases", "order" }`. The designer can add or edit entries; honor them.

3. **Choose the next review.** Start from catalog `order`, then adjust with memory:
   - Filter by the brief's `phase` (from `memory/index/project` or the flow context).
   - Skip a review run recently on an unchanged frame (compare the flow's line in `memory/index/fingerprint` and the dates of findings for that skill).
   - Re-suggest a review when the frame changed after its last run.
   - Move a skill up when open questions in scope point at it.
   - Structure before polish: flow clarity and cognitive load, then content, then visual, then accessibility last.

4. **Optional argument.** If the user gave an alias (`/review visual`) or a plain phrase ("is this readable?"), match the closest catalog entry and skip step 5's suggestion. If nothing matches, say so and fall back to your suggestion.

5. **Suggest and confirm.** Say your choice and the reason in one line, e.g. "Next: cognitive load. Checkout hasn't had one and is still in exploration." Offer: go, skip, or pick another (list the others by friendly name). Wait for one word.

6. **Run the critique skill** with the Skill tool, using the catalog's `skill` value. In the prompt include: the target (Figma URL and node), the scope line, the brief and flow mini-brief, the relevant decisions, and the already-considered list with this instruction: "These were already considered. Do not re-raise them unless the design has changed." Do not change the other skill or its output format.

7. **Normalize** the output into a numbered list with short IDs (first letter of the skill plus a number: `C1`, `C2`). One item each: severity mapped to `P1`-`P3` (P1 critical, P2 important, P3 polish; map high/medium/low or any other scale), the claim, and the node if given. Keep the list in your working context. Do not print it.

8. **Write the findings to Figma first.** Do not ask for triage before this. For each item, allocate the `FD-` ID immediately before writing (use `nextFindingId`) and write a `Finding` component instance with `writeFinding`, status `open`, placed on the design page directly below the frame it is about. Pass the frame's node id as `anchorId`: the finding's `frame:` scope, or the reviewed frame when the scope is a flow or the file. Several findings for one frame stack below it. Pass `findingComponentKey` from the config as `libraryKey` if set. If the component set is missing, create it per `start` first.

9. **Hand triage to Figma.** Say in one or two lines that the findings are on the canvas below their frames (how many, and the highest severity), and that the designer sets statuses on the cards in Figma, whenever and in whatever order. Do not list the findings in chat and do not ask for triage here. If the designer says in chat "FD-004 will do, FD-006 dismiss", read the current state with `readFindings` and flip the instances with `updateFinding` (both find instances on every page). Map the words:
   - `accepted`: done, yes, will do
   - `dismissed`: no, skip, with an optional reason
   - `deferred`: later
   Never infer `accepted` from vague replies such as "fine", "ok", "all good": ask once "Which of these should I mark as accepted?" and otherwise leave them `open`. Never ask for a reason. For newly deferred findings add one combined `Q-` card (not one per finding), then prune per step 11. Statuses the designer set in Figma are picked up the next time this skill runs (step 11).

10. **Offer promotion.** For a dismissal whose reason generalizes (brand, platform or audience constraints), propose a decision card scoped to the flow. Show the draft and write it to `02 Decisions` only if the designer says yes.

11. **Prune.** The findings list is a working list, not a history. Whenever you see `Dismissed` or `Done` instances (after triage here or later in Figma), condense and remove them:
    - Write one `C-` change log card for the triage with `changed` (what was fixed, from the `Done` ones), and a `dismissed:` line (short topics with a brief reason or decision id). Do not put a fingerprint on the card. If a card for this triage already exists, add to it instead.
    - Then remove the `Dismissed` and `Done` instances with `node.remove()`. Keep `Open`, `Will do` and `On hold`.
    - Do not write a `Q-` card per on-hold finding; one combined card listing the finding ids is enough.

12. **Update status and re-evaluate.** Update the flow's line in `memory/index/status` (`last_review`, `next`, `open_q`). Then suggest the next review with a reason, or say "that's enough for now". If accepted findings imply layout changes, say "apply those first, then I'll pick up with <next>" and stop.

13. **Stage line** (`memory-format`). Keep it current throughout: at step 5 `stage=review`, `detail=choosing review`, `actions=` (empty); at step 6 `detail=running <review name>`; at step 8 `stage=triage`, `detail=<n> findings on the canvas`. After step 12 set `open` from `readFindings`, copy `phase` from `memory/index/project`, and set:
    - findings with status `Will do` or accepted layout changes: `stage=fix`, `detail=<n> changes to apply`
    - findings still `Open` or `On hold`: `stage=triage`, `detail=<n> findings waiting in Figma`
    - nothing pending: `stage=idle`, `detail=` (empty)

    Leave `next` empty: nothing steers the designer to checkpoint or export. Write `actions` instead (format in `memory-format`): the next suggested review from step 12 (label its friendly name, command `/design-memory:review <first alias>`), a second suggestion if there is one, and `Checkpoint|/design-memory:checkpoint` last, only when findings are `Will do` or `Done`. At most three. Never offer Export.
