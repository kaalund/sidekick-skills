---
name: memory-format
description: Reference for the design-memory plugin: Memory page frames, card templates, scope syntax, ID rules, config schema and Figma helper snippets. Load this before reading or writing any design memory. Not for direct use.
---

# Design Memory Format

The single contract for every design-memory skill. If a skill and this file disagree, this file wins.

## Memory page

One page named `🤖 Agentic Memory`, last in the page list. Older files may still use the legacy name `Memory (agent-maintained)`; treat it as the same page and do not rename it unless the designer asks. It holds seven top-level frames, left to right, named exactly:

`00 Index`, `01 Brief`, `02 Decisions`, `03 Change log`, `04 Findings`, `05 Open questions`, `06 Components`

Frames use vertical auto-layout, padding 24, 80px gaps between frames. `06 Components` holds the `Finding` component set (see below); it is the only frame that holds no cards.

## Cards

A card is a single text node placed directly inside a topic frame, named `memory/<topic>/<ID>` (for example `memory/decisions/D-007`). Findings are the exception: they are component instances with the same naming, placed under the frame they are about (see below). The text body is lines of `key: value`. Continuation lines for a long value start with two spaces. Parse by splitting each line on the first `: `. Cards use Inter Regular 12, width 480, so they stack.

Topic names in card names: `index`, `brief`, `decisions`, `changelog`, `findings`, `questions`.

### Decision card (`D-###`)

```
id: D-007
title: Use inline validation on the payment form
status: active
scope: flow:F-03
date: 2026-10-12
context: Guest payment form had a long error list on submit.
why: Inline validation cuts the recovery effort.
alternatives: Error summary at top (rejected: forces scrolling)
nodes: 12:34 "Payment"
```

Optional keys: `superseded_by: D-012` (set when `status: superseded`), `variant_only: yes`.

### Brief cards

`memory/brief/file` and `memory/brief/F-03`.

- File brief keys: `purpose`, `users`, `goals`, `constraints`, `platform`, `brand`, `references`, `risks`.
- Flow mini-brief keys: `for`, `who`, `done_when`.
- A skipped answer is the literal `unknown`.

### Change log card (`C-###`)

```
id: C-004
date: 2026-10-12
scope: flow:F-03
changed: Moved coupon field below the total
why: Likely to reduce hesitation before payment (inferred)
nodes: 12:34 "Payment"
```

Optional key `dismissed:`: one line of short topics for findings dismissed in a triage, each with a brief reason in parentheses when given or the decision id if promoted (`dismissed: Egenkapital focus states (Eufemia, D-001); touch targets under 44px`). It exists so later reviews do not re-raise them; keep it to topics, not ticket history.

Write a `C-` card only when something happened: a design change, a dismissal, or a finding that landed. A checkpoint with nothing to report writes no card; it only updates `last_checkpoint` in the index. Never write a card whose `changed` is just "no design changes".

The structural fingerprint does not live on `C-` cards (it is machine state, not history). It lives in one place, `memory/index/fingerprint`. Older `C-` cards may still carry a `fingerprint:` line; treat the newest one as a fallback if the index card does not exist yet.

### Findings (`FD-###`): `Finding` component instances

A finding is an instance of the `Finding` component set, named `memory/findings/FD-###` and placed on the design page directly below the frame it is about, not on the Memory page. Several findings for one frame stack downward with a 16px gap. `04 Findings` stays on the Memory page but now only holds legacy text-card findings. The designer changes status in the Figma properties panel; agents read and write the same properties.

