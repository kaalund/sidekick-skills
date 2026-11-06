---
name: context
description: Internal helper for design-memory skills. Given a Figma node, resolves its flow chain (registering a flow on first use and asking once what it is for and for whom) and loads only the memory entries in scope. Load before any review.
---

# Design Context

Given a target node, work out which flow it belongs to and load only the memory that applies. Never copy the whole memory spec into your working context: parse it in script and return only what is in scope.

1. Load `resolve`, `memory-format` and `figma-use`. Get the target node ID from the `node-id` in a Figma URL (convert `-` to `:`), or from the current selection, or ask.

2. **Find the memory.** `findMemorySpec`. When there is none but a legacy memory page exists, migrate it first (`memory-format`, Legacy memory page). When there is neither, say so and tell the designer to press Retry on the card, which runs `/design-memory:start`, instead of creating anything.

3. **Flow chain.** Read the `flows` entry under `## Index` (`parseMemory`, `entry.lines`). With `use_figma`, walk the node's ancestors (`node.parent` up to the page). For each ancestor that is a section, or the page, check whether its ID is an anchor in the flow map. Collect matches from innermost to outermost as the flow chain.

4. **Register a flow if the chain is empty.**
   - Find the nearest section ancestor. If there is none (a loose top-level frame), use the page as the flow anchor and say so.
   - Register it: allocate the next flow id (a nested id like `F-03.1` when the parent section or page is itself a registered flow, otherwise the next `F-0N`), add the line to the `flows` entry and a `(flow)` line to the `status` entry (replacing a `(no flows registered yet)` placeholder bullet), and say so in one line: "Registered *<name>* as <flowId>."
   - Then ask exactly one prompt, and only for a flow you just registered: "What is *<name>* for, and for whom? (skip is fine)". This is the only question the design-memory skills ask the designer, in `start` or in a review: what a flow is for cannot be seen on the canvas. Ask it while `progress` is set in the state file (`memory-format`, Stage line; `review` sets it from its first step): a skill that wrote `progress` and then stopped is shown on the card as waiting on the terminal. Ask it once, with no follow-ups, and carry on when the designer answers or skips. A page used as the anchor because there is no section gets the same prompt.
   - Write the `### <flowId>` brief entry under `## Brief` (`addEntry`) with `for:` (the purpose) and `who:` (the audience). A part the designer answered is written verbatim, with no marker. A part they skipped (purpose, audience, or both) becomes a best guess from the screen purposes and copy in the cached descriptions of the flow's screens (`<slug>/screens/*.md` in the shared design folder, read with the Read tool as `digest` does), written with `(inferred)` appended, when such descriptions exist. For a first-time flow none exist yet, and `review` runs `digest` right after `context`, so do not run a digest from here: write `unknown` for now, and `review` step 3 replaces it with an inferred guess once the digest has the screens. `done_when:` only if the answer covers it, otherwise `unknown`.
   - An existing flow is never asked about again, even when its mini-brief says `unknown` (keep that sentence as it is).

5. **Load entries.** Parse the spec once (`readMemoryMarkdown`, `parseMemory`) and read the entries under `## Decisions`, `## Brief` and the open questions, and the findings with `readFindings` (component instances on the design pages, plus legacy text cards on a legacy memory page). Keep an entry or finding if its scope is `file`, a flow in the chain (for ancestor flows, drop entries with `variant_only: yes`), or `frame:<nodeId>` for the target node. Drop everything else. A designer's comment on a line (`memory-format`, Entries) counts as text the designer wrote.

6. **Already considered.** Combine: the `dismissed:` lines on kept `C-` change log entries, the active decisions, and the kept findings that are still `accepted` or `deferred` (`Will do` or `On hold`). Dismissed and done findings are pruned, so they only live in the change log digest. Callers pass this list to critique skills.

7. Return: the spec's node id, the node ID, the flow chain, the kept entries grouped by section, and the already-considered list. State the scope to the user in one line, for example: "Scope: Checkout > Guest payment (3 decisions, 2 on-hold findings)".
