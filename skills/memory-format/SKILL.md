---
name: memory-format
description: Reference for the design-memory plugin: the memory spec (Figma Specs document) and its entries, scope syntax, ID rules, config schema and Figma helper snippets. Load this before reading or writing any design memory. Not for direct use.
---

# Design Memory Format

The single contract for every design-memory skill. If a skill and this file disagree, this file wins.

## Memory spec

The memory is one Figma spec (a native `SPEC_BLOCK` document, GitHub-flavoured markdown) named exactly `🤖 Agentic memory.md`, on the page with the designs. It sits 80px to the left of the journey section it relates to, top aligned with it, so the designer reads it next to the flows. It replaces the old `🤖 Agentic Memory` page and its seven frames (see Legacy memory page). Skills read and write it only through `figma.spec.*` (helpers below), never through text nodes.

The document is the H1 title block, then five H2 sections in this order: `## Index`, `## Brief`, `## Decisions`, `## Change log`, `## Open questions`. Never name an H3 like a section.

**Specs must be on.** Before the first `figma.spec.*` call of a run, call `whoami` and check `specs_enabled: true` on the plan that owns the file (when the account has several plans and you cannot tell which owns the file, that is the `specs` blocker too, with `detail=Couldn't tell which Figma plan owns this file`). If Specs is not enabled, memory cannot be written: that is the `specs` check of the Preflight, which stops the run (`review` and `start` run it before anything else).

## Entries

An entry is an `### <ID> <title>` heading, a blank line, then `- key: value` lines. A value is one line; a value with several items is a key with nested bullets (`  - item`). Parse by splitting each bullet on the first `: `. Findings are the exception: they are component instances placed under the frame they are about (see below). In the other skills, "card" means an entry in the spec.

- Figma normalises the markdown when it stores it (a blank line after every heading, `- ` bullets), so always write that form.
- New entries go directly under their section heading, newest first. Edit an entry with the helpers: they change one line and never rewrite the document, so a designer or another agent editing elsewhere is not overwritten.
- **Comments.** A designer can comment on any line (`[comment:<uuid>]…[/comment:<uuid>]` markers in the markdown). Comments are how a designer corrects a guess without editing. Never remove or move a marker. When you change a line that carries one, keep the marker pair around the new value. A designer's comment on an `(inferred)` line counts as text the designer wrote: read it, and let it win over the guess.
- Read the whole document in script (`readMemoryMarkdown`, which pages through long documents) and return only the entries in scope. The document grows without limit and must never be copied into the conversation whole.

### Decision card (`D-###`)

```
### D-007 Use inline validation on the payment form

- status: active          # active | inferred | superseded
- scope: flow:F-03
- date: 2026-10-12
- context: Guest payment form had a long error list on submit.
- why: Inline validation cuts the recovery effort.
- alternatives: Error summary at top (rejected: forces scrolling)
- nodes: 12:34 "Payment"
```

(The `# …` note is documentation, not written to the spec.) The heading carries the id and the title. Optional keys: `superseded_by: D-012` (set when `status: superseded`), `variant_only: yes`.

### Brief cards

Under `## Brief`: `### file` and `### F-03`.

- File brief keys: `purpose`, `users`, `goals`, `constraints`, `platform`, `brand`, `references`, `risks`.
- Flow mini-brief keys: `for`, `who`, `done_when`.
- A skipped answer is the literal `unknown`. A value a skill guessed instead of being told ends in `(inferred)` (see Inferred content); `start` writes the file brief this way, and `context` writes a flow mini-brief's `for` and `who` this way when the designer skips the prompt. A designer's comment on a brief line wins over the `(inferred)` value.

### Change log card (`C-###`)

```
### C-004

- date: 2026-10-12
- scope: flow:F-03
- changed: Moved coupon field below the total
- why: Likely to reduce hesitation before payment (inferred)
- nodes: 12:34 "Payment"
```

Optional key `dismissed:`: one line of short topics for findings dismissed in a triage, each with a brief reason in parentheses only when the designer gave one (`dismissed: Egenkapital focus states (Eufemia); touch targets under 44px`). It exists so later reviews do not re-raise them; keep it to topics, not ticket history.

Write a `C-` card only when something happened: a design change, a dismissal, or a finding that landed. A catch-up with nothing to report writes no card; it only updates `last_checkpoint` in the index. Never write a card whose `changed` is just "no design changes".

The structural fingerprint does not live on `C-` cards (it is machine state, not history). It lives in the local cache (see Local cache). Older files may still have a `memory/index/fingerprint` card on a legacy memory page, and older `C-` cards a `fingerprint:` line; read the newest of those only as a fallback when the cache has no fingerprint for the flow, and never write them again.

### Findings (`FD-###`): `Finding` component instances

A finding is an instance of the `Finding` component set, named `memory/findings/FD-###` and placed on the design page, not in the memory spec, inside the findings frame of the frame it is about. That frame is a vertical auto-layout frame named `<frame name> - Sidekick Findings 🤖` (16px gap, no padding, no fill) that sits directly below the frame it is about. The first finding about a frame creates it, and every later finding about the same frame is added to it. A legacy memory page's `04 Findings` frame only holds legacy text-card findings. The designer changes status in the Figma properties panel; agents read and write the same properties.

Component set `Finding` (from the `Sidekick` library), variant properties:

