export const RONZANO_POSITION_FRAMES = Object.freeze(["raw", "normalized"]);
export const RONZANO_POSITION_MUSCLES = Object.freeze(["all", "LG", "TA"]);
export const RONZANO_POSITION_SEGMENTS = Object.freeze(["all", "L1", "L2", "L3", "L4", "L5", "L6"]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validPoint(point) {
  return Array.isArray(point) && point.length === 3 && point.every((value) => typeof value === "number" && Number.isFinite(value));
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateRonzanoPositionPayload(payload, contract) {
  check(isRecord(payload), "Position payload must be an object");
  check(payload.schemaVersion === "0.1.0", "Position payload schemaVersion mismatch");
  check(payload.assetId === contract.assetId, "Position payload assetId mismatch");
  check(payload.sourceDoi === contract.source.doi, "Position payload DOI mismatch");
  check(payload.sourceObjectKind === "labelled_cell_coordinate_rows", "Position payload object kind mismatch");
  check(JSON.stringify(payload.columns) === JSON.stringify(["x", "y", "z"]), "Position payload XYZ columns mismatch");
  check(Array.isArray(payload.representations) && payload.representations.length === 2, "Position payload representations mismatch");

  const sourceFiles = new Map(contract.sourceFiles.map((file) => [file.id, file]));
  const seenSourceIds = new Set();
  const frameCounts = { raw: 0, normalized: 0 };
  for (const representation of payload.representations) {
    check(RONZANO_POSITION_FRAMES.includes(representation.frame), "Position payload frame is invalid");
    check(Array.isArray(representation.groups), `Position payload ${representation.frame} groups missing`);
    check(representation.groups.length === contract.sourceObjectContract.representations[representation.frame].sourceFileCount, `Position payload ${representation.frame} source-file count mismatch`);
    for (const group of representation.groups) {
      const sourceFile = sourceFiles.get(group.sourceFileId);
      check(sourceFile, `Position payload has unknown source file ${group.sourceFileId}`);
      check(!seenSourceIds.has(group.sourceFileId), `Position payload repeats source file ${group.sourceFileId}`);
      seenSourceIds.add(group.sourceFileId);
      check(sourceFile.frame === representation.frame, `Position payload frame mismatch for ${group.sourceFileId}`);
      check(group.sourceFileSha256 === sourceFile.sha256, `Position payload source hash mismatch for ${group.sourceFileId}`);
      check(group.muscle === sourceFile.muscle && group.segment === sourceFile.segment && group.muscleRole === sourceFile.muscleRole, `Position payload group metadata mismatch for ${group.sourceFileId}`);
      check(group.sourceRows?.first === 1 && group.sourceRows?.last === sourceFile.rowCount, `Position payload row locator mismatch for ${group.sourceFileId}`);
      check(Array.isArray(group.points) && group.points.length === sourceFile.rowCount, `Position payload row count mismatch for ${group.sourceFileId}`);
      check(group.points.every(validPoint), `Position payload contains a non-finite XYZ row in ${group.sourceFileId}`);
      frameCounts[representation.frame] += group.points.length;
    }
  }
  check(seenSourceIds.size === contract.sourceFiles.length, "Position payload source-file roster is incomplete");
  check(frameCounts.raw === contract.sourceObjectContract.representations.raw.coordinateRowCount, "Position payload raw count mismatch");
  check(frameCounts.normalized === contract.sourceObjectContract.representations.normalized.coordinateRowCount, "Position payload normalized count mismatch");
  check(payload.totals?.sourceFileCount === contract.sourceObjectContract.sourceFileCount, "Position payload total source-file count mismatch");
  check(payload.totals?.coordinateRowCountAcrossRepresentations === contract.sourceObjectContract.coordinateRowCountAcrossRepresentations, "Position payload cross-representation row count mismatch");
  check(payload.totals?.byFrame?.raw === frameCounts.raw && payload.totals?.byFrame?.normalized === frameCounts.normalized, "Position payload frame totals mismatch");
  check(payload.identityPolicy?.rowIdentity === "source_file_id_plus_one_based_excel_row", "Position payload row identity changed");
  check(payload.identityPolicy?.crossFramePointIdentity === "not_established", "Position payload promotes cross-frame point identity");
  check(payload.identityPolicy?.crossSourceIdentity === "not_established", "Position payload promotes cross-source identity");
  check(payload.identityPolicy?.registrationCount === 0, "Position payload creates a registration");
  return payload;
}

export function positionGroupsFor(payload, { frame, muscle = "all", segment = "all" }) {
  const representation = payload.representations.find((item) => item.frame === frame);
  if (!representation) return [];
  return representation.groups.filter((group) => (
    (muscle === "all" || group.muscle === muscle)
    && (segment === "all" || group.segment === segment)
  ));
}

export function displayCoordinate(point, frame) {
  check(validPoint(point), "Display coordinate input must be a finite XYZ triple");
  if (frame === "normalized") return [point[0] * 1700, point[1] * 900, point[2]];
  if (frame === "raw") return [...point];
  throw new Error(`Unsupported position frame: ${frame}`);
}

export function pointReceipt(group, zeroBasedIndex, frame) {
  check(Number.isInteger(zeroBasedIndex) && zeroBasedIndex >= 0 && zeroBasedIndex < group.points.length, "Point receipt index is invalid");
  check(RONZANO_POSITION_FRAMES.includes(frame), "Point receipt frame is invalid");
  return {
    id: `${group.sourceFileId}:row:${zeroBasedIndex + 1}`,
    sourceFileId: group.sourceFileId,
    sourceFileSha256: group.sourceFileSha256,
    sourceRow: zeroBasedIndex + 1,
    frame,
    muscle: group.muscle,
    muscleRole: group.muscleRole,
    segment: group.segment,
    sourceCoordinate: group.points[zeroBasedIndex],
    objectClaim: "labelled_cell_position_only",
    registrationCount: 0,
  };
}
