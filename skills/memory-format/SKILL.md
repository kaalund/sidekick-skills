---
name: memory-format
description: Index and contract for the design-memory plugin: lists the files that hold the memory spec, the workspace and cache, the state file and preflight, findings and the Figma helper code, and the rules for working in Figma. Load this before reading or writing any design memory, then read only the files your skill names. Not for direct use.
---

# Design Memory Format

The single contract for every design-memory skill. If a skill and this file disagree, this file wins.

This file is the index. The rest is in sibling files in this skill's folder (paths are relative to it). Read only the ones your skill names, with the Read tool, and skip a file you already read in this session:

| file | holds |
|---|---|
| `spec.md` | the memory spec: entries, cards, open questions, what I know, scope, IDs, inferred content, helper notes |
| `workspace.md` | config, seed, local cache, page structure |
| `state.md` | preflight, stage line |
| `findings.md` | the `Finding` component, placement, pruning, library |
| `spec-helpers.js` | code for the spec: find, create, read, parse, edit |
| `finding-helpers.js` | code for finding instances |

## Figma access

- Load the `figma-use` skill before every `use_figma` call.
- Do not use `setPluginData`, `createImageAsync` or `loadAllPagesAsync`; they are unsupported.
- Switch pages with `await figma.setCurrentPageAsync(page)` before reading or writing its nodes.
- One memory spec per page: a page is a scoped feature or journey. Look only at the target page, and find its spec as a top-level node (`findMemorySpec`). Never walk the tree of a page or the document (`findAll`, `findOne`, `findAllWithCriteria` on a page are for finding instances only, `allFindingNodes`), and never loop over every page.
- Never call `get_metadata` on a page or a section: it returns the whole tree. List the first level with one `use_figma` script, one row per node (`id|type|name|x,y|WxH|childCount`).
- Memory is only ever visible nodes: the memory spec, and finding instances in the findings frames below the frames they are about.