| property | values |
|---|---|
| `Status` | `Open`, `Will do`, `On hold`, `Dismissed`, `Done` |
| `Severity` | `P1`, `P2`, `P3` |

Text and boolean properties: `ID`, `Claim`, `Reason`, `Show reason` (boolean), `Skill`, `Scope`, `Date`.

Status mapping (card status on the left, `Status` variant on the right):

| status | `Status` variant |
|---|---|
| `open` | `Open` |
| `accepted` | `Will do` |
| `deferred` | `On hold` |
| `dismissed` | `Dismissed` |
| `landed` | `Done` |

Rules:
- `Scope` is stored with the normal scope syntax in the API, but the card shows it readable. For `frame:<nodeId>` scopes the `Scope` text is the frame's name, styled as a blue underlined hyperlink to `https://www.figma.com/design/<fileKey>/?node-id=<id with ':' replaced by '-'>`. The link is the source of truth: `readFindings` derives `frame:<nodeId>` from it. `file` and `flow:F-03` scopes are plain text. Any node id written in `Claim` (for example `also 3672:20165`) is linked in place, text unchanged.
- Links live on text overrides of the instance. They survive `Status` variant changes, but setting `Scope` or `Claim` clears them, so `writeFinding` and `updateFinding` always re-apply them. Never set those properties without going through the helpers.
- `Skill` is the short skill name (`visual`, `ux`, `content`, `a11y`, `cognitive-load`). `Date` is `YYYY-MM-DD`.
- `Reason` is empty when `Show reason` is false. Set `Show reason` to true whenever a reason is written; if the designer toggles it on and fills `Reason` in Figma, that counts as the reason.
- Property keys carry a suffix (`ID#3997:105`). Read them by stripping `/#.*$/`; variant properties are keyed by plain name.
- To change a finding, change properties on the instance. Never detach it and never recreate it.
- **Pruning.** Findings are a working list, not a history. `Dismissed` and `Done` are transient: the designer sets them in Figma (or says them in chat), and the next review removes those instances (see `review` step 3) with `removeFinding`, which also removes a findings frame that is left empty. Only `Open`, `Will do` and `On hold` persist. What survives is the digest on the change log card.
- **Placement.** The anchor is the finding's `frame:` scope, or the reviewed frame when the scope is `flow:` or `file`. The findings frame goes into the anchor's parent when that is a page or section, otherwise onto the page, aligned to the anchor's left edge and 16px below it. `writeFinding` finds it by its exact name among that parent's children and creates it when it is missing, so never rename it, and never make a second one for the same frame. If the anchor frame is renamed, the next finding starts a new findings frame and the old one keeps its findings. Findings written by older versions sit loose below their frame; leave them where they are (they are still read and updated like the others). `readFindings`, `updateFinding` and `nextFindingId` scan the instances by name on every page, so moving a finding in Figma is fine.
- **Finding library.** The `Finding` component set lives in the published `Sidekick` Figma library. Skills only ever import it and make instances; they never build it (the one exception is `build-finding-component`, below). Resolve the key like this, before the first `writeFinding` of a run:
  1. Use `findingComponentKey` from the config if it is there.
  2. Otherwise, if the file already holds a local `Finding` component set on any page (older files, or one made by `build-finding-component`), use it: no key, no library check.
  3. Otherwise call `get_libraries` for the file, every time you run this check, even when an earlier call in this conversation said `Sidekick` was missing: the designer may have enabled it since, and a Retry is exactly that case. Never reuse an earlier result. `Sidekick` counts as enabled only when it is in `libraries_added_to_file`; if it is only under the libraries available to add, or absent, go to the missing-library steps below.
  4. Otherwise call `search_design_system` with `{entity: "component", query: "Finding"}` and `includeLibraryKeys: [<Sidekick library key>]`. Take the component set named exactly `Finding`, and save its key in the config as `findingComponentKey` so the lookup happens once.
  5. Pass the key to `writeFinding` as `libraryKey`. If the import throws, or step 4 finds no `Finding` set, go to the missing-library steps.
- **Missing library.** Never build the component, and never write a finding without it. Write the state file with `needs=library`, `detail=` the `library` row's sentence from Preflight, empty `progress`, and copy every other key over, as in Preflight (the card's Retry re-runs `/design-memory:start` when `stage` is `start`, otherwise `/design-memory:review`, so no command is written). Tell the designer in one or two lines: "The Sidekick library isn't enabled in this file. In Figma, open Assets, then Libraries, and turn on Sidekick. Then press Retry on the card." Stop there. Only when the designer says they cannot enable it (no access, or it is not offered) point them to `/design-memory:build-finding-component`, which builds a local copy after asking them to confirm. Any skill that rewrites the state file once the library resolves leaves `needs` out.
- Existing local `Finding` sets and instances (from older files) stay valid: `findingSet` falls back to a local set only when it already exists.

**Legacy findings.** Older files may hold findings as one-line text cards (`FD-014 | visual | P2 | frame:12:34 | claim | dismissed | reason | 2026-10-12`, columns `id | skill | severity | scope | claim | status | reason | date`). Keep reading them as a fallback via `readFindings`. Do not rewrite them unless the designer asks; new findings are always instances.

### Open questions (one checkbox line each)

Open question (`Q-###`), a task-list line directly under `## Open questions` (no heading, no sub-bullets), newest first:

