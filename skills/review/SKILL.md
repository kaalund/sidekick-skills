---
name: review
description: Guided design review for a Figma frame or flow. Looks at what changed since last time (digest), catches the memory up, picks the next best critique for the flow's stage, runs it with scoped context, writes the findings to Figma for triage there, and parks minor details during early exploration. Works silently. Use when the designer wants feedback on a screen or flow, or asks what to review next.
---

# Design Review

One silent pass: look, catch up, critique, write. The designer is never asked to confirm a guess or approve a draft, and is never asked for a reason. The only question in the whole pass is the purpose of a new flow, which `context` asks. Keep messages short and casual.

1. **Scope.** Load `memory-format` and `figma-use`. Load `context` with the target node: it returns the flow chain, the kept cards and the already-considered list, and asks for a new flow's purpose.

2. **Digest.** Load `digest` with the file, the target and the flow chain. Print its summary lines as they are.

3. **Catch up** (what `checkpoint` used to do), silently:
   - **Triage done in Figma.** `readFindings` for the scope. For `Dismissed` and `Done` instances, write or extend one `C-` card for this pass: `changed` lists what was fixed (from `Done`), and `dismissed:` lists short topics. Give a dismissal a reason only when the designer wrote one (the `Reason` property, or in chat); never infer why something was dismissed. Then remove those instances with `removeFinding`.
   - **Design edits.** For each `edit` in the digest's changes, add it to the same `C-` card's `changed` (with `nodes`). Write `why:` only when the edit answers an open finding or question ("addresses FD-006"); otherwise a short guess marked `(inferred)`, or leave `why` out when there is nothing to go on.
   - **Findings that landed.** For each `Will do` finding in scope whose claim the digest's changes clearly address, set `Done` with `Reason: Looks fixed (inferred, <date>)` and `Show reason` on (`memory-format`, Inferred content). Leave it on the canvas for the designer to see. A `Done` finding whose reason starts with `Looks fixed (inferred` from an earlier pass is pruned like any other `Done` one.
   - **Direction.** Write a decision card with `status: inferred` (`memory-format`, Decision card) only for a direction-level event in the digest: every screen of a flow was removed (`F-01 dropped`), or several variants of one screen were reduced to one (`chose <variant> for <screen>`), or a new flow's stated purpose matches an existing flow's (`F-02 is an alternative to F-01`). At most two per pass. Never for single edits.
   - **Index.** Update `last_checkpoint` in `memory/index/project` (`<date> (C-###)` or `<date> (no changes)`).
   Do not mention the catch-up beyond one line when it did something: "Logged 2 edits, FD-006 looks fixed."

4. **Seed the catalog** if `catalog` in the config (`.design-memory/config.json` in the shared design folder) is empty. Check each skill name against the current skill list and drop entries whose skill is not installed:

   | name | aliases | skill | for | phases | order |
   |---|---|---|---|---|---|
   | Cognitive load | load, cognitive | `cognitive-accessibility:assess-load` | flow clarity and mental effort | explore, refine | 1 |
   | UX critique | ux | `visual-critique:critique-ux` | flow and interaction problems | explore, refine | 2 |
   | Content | content, copy | `accessible-content:review` | headings, labels, readability | refine, polish | 3 |
   | Visual critique | visual, critique | `visual-critique:critique-screen` | hierarchy, color, type, composition | refine, polish | 4 |
   | Accessibility decisions | a11y | `accessibility-decisions:review` | accessibility decisions and debt | polish, handoff | 5 |

   Store entries as `{ "name", "aliases", "skill", "for", "phases", "order" }`. The designer can add or edit entries; honor them.

