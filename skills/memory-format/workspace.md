# Workspace, local cache and page structure

Part of `memory-format`.

## Config

`<workspaceFolder>/.design-memory/config.json` (in the shared design folder, next to the `<slug>/` folders):

```json
{
  "version": 1,
  "workspaceFolder": "/Users/peter/sidekick-workspace",
  "files": {
    "FIGMAFILEKEY": { "name": "Checkout redesign", "path": "/Users/peter/sidekick-workspace", "slug": "checkout-redesign" }
  },
  "catalog": []
}
```

`workspaceFolder` is the shared design folder: one git repo for all Figma files, holding `.claude/settings.json` (the enabled design plugins) and one `<slug>/` folder per Figma file, holding `state` (the stage line) and the local cache. The brief and goals are not kept on disk: the memory spec is the only copy. Every entry has a `slug`; an entry without one is ignored. The `catalog` array is seeded by `review`. Optional: `findingComponentKey`, the key of the published `Finding` component set, filled in after the first lookup in the `Sidekick` library (`findings.md`).

## Seed

`~/Library/Application Support/Sidekick/seeds/<slug>.md`, written by the Sidekick card (in its own support folder, not the design folder) before it launches `start`, and deleted by Sidekick once the stage line says `brief written`: a `---` header with `fileKey`, `name`, `slug` and `url`, then one `##` section per answer (Purpose and problem, Users and audience, Goals and success, Scope of this file, Platform, Brand). `unknown` means the designer skipped the question. Skills only read it, and only by its exact path.

## Reading and writing files

Read and write everything in the shared design folder and the Sidekick support folder with the Read and Write tools, never with shell commands (`cat` and the like): the auto-mode safety check blocks shell reads outside the project folder. Create folders as needed.

## Local cache

Machine state that can be rebuilt from the Figma file at any time. It lives in the slug folder next to the state file, is never shown in the memory spec, and is per machine: two designers on one file each build their own. Only `digest` writes it, with three exceptions: `context` writes `structure` and creates a flow's file when it registers the flow (`id`, `name`, `anchor`, `parent`), and `review` sets `reviews` and `next` in it. Other skills read it. A missing or unreadable file is empty: the next `digest` rebuilds it.

```
<folderPath>/<slug>/
├── state                        stage line (the Sidekick card reads it; not cache)
├── fingerprint                  one line per flow
├── structure                    first-level read of the page: a role per top-level node (see Page structure)
├── flows/F-01.md                one file per flow
├── screens/2002-1196.md         one file per described frame, named by node id with ':' as '-'
├── parked.md                    minor findings held back until polish
└── changelog.md                 change log cards rolled out of the spec, appended by review (not cache: never rebuilt or deleted)
```

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
changes: primary action now filled; upload box replaced by a drop zone   # since the previous description, empty on the first
```

Keep a description under about 25 lines. Describe what a designer would notice, not every layer.

A state or variant gets the short form: `id`, `name`, `flow`, `described`, `fingerprint`, `relation` and one `diff:` line; everything else it shares with the screen it relates to.

```
relation: state of 2002:1199
diff: upload modal open over the form
```

**Flow description** (`flows/F-01.md`):

```
id: F-01
name: Prototype flow
anchor: section:2044:13149     # section:<id>, or frames:<id>,<id> (the page's loose top-level frames)
parent: -                      # or another flow id
purpose: <from the flow mini-brief, or unknown>
stage: explore                 # explore | refine | polish (inferred)
stage_evidence: screenshots, placeholder amounts, no error states
screens: 2002:1190 image 1; 2002:1193 image 2; 2002:1196 image 3
variants: 2050:10 variant of 2002:1196
states: 2050:22 state of 2002:1199
not_described: 5:338 3. ready to send to agent; loose images in v01   # the gaps; review words them for `### Not covered yet`
reviews: UX critique 2026-11-06 2002:1196,2002:1199; Cognitive load 2026-11-01 2002:1190,2002:1193   # set by review, newest first, one per check that ran: name, date, frames it covered
next: Cognitive load                   # set by review
updated: 2026-11-04
```

`reviews` keeps the latest run of each check (a re-run replaces that check's item and moves it to the front); the first item is the last review. An older file with `last_review` instead reads as a one-item `reviews` that covered every screen. `anchor`, `parent`, `reviews` and `next` are set by `context` and `review`; `digest` keeps them when it rewrites the file. When a flow file is missing (another machine, a wiped cache), `context` rebuilds `id`, `name`, `anchor` and `parent` from the `### Flows` bullet in the spec by matching its `section "<name>"` (or `loose frames`) against the page structure; `reviews` and `next` start empty.

**Relations.** Identity is the Figma node id. A frame with an id seen before is the same screen (`edit` when its fingerprint or appearance changed). A new id is classified from `digest`'s first read (size, top-level child names, text strings). The same size and mostly the same text and child names mean the same step. Then: one part differs (an overlay or modal on top, an error or message shown, a toggle, a sub-section with other children) makes it a `state of` that screen; the parts are rearranged or replaced (a different layout or concept for the same step) makes it a `variant of` it; otherwise it is `new`. The base is the frame with the fewest extras, else the first in journey order. A new id in a section that is not a registered flow belongs to a new flow (see `context`).

**Stage.** Inferred from the frames in scope, not the whole page, by fidelity: `explore` when the frames are mostly screenshots or rough shapes, copy or numbers are placeholders, or key states are missing; `polish` when frames use components, copy is real and the main states exist; `refine` in between. A stage the designer stated in the flow mini-brief or in chat wins over the inferred one. The brief has no stage key.

**Parked findings** (`parked.md`), one line each, columns `id | skill | severity | scope | claim | parked | reason | date`: `P-007 | content | P3 | frame:2002:1196 | claim | parked | reason | 2026-11-04`. They are not `FD-` findings and never appear in Figma until `review` brings them back (`review`, Filter).

## Page structure

Designers lay a page out in their own way: a flow can be a section, or a set of loose frames, and a page often holds earlier rounds, references and unrelated pieces next to the live work. A page is not a flow. `context` reads the structure once per page and records a role per top-level node:

- `current`: the live work.
- `earlier:<name>`: an earlier round of another node (same screens, older). Left out of a review's scope, but still read to see what changed. Selecting one explicitly reviews it anyway.
- `journey`: a self-contained flow, current or not yet compared.
- `reference`: not a flow (an icon page, notes, loose images).
- `unclear`: the cues do not agree. Stays in scope.

The read is first level only (see Figma access in `memory-format`). With more than 80 top-level nodes, group a run of the same type with generic names (`Frame 12`) into one row with a count. The cues are combined and none decides alone: page names (`Old`, `Archive`, `Current`), version-like node names (`v0`, `v01`, `V0.2.1`, `old`, `final`), stacking order (rounds are often laid out in one direction, the newest last), size and node type, child count (a section of 19 rectangles is screenshots), and whether names repeat. When the cues disagree or names are generic, the role is `unclear`. Never exclude a node on a single cue.

Local `structure` file, written by `context`:

```
page: 0:1
read: 2026-11-07
pages: 207:612 Old|earlier:Current; 80:1267 app icon|reference
131:128|SECTION|V0.2.1|current|-469,4934|2860x970|3
5:690|SECTION|v00|earlier:V0.2.1|-337,1451|5108x998|2
```

When the ids and names of the first level are unchanged since `read`, reuse it and read nothing; otherwise classify only the new or renamed nodes. The `### How I read this page` bullets in the spec are the shared copy, written by `context` when the read changed; when they disagree with the local file, they win.
