---
name: review
description: Guided design review for a Figma frame or flow. Looks at what changed since last time (digest), catches the memory up, picks the next best critique for the flow's stage, runs it with scoped context, writes the findings to Figma for triage there, and parks minor details during early exploration. Works silently. Use when the designer wants feedback on a screen or flow, or asks what to review next.
---

# Design Review

One silent pass: look, catch up, critique, write. The designer is never asked to confirm a guess or approve a draft, and is never asked for a reason. The only question in the whole pass is the purpose of a new flow, which `context` asks. Keep messages short and casual.

1. **Preflight, then scope.** Load `resolve` (the file, folder and slug), `memory-format` (read its `spec.md`, `workspace.md`, `state.md`, `findings.md`, `spec-helpers.js` and `finding-helpers.js`) and `figma-use`. Get the target node from the Figma URL or the selection, then run the whole Preflight (`state.md`). Until it passes, write nothing to Figma or to `<slug>/`; if a check fails, stop as the Preflight says, with `stage=review`. When it passes, write the stage line now (step 12, first bullet), and only then load `context` with the target node: it returns the flow chain, the kept cards and the already-considered list, and asks for a new flow's purpose. The stage line comes first so that a purpose prompt shows on the card as waiting on the terminal.

2. **Digest.** Load `digest` with the file, the target and the flow chain. Print its summary lines as they are.

