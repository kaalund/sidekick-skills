---
name: context
description: Internal helper for design-memory skills. Given a Figma node, resolves its flow chain (registering a flow on first use) and loads only the memory cards in scope. Load before any review or checkpoint.
---

# Design Context

Given a target node, work out which flow it belongs to and load only the memory that applies. Never load the whole Memory page into your working context.

1. Load `resolve`, `memory-format` and `figma-use`. Get the target node ID from the `node-id` in a Figma URL (convert `-` to `:`), or from the current selection, or ask.

2. **Flow chain.** Read `memory/index/flows`. With `use_figma`, walk the node's ancestors (`node.parent` up to the page). For each ancestor that is a section, or the page, check whether its ID is an anchor in the flow map. Collect matches from innermost to outermost as the flow chain.

3. **Register a flow if the chain is empty.**
   - Find the nearest section ancestor. If there is none (a loose top-level frame), use the page as the flow anchor and say so.
   - Register it without asking: allocate the next flow id (a nested id like `F-03.1` when the parent section or page is itself a registered flow, otherwise the next `F-0N`), add the line to `memory/index/flows` and a `(flow)` line to `memory/index/status`, and say so in one line: "Registered *<name>* as <flowId>."
   - Do not interview the designer about the flow: it inherits the file brief. Write `memory/brief/<flowId>` (keys `for`, `who`, `done_when`) only if the designer volunteers that content.

4. **Load cards.** Read the cards in `02 Decisions`, `05 Open questions` and `01 Brief`, and the findings with `readFindings` (component instances on the design pages, plus legacy text cards in `04 Findings`). Keep a card or finding if its scope is `file`, a flow in the chain (for ancestor flows, drop cards with `variant_only: yes`), or `frame:<nodeId>` for the target node. Drop everything else.

5. **Already considered.** Combine: the `dismissed:` lines on kept `C-` change log cards, the active decisions, and the kept findings that are still `accepted` or `deferred` (`Will do` or `On hold`). Dismissed and done findings are pruned, so they only live in the change log digest. Callers pass this list to critique skills.

6. Return: the node ID, the flow chain, the kept cards grouped by topic, and the already-considered list. State the scope to the user in one line, for example: "Scope: Checkout > Guest payment (3 decisions, 2 on-hold findings)".

If the Memory page does not exist, say so and suggest `/start` instead of creating anything.
