---
name: context
description: Internal helper for design-memory skills. Given a Figma node, resolves its flow chain (registering a flow on first use and asking once what it is for and for whom) and loads only the memory entries in scope. Load before any review.
---

# Design Context

Given a target node, work out which flow it belongs to and load only the memory that applies. Never copy the whole memory spec into your working context: parse it in script and return only what is in scope.

1. Load `resolve` and `memory-format` (read its `spec.md`, `workspace.md`, `findings.md`, `spec-helpers.js` and `finding-helpers.js`) and `figma-use`. Get the target node ID from the `node-id` in a Figma URL (convert `-` to `:`), or from the current selection, or ask.

2. **Find the memory.** `findMemorySpec`. When there is none, say so and tell the designer to press Retry on the card, which runs `/design-memory:start`, instead of creating anything.

3. **Read the page structure** (`workspace.md`, Page structure), first level only. With one `use_figma` script, list the top-level nodes of the target's page and the names of the file's other pages (a page called `Old` or `Archive` is a strong cue, recorded on the `pages:` line of `structure`). Compare with `<slug>/structure`: unchanged ids and names mean reuse it and read nothing more. Otherwise classify only the new or renamed nodes into roles (`current`, `earlier:<name>`, `journey`, `reference`, `unclear`) and write `<slug>/structure`. The spec's `### How I read this page` bullets win over the local file: a name the designer moved or commented on keeps their role. When the roles changed, rewrite those bullets (`replaceLines`, or `addEntry` under `## What I know` the first time), in plain words. Do not mention it beyond one line when the read changed: "Read the page: V0.2.1 is current, v00 and v01 are earlier rounds."

4. **Flow chain.** Read the flow anchors from the local flow files (`<slug>/flows/*.md`, `anchor:` and `parent:`); when there are none, rebuild them from the `### Flows` bullets under `## What I know` (`workspace.md`, Flow description). With `use_figma`, walk the node's ancestors (`node.parent` up to the page). A `section:<id>` anchor matches an ancestor section with that id. A `frames:<ids>` anchor matches when the target's top-level ancestor is one of the listed frames. Collect matches from innermost to outermost as the flow chain.

5. **Register a flow if the chain is empty.**
   - The anchor is the nearest section ancestor (`section:<id>`). With none (a loose top-level frame), it is the page's loose top-level frames that are not `earlier:` or `reference` (`frames:<ids>`), named after the page. Never the whole page: a page is not a flow. Say which in one line.
   - A target inside an `earlier:` section is registered like any other flow (named `<section name> (earlier round)`), because an explicit selection wins; it is simply never in scope by default.
   - Register it: allocate the next flow id (a nested id like `F-03.1` when the parent section is itself a registered flow, otherwise the next `F-0N`, taking the highest of the local flow files and the `### Flows` bullets), write `<slug>/flows/<flowId>.md` with `id`, `name`, `anchor` and `parent`, add the bullet to `### Flows` (replacing the `(no flows registered yet)` placeholder; the bullet names the flow and its anchor in words, `spec.md`, What I know), and say so in one line: "Registered *<name>* as <flowId>."
   - Then ask exactly one prompt, and only for a flow you just registered: "What is *<name>* for, and for whom? (skip is fine)". This is the only question the design-memory skills ask: what a flow is for cannot be seen on the canvas. Ask it once, with no follow-ups, and carry on when the designer answers or skips. Loose frames used as the anchor get the same prompt.
   - Write the `### <flowId>` brief entry under `## Brief` (`addEntry`) with `for:` (the purpose) and `who:` (the audience). A part the designer answered is written verbatim, with no marker; a skipped part is `unknown` (`review` guesses it once the digest has the screens). `done_when:` only if the answer covers it, otherwise `unknown`.
   - An existing flow is never asked about again, even when its mini-brief says `unknown` (keep that sentence as it is).

6. **Load entries.** Parse the spec once (`readMemoryMarkdown`, `parseMemory`) and read the entries under `## Decisions`, `## Brief` and the open questions, and the findings with `readFindings`. Keep an entry or finding if its scope is `file`, a flow in the chain (for ancestor flows, drop entries with `variant_only: yes`), or `frame:<nodeId>` for the target node. Drop everything else. A designer's comment on a line counts as text the designer wrote.

7. **Already considered.** Combine: the `dismissed:` lines on kept `C-` change log entries, the dismissed topics on `### Earlier` lines (those tagged with a flow outside the chain dropped), the active decisions, and the kept findings that are still `accepted` or `deferred` (`Will do` or `On hold`). Dismissed and done findings are pruned, so they only live in the change log digest. Callers pass this list to critique skills.

8. Return: the spec's node id, the node ID, the flow chain, the page structure (roles per top-level node), the kept entries grouped by section, and the already-considered list. State the scope to the user in one line, for example: "Scope: Checkout > Guest payment (3 decisions, 2 on-hold findings)".
