# The memory spec

Part of `memory-format`.

## Memory spec

The memory is one Figma spec (a native `SPEC_BLOCK` document, GitHub-flavoured markdown) named exactly `🤖 Agentic memory.md`, on the page with the designs. It sits 80px to the left of the journey section it relates to, top aligned with it, so the designer reads it next to the flows. Skills read and write it only through `figma.spec.*` (`spec-helpers.js`), never through text nodes.

The document is the H1 title block, then five H2 sections in this order: `## Open questions`, `## What I know`, `## Brief`, `## Decisions`, `## Change log`. Never name an H3 like a section.

The spec is for the designer to read, so it holds only what a designer needs: what is waiting for them (open questions first, so they are never buried), what the agent understands about the file and where it is blind (`What I know`), the brief, the decisions and a short history. No node ids, folder paths, fingerprints or counts the cache already holds: machine state lives in the local cache (`workspace.md`). A frame is named in words and, where a pointer helps, linked with `[name](https://www.figma.com/design/<fileKey>/?node-id=<id with ':' replaced by '-'>)`.

## Entries

An entry is an `### <ID> <title>` heading, a blank line, then `- key: value` lines. A value is one line; a value with several items is a key with nested bullets (`  - item`). Parse by splitting each bullet on the first `: `. Findings are the exception: they are component instances on the canvas (`findings.md`). "Card" in the other skills means an entry in the spec.

- Figma normalises the markdown when it stores it (a blank line after every heading, `- ` bullets), so always write that form.
- New entries go directly under their section heading, newest first. Edit an entry with the helpers: they change one line and never rewrite the document, so a designer or another agent editing elsewhere is not overwritten. Do not use `setContent` on an existing spec: it recreates the document and drops the designer's comments.
- Read the whole document in script (`readMemoryMarkdown`, which pages through long documents) and return only the entries in scope. The document grows without limit and must never be copied into the conversation whole.
- Never delete a decision, change log, brief, flow or question entry. Supersede or resolve it by updating its text. The one exception is the change log roll-up (Change log card).

### Decision card (`D-###`)

```
### D-007 Use inline validation on the payment form

- status: active          # active | inferred | superseded
- scope: flow:F-03
- date: 2026-10-12
- context: Guest payment form had a long error list on submit.
- why: Inline validation cuts the recovery effort.
- alternatives: Error summary at top (rejected: forces scrolling)
- nodes: [Payment](https://www.figma.com/design/FILEKEY/?node-id=12-34)
```

(The `# …` note is documentation, not written to the spec.) The heading carries the id and the title. Optional keys: `superseded_by: D-012` (set when `status: superseded`), `variant_only: yes`.

### Brief cards

Under `## Brief`: `### file` and `### F-03`.

- File brief keys: `purpose`, `users`, `goals`, `constraints`, `platform`, `brand`, `references`, `risks`.
- Flow mini-brief keys: `for`, `who`, `done_when`.
- A skipped answer is the literal `unknown`. A value a skill guessed instead of being told ends in `(inferred)`.

### Change log card (`C-###`)

```
### C-004

- date: 2026-10-12
- scope: flow:F-03
- changed: Moved coupon field below the total
- why: Likely to reduce hesitation before payment (inferred)
- nodes: [Payment](https://www.figma.com/design/FILEKEY/?node-id=12-34)
```

Keep `changed` to one sentence and `nodes` to the few frames a designer would open, as links with the frame's name. What else changed is in the local screen descriptions. Never cite an `FD-` id in a card: findings are pruned, so the reference dies; name the topic. Optional key `dismissed:`: one line of short topics for findings dismissed in a triage, each with a brief reason in parentheses only when the designer gave one (`dismissed: Egenkapital focus states (Eufemia); touch targets under 44px`). It exists so later reviews do not re-raise them; keep it to topics.

Write a `C-` card only when something happened: a design change, a dismissal, or a finding that landed. A catch-up with nothing to report writes no card and changes nothing in the spec.

**Roll-up.** The spec keeps the 10 newest `C-` cards. `review` rolls older ones into `### Earlier`, the last entry of the section (create it when missing), one bullet per month, newest month first:

```
### Earlier

- 2026-10: Payment form moved to inline validation; coupon field below the total. Dismissed: Egenkapital focus states (Eufemia, F-02); touch targets under 44px
```

One sentence for what changed that month, then its dismissed topics, each with the flow id when the card's scope was a flow and the designer's reason as on the card. Extend an existing month line rather than adding a second. The bullets are lines, edited like `### Flows` (What I know). The full cards are kept in `<slug>/changelog.md` (`workspace.md`).

### Open questions

`## Open questions` is the first section, so what waits for the designer is the first thing they see. An open question (`Q-###`) is a task-list line directly under the heading (no sub-bullets), newest first:

```
- [ ] Q-009 | flow:F-03 | FD-016 deferred: error copy needs content review | 2026-10-12
```

Columns: `id | scope | question | opened | closed`. An open question has no `closed` column. When the designer ticks the box in Figma, the next `review` catch-up appends the closing date and moves the line under an `### Answered` heading at the bottom of the section (create it when missing), so the open ones stay on top (a line with a comment marker only gets the date and stays in place):

