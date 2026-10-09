export function parseBancV888IN14A018Swc(text) {
  if (typeof text !== "string" || text.length === 0) throw new Error("SWC payload is empty");
  const nodes = [];
  const byId = new Map();
  for (const [lineIndex, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(/\s+/);
    if (fields.length !== 7) throw new Error(`SWC row ${lineIndex + 1} does not have seven columns`);
    const [id, type, x, y, z, radius, parentId] = fields.map(Number);
    if (![id, type, x, y, z, radius, parentId].every(Number.isFinite)
      || !Number.isInteger(id) || !Number.isInteger(type) || !Number.isInteger(parentId)
      || id <= 0 || radius < 0) throw new Error(`SWC row ${lineIndex + 1} contains invalid values`);
    if (byId.has(id)) throw new Error(`Duplicate SWC node id ${id}`);
    const node = { id, type, x, y, z, radius, parentId };
    nodes.push(node);
    byId.set(id, node);
  }
  if (!nodes.length) throw new Error("SWC payload contains no nodes");
  const roots = nodes.filter((node) => node.parentId === -1);
  if (roots.length !== 1) throw new Error("SWC must contain exactly one root");
  const root = roots[0];
  const edges = [];
  for (const node of nodes) {
    if (node.id === root.id) continue;
    const parent = byId.get(node.parentId);
    if (!parent) throw new Error(`SWC node ${node.id} has a missing parent`);
    edges.push([parent, node]);
  }
  if (edges.length !== nodes.length - 1) throw new Error("SWC edge count does not describe one tree");
  const children = new Map(nodes.map((node) => [node.id, []]));
  for (const [parent, child] of edges) children.get(parent.id).push(child.id);
  const visited = new Set();
  const pending = [root.id];
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id)) throw new Error("SWC contains a cycle or repeated child traversal");
    visited.add(id);
    pending.push(...children.get(id));
  }
  if (visited.size !== nodes.length) throw new Error("SWC contains disconnected nodes");
  const nodeTypeCodes = [...new Set(nodes.map((node) => node.type))].sort((a, b) => a - b);
  return { nodes, edges, root, nodeTypeCodes };
}

export function computeBancV888SwcBounds(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) throw new Error("Cannot compute bounds for an empty SWC");
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of nodes) {
    for (const [axis, value] of [node.x, node.y, node.z].entries()) {
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }
  return { min, max };
}
