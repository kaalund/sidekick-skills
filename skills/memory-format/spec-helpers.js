// Spec helpers for `use_figma` code. Prepend only what you need. See `memory-format` (Figma helpers).
const SPEC_NAME = "🤖 Agentic memory.md";
const MARKS = /\[\/?comment:[0-9a-fA-F-]+\]/g;   // designer comment markers inside the markdown
const plain = l => l.replace(MARKS, "");

// The page's memory spec: a top-level node of the page, so no tree walk and no other page is loaded. Leaves the current page on `page`.
async function findMemorySpec(page = figma.currentPage) {
  await figma.setCurrentPageAsync(page);
  return page.children.find(n => n.type === "SPEC_BLOCK" && n.specBlockType === "DOCUMENT" && n.name === SPEC_NAME) || null;
}
// Create it, 80px left of the journey (the top-level section or frame holding `anchor`, or the leftmost node that is not a spec when the anchor is the page), top aligned.
// Switch to the anchor's page first: the spec is created on the current page. `content` is the seed markdown: the H1 `# 🤖 Agentic memory.md` and the five H2 sections (Open questions first).
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