```
- [ ] Q-009 | flow:F-03 | FD-016 deferred: error copy needs content review | 2026-10-12
- [x] Q-008 | file | Which approval flow applies? | 2026-10-10 | 2026-10-12
```

Columns: `id | scope | question | opened | closed`. An open question is `- [ ]` with no `closed` column; closing it ticks the box (`- [x]`) and appends the closing date. A deferred finding (`On hold`) also gets a `Q-###` line whose question text starts with the finding id; `review` step 3 writes it, in the pass that finds the finding `On hold`, not later. Write it once per finding, so look for an existing `Q-` line (open or closed) starting with that id before adding one. `review` step 9 also writes the critique's questions as `Q-` lines.

### Index entries

Under `## Index`, three entries:

- `### project`: keys `intent`, `last_checkpoint`, `workspace_folder`.
- `### flows`: one bullet per flow, `- F-03 | Checkout | section:123:456 | parent:-`. Anchor kind is `page` or `section`. Parent is `-` or another flow id.
- `### status`: one bullet per flow, `- F-03 | last_review: cognitive-load 2026-10-10 | next: visual-critique | open_q: 3`.

`flows` and `status` bullets are not `key: value` pairs. Read them as lines (`entry.lines` in `parseMemory`), and change one with `replaceLines`.

## Preflight

`review` and `start` run this before anything else that can fail: in ONE pass, before anything is written to Figma or to the local cache (the state file excepted). Run every check that applies, in this order, and do not stop at the first failure:

| name | check | fix (the `detail` sentence) |
|---|---|---|
| `specs` | `whoami` shows `specs_enabled: true` on the plan that owns the file (see Memory spec, Specs must be on) | `Turn on Figma Specs for this file's plan` |
| `login` | the Figma MCP session is logged in: no call fails with an authentication error, and `whoami` returns a user | `Log in to Figma in Raicode (run /mcp)` |
| `memory` | a memory spec exists (`findMemorySpec`), or a legacy memory page that can be migrated. `start` skips this check: it creates the spec | `The memory spec is missing: run /design-memory:start in the terminal` |
| `library` | the `Sidekick` library is enabled in the file: a FRESH `get_libraries` call every time (see Findings, Finding library: never reuse an earlier result, and `Sidekick` counts only when it is in `libraries_added_to_file`). Call it even when the config has a `findingComponentKey`. Only a file that already holds a local `Finding` set on a page (older files, Finding library rule 2) skips this check; that does not change the order of the Finding library rules, where the config key (rule 1) still wins when the key is resolved | `Enable the Sidekick library: Assets, Libraries, Sidekick` |
| `empty-target` | `review` only: the target node exists and is not an empty frame (it has children or an image fill) | `Select a frame with content, then press Review` |

`whoami` also tells you about the login: an authentication error (or no user) on `whoami` is `login`, not `specs`, and `login` takes precedence over `specs`. When both fail only because of that one `whoami` failure, report `login` alone (the `specs` check could not run). In general, a check that cannot run because an earlier one failed (no login, so no `get_libraries`) counts as not checked: list it as unchecked in the message, and it is never the `needs` value.

When every check passes, carry on. When any fails, stop before touching Figma or the cache:

