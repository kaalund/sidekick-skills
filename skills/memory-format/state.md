# Preflight and stage line

Part of `memory-format`.

## Preflight

`review` and `start` run this before anything else that can fail: in ONE pass, before anything is written to Figma or to the local cache (the state file excepted). Run every check that applies, in this order, and do not stop at the first failure:

| name | check | fix (the `detail` sentence) |
|---|---|---|
| `specs` | `whoami` shows `specs_enabled: true` on the plan that owns the file. With several plans and no way to tell which owns the file, that is this blocker too, with `detail=Couldn't tell which Figma plan owns this file` | `Turn on Figma Specs for this file's plan` |
| `login` | the Figma MCP session is logged in: no call fails with an authentication error, and `whoami` returns a user | `Log in to Figma in Raicode (run /mcp)` |
| `library` | the `Sidekick` library is enabled in the file: a FRESH `get_libraries` call every time, never an earlier result (on a Retry the designer enabled it after the first stop), even when the config has a `findingComponentKey`. `Sidekick` counts only when it is in `libraries_added_to_file`, not when it is only available to add. A page that already holds a local `Finding` set skips this check | `Enable the Sidekick library: Assets, Libraries, Sidekick` |
| `empty-target` | `review` only: the target node exists and is not an empty frame (it has children or an image fill) | `Select a frame with content, then press Retry` |

`start` runs `specs`, `login` and `library` (the library check does not need the spec, so it runs before the spec is created). There is no `memory` check: a page without a spec gets one created silently (`spec.md`, Page spec). `memory` stays a valid `needs` value only so an old state file still reads.

An authentication error (or no user) on `whoami` is `login`, not `specs`, and `login` takes precedence. A check that cannot run because an earlier one failed (no login, so no `get_libraries`) counts as not checked: list it as unchecked in the message, and it is never the `needs` value.

When every check passes, carry on. When any fails, stop before touching Figma or the cache:

1. Print EVERY failing check with its exact fix in one terminal message, one line each, for example: "Can't start yet. 1) Specs is off: turn on Figma Specs for this file's plan. 2) The Sidekick library isn't enabled: in Figma, open Assets, then Libraries, and turn on Sidekick. Then press Retry on the card."
2. Write the state file with `needs=<name of the FIRST failing check in the table's order>` and `detail=<that check's fix sentence>` (one line, no trailing period), `stage=review` for a review and `stage=start` for a start (the card's Retry re-runs that skill). `progress=` and `result=` stay EMPTY: a skill that wrote `progress` and stopped is shown as "waiting on the terminal", which would hide the fix. Copy every other key over (see Stage line). The card shows `detail` for every `needs` value except `library`, which has its own picture card (its `detail` is a fallback).

## Stage line

The Sidekick card shows where the designer is in the workflow. It reads a plain-text state file that skills keep up to date. Updating it is cosmetic: never ask permission, never mention it, and ignore any write failure.

Write the whole file (overwrite, one `key=value` per line, no quotes, single-line values) to `<folderPath>/<slug>/state` (create `<slug>/` if missing):

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
- `stage`: one of `start`, `review`, `triage`, `idle`.
- `detail`: a short phrase for what is happening right now (max ~70 chars), or empty.
- `open`: count of findings in scope with status Open, Will do or On hold (from `readFindings`); `0` or empty if unknown.
- `p1`, `p2`, `p3`: the same open findings counted by severity (`P1` critical, `P2` important, `P3` polish), so they add up to `open`. Set them together with `open`; `0` or empty if unknown.
- `f1`, `f2`, `f3`: the Figma node id of the first open finding of each severity (P1, P2, P3), which the card's severity pills link to: status `Open` only, lowest `FD-` number. Written as `12:345`. Empty when no finding of that severity is open. Set them together with `p1` to `p3`.
- `last`: the friendly name of the review that ran last (the catalog `name`, e.g. `UX critique`), so the card can say "UX critique done". Only `review` sets it.
- `progress`: `<step>/<total>` while a skill runs a known number of steps (`2/3`), only a liveness marker (the card shows an indeterminate bar and no step text). Empty when nothing is running or the steps are unknown.
- `result`: one plain sentence the card shows on its Ready and Findings states (for example `Nothing changed since 5 Nov. 15 still open.`), display only. Empty while a skill runs and when there is nothing to say. Only `review` sets it.
- `needs`: set when a skill stopped on something the designer must fix, with `detail` carrying the one-line fix. One of `specs`, `login`, `memory`, `library`, `empty-target` (the first failing Preflight check). `library` has its own card; any other value shows a generic "needs a fix" card with `detail` as the text and a Retry button.

**Carry-over.** Every write replaces the whole file, so read the existing one first and copy over every key you are not changing: `flow`, `open`, `p1` to `p3`, `f1` to `f3`, `last` and `result`. This holds for `start` too (a re-run on a file that already has findings must not wipe their counts). `progress` and `needs` are the exceptions: they are dropped when the skill is no longer running or its blocker cleared, so a successful write never carries a stale `needs` over. A blocker stop writes `needs` and leaves `progress` empty.

**Stage meanings.** `start` setup and the first brief. `detail=brief interview` is a marker, not an interview: it means setup is done (Preflight passed, spec, library and entries in place) and the card reads it as "onboarding in progress". Only `start` writes it, only after that, and never while a blocker stands. `review` a critique is being chosen or run. `triage` findings are waiting for the designer to decide or to apply (in chat or in Figma). `idle` nothing in progress.