Component set `Finding` (in `06 Components`), variant properties:

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
- **Pruning.** Findings are a working list, not a history. `Dismissed` and `Done` are transient: the designer sets them in Figma (or says them in chat), and the next sync removes those instances (see `review` step 11). Only `Open`, `Will do` and `On hold` persist. What survives is the digest on the change log card and, for dismissals that generalize, a decision.
- **Placement.** The anchor is the finding's `frame:` scope, or the reviewed frame when the scope is `flow:` or `file`. The instance goes into the frame's parent when that is a page or section, otherwise onto the page, aligned to the frame's left edge. `readFindings`, `updateFinding` and `nextFindingId` scan the instances by name on every page, so moving a finding in Figma is fine.
- **Finding library.** The `Finding` component set lives in the published `Sidekick` Figma library. Skills only ever import it and make instances; they never build it (the one exception is `build-finding-component`, below). Resolve the key like this, before the first `writeFinding` of a run:
  1. Use `findingComponentKey` from the config if it is there.
  2. Otherwise, if `06 Components` already holds a local `Finding` set (older files, or one made by `build-finding-component`), use it: no key, no library check.
  3. Otherwise call `get_libraries` for the file. If no subscribed library is named `Sidekick`, go to the missing-library steps below.
  4. Otherwise call `search_design_system` with `{entity: "component", query: "Finding"}` and `includeLibraryKeys: [<Sidekick library key>]`. Take the component set named exactly `Finding`, and save its key in the config as `findingComponentKey` so the lookup happens once.
  5. Pass the key to `writeFinding` as `libraryKey`. If the import throws, or step 4 finds no `Finding` set, go to the missing-library steps.
- **Missing library.** Never build the component, and never write a finding without it. Write the state file with `needs=library`, `detail=enable the Sidekick library in Figma`, empty `actions` and `progress`, and copy every other key over. Tell the designer in one or two lines: "The Sidekick library isn't enabled in this file. In Figma, open Assets, then Libraries, and turn on Sidekick. Then press Retry on the card." Stop there. Only when the designer says they cannot enable it (no access, or it is not offered) point them to `/design-memory:build-finding-component`, which builds a local copy after asking them to confirm. Any skill that rewrites the state file once the library resolves leaves `needs` out.
- Existing local `Finding` sets and instances (from older files) stay valid: `findingSet` falls back to a local set only when it already exists.

**Legacy findings.** Older files may hold findings as one-line text cards (`FD-014 | visual | P2 | frame:12:34 | claim | dismissed | reason | 2026-10-12`, columns `id | skill | severity | scope | claim | status | reason | date`). Keep reading them as a fallback via `readFindings`. Do not rewrite them unless the designer asks; new findings are always instances.

### Open questions (compact, one line)

Open question (`Q-###`):

```
Q-009 | flow:F-03 | FD-016 deferred: error copy needs content review | open | 2026-10-12 |
```

Columns: `id | scope | question | status | opened | closed`. Status is `open` or `closed`. A deferred finding also gets a `Q-###` entry whose question text starts with the finding id.

### Index cards

- `memory/index/project`: keys `intent`, `last_checkpoint`, `workspace_folder`.
- `memory/index/flows`: one line per flow, `F-03 | Checkout | section:123:456 | parent:-`. Anchor kind is `page` or `section`. Parent is `-` or another flow id.
- `memory/index/status`: one line per flow, `F-03 | last_review: cognitive-load 2026-10-10 | next: visual-critique | open_q: 3`.

- `memory/index/fingerprint`: machine state, one line per flow: `F-03 | 12:34|Payment|7|390x844 ; 12:40|Order summary|5|390x600`. The part after the flow id is a compact structural summary of the frames in scope, `nodeId|name|childCount|WxH` joined by ` ; `. The next checkpoint diffs against it because snapshots are not stored. It is the last card in `00 Index`, in a muted grey, and the designer is never asked about it. Only the latest value is kept; overwrite, never append. It cannot see visual edits (spacing, colour, text), so it is evidence, not proof.

`flows`, `status` and `fingerprint` are single text nodes holding many lines, so they are updated by rewriting the node's full text.

## Scope syntax

`file`, `flow:F-03`, `frame:<nodeId>`.

Context for a frame is: its own `frame:` cards, the cards of its flow and every ancestor flow, and `file` cards. A card with `variant_only: yes` is not inherited by child flows.

## IDs

Prefix plus a zero-padded 3-digit number: `D-`, `C-`, `FD-`, `Q-`. Flows are `F-01`, nested flows `F-01.1`.

Allocate immediately before writing by scanning the existing cards in the target frame for the highest number and adding one (see `nextId`). Never cache an ID across a user prompt, because another agent or designer may have written in between.

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

`workspaceFolder` is the shared design folder: one git repo for all Figma files, holding `.claude/settings.json` (the enabled design plugins) and a `files/` folder with `<slug>.state` (the stage line) and `<slug>.md` (the onboarding seed, later a copy of the brief) per Figma file. Every entry has a `slug`; an entry without one is ignored. The `catalog` array is seeded by `review`. Optional: `findingComponentKey`, the key of the published `Finding` component set. Skills fill it in after the first lookup in the `Sidekick` library (see Findings, Finding library).