5. **Choose the review.** If the designer gave an alias (`/review visual`) or a phrase ("is this readable?"), run the closest catalog entry; if nothing matches, say so and choose yourself. Otherwise choose, in this order:
   - Prefer entries whose `phases` include the flow's stage from the digest.
   - Prefer checks that have not run on this scope yet (compare with the `skill` and dates of the findings for the scope and the flow's `last_review` in `memory/index/status`).
   - Skip a check that already ran on this scope when the digest found no changes since then. Run it again when the screens it covered changed.
   - Move a check up when open questions in scope point at it.
   - **Review again.** Started without an alias while findings in scope are still `Open`, `Will do` or `On hold` (the card's Review again chip): do not start a check that has not run yet. Run again only the checks whose screens changed since they ran, on those screens. With no changes, the catch-up is the whole pass: say "Nothing changed since <last review>. <n> findings still open." and go to step 11. A new critique on top of open findings needs an alias from the designer (the card's menu).
   If every fitting check already ran on unchanged screens, say "Nothing new to review here since <last review>." and go to step 11 with no findings.
   Say your choice and why in one line, for example "Running cognitive load: the new flow hasn't had one, and it's still in explore." Then run it. Do not wait for an answer.

6. **Run the critique skill** with the Skill tool, using the catalog's `skill` value. In the prompt include: the target (Figma URL and node), the scope line, the brief and flow mini-brief, the relevant decisions (active and inferred), the digest's package, the already-considered list with "These were already considered. Do not re-raise them unless the design has changed.", and the stage instruction:
   - `explore`: "This is early exploration. Focus on whether the flow serves its purpose, on structure and interaction, and on open questions. Do not report placeholder copy, placeholder numbers, spelling, spacing or formatting details."
   - `refine`: "This is being refined. Focus on interaction, hierarchy and clarity of content. Leave pixel-level polish out."
   - `polish`: "This is close to done. Consistency, copy, formatting and accessibility details all count."
   Do not change the other skill or its output format.

7. **Normalize** the output into a numbered list with short IDs (first letter of the skill plus a number: `C1`, `C2`). One item each: severity mapped to `P1`-`P3` (P1 critical, P2 important, P3 polish; map high/medium/low or any other scale), the claim, the reason, and the node if given. Questions the critique raises (things to decide rather than things to fix) become `Q-` lines in `05 Open questions`, not findings. Keep the list in your working context. Do not print it.

8. **Filter by stage.**
   - `explore`: park every `P3` item, and any item about placeholder copy or numbers, in `files/<slug>/parked.md` (`memory-format`, Parked findings). They do not go to Figma.
   - `refine`: write everything.
   - `polish`, or the digest says the stage moved to `polish`: also read `parked.md` for this flow. Check each parked item against the digest's current descriptions: still true, add it to the list; no longer true, drop it. Remove both kinds from `parked.md`.

9. **Write the findings to Figma.** For each item, allocate the `FD-` ID immediately before writing (use `nextFindingId`) and write a `Finding` component instance with `writeFinding`, status `open`, placed in the findings frame of the frame it is about (`<frame name> - Sidekick Findings 🤖`, directly below that frame). Pass the frame's node id as `anchorId`: the finding's `frame:` scope, or the reviewed frame when the scope is a flow or the file. Resolve the library first (`memory-format`, Findings, Finding library) and pass its key as `libraryKey`. If the `Sidekick` library is missing, do not build the component and do not write any finding: follow Missing library (`needs=library`) and stop. Then write the screens' `findings:` lines in the cache.

10. **Hand over.** One or two lines: how many findings are on the canvas below their frames and the highest severity, how many were parked until polish, and how many questions were added. The designer sets statuses on the cards in Figma, whenever they like; the next review catches up. Do not list the findings in chat and do not ask for triage.
    If the designer says in chat "FD-004 will do, FD-006 dismiss", flip the instances with `readFindings` and `updateFinding` (`accepted`: done, yes, will do; `dismissed`: no, skip; `deferred`: later). Never infer `accepted` from vague replies such as "fine" or "ok": leave those `open`. A reason the designer gives goes on the finding's `Reason`.

11. **Status.** Update the flow's line in `memory/index/status` (`last_review`, `next`, `open_q`).

12. **Stage line** (`memory-format`). Keep it current throughout. The review has four steps for the card's progress bar:
    - at step 1: `stage=review`, `detail=looking at changes`, `progress=1/4`, `actions=` (empty)
    - at step 4: `detail=choosing review`, `progress=2/4`
    - at step 6: `detail=running <review name>`, `progress=3/4`
    - at step 9: `stage=triage`, `detail=writing findings to Figma`, `progress=4/4`
    After step 11 clear `progress`, set `last=<review name>` (leave it when no critique ran), set `open`, `p1`, `p2`, `p3`, `f1`, `f2` and `f3` from `readFindings`, and set:
    - findings `Will do`: `stage=fix`, `detail=<n> changes to apply`
    - findings `Open` or `On hold`: `stage=triage`, `detail=<n> findings waiting in Figma`
    - nothing pending: `stage=idle`, `detail=` (empty)
    Write `actions` (format in `memory-format`): the next suggested review (label its friendly name, command `/design-memory:review <first alias>`) and a second suggestion if there is one. At most two. Catch up lives in the card's menu and is never offered here.
