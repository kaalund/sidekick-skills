# design-memory

A Claude Code plugin that gives a Figma file a memory: brief, decisions, change log, critique findings and open questions, all kept in one Figma spec, `🤖 Agentic memory.md`, that sits next to your flows so you read it beside the journeys it describes. Findings are instances of a `Finding` component (from the `Sidekick` library) placed directly below the frame they are about, not in the spec, with a Status variant (Open, Will do, On hold, Dismissed, Done), so you can triage in Figma at any time and the agent reads it back. The agent works silently: it looks at what changed, logs it, marks its guesses as inferred, and asks only what a new flow is for.

## Install

```
/plugin marketplace add kaalund/sidekick-skills
/plugin install design-memory@sidekick
```

Choose user scope so it works from any directory. For development you can instead start Claude Code with `claude --plugin-dir <path to this folder>`. The Sidekick app does this for you: its Set up button adds the marketplace and enables the plugin in the shared design folder.

## Commands

- `/start` sets up the memory spec (and moves an older Memory page into it), writes a first project brief from the Sidekick form and what it sees in the file (guesses are marked `(inferred)`, you correct them in the spec), and registers the file in the shared design folder.
- `/review` looks at what changed since last time, catches the memory up, picks the critique that fits the flow's stage and runs it with scoped memory. Findings land on the canvas for triage in Figma; minor ones are parked during exploration.

The skills keep a small state file (`files/<slug>.state` in the shared design folder) up to date; the Sidekick card reads it to show your stage and one button for the next step.

Internal skills: `memory-format` (the contract), `resolve` (file and folder lookup), `context` (scope and flow registration), `digest` (screen descriptions in the local cache `files/<slug>/`, what changed, the flow's stage).

## Where things live

- Memory: the Figma file.
- The file registry and the review catalog: `.design-memory/config.json` in the shared design folder.
- One shared design folder for all files: `.claude/settings.json` (the enabled plugins) and a `files/` folder with `<slug>.state` per Figma file, plus a rebuildable local cache in `files/<slug>/` (screen descriptions, fingerprints, parked findings).