Seed file `<workspaceFolder>/files/<slug>.md`, written by the Sidekick card before it launches `start`: a `---` header with `fileKey`, `name`, `slug` and `url`, then one `##` section per answer (Purpose and problem, Users and audience, Goals and success, Scope of this file, Platform, Brand). `unknown` means the designer skipped the question.

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
actions=UX critique|/design-memory:review ux;Checkpoint|/design-memory:checkpoint
```

- `flow`: the flow in scope as `<id> <name>`, or empty.
- `stage`: one of `start`, `review`, `triage`, `fix`, `checkpoint`, `idle`.
- `detail`: a short phrase for what is happening right now (max ~40 chars), or empty.
- `open`: count of findings in scope with status Open, Will do or On hold (from `readFindings`); `0` or empty if unknown.
- `p1`, `p2`, `p3`: the same open findings counted by severity (`P1` critical, `P2` important, `P3` polish), so they add up to `open`. Set them together with `open`; `0` or empty if unknown.
- `f1`, `f2`, `f3`: the Figma node id of the first open finding of each severity (P1, P2, P3), which the card's severity pills link to: status `Open` only, lowest `FD-` number. Written as `12:345`. Empty when no finding of that severity is open. Set them together with `p1` to `p3`.
- `last`: the friendly name of the review that ran last (the catalog `name`, e.g. `UX critique`), so the card can say "UX critique done". Only `review` sets it; every other skill that writes the file copies it over.
- `progress`: `<step>/<total>` while a skill runs a known number of steps (`2/3`), shown as a bar and "step 2 of 3". Empty when nothing is running or the steps are unknown.
- `needs`: `library` when a skill stopped because the `Sidekick` Figma library is not enabled in the file (see Findings, Missing library); the card then asks the designer to enable it. Omit the key otherwise.
- `actions`: the next-step offers shown as buttons in the Sidekick card, as `label|command` pairs separated by `;` (labels have no `|` or `;`; commands start with `/design-memory:`; at most three; empty while a skill is running). Example: `UX critique|/design-memory:review ux;Checkpoint|/design-memory:checkpoint`.

Stage meanings: `start` setup and brief interview; `review` a critique is being chosen or run; `triage` findings are waiting for the designer to decide (in chat or in Figma); `fix` accepted findings are waiting to be applied in the design; `checkpoint` logging a change; `idle` nothing in progress (the line shows everything as passed).

## Figma access

- Load the `figma-use` skill before every `use_figma` call.
- Do not use `setPluginData`, `createImageAsync` or `loadAllPagesAsync`; they are unsupported.
- Switch pages with `await figma.setCurrentPageAsync(page)` before reading or writing its nodes.
- Memory is only ever visible nodes: cards on the Memory page, and finding instances below the frames they are about.

## Figma helpers

Prepend what you need to `use_figma` code. Tested against a scratch file: create the page with `figma.createPage()`, switch with `setCurrentPageAsync`, create frames with `ensureTopicFrame` (spaced 608px apart), write cards with `writeCard`. Calling `resize()` resets sizing to fixed, so `ensureTopicFrame` sets fixed width and hugging height afterwards; without that, cards overflow the frame.

```js
async function ensureFont() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
}
function findMemoryPage() {
  return figma.root.children.find(p => p.name === "🤖 Agentic Memory" || p.name === "Memory (agent-maintained)") || null;
}
function topicFrame(page, name) {
  return page.children.find(n => n.type === "FRAME" && n.name === name) || null;
}
function ensureTopicFrame(page, name, x) {
  let f = topicFrame(page, name);
  if (f) return f;
  f = figma.createAutoLayout("VERTICAL");
  f.name = name;
  f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = 24;
  f.itemSpacing = 12;
  f.x = x; f.y = 0;
  page.appendChild(f);
  f.resize(528, 200);
  f.counterAxisSizingMode = "FIXED";
  f.primaryAxisSizingMode = "AUTO";
  return f;
}
function readCards(frame) {
  return frame.children
    .filter(n => n.type === "TEXT" && n.name.startsWith("memory/"))
    .map(n => ({ nodeId: n.id, name: n.name, text: n.characters }));
}
function nextId(frame, prefix) {
  const nums = frame.children
    .filter(n => n.name.startsWith("memory/"))
    .map(n => n.name.split("/").pop())
    .filter(id => id.startsWith(prefix + "-"))
    .map(id => parseInt(id.slice(prefix.length + 1), 10))
    .filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + "-" + String(next).padStart(3, "0");
}
async function writeCard(frame, topic, id, body) {
  await ensureFont();
  const t = figma.createText();
  t.fontName = { family: "Inter", style: "Regular" };
  t.fontSize = 12;
  t.characters = body;
  t.name = "memory/" + topic + "/" + id;
  t.textAutoResize = "HEIGHT";
  t.resize(480, t.height);
  frame.appendChild(t);
  return t.id;
}
async function updateCard(frame, name, body) {
  await ensureFont();
  const t = frame.children.find(n => n.type === "TEXT" && n.name === name);
  if (!t) throw new Error("card not found: " + name);
  t.characters = body;
  return t.id;
}
```

Finding helpers (instances). Findings are read with `readFindings()`, written with `writeFinding(page, f, libraryKey, anchorId)`, changed with `updateFinding(id, patch)`, and numbered with `nextFindingId()`. They scan every page, and `writeFinding` positions the instance below `anchorId` (a frame node id). Because they switch pages, call `await figma.setCurrentPageAsync(...)` again afterwards before touching other nodes. Prepend `const FILE_KEY = "<fileKey>";` before the block (used for links). Status values are the card statuses (`open`, `accepted`, ...), mapped to variants internally. `writeFinding` takes `f.scope` in normal syntax (`frame:3962:13783`) and shows the frame name as a link. Patch keys for `updateFinding`: `status`, `severity`, `claim`, `reason`, `scope`, `skill`, `date`.

```js
const STATUS_TO_VARIANT = { open: "Open", accepted: "Will do", deferred: "On hold", dismissed: "Dismissed", landed: "Done" };
const VARIANT_TO_STATUS = Object.fromEntries(Object.entries(STATUS_TO_VARIANT).map(([k, v]) => [v, k]));

