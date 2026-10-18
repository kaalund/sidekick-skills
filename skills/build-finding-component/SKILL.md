---
name: build-finding-component
description: Emergency fallback. Builds a local copy of the Finding component set in a Figma file when the designer cannot enable the Sidekick library. Only for a designer who has confirmed they cannot enable it; never call it from another skill.
---

# Build Finding Component

Last resort for a file that cannot use the `Sidekick` Figma library. Keep your messages short and casual.

⚠️ **Auto mode warning.** If auto mode is active, warn the designer up front that this skill cannot create components in auto mode, and ask them to switch it off before continuing.

1. Load `resolve` and resolve the file and folder. Load `memory-format` and `figma-use`.

2. **Check that the library really is out of reach.** Call `get_libraries` for the file. If `Sidekick` is subscribed, or listed under libraries available to add, say so and point the designer to Assets, then Libraries, to turn it on, and stop. Building a copy is only for the case where it truly cannot be enabled.

3. **Confirm before building.** Say in two lines that a local copy will not follow later changes to the library, and ask the designer to confirm they cannot enable it. Build nothing until they say so.

4. **Check for an existing set.** With `use_figma`, look for a `Finding` component set in `06 Components` of the Memory page (create the page and frames first, per `start` steps 2 and 3, if they are missing). If one exists, do not build a second: say so and go to step 6.

5. **Build it** in `06 Components`, to the contract in `memory-format`: 15 variants (`Status` x `Severity`, named `Status=X, Severity=Y`), each 480 wide and hugging height, with a 4px severity accent bar, severity pill, ID, status pill with dot, claim, reason (visibility bound to `Show reason`), and a footer with Skill, Scope and Date. Add the TEXT and BOOLEAN properties before `combineAsVariants`, link them via `componentPropertyReferences`, and clear fills on the inner layout frames. Colour status and severity clearly (neutral open, blue will do, amber on hold, grey dismissed, green done; red, orange, grey for P1-P3). Check the result with a screenshot.

6. **Clear the flag.** Rewrite the state file (`memory-format`, Stage line) without `needs`, copying every other key over, with `detail` empty. Do not set `findingComponentKey`: findings in this file use the local set until the library is enabled.

7. Tell the designer it is done, and that `/design-memory:review` works now. If they enable the library later, new findings will still use the local set until they ask to switch.
