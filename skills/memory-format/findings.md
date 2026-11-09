# Findings (`FD-###`): `Finding` component instances

Part of `memory-format`. A finding is an instance of the `Finding` component set, named `memory/findings/FD-###`, placed on the design page (not in the memory spec) inside the findings frame of the frame it is about. That frame is a vertical auto-layout frame named `<frame name> - Sidekick Findings 🤖` (16px gap, no padding, no fill) directly below the frame it is about. The first finding about a frame creates it; every later one is added to it. The designer changes status in the Figma properties panel; agents read and write the same properties, through `finding-helpers.js`.

Component set `Finding` (from the `Sidekick` library), variant properties:

| property | values |
|---|---|
| `Status` | `Open`, `Will do`, `On hold`, `Dismissed`, `Done` |
| `Severity` | `P1`, `P2`, `P3` |

Text and boolean properties: `ID`, `Claim`, `Reason`, `Show reason` (boolean), `Skill`, `Scope`, `Date`.

Status mapping (card status on the left, `Status` variant on the right): `open` = `Open`, `accepted` = `Will do`, `deferred` = `On hold`, `dismissed` = `Dismissed`, `landed` = `Done`. The helpers take and return the card statuses.

## Rules

- **Scope.** The API uses the normal scope syntax; the card shows plain text: the frame's name for a `frame:<nodeId>` scope, `flow:F-03` or `file` otherwise. `readFindings` derives `frame:<nodeId>` from where the finding sits (its findings frame is named after the frame it is about), so a renamed frame leaves the old findings with just the name. In a `Claim`, name frames in words, never node ids.
- `Skill` is the short skill name (`visual`, `ux`, `content`, `a11y`, `cognitive-load`). `Date` is `YYYY-MM-DD`.
- `Reason` is empty when `Show reason` is false. Set `Show reason` to true whenever a reason is written; if the designer toggles it on and fills `Reason` in Figma, that counts as the reason.
- Property keys carry a suffix (`ID#3997:105`). Read them by stripping `/#.*$/`; variant properties are keyed by plain name.
- To change a finding, change properties on the instance. Never detach it and never recreate it.
- **Pruning.** Findings are a working list, not a history. `Dismissed` and `Done` are transient: the designer sets them in Figma (or says them in chat), and the next review (`review` step 3) removes those instances with `removeFinding`, which also removes a findings frame left empty. Only `Open`, `Will do` and `On hold` persist. What survives is the digest on the change log card.
- **Placement.** The anchor is the finding's `frame:` scope, or the reviewed frame when the scope is `flow:` or `file`. The findings frame goes into the anchor's parent when that is a page or section, otherwise onto the page, aligned to the anchor's left edge and 16px below it. `writeFinding` finds it by its exact name among that parent's children and creates it when missing, so never rename it and never make a second one for the same frame. If the anchor frame is renamed, the next finding starts a new findings frame and the old one keeps its findings. `readFindings`, `updateFinding` and `nextFindingId` scan the instances by name on every page, so moving a finding in Figma is fine.

## Finding library

The `Finding` component set lives in the published `Sidekick` Figma library. Skills only import it and make instances; they never build it (the one exception is `build-finding-component`). Resolve the key before the first `writeFinding` of a run:

1. Use `findingComponentKey` from the config if it is there.
2. Otherwise, if the current page holds a local `Finding` component set (made by `build-finding-component`, in its `🤖 Sidekick components` frame), use it: no key.
3. Otherwise the Preflight `library` check (`state.md`) has already confirmed `Sidekick` is enabled. Call `search_design_system` with `{entity: "component", query: "Finding"}` and `includeLibraryKeys: [<Sidekick library key>]`, take the component set named exactly `Finding`, and save its key in the config as `findingComponentKey` so the lookup happens once.
4. Pass the key to `writeFinding` as `libraryKey`. If the import throws, or step 3 finds no `Finding` set, follow Missing library.

## Missing library

Never build the component and never write a finding without it. Write the state file with `needs=library` as the Preflight procedure says (`state.md`), and tell the designer in one or two lines: "The Sidekick library isn't enabled in this file. In Figma, open Assets, then Libraries, and turn on Sidekick. Then press Retry on the card." Stop there. Only when the designer says they cannot enable it (no access, or it is not offered) point them to `/design-memory:build-finding-component`, which builds a local copy after asking them to confirm.