```
### Answered

- [x] Q-008 | file | Which approval flow applies? | 2026-10-10 | 2026-10-12
```

An empty section means nothing is open; write no placeholder line. Never delete a question.

**One line per question.** Before adding a `Q-` line, look for an existing one (open or closed, above or under `### Answered`) that asks the same thing, matched on its question text, and skip the new one if there is. A deferred finding (`On hold`) gets a line whose question starts with its `FD-` id, written by `review` in the pass that finds it `On hold`. Any other `FD-` id in a question dies when the finding is pruned, so cite none.

### What I know

The agent's awareness of the file, in plain sentences for the designer, rewritten by `review` after each pass (a status, not a log). Three entries under `## What I know`:

- `### Flows`: one bullet per flow, `- **F-03 Checkout** (section "Checkout"): <what it is for>. Looks like <stage> (inferred), from <evidence>. Last reviewed with <review> on <date>; next up: <review>. <n> findings open, <n> questions.` The parentheses name the anchor in words: `section "<name>"` or `loose frames`, then `, inside F-01` for a nested flow. Drop the review sentence before the first review. Node ids stay in the local flow file. Until a flow is registered the entry is the single bullet `(no flows registered yet)`.
- `### How I read this page`: how the designer structures the page, from the first-level read (`workspace.md`, Page structure). One bullet per role, only roles that occur, the node names in italics: `- **Current:** *V0.2.1*`, `- **Earlier rounds** (left out of reviews, still read for what changed): *v00*, *v01*`, `- **Not a flow:** *app icon*`, `- **Unclear** (included for now): *Frame 12*`. A designer who moves a name to another bullet, or comments on one, has corrected the read: that wins over the local `structure` file and is never re-guessed.
- `### Not covered yet`: one bullet per gap, in plain words ("5 frames in *2. Get started* are not described yet", "19 loose images in *v01* look like screenshots and were skipped"), written from the digest's gaps, plus one line `<n> minor items are held back until polish` when `parked.md` has items for the flow. `- Nothing that I know of.` when there are none; `start` seeds `- I have not looked at any frame yet.`

`### Flows` and `### Not covered yet` bullets are not `key: value` pairs. Read them as lines (`entry.lines` in `parseMemory`) and change one with `replaceLines`: find its line index in `readMemoryMarkdown(specId).split("\n")`; add a bullet by replacing the entry's last line with `[thatLine, newBullet]`; the first real bullet replaces a placeholder. `### Not covered yet` is rewritten as a whole each pass. A `### Flows` bullet starts `- **<flowId> <name>**`; the flow's registry lives in the local flow file, and `context` rebuilds a missing one from the bullet.

## Scope syntax

`file`, `flow:F-03`, `frame:<nodeId>`.

Context for a frame is: its own `frame:` cards, the cards of its flow and every ancestor flow, and `file` cards. A card with `variant_only: yes` is not inherited by child flows.

## IDs

Prefix plus a zero-padded 3-digit number: `D-`, `C-`, `FD-`, `Q-`. Flows are `F-01`, nested flows `F-01.1`.

Allocate immediately before writing by reading the spec and taking the highest number for the prefix plus one (`nextMemoryId`; `nextFindingId` for `FD-`). Never cache an ID across a user prompt, because another agent or designer may have written in between.

## Inferred content

Skills work silently: they do not ask the designer to confirm a guess. Anything a skill guessed rather than saw or was told is marked:
- a `why:` on a `C-` card ends in `(inferred)`;
- a brief value the designer did not give (a file brief key, or a flow's `for` or `who`) ends in `(inferred)`;
- a decision the designer did not state has `status: inferred`;
- a flow's stage in `### Flows` is marked `(inferred)` unless the designer stated it;
- a finding a skill set to `Done` because the design looks fixed gets `Reason: Looks fixed (inferred, <date>)` with `Show reason` on.

What changed on the canvas is evidence and is not marked.

**The designer's text wins.** Text the designer wrote (a `Reason` on a finding, an edited line, a reply in chat) always beats an inferred value: overwrite an inferred value, never theirs, and drop the marker when theirs replaces it. Designers correct a guess with a comment (`[comment:<uuid>]…[/comment:<uuid>]` markers in the markdown) as often as by editing, so a line with a marker is the designer's, even when it still ends in `(inferred)`. `parseMemory` strips markers through `plain()`, so check the raw lines from `readMemoryMarkdown` before overwriting a line. Never remove or move a marker; when you change a line that carries one, keep the pair around the new value. Never overwrite a flow's `for` or `who` the designer answered. A designer who turns an inferred decision into `active` or deletes it is never asked why.

## Figma helpers

Read `spec-helpers.js` (and `finding-helpers.js` where your skill names it) and prepend only the functions you need to the `use_figma` code. `readMemoryMarkdown` pages through a long document and returns it unchanged; `addEntry` and `setKey` change one place and leave the rest as it was; `createMemorySpec` places the spec left of the journey. The spec API cannot resize a spec, and `editContent` needs `oldText` to match exactly once, which is why `replaceLines` widens its match upwards until it is unique.