async function ensureFindingFonts() {
  for (const style of ["Regular", "Medium", "Semi Bold"]) {
    await figma.loadFontAsync({ family: "Inter", style });
  }
}
async function findingSet(page, libraryKey) {
  if (libraryKey) return await figma.importComponentSetByKeyAsync(libraryKey);
  // Older files only: a set that already exists locally. Never build one here.
  const comps = topicFrame(page, "06 Components");
  return (comps && comps.children.find(n => n.type === "COMPONENT_SET" && n.name === "Finding")) || null;
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
// Put the instance below the anchor frame, under any findings already stacked there.
async function placeBelow(inst, anchorId) {
  const anchor = await figma.getNodeByIdAsync(anchorId);
  if (!anchor || !anchor.absoluteBoundingBox) throw new Error("anchor frame not found: " + anchorId);
  const parent = anchor.parent && (anchor.parent.type === "SECTION" || anchor.parent.type === "PAGE") ? anchor.parent : figma.currentPage;
  parent.appendChild(inst);
  const bb = anchor.absoluteBoundingBox;
  const origin = parent.type === "SECTION" ? { x: parent.absoluteBoundingBox.x, y: parent.absoluteBoundingBox.y } : { x: 0, y: 0 };
  const x = bb.x - origin.x;
  let y = bb.y - origin.y + bb.height + 16;
  const stacked = parent.children
    .filter(n => n !== inst && n.name.startsWith("memory/findings/") && Math.abs(n.x - x) < 1 && n.y >= y - 1)
    .sort((a, b) => a.y - b.y);
  for (const n of stacked) if (n.y <= y + 1) y = n.y + n.height + 16;
  inst.x = x; inst.y = y;
}
async function writeFinding(page, f, libraryKey, anchorId) {
  await ensureFindingFonts();
  const set = await findingSet(page, libraryKey);
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
  await placeBelow(inst, anchorId);
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

Do not delete decision, change log, brief, index or question cards. Supersede or resolve them by updating the card text. The only things that are removed are `Dismissed` and `Done` finding instances, by the pruning rule above (`node.remove()` on those instances after the digest is written).
