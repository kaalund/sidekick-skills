# design-memory

A Claude Code plugin that gives a Figma file a memory: brief, decisions, change log, critique findings and open questions, all kept as visible nodes on a `🤖 Agentic Memory` page. Findings are instances of a `Finding` component (in `06 Components`) placed directly below the frame they are about, not on the Memory page, with a Status variant (Open, Will do, On hold, Dismissed, Done), so you can triage in Figma at any time and the agent reads it back. The AI drafts and logs; the designer approves.

## Install

```
/plugin marketplace add kaalund/sidekick-skills
/plugin install design-memory@sidekick
```

Choose user scope so it works from any directory. For development you can instead start Claude Code with `claude --plugin-dir <path to this folder>`. The Sidekick app does this for you: its Set up button adds the marketplace and enables the plugin in the shared design folder.

## Commands

- `/start` sets up the Memory page, interviews you for the project brief, and registers the file in the shared design folder.
- `/review` suggests the next critique skill for a frame or flow, runs it with scoped memory, and asks for a quick triage.
- `/checkpoint` logs a meaningful change and checks whether accepted findings landed.
The skills keep a small state file (`files/<slug>.state` in the shared design folder) up to date; the Sidekick card reads it to show your stage and next options.

Internal skills: `memory-format` (the contract), `resolve` (file and folder lookup), `context` (scope and flow registration).

## Where things live

- Memory: the Figma file.
- The file registry and the review catalog: `.design-memory/config.json` in the shared design folder.
- One shared design folder for all files: `.claude/settings.json` (the enabled plugins) and a `files/` folder with `<slug>.state` and `<slug>.md` per Figma file.