3. **Catch up**, silently:
   - **Triage done in Figma.** `readFindings` for the scope. For `Dismissed` and `Done` instances, write or extend one `C-` card for this pass (`spec.md`, Change log card: one sentence in `changed`, frames as links, no `FD-` ids, name the topic): `changed` says what was fixed (from `Done`), and `dismissed:` lists short topics. Give a dismissal a reason only when the designer wrote one (the `Reason` property, or in chat); never infer why something was dismissed. Then remove those instances with `removeFinding`.
   - **Design edits.** For each `edit` in the digest's changes, fold it into the same `C-` card's `changed` (one sentence in all, with up to three frames in `nodes`; the detail stays in the local screen descriptions). Write `why:` only when the edit answers an open finding or question (name its topic); otherwise a short guess marked `(inferred)`, or leave `why` out when there is nothing to go on.
   - **Findings that landed.** For each `Will do` finding in scope whose claim the digest's changes clearly address, set `Done` with `Reason: Looks fixed (inferred, <date>)` and `Show reason` on (`spec.md`, Inferred content). Leave it on the canvas for the designer to see; like any `Done` one it is pruned by the next review.
   - **Questions for on-hold findings.** For each `On hold` finding in scope, add its `Q-` line with `addEntry` (`spec.md`, Open questions: the finding's scope, the question `<FD-id> deferred: <short reason or topic>`, today's date, ID from `nextMemoryId(md, "Q")`).
   - **Refine guesses.** In the `### file` brief and the `### <flowId>` entries of the flow chain, look at each value that is `unknown` or ends in `(inferred)` and is not the designer's (`spec.md`, Inferred content). Where the digest's screen purposes, copy and changes support a better guess, write it with `setKey`, with `(inferred)` appended. A flow registered in this pass gets its skipped `for:` and `who:` filled first; beyond those, change at most two values per pass, and leave a value alone when the evidence is no better than what is there.
   - **Direction.** Write a decision card with `status: inferred` (`spec.md`, Decision card) only for a direction-level event in the digest: every screen of a flow was removed (`F-01 dropped`), or several variants of one screen were reduced to one (`chose <variant> for <screen>`), or a new flow's stated purpose matches an existing flow's (`F-02 is an alternative to F-01`), or a topic dismissed in this pass matches a `dismissed:` topic on an earlier `C-` card or `### Earlier` line and no decision covers it yet. For a dismissed topic, the title is the rule a critic should follow (`Eufemia handles focus states`), `why:` is only the designer's reason, and the scope is the flow when both dismissals were in it, else `file`. At most two per pass. Never for single edits.
   - **Questions the designer ticked.** For each `- [x]` line still directly under `## Open questions` (above `### Answered`): when it asks about a brief key (a `start` question such as `Which platform is this for?`, or a flow's `for`, `who` or `done_when`) and the designer answered it, in text they added to the line or in a comment on it (`figma.spec.comments.getThread` with the uuid of its `[comment:<uuid>]` marker), write the answer verbatim with `setKey` to that key of the `### file` or `### <flowId>` entry, with no marker, unless the key already holds the designer's text. Then append the closing date if it is missing and move the line under `### Answered` (`spec.md`, Open questions); a line with a comment marker only gets the date and stays where it is, so the thread does not detach. Never delete a question line.
   Do not mention the catch-up beyond one line when it did something: "Logged 2 edits, FD-006 looks fixed."

4. **Seed the catalog** if `catalog` in the config (`.design-memory/config.json` in the shared design folder) is empty. Check each skill name against the current skill list and drop entries whose skill is not installed:

   | name | aliases | skill | for | phases |
   |---|---|---|---|---|
   | Cognitive load | load, cognitive | `cognitive-accessibility:assess-load` | flow clarity and mental effort | explore, refine |
   | UX critique | ux | `visual-critique:critique-ux` | flow and interaction problems | explore, refine |
   | Content | content, copy | `accessible-content:review` | headings, labels, readability | refine, polish |
   | Visual critique | visual, critique | `visual-critique:critique-screen` | hierarchy, color, type, composition | refine, polish |
   | Accessibility decisions | a11y | `accessibility-decisions:review` | accessibility decisions and debt | polish |

   Store entries as `{ "name", "aliases", "skill", "for", "phases" }`. The designer can add or edit entries; honor them.

5. **Choose the review.** The card always starts a review without an alias, so you choose. A designer typing `/design-memory:review visual` or a phrase ("is this readable?") in the terminal still gets the closest catalog entry; if nothing matches, say so and choose yourself. Otherwise choose, in this order:
   - Prefer entries whose `phases` include the flow's stage from the digest.
   - Prefer checks that have not run on this scope yet: a check has run when the flow's `reviews` line (local flow file) lists it with frames in scope. Note the first item's date now (the last review): step 11 rewrites the line, and step 12's `result` needs it.
   - Skip a check whose frames have not changed since it ran. Run it again on the frames that did.
   - Move a check up when open questions in scope point at it.
   - **Review again.** Started without an alias while findings in scope are still `Open`, `Will do` or `On hold`: do not start a check that has not run yet. Run again only the checks whose screens changed since they ran, on those screens. With no changes, the catch-up is the whole pass: say step 12's "nothing changed" sentence and go to step 11. A new check type on top of open findings needs a typed alias from the designer (`/design-memory:review <alias>`).
   If every fitting check already ran on unchanged screens, say step 12's "nothing new to review" sentence and go to step 11 with no findings.
   Say your choice and why in one line, for example "Running cognitive load: the new flow hasn't had one, and it's still in explore." Then run it. Do not wait for an answer.

6. **Run the critique skill** with the Skill tool, using the catalog's `skill` value. In the prompt include: the target (Figma URL and node), the scope line, the brief and flow mini-brief, the relevant decisions (active and inferred), the digest's package, the already-considered list with "These were already considered. Do not re-raise them unless the design has changed.", and the stage instruction:
   - `explore`: "This is early exploration. Focus on whether the flow serves its purpose, on structure and interaction, and on open questions. Do not report placeholder copy, placeholder numbers, spelling, spacing or formatting details."
   - `refine`: "This is being refined. Focus on interaction, hierarchy and clarity of content. Leave pixel-level polish out."
   - `polish`: "This is close to done. Consistency, copy, formatting and accessibility details all count."
   Do not change the other skill or its output format.

7. **Normalize** the output into a numbered list with short IDs (first letter of the skill plus a number: `C1`, `C2`). One item each: severity mapped to `P1`-`P3` (P1 critical, P2 important, P3 polish; map high/medium/low or any other scale), the claim, the reason, the node if given, and a `kind`: `structure-interaction` (flow, purpose, hierarchy, interaction), `a11y`, `copy-polish` (wording, spelling, tone), `pixel-format` (spacing, alignment, styling), `placeholder-content` (placeholder copy or sample content) or `data-math` (figures that are wrong, or do not add up). Pick the one that fits the claim, not its severity. Questions the critique raises (things to decide rather than things to fix) are written as `Q-` lines in step 9, not as findings. Keep the list in your working context. Do not print it.

8. **Filter by stage and kind.** The stage is the one `digest` inferred for the frames in scope (not the whole flow). Decide every item from this table, not by judgment:

   | kind | `explore` | `refine` | `polish` |
   |---|---|---|---|
   | `structure-interaction`, `a11y` | write | write | write |
   | `copy-polish`, `pixel-format` | park | park | write |
   | `placeholder-content`, `data-math` | drop | park | write |

   Any `P3` is also parked in `explore`. A dropped item is gone: it is not written anywhere. A parked item goes to `<slug>/parked.md` (`workspace.md`), not to Figma.
   - `polish`, or the digest says the stage moved to `polish`: also read the `parked.md` items for the frames in scope (a `flow:` item only when the whole flow is in scope). Check each parked item against the digest's current descriptions: still true, add it to the list; no longer true, drop it. Remove both kinds from `parked.md`.

9. **Write the findings to Figma.** For each item, allocate the `FD-` ID immediately before writing (`nextFindingId`) and write a `Finding` instance with `writeFinding`, status `open`, with the anchor's node id as `anchorId` (`findings.md`, Placement). Resolve the key first (`findings.md`, Finding library) and pass it as `libraryKey`. If `writeFinding` still throws `FINDING_LIBRARY_MISSING`, follow Missing library once and stop.
    Also write each question from step 7 as a `Q-` line with `addEntry` (`spec.md`, Open questions: the scope line from step 6, the question as the critique put it, today's date, ID from `nextMemoryId(md, "Q")` read right before each write).

10. **Hand over.** One or two lines: how many findings are on the canvas below their frames and the highest severity, how many were parked until polish, and how many questions were added. The designer sets statuses on the cards in Figma, whenever they like; the next review catches up. Do not list the findings in chat and do not ask for triage.
    If the designer says in chat "FD-004 will do, FD-006 dismiss", flip the instances with `readFindings` and `updateFinding` (`accepted`: done, yes, will do; `dismissed`: no, skip; `deferred`: later). Never infer `accepted` from vague replies such as "fine" or "ok": leave those `open`. A reason the designer gives goes on the finding's `Reason`.

11. **What I know.** Keep the spec's awareness section true to this pass (`spec.md`, What I know). In the flow's local file, put `<review name> <date> <frame ids it covered>` first on `reviews`, replacing that check's older item (left alone when no critique ran), and set `next` (the check you would choose next). Rewrite the flow's `### Flows` bullet (what it is for, the stage and its evidence from the flow file, marked `(inferred)` unless the designer stated it, last review and next, open finding and question counts from `readFindings` and the `Q-` lines in scope) and rewrite `### Not covered yet` from the digest's gaps (base screens left over by the digest's cap, `not_described`, anything it skipped) plus `<n> minor items are held back until polish` when `parked.md` has items for the flow. Both with `replaceLines`, in plain words, so the designer sees what you know and what you have not looked at.
    Then keep the change log short: when `## Change log` holds more than 10 `C-` cards, take each card past the 10 newest, append it as it is to `<slug>/changelog.md`, fold it into its month's line under `### Earlier`, then remove it from the spec (`spec.md`, Change log card). Leave a card that carries a comment marker in place.

12. **Stage line** (`state.md`). Keep it current throughout. The review has four steps. `progress` is only a liveness marker:
    - at step 1, once the preflight passed and before loading `context`: `stage=review`, `detail=looking at changes`, `progress=1/4`, `result=` (empty)
    - at step 4: `detail=choosing review`, `progress=2/4`
    - at step 6: `detail=running <review name>`, `progress=3/4`
    - at step 9: `stage=triage`, `detail=writing findings to Figma`, `progress=4/4`
    After step 11 clear `progress`, set `last=<review name>` (leave it when no critique ran), set `open`, `p1`, `p2`, `p3`, `f1`, `f2` and `f3` from `readFindings`, and set:
    - findings `Will do`: `stage=triage`, `detail=<n> changes to apply`
    - findings `Open` or `On hold`: `stage=triage`, `detail=<n> findings waiting in Figma`
    - nothing pending: `stage=idle`, `detail=` (empty)
    Write `result=` with one sentence, display only. A review that produced findings: leave it empty. `<date>` is the last-review date you noted at step 5 (for example `5 Nov`), never today's date. The "nothing changed" path: `Nothing changed since <date>. <n> still open.`, where `<n>` is the number of findings still `Open`, `Will do` or `On hold` in scope. The "nothing new to review" path: `Nothing new to review here since <date>.`, with no count.