1. Print EVERY failing check with its exact fix in one terminal message, one line each, for example: "Can't start yet. 1) Specs is off: turn on Figma Specs for this file's plan. 2) The Sidekick library isn't enabled: in Figma, open Assets, then Libraries, and turn on Sidekick. Then press Retry on the card."
2. Write the state file (Stage line) with `needs=<name of the FIRST failing check in the table's order>` and `detail=<that check's fix sentence from the table>` (one line, no trailing period), `stage=review` for a review and `stage=start` for a start (so the card's Retry re-runs the right skill), `progress=` EMPTY and `result=` empty. Copy every other key over, as in Missing library. `progress` must stay empty: the card treats a skill that wrote `progress` and stopped as "waiting on the terminal", which would hide the fix. The card shows `detail` for every `needs` value except `library`, which has its own picture card (its `detail` is a fallback).
3. Never write `stage=start` with `detail=brief interview` while a blocker stands: that marker is only for `start` after the preflight, the spec, the library and the entries are done.

## Legacy memory page

Older files keep their memory on a page named `🤖 Agentic Memory` (or `Memory (agent-maintained)`) with seven frames, `00 Index` to `06 Components`, and cards as text nodes named `memory/<topic>/<ID>` with plain `key: value` lines. When a run finds the legacy page and no memory spec, it migrates first, silently (`context` and `start` do this):

1. Create the spec (`createMemorySpec`) with the five sections and write each card as an entry: the `id:` and `title:` lines become the heading, every other `key: value` line becomes a bullet, continuation lines become nested bullets, the `memory/index/flows` and `status` lines become bullets, `memory/brief/<scope>` becomes `### <scope>` under `## Brief`, and `04 Findings` text cards are not copied (they stay readable through `readFindings`). The legacy `memory/index/fingerprint` card is not copied either: write it to the local cache's `fingerprint` file if the cache has none.
2. Never delete or edit the legacy page. Tell the designer in one line: "Moved the memory to the 🤖 Agentic memory.md spec next to your flows. The old page is untouched and can be deleted."
3. From then on only the spec is read and written. The legacy page is ignored, apart from the fingerprint fallback and legacy findings above.

## Scope syntax

`file`, `flow:F-03`, `frame:<nodeId>`.

Context for a frame is: its own `frame:` cards, the cards of its flow and every ancestor flow, and `file` cards. A card with `variant_only: yes` is not inherited by child flows.

## IDs

Prefix plus a zero-padded 3-digit number: `D-`, `C-`, `FD-`, `Q-`. Flows are `F-01`, nested flows `F-01.1`.

Allocate immediately before writing by reading the spec and taking the highest number for the prefix plus one (`nextMemoryId`; `nextFindingId` for `FD-`). Never cache an ID across a user prompt, because another agent or designer may have written in between.

## Config

`<workspaceFolder>/.design-memory/config.json` (in the shared design folder, next to `files/`):

```json
{
  "version": 1,
  "workspaceFolder": "/Users/peter/design-workspace",
  "files": {
    "FIGMAFILEKEY": { "name": "Checkout redesign", "path": "/Users/peter/design-workspace", "slug": "checkout-redesign" }
  },
  "catalog": []
}
```

`workspaceFolder` is the shared design folder: one git repo for all Figma files, holding `.claude/settings.json` (the enabled design plugins) and a `files/` folder with `<slug>.state` (the stage line) per Figma file. The brief and goals are not kept on disk: the Figma file's memory spec is the only copy. Every entry has a `slug`; an entry without one is ignored. The `catalog` array is seeded by `review`. Optional: `findingComponentKey`, the key of the published `Finding` component set. Skills fill it in after the first lookup in the `Sidekick` library (see Findings, Finding library).

Seed file `~/Library/Application Support/Sidekick/seeds/<slug>.md`, written by the Sidekick card (in its own support folder, not the design folder) before it launches `start`, and deleted by Sidekick once the stage line says `brief written`: a `---` header with `fileKey`, `name`, `slug` and `url`, then one `##` section per answer (Purpose and problem, Users and audience, Goals and success, Scope of this file, Platform, Brand). `unknown` means the designer skipped the question. Skills only read it, and only by its exact path.

## Inferred content

Skills work silently: they do not ask the designer to confirm a guess. Anything a skill guessed rather than saw or was told is marked:
- a `why:` on a `C-` card ends in `(inferred)`;
- a brief value the designer did not give (a file brief key, or a flow's `for` or `who`) ends in `(inferred)`;
- a decision the designer did not state has `status: inferred`;
- a finding a skill set to `Done` because the design looks fixed gets `Reason: Looks fixed (inferred, <date>)` with `Show reason` on.

What changed on the canvas is evidence and is not marked. Text the designer wrote (a `Reason` on a finding, an edited card, a reply in chat) always wins over an inferred value: overwrite the inferred one and drop the marker. A designer who turns an inferred decision into `active` or deletes it is never asked why.

## Local cache

Machine state that can be rebuilt from the Figma file at any time. It lives in the shared design folder next to the state file, is never shown in the memory spec, and is per machine: two designers on one file each build their own. Only `digest` writes it; other skills read it.

```
<folderPath>/files/
├── <slug>.state                 stage line (the Sidekick card reads it)
└── <slug>/
    ├── fingerprint              one line per flow, same format as the legacy index card
    ├── flows/F-01.md            one file per flow
    ├── screens/2002-1196.md     one file per described frame, named by node id with ':' as '-'
    └── parked.md                minor findings held back until polish
```

Write the files with the Write tool and read them with the Read tool, never with shell commands. Create folders as needed. If a cache file is missing or unreadable, treat it as empty: the next `digest` rebuilds it.

**Fingerprint line:** `F-03 | 12:34|Payment|7|390x844 ; 12:40|Order summary|5|390x600`, each frame as `nodeId|name|childCount|WxH`. Only the latest value per flow is kept.

**Screen description** (`screens/<id>.md`), plain `key: value` lines:

```
id: 2002:1196
name: image 3
flow: F-01
described: 2026-11-04
fingerprint: 2002:1196|image 3|0|1135x895
relation: edit                 # new | edit | variant of <id> | state of <id>
fidelity: screenshot; real copy; some placeholders
purpose: attach a receipt and classify the expense
primary_action: "Legg til i regnskap", outlined button below the form
elements: transaction header (COOP Obs!, -1 874,00 NOK); upload box (PDF, JPG, PNG); Kategori field; Leverandør; MVA
copy: "Hva betaler du for?" (Kategori hint)
findings: FD-006, FD-009, FD-014
changes: primary action now filled; upload box replaced by a drop zone   # since the previous description, empty on the first
```

Keep a description under about 25 lines. Describe what a designer would notice, not every layer.

**Flow description** (`flows/F-01.md`):

```
id: F-01
name: Prototype flow
anchor: section:2044:13149
purpose: <from the flow mini-brief, or unknown>
stage: explore                 # explore | refine | polish (inferred)
stage_evidence: screenshots, placeholder amounts, no error states
screens: 2002:1190 image 1; 2002:1193 image 2; 2002:1196 image 3
variants: 2050:10 variant of 2002:1196
states: 2050:22 state of 2002:1199
updated: 2026-11-04
```

**Relations.** Identity is the Figma node id. A frame with an id seen before is the same screen (`edit` when its fingerprint or appearance changed). A new id is classified, in this order: a `state of` a sibling when it is nearly identical and one object differs (a toggle, an expanded row, an error shown); a `variant of` a screen when it covers the same step with a different layout or concept and sits next to it; otherwise `new`. A new id in a section that is not a registered flow belongs to a new flow (see `context`).

**Stage.** Inferred per flow from fidelity: `explore` when the frames are mostly screenshots or rough shapes, copy or numbers are placeholders, or key states are missing; `polish` when frames use components, copy is real and the main states exist; `refine` in between. A stage the designer stated (in the brief, the flow mini-brief or chat) wins over the inferred one.

**Parked findings** (`parked.md`), one line each, same columns as legacy findings: `P-007 | content | P3 | frame:2002:1196 | claim | parked | reason | 2026-11-04`. They are not `FD-` findings and never appear in Figma until `review` brings them back (see `review`, Filter).

## Stage line

The Sidekick card shows where the designer is in the workflow. It reads a plain-text state file that skills keep up to date. Updating it is cosmetic: never ask permission, never mention it, and ignore any write failure.

Write the whole file (overwrite, one `key=value` per line, no quotes, single-line values) to `<folderPath>/files/<slug>.state` (create `files/` if missing):

```
flow=F-03 Cart
stage=triage
detail=3 findings waiting in Figma
open=5
p1=1
p2=3
p3=1
f1=12:345
f2=12:346
f3=12:350
last=UX critique
result=
```

- `flow`: the flow in scope as `<id> <name>`, or empty.
- `stage`: one of `start`, `review`, `triage`, `idle`. Older state files may contain `fix`, `checkpoint`, `init`, `handoff` or `export`; the app maps them, so a skill must never write them.
- `detail`: a short phrase for what is happening right now (max ~70 chars), or empty.
- `open`: count of findings in scope with status Open, Will do or On hold (from `readFindings`); `0` or empty if unknown.
- `p1`, `p2`, `p3`: the same open findings counted by severity (`P1` critical, `P2` important, `P3` polish), so they add up to `open`. Set them together with `open`; `0` or empty if unknown.
- `f1`, `f2`, `f3`: the Figma node id of the first open finding of each severity (P1, P2, P3), which the card's severity pills link to: status `Open` only, lowest `FD-` number. Written as `12:345`. Empty when no finding of that severity is open. Set them together with `p1` to `p3`.
- `last`: the friendly name of the review that ran last (the catalog `name`, e.g. `UX critique`), so the card can say "UX critique done". Only `review` sets it; every other skill that writes the file copies it over.
- `progress`: `<step>/<total>` while a skill runs a known number of steps (`2/3`), shown as a bar and "step 2 of 3". Empty when nothing is running or the steps are unknown.
- `result`: one plain sentence the card shows on its Ready and Findings states (for example `Nothing changed since 5 Nov. 15 still open.`), display only. Empty while a skill runs and when there is nothing to say. Only `review` sets it; other skills copy it over.
- `needs`: set when a skill stopped on something the designer must fix, with `detail` carrying the one-line fix. One of `specs`, `login`, `memory`, `library`, `empty-target` (the first failing Preflight check). `library` means the `Sidekick` Figma library is not enabled in the file (see Findings, Missing library) and has its own card; any other value shows a generic "needs a fix" card with `detail` as the text and a Retry button. Omit the key otherwise.

Every write replaces the whole file, so read the existing one first and carry over every key you are not changing: `flow`, `open`, `p1` to `p3`, `f1` to `f3`, `last` and `result` (unless you are writing a new one). This holds for `start` too (a re-run on a file that already has findings must not wipe their counts). Only `progress` and `needs` are dropped, as described above, when the skill is no longer running or its blocker cleared (a blocker stop is the exception: it writes `needs` and leaves `progress` empty, see Preflight).

Stage meanings: `start` setup and the first brief (`detail=brief interview` is the marker meaning setup is done and the library is present (the Preflight passed), and no interview follows; the Sidekick card uses it to say the designer can switch to auto mode, so only `start` writes it, and only after the Preflight and the library check passed); `review` a critique is being chosen or run; `triage` findings are waiting for the designer to decide or to apply (in chat or in Figma); `idle` nothing in progress (the line shows everything as passed).

## Figma access

- Load the `figma-use` skill before every `use_figma` call.
- Do not use `setPluginData`, `createImageAsync` or `loadAllPagesAsync`; they are unsupported.
- Switch pages with `await figma.setCurrentPageAsync(page)` before reading or writing its nodes.
- Memory is only ever visible nodes: the memory spec, and finding instances in the findings frames below the frames they are about.

## Figma helpers

Prepend what you need to `use_figma` code. Tested on a real file: `readMemoryMarkdown` pages through a long document and returns it unchanged, `addEntry` and `setKey` change one place and leave the rest of the document as it was, `createMemorySpec` places the spec left of the journey.

The spec API cannot resize a spec (`resize` does not exist on a spec node) and `editContent` needs `oldText` to match exactly once, which is why `replaceLines` widens its match upwards until it is unique. Do not use `setContent` on an existing memory spec: it clears and recreates the document and would drop the designer's comments.

```js
const SPEC_NAME = "🤖 Agentic memory.md";
const MARKS = /\[\/?comment:[0-9a-fA-F-]+\]/g;   // designer comment markers inside the markdown
const plain = l => l.replace(MARKS, "");

// The memory spec, searched page by page (the current page is left on the page that holds it).
async function findMemorySpec() {
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    const s = page.findAllWithCriteria({ types: ["SPEC_BLOCK"] })
      .find(n => n.specBlockType === "DOCUMENT" && n.name === SPEC_NAME);
    if (s) return s;
  }
  return null;
}
// Create it, 80px left of the journey (the top-level section or frame holding `anchor`, or the leftmost node that is not a spec when the anchor is the page), top aligned.
// Switch to the anchor's page first: the spec is created on the current page. `content` is the seed markdown: the H1 `# 🤖 Agentic memory.md` and the five H2 sections.
async function createMemorySpec(anchor, content) {
  const { specNodeId } = await figma.spec.createOnCanvasAsync({ title: SPEC_NAME, content });
  const spec = await figma.getNodeByIdAsync(specNodeId);
  let top = anchor.type === "PAGE" ? anchor.children.filter(n => n.type !== "SPEC_BLOCK").reduce((a, b) => (b.x < a.x ? b : a)) : anchor;
  while (top.parent && top.parent.type !== "PAGE") top = top.parent;
  spec.x = top.x - spec.width - 80;
  spec.y = top.y;
  return spec;
}
async function readMemoryMarkdown(specId, maxLines) {
  const lines = [];
  let offset = 0, more = true;
  while (more) {
    const r = await figma.spec.getContent({ specNodeId: specId, offset, maxLines });
    lines.push(...r.markdown.split("\n"));
    offset += r.linesReturned;
    more = r.hasMore;
  }
  return lines.join("\n");
}
// Entries { section, id, title, keys, lines } and Open questions lines { id, scope, question, opened, closed, status }.
// Filter by scope in script and return only what is in scope.
function parseMemory(md) {
  const entries = [], questions = [];
  let section = "", cur = null, key = null, m;
  for (const line of plain(md).split("\n")) {
    if ((m = line.match(/^## (.+)$/))) { section = m[1].trim(); cur = key = null; }
    else if ((m = line.match(/^### (\S+)\s*(.*)$/))) { cur = { section, id: m[1], title: m[2], keys: {}, lines: [] }; key = null; entries.push(cur); }
    else if (section === "Open questions" && (m = line.match(/^- \[( |x)\] (.*)$/))) {
      const c = m[2].split(" | ");
      questions.push({ id: c[0], scope: c[1], question: c[2], opened: c[3], closed: c[4] || "", status: m[1] === "x" ? "closed" : "open" });
    }
    else if (cur && (m = line.match(/^- ([a-z_]+):\s*(.*)$/))) { key = m[1]; cur.keys[key] = m[2]; }
    else if (cur && key && (m = line.match(/^\s+- (.*)$/))) { cur.keys[key] += (cur.keys[key] ? "\n" : "") + m[1]; }
    else if (cur && (m = line.match(/^- (.*)$/))) { key = null; cur.lines.push(m[1]); }
  }
  return { entries, questions };
}
// prefix: "D", "C" or "Q".
function nextMemoryId(md, prefix) {
  const re = new RegExp("^(?:### |- \\[[ x]\\] )" + prefix + "-(\\d+)", "gm");
  const nums = [...plain(md).matchAll(re)].map(m => parseInt(m[1], 10));
  return prefix + "-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
}
// Insert a new entry (or an Open questions line) directly under its section heading, newest first.
async function addEntry(specId, section, block) {
  const h = "## " + section + "\n";
  await figma.spec.editContent({ specNodeId: specId, edits: [{ oldText: h, newText: h + "\n" + block.trim() + "\n" }] });
}
// Replace lines[from..to] with newLines in the document. `lines` is readMemoryMarkdown(...).split("\n").
async function replaceLines(specId, lines, from, to, newLines) {
  const md = lines.join("\n");
  let a = from;
  const text = () => lines.slice(a, to + 1).join("\n");
  while (md.split(text()).length !== 2 && a > 0) a--;
  if (md.split(text()).length !== 2) throw new Error("no unique match for the edit");
  await figma.spec.editContent({ specNodeId: specId, edits: [{ oldText: text(), newText: lines.slice(a, from).concat(newLines).join("\n") }] });
}
// Set one key of an entry (a single-line value), or add the key at the end of the entry when it is missing.
// Keep a `[comment:…]` pair in `value` when the old line carried one.
async function setKey(specId, entryId, key, value) {
  const lines = (await readMemoryMarkdown(specId)).split("\n");
  const start = lines.findIndex(l => new RegExp("^### " + entryId + "( |$)").test(plain(l)));
  if (start < 0) throw new Error("entry not found: " + entryId);
  let end = start + 1;
  while (end < lines.length && !/^#{2,3} /.test(plain(lines[end]))) end++;
  while (!plain(lines[end - 1]).trim()) end--;
  let from = -1, to = -1;
  for (let i = start + 1; i < end; i++) {
    if (from < 0 && plain(lines[i]).startsWith("- " + key + ":")) from = to = i;
    else if (from >= 0 && /^\s+- /.test(plain(lines[i]))) to = i;   // nested bullets belong to the key
    else if (from >= 0) break;
  }
  const newLine = "- " + key + ": " + value;
  if (from < 0) return replaceLines(specId, lines, end - 1, end - 1, [lines[end - 1], newLine]);
  return replaceLines(specId, lines, from, to, [newLine]);
}
```

For the `flows` and `status` entries (bullets that are not `key: value`), a bullet is changed with `replaceLines` after finding its line index in `readMemoryMarkdown(specId).split("\n")`; a new bullet is added by replacing the entry's last line with `[thatLine, newBullet]`, and a `(no flows registered yet)` placeholder bullet is replaced by the first real one. Close an open question by replacing its line with the ticked one.

Finding helpers (instances). Findings are read with `readFindings()`, written with `writeFinding(f, libraryKey, anchorId)`, changed with `updateFinding(id, patch)`, and numbered with `nextFindingId()`. They scan every page, and `writeFinding` adds the instance to the findings frame of `anchorId` (a frame node id), creating that frame under the anchor when it doesn't exist. Remove a finding with `removeFinding(id)`, never with a bare `node.remove()`. Because they switch pages, call `await figma.setCurrentPageAsync(...)` again afterwards before touching other nodes. Prepend `const FILE_KEY = "<fileKey>";` before the block (used for links). Status values are the card statuses (`open`, `accepted`, ...), mapped to variants internally. `writeFinding` takes `f.scope` in normal syntax (`frame:3962:13783`) and shows the frame name as a link. Patch keys for `updateFinding`: `status`, `severity`, `claim`, `reason`, `scope`, `skill`, `date`.

```js
const STATUS_TO_VARIANT = { open: "Open", accepted: "Will do", deferred: "On hold", dismissed: "Dismissed", landed: "Done" };
const VARIANT_TO_STATUS = Object.fromEntries(Object.entries(STATUS_TO_VARIANT).map(([k, v]) => [v, k]));

async function ensureFindingFonts() {
  for (const style of ["Regular", "Medium", "Semi Bold"]) {
    await figma.loadFontAsync({ family: "Inter", style });
  }
}
async function findingSet(libraryKey) {
  if (libraryKey) return await figma.importComponentSetByKeyAsync(libraryKey);
  // Older files only: a set that already exists locally, on any page. Never build one here.
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    const s = page.findAllWithCriteria({ types: ["COMPONENT_SET"] }).find(n => n.name === "Finding");
    if (s) return s;
  }
  return null;
}
function propKey(inst, name) {
  const key = Object.keys(inst.componentProperties).find(k => k.replace(/#.*$/, "") === name);
  if (!key) throw new Error("Finding property not found: " + name);
  return key;
}
function propValue(inst, name) {
  const p = inst.componentProperties[propKey(inst, name)];
  return p.value;
}
function readScope(inst) {
  const t = inst.findOne(n => n.type === "TEXT" && n.name === "Scope");
  const seg = t.getStyledTextSegments(["hyperlink"]).find(s => s.hyperlink && s.hyperlink.type === "URL");
  const m = seg && seg.hyperlink.value.match(/node-id=(\d+)-(\d+)/);
  return m ? "frame:" + m[1] + ":" + m[2] : t.characters;
}
function nodeUrl(id) {
  return "https://www.figma.com/design/" + FILE_KEY + "/?node-id=" + id.replace(":", "-");
}
function styleRange(t, s, e, link, id) {
  t.setRangeHyperlink(s, e, link ? { type: "URL", value: nodeUrl(id) } : null);
  t.setRangeTextDecoration(s, e, link ? "UNDERLINE" : "NONE");
  t.setRangeFills(s, e, [{ type: "SOLID", color: link ? { r: 0.04, g: 0.4, b: 0.8 } : { r: 0.42, g: 0.447, b: 0.502 } }]);
}
async function applyFindingLinks(inst, scope) {
  const st = inst.findOne(n => n.type === "TEXT" && n.name === "Scope");
  const node = scope.startsWith("frame:") ? await figma.getNodeByIdAsync(scope.slice(6)) : null;
  if (node) {
    inst.setProperties({ [propKey(inst, "Scope")]: node.name });
    styleRange(st, 0, st.characters.length, true, scope.slice(6));
  } else {
    inst.setProperties({ [propKey(inst, "Scope")]: scope });
    styleRange(st, 0, st.characters.length, false);
  }
  const ct = inst.findOne(n => n.type === "TEXT" && n.name === "Claim");
  const re = /\b\d{1,6}:\d{1,6}\b/g;
  let m;
  while ((m = re.exec(ct.characters))) {
    if (await figma.getNodeByIdAsync(m[0])) styleRange(ct, m.index, m.index + m[0].length, true, m[0]);
  }
}
function findingFromInstance(n) {
  const reasonOn = propValue(n, "Show reason") === true;
  return {
    nodeId: n.id,
    id: n.name.split("/").pop(),
    skill: propValue(n, "Skill"),
    severity: propValue(n, "Severity"),
    scope: readScope(n),
    claim: propValue(n, "Claim"),
    status: VARIANT_TO_STATUS[propValue(n, "Status")],
    reason: reasonOn ? propValue(n, "Reason") : "",
    date: propValue(n, "Date"),
    legacy: false
  };
}
function parseLegacyFinding(n) {
  const c = n.characters.split("|").map(s => s.trim());
  return { nodeId: n.id, id: c[0], skill: c[1], severity: c[2], scope: c[3], claim: c[4], status: c[5], reason: c[6] || "", date: c[7], legacy: true };
}
async function allFindingNodes() {
  const out = [];
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    page.findAll(n => n.name.startsWith("memory/findings/") && (n.type === "INSTANCE" || n.type === "TEXT")).forEach(n => out.push(n));
  }
  return out;
}
async function readFindings() {
  return (await allFindingNodes())
    .map(n => n.type === "INSTANCE" ? findingFromInstance(n) : parseLegacyFinding(n));
}
async function nextFindingId() {
  const nums = (await allFindingNodes())
    .map(n => parseInt(n.name.split("/").pop().slice(3), 10))
    .filter(n => !Number.isNaN(n));
  return "FD-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
}
// Add the instance to the anchor's findings frame, creating the frame below the anchor the first time.
async function placeInFindingsFrame(inst, anchorId) {
  const anchor = await figma.getNodeByIdAsync(anchorId);
  if (!anchor || !anchor.absoluteBoundingBox) throw new Error("anchor frame not found: " + anchorId);
  let pg = anchor; while (pg.type !== "PAGE") pg = pg.parent;   // the helpers above switch pages, so figma.currentPage can be a different page
  const parent = anchor.parent && (anchor.parent.type === "SECTION" || anchor.parent.type === "PAGE") ? anchor.parent : pg;
  const name = anchor.name + " - Sidekick Findings 🤖";
  let frame = parent.children.find(n => n.type === "FRAME" && n.name === name);
  if (!frame) {
    frame = figma.createAutoLayout("VERTICAL");
    frame.name = name;
    frame.itemSpacing = 16;
    frame.paddingLeft = frame.paddingRight = frame.paddingTop = frame.paddingBottom = 0;
    frame.fills = [];
    parent.appendChild(frame);
    const bb = anchor.absoluteBoundingBox;
    const origin = parent.type === "SECTION" ? { x: parent.absoluteBoundingBox.x, y: parent.absoluteBoundingBox.y } : { x: 0, y: 0 };
    const x = bb.x - origin.x;
    let y = bb.y - origin.y + bb.height + 16;
    // Older findings stacked loose below the anchor: start under them.
    const loose = parent.children
      .filter(n => n !== frame && n.name.startsWith("memory/findings/") && Math.abs(n.x - x) < 1 && n.y >= y - 1)
      .sort((a, b) => a.y - b.y);
    for (const n of loose) if (n.y <= y + 1) y = n.y + n.height + 16;
    frame.x = x; frame.y = y;
  }
  frame.appendChild(inst);
}
// Remove a finding, and its findings frame when that is left empty.
async function removeFinding(id) {
  const inst = (await allFindingNodes()).find(n => n.name === "memory/findings/" + id);
  if (!inst) throw new Error("finding not found: " + id);
  const frame = inst.parent;
  inst.remove();
  if (frame && frame.type === "FRAME" && frame.name.endsWith(" - Sidekick Findings 🤖") && frame.children.length === 0) frame.remove();
}
async function writeFinding(f, libraryKey, anchorId) {
  await ensureFindingFonts();
  const set = await findingSet(libraryKey);
  if (!set) throw new Error("FINDING_LIBRARY_MISSING: the Finding set is not in the Sidekick library or this file; see Missing library");
  const variantName = "Status=" + STATUS_TO_VARIANT[f.status || "open"] + ", Severity=" + f.severity;
  const variant = set.children.find(c => c.name === variantName);
  if (!variant) throw new Error("variant not found: " + variantName);
  const inst = variant.createInstance();
  const reason = f.reason || "";
  const props = {};
  props[propKey(inst, "ID")] = f.id;
  props[propKey(inst, "Claim")] = f.claim;
  props[propKey(inst, "Reason")] = reason;
  props[propKey(inst, "Show reason")] = reason !== "";
  props[propKey(inst, "Skill")] = f.skill;
  props[propKey(inst, "Date")] = f.date;
  inst.setProperties(props);
  await applyFindingLinks(inst, f.scope);
  inst.name = "memory/findings/" + f.id;
  await placeInFindingsFrame(inst, anchorId);
  return inst.id;
}
async function updateFinding(id, patch) {
  await ensureFindingFonts();
  const inst = (await allFindingNodes()).find(n => n.type === "INSTANCE" && n.name === "memory/findings/" + id);
  if (!inst) throw new Error("finding instance not found (legacy text card?): " + id);
  const props = {};
  const scope = patch.scope !== undefined ? patch.scope : readScope(inst);
  if (patch.status) props.Status = STATUS_TO_VARIANT[patch.status];
  if (patch.severity) props.Severity = patch.severity;
  if (patch.claim !== undefined) props[propKey(inst, "Claim")] = patch.claim;
  if (patch.skill !== undefined) props[propKey(inst, "Skill")] = patch.skill;
  if (patch.date !== undefined) props[propKey(inst, "Date")] = patch.date;
  if (patch.reason !== undefined) {
    props[propKey(inst, "Reason")] = patch.reason;
    props[propKey(inst, "Show reason")] = patch.reason !== "";
  }
  inst.setProperties(props);
  if (patch.scope !== undefined || patch.claim !== undefined) await applyFindingLinks(inst, scope);
  return inst.id;
}
```

Do not delete decision, change log, brief, index or question cards. Supersede or resolve them by updating the card text. The only things that are removed are `Dismissed` and `Done` finding instances, by the pruning rule above (`removeFinding` on those instances after the digest is written).
