// Finding helpers for `use_figma` code. Prepend only what you need. Rules are in `findings.md`.
// readFindings(), writeFinding(f, libraryKey, anchorId), updateFinding(id, patch), nextFindingId(), removeFinding(id).
// They switch pages: call `await figma.setCurrentPageAsync(...)` again before touching other nodes afterwards.
// `f` and `patch` use the card statuses (open, accepted, ...) and the normal scope syntax (frame:3962:13783).
// Patch keys for updateFinding: status, severity, claim, reason, skill, date.
const FINDINGS_SUFFIX = " - Sidekick Findings 🤖";
const STATUS_TO_VARIANT = { open: "Open", accepted: "Will do", deferred: "On hold", dismissed: "Dismissed", landed: "Done" };
const VARIANT_TO_STATUS = Object.fromEntries(Object.entries(STATUS_TO_VARIANT).map(([k, v]) => [v, k]));

async function ensureFindingFonts() {
  for (const style of ["Regular", "Medium", "Semi Bold"]) {
    await figma.loadFontAsync({ family: "Inter", style });
  }
}
async function findingSet(libraryKey) {
  if (libraryKey) return await figma.importComponentSetByKeyAsync(libraryKey);
  // A set that already exists locally, on any page (made by build-finding-component). Never build one here.
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
  return inst.componentProperties[propKey(inst, name)].value;
}
// The Scope text is a frame name, `flow:F-03` or `file`. A frame's id comes from where the finding sits:
// its findings frame is named after the frame it is about. shortcut: duplicate frame names pick the first, upgrade if that bites.
function readScope(inst) {
  const text = propValue(inst, "Scope");
  if (text === "file" || text.startsWith("flow:")) return text;
  const box = inst.parent;
  if (box && box.name.endsWith(FINDINGS_SUFFIX)) {
    const name = box.name.slice(0, -FINDINGS_SUFFIX.length);
    const anchor = box.parent.findOne(n => n !== box && n.name === name);
    if (anchor) return "frame:" + anchor.id;
  }
  return text;   // the frame was renamed: the name is all that is left
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
    date: propValue(n, "Date")
  };
}
async function allFindingNodes() {
  const out = [];
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    page.findAll(n => n.type === "INSTANCE" && n.name.startsWith("memory/findings/")).forEach(n => out.push(n));
  }
  return out;
}
async function readFindings() {
  return (await allFindingNodes()).map(findingFromInstance);
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
  const name = anchor.name + FINDINGS_SUFFIX;
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
    frame.x = bb.x - origin.x;
    frame.y = bb.y - origin.y + bb.height + 16;
  }
  frame.appendChild(inst);
}
// Remove a finding, and its findings frame when that is left empty.
async function removeFinding(id) {
  const inst = (await allFindingNodes()).find(n => n.name === "memory/findings/" + id);
  if (!inst) throw new Error("finding not found: " + id);
  const frame = inst.parent;
  inst.remove();
  if (frame && frame.type === "FRAME" && frame.name.endsWith(FINDINGS_SUFFIX) && frame.children.length === 0) frame.remove();
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
  const frameNode = f.scope.startsWith("frame:") ? await figma.getNodeByIdAsync(f.scope.slice(6)) : null;
  const props = {};
  props[propKey(inst, "ID")] = f.id;
  props[propKey(inst, "Claim")] = f.claim;
  props[propKey(inst, "Reason")] = reason;
  props[propKey(inst, "Show reason")] = reason !== "";
  props[propKey(inst, "Skill")] = f.skill;
  props[propKey(inst, "Scope")] = frameNode ? frameNode.name : f.scope;
  props[propKey(inst, "Date")] = f.date;
  inst.setProperties(props);
  inst.name = "memory/findings/" + f.id;
  await placeInFindingsFrame(inst, anchorId);
  return inst.id;
}
async function updateFinding(id, patch) {
  await ensureFindingFonts();
  const inst = (await allFindingNodes()).find(n => n.name === "memory/findings/" + id);
  if (!inst) throw new Error("finding instance not found: " + id);
  const props = {};
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
  return inst.id;
}
