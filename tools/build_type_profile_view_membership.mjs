import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const sourcePath = "public/data/research_explorer_index_v1/search-index.json";
const target = new URL("data/type-profile-view-membership-0.1.json", root);
export async function buildTypeProfileViewMembership() {
  const bytes = await readFile(new URL(sourcePath, root));
  const index = JSON.parse(bytes);
  const profiles = index.records.filter(record => record.focusKind === "molecular_profile")
    .map(record => ({ id: record.focusId, namespace: record.namespace }));
  const defaultId = "sathyamurthy-2018:DE-1";
  if (!profiles.length || profiles.some(profile => typeof profile.id !== "string" || !profile.id
    || typeof profile.namespace !== "string" || !profile.namespace)
    || new Set(profiles.map(profile => profile.id)).size !== profiles.length
    || !profiles.some(profile => profile.id === defaultId)) throw Error("Invalid current molecular-profile membership");
  return {
    schemaVersion: "1.0",
    authority: "Exact public source-profile request membership only; this grants no canonical biological identity, same-cell relationship, geometry or private-roster byte authority.",
    source: { path: sourcePath, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") },
    defaultId, profiles,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = JSON.stringify(await buildTypeProfileViewMembership(), null, 2) + "\n";
  if (process.argv.includes("--write")) await writeFile(target, expected);
  else if (await readFile(target, "utf8") !== expected) throw Error("Type-profile membership is stale; regenerate it from the current index");
  console.log("Current type-profile request membership verified");
}
