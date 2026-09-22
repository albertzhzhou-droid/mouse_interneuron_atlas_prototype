import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const CONTRACT_URL = new URL("../data/microns-observed-cell-nucleus-reference-0.1.json", import.meta.url);
const PUBLIC_DATA_ROOT = new URL("../public/data/", import.meta.url);
const ROOT_ID = "648518346349516051";
const NUCLEUS_ID = "4309";

const EXPECTED_COMPONENTS = {
  cell: {
    objectId: ROOT_ID,
    fragmentCount: 94,
    storedBytes: 12922288,
    decodedBytes: 12922288,
    storedLedgerSha256: "847ec84da81d8e38362e00d14cbe56d84e327541fc3a3e27bea842f9c4eefe1f",
    decodedLedgerSha256: "847ec84da81d8e38362e00d14cbe56d84e327541fc3a3e27bea842f9c4eefe1f",
    vertexCount: 372382,
    triangleCount: 704444,
    boundsNanometre: {
      min: [193453.140625, 142840.671875, 817.6767578125],
      max: [382259.5, 241471.5, 86263.234375],
    },
    positions: {
      bytes: 4468584,
      sha256: "0eeb79d91607afff797be1a81a8c1378a66689373ef7df499a4c0a2aba243fda",
    },
    triangles: {
      bytes: 8453328,
      sha256: "b72fee4500fdf85b389897a623cde3f30289fff6c52e04b4e135ede2ebad9c62",
    },
  },
  nucleus: {
    objectId: NUCLEUS_ID,
    fragmentCount: 3,
    storedBytes: 214728,
    decodedBytes: 432324,
    storedLedgerSha256: "56686bd64a04355d67f2a0fdf1fcaac875a1c186d4d280e8c2263f6303fe5ade",
    decodedLedgerSha256: "6957d4d226303c1844e7983316560f1b3cc66b2c7793ac2adfa3d125aa58df92",
    vertexCount: 12682,
    triangleCount: 23344,
    boundsNanometre: {
      min: [242143.203125, 160727.046875, 76100.328125],
      max: [253411.28125, 169058.90625, 84994.09375],
    },
    positions: {
      bytes: 152184,
      sha256: "9fbe8c12ce08586ca45f91dfee1043d3a904a873adf93ee0e57b4eee627a9efb",
    },
    triangles: {
      bytes: 280128,
      sha256: "e6561a5e266d34da2d7d9b7d21ad4819b74e97cebf81b8ed76e7f805f8baefb5",
    },
  },
};

const EXPECTED_SOURCE_RECEIPTS = {
  cell: {
    sourceManifest: "d1e28ddf669e72ae84df7925e6e32617daad6ab17283473fbd7340b1e54b6fd7",
    segmentationInfo: "0b92b9c6458a4f78d418d6833917561ebfc4a40bf2120f6322b05c1894e1f5a1",
    meshInfo: "febf16d097da8b6d3fa18a5043716be73e2e9e16939b22ea6e052cee3a239ecb",
  },
  nucleus: {
    sourceManifest: "9cd8364d28e2b548cc29b16bcdcaf389358d29078be191c3ea0b8956d5804ce6",
    segmentationInfo: "3992131bd255b681a1c4a5fb0cc7adaff1000211e7319e4eb9149a091238edc8",
    meshInfo: "704ad79402ead7a99af9dfb946538148c9adb7a51cba975bfb24a8b148a2bcfe",
  },
};

const EXPECTED_NATIVE_TRANSFORM = {
  relationship: "cell_to_nucleus",
  matrixRowMajor: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  units: "nanometre",
  status: "SOURCE_NATIVE_IDENTITY",
  registrationCount: 0,
};

const EXPECTED_DISPLAY_TRANSFORM = {
  kind: "soma_centered_uniform_scale",
  originNanometre: [246864, 164668, 80240],
  scaleViewerUnitPerNanometre: 0.00003177859061454084,
  sourceMaxExtentNanometre: 188806.359375,
  basis: "6_viewer_units_over_max_exact_cell_extent",
  use: "DISPLAY_ONLY",
};

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function exactJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function localDataUrl(path, publicDataRoot = PUBLIC_DATA_ROOT) {
  if (typeof path !== "string" || !path.startsWith("/data/")) {
    throw new Error(`local asset path must start with /data/: ${String(path)}`);
  }
  return new URL(path.slice("/data/".length), publicDataRoot);
}

function maybeGunzip(bytes) {
  return bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
}

export function parseLegacyMeshFragment(input, name = "fragment") {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.byteLength < 4) throw new Error(`${name} is shorter than the legacy-mesh header`);
  const vertexCount = bytes.readUInt32LE(0);
  const positionsByteLength = vertexCount * 3 * 4;
  const indexOffset = 4 + positionsByteLength;
  if (indexOffset > bytes.byteLength) throw new Error(`${name} position payload is truncated`);
  if ((bytes.byteLength - indexOffset) % 12 !== 0) throw new Error(`${name} triangle payload is not uint32 triplets`);
  const triangleCount = (bytes.byteLength - indexOffset) / 12;
  const boundsNanometre = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  };
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = bytes.readFloatLE(4 + (vertexIndex * 3 + axis) * 4);
      if (!Number.isFinite(value)) throw new Error(`${name} contains a non-finite coordinate`);
      boundsNanometre.min[axis] = Math.min(boundsNanometre.min[axis], value);
      boundsNanometre.max[axis] = Math.max(boundsNanometre.max[axis], value);
    }
  }
  for (let index = 0; index < triangleCount * 3; index += 1) {
    if (bytes.readUInt32LE(indexOffset + index * 4) >= vertexCount) {
      throw new Error(`${name} contains an out-of-range vertex index`);
    }
  }
  return {
    vertexCount,
    triangleCount,
    positions: bytes.subarray(4, indexOffset),
    indices: bytes.subarray(indexOffset),
    boundsNanometre,
  };
}

function mergeBounds(target, source) {
  for (let axis = 0; axis < 3; axis += 1) {
    target.min[axis] = Math.min(target.min[axis], source.min[axis]);
    target.max[axis] = Math.max(target.max[axis], source.max[axis]);
  }
}

function canonicalLedgerSha256(receipts, decoded = false) {
  const canonical = [...receipts]
    .sort((left, right) => left.fragment.localeCompare(right.fragment))
    .map((receipt) => [
      receipt.fragment,
      decoded ? receipt.decodedBytes : receipt.storedBytes,
      decoded ? receipt.decodedSha256 : receipt.storedSha256,
    ].join("\t"))
    .join("\n") + "\n";
  return digest("sha256", Buffer.from(canonical, "utf8"));
}

export function collectMicronsSemanticErrors(contract) {
  const errors = [];
  check(contract.contractId === "microns-observed-cell-nucleus-reference-0.1", "contract ID drifted", errors);
  check(contract.schemaVersion === "0.1.0", "schema version drifted", errors);
  check(contract.upgradeId === "UPG-111", "upgrade ID must resolve to canonical registry row UPG-111", errors);
  check(contract.upgradePhase === "A", "upgrade phase must remain A", errors);
  check(contract.modeId === "microns_observed_cell_nucleus_reference", "observed reference mode ID drifted", errors);
  check(contract.admissionStatus === "admitted_component_limited", "admission must remain component-limited", errors);
  check(contract.authority === "OBS_EM_SEGMENTATION", "authority must remain observed EM segmentation", errors);
  check(contract.sourceDataset?.segmentationRelease === "v185.4", "segmentation release must remain v185.4", errors);
  check(contract.sourceDataset?.metadataDepositVersion === "185.3", "metadata deposit version must remain separately pinned to 185.3", errors);
  check(contract.sourceDataset?.specimen?.region === "visual cortex layer 2/3", "source region drifted", errors);
  check(contract.sourceDataset?.specimen?.regionRelationshipToProject === "cross_region_not_spinal_cord", "cross-region boundary drifted", errors);
  check(contract.identityChain?.cellRootId === ROOT_ID, "cell root ID drifted", errors);
  check(contract.identityChain?.somaValenceTable?.nucleusId === NUCLEUS_ID, "linked nucleus ID drifted", errors);
  check(contract.identityChain?.cellClass === "inhibitory", "coarse inhibitory class drifted", errors);
  check(contract.identityChain?.coarseMorphologyClassification === "chandelier", "coarse chandelier label drifted", errors);
  check(contract.identityChain?.molecularSubtype?.value === null, "coarse morphology label was promoted to a molecular subtype", errors);
  check(exactJson(contract.identityChain?.somaValenceTable?.somaCentreNanometre, [246864, 164668, 80240]), "soma centre drifted", errors);
  check(contract.assetBundle?.sourceFragmentCount === 97, "total source fragment count must remain 97", errors);
  check(contract.assetBundle?.admittedComponentCount === 2, "exactly two source components may be admitted", errors);
  check(contract.assetBundle?.manifest?.bytes === 94901, "asset-manifest byte receipt drifted", errors);
  check(contract.assetBundle?.manifest?.sha256 === "063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1", "asset-manifest SHA-256 receipt drifted", errors);

  const components = contract.components ?? [];
  check(exactJson(components.map((item) => item.id), ["cell-segmentation-surface", "nucleus-segmentation-surface"]), "admitted component set or order drifted", errors);
  check(components[0]?.displayLabel === "Cell segmentation surface" && components[0]?.membraneClaim === false, "cell surface was promoted to a membrane claim", errors);
  check(components[0]?.sourceObjectId === ROOT_ID && components[0]?.sourceFragmentCount === 94 && components[0]?.vertexCount === 372382 && components[0]?.triangleCount === 704444, "cell component receipt drifted", errors);
  check(components[1]?.sourceObjectId === NUCLEUS_ID && components[1]?.sourceFragmentCount === 3 && components[1]?.vertexCount === 12682 && components[1]?.triangleCount === 23344, "nucleus component receipt drifted", errors);
  check(components[1]?.manualProofreadingClaim === false, "nucleus gained an unsupported manual-proofreading claim", errors);
  check(components.every((item) => item.sourceGeometryPreserved === true), "an admitted component no longer preserves source geometry", errors);

  const derivation = contract.geometryDerivationPolicy ?? {};
  check(derivation.algorithmId === "concatenate_legacy_mesh_fragments_rebase_indices_v1", "geometry algorithm ID drifted", errors);
  for (const field of ["vertexWelding", "smoothing", "repair", "decimation", "holeFilling", "normalGeneration", "coordinateTransformApplied"]) {
    check(derivation[field] === false, `${field} must remain false`, errors);
  }

  const nativeReceipt = contract.coordinateContract?.cellToNucleusTransformReceipt;
  check(exactJson(nativeReceipt?.canonical, EXPECTED_NATIVE_TRANSFORM), "native cell-to-nucleus transform must remain identity", errors);
  check(nativeReceipt?.canonicalJsonSha256 === digest("sha256", Buffer.from(JSON.stringify(EXPECTED_NATIVE_TRANSFORM))), "native transform canonical hash drifted", errors);
  const displayReceipt = contract.coordinateContract?.displayTransformReceipt;
  check(exactJson(displayReceipt?.canonical, EXPECTED_DISPLAY_TRANSFORM), "display-only transform drifted", errors);
  check(displayReceipt?.canonicalJsonSha256 === digest("sha256", Buffer.from(JSON.stringify(EXPECTED_DISPLAY_TRANSFORM))), "display transform canonical hash drifted", errors);
  check(contract.coordinateContract?.coordinateTransformAppliedToBrowserGeometry === false, "browser geometry must remain in native coordinates", errors);
  check(contract.coordinateContract?.projectDerivedRegistrationCount === 0, "project-derived registration count must remain zero", errors);

  const withinObject = contract.relationshipPolicy?.withinAdmittedObject;
  check(withinObject?.relationship === "source_linked_same_physical_cell", "cell-to-nucleus relationship drifted", errors);
  check(withinObject?.samePhysicalObject === true && withinObject?.cellRootId === ROOT_ID && withinObject?.nucleusId === NUCLEUS_ID, "same-object identity chain drifted", errors);
  check(withinObject?.sourceFrameRelationship === "source_native_identity" && withinObject?.projectDerivedRegistrationCount === 0, "same-object source-frame policy drifted", errors);
  const crossRegion = contract.relationshipPolicy?.crossRegionRelationships ?? [];
  check(exactJson(crossRegion.map((item) => item.targetLane), ["neuromorpho_spinal_morphology", "spinal_interneuron_type_evidence", "allen_spinal_atlas"]), "cross-region target lanes drifted", errors);
  for (const relationship of crossRegion) {
    check(relationship.relationship === "co_display_only", `${relationship.targetLane ?? "unknown lane"} must remain co-display only`, errors);
    check(relationship.samePhysicalObject === false, `${relationship.targetLane ?? "unknown lane"} gained a same-object claim`, errors);
    check(Array.isArray(relationship.joinedEntityIds) && relationship.joinedEntityIds.length === 0 && relationship.joinCount === 0, `${relationship.targetLane ?? "unknown lane"} gained a join`, errors);
    check(relationship.registrationCount === 0, `${relationship.targetLane ?? "unknown lane"} gained a registration`, errors);
  }

  const permissions = contract.claimPermissions ?? {};
  check(permissions.sourceCellSegmentationSurfaceDisplay === true && permissions.sourceNucleusSegmentationSurfaceDisplay === true, "the two exact segmentation displays must remain admitted", errors);
  for (const field of ["membrane", "membraneMolecularComposition", "mitochondria", "synapses", "otherOrganelles", "molecularSubtype", "spinalInterneuronIdentity", "neuroMorphoIdentity", "atlasPlacement", "connectivity", "postHocMeasurementCorrectionApplied"]) {
    check(permissions[field] === false, `${field} must remain forbidden`, errors);
  }
  check(exactJson((contract.notAdmitted ?? []).map((item) => item.id), ["mitochondria", "synapses", "other-internal-organelles", "membrane"]), "not-admitted component list drifted", errors);
  check((contract.notAdmitted ?? []).every((item) => item.status === "UNAVAILABLE_IN_THIS_ADMISSION"), "unavailable component status was promoted", errors);
  return errors;
}

async function readJson(url, read) {
  return read(url, "utf8").then(JSON.parse);
}

async function verifyReceipt(receipt, errors, read, publicDataRoot, label, expectedSha256 = null) {
  try {
    const bytes = await read(localDataUrl(receipt.path, publicDataRoot));
    check(bytes.byteLength === receipt.bytes, `${label} byte receipt mismatch`, errors);
    check(digest("sha256", bytes) === receipt.sha256, `${label} SHA-256 receipt mismatch`, errors);
    if (expectedSha256) check(receipt.sha256 === expectedSha256, `${label} expected SHA-256 pin drifted`, errors);
    return bytes;
  } catch (error) {
    errors.push(`${label} could not be read: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function verifyComponent(component, expected, expectedSource, errors, read, list, publicDataRoot) {
  check(component.objectId === expected.objectId, `${component.componentName} object ID drifted`, errors);
  check(component.sourceFragments?.count === expected.fragmentCount, `${component.componentName} fragment count drifted`, errors);
  check(component.sourceFragments?.storedBytes === expected.storedBytes, `${component.componentName} stored byte total drifted`, errors);
  check(component.sourceFragments?.decodedBytes === expected.decodedBytes, `${component.componentName} decoded byte total drifted`, errors);
  check(component.sourceFragments?.storedLedgerSha256 === expected.storedLedgerSha256, `${component.componentName} stored ledger pin drifted`, errors);
  check(component.sourceFragments?.decodedLedgerSha256 === expected.decodedLedgerSha256, `${component.componentName} decoded ledger pin drifted`, errors);
  const sourceManifestBytes = await verifyReceipt(component.sourceManifest, errors, read, publicDataRoot, `${component.componentName} source manifest`, expectedSource.sourceManifest);
  await verifyReceipt(component.segmentationInfo, errors, read, publicDataRoot, `${component.componentName} segmentation info`, expectedSource.segmentationInfo);
  await verifyReceipt(component.meshInfo, errors, read, publicDataRoot, `${component.componentName} mesh info`, expectedSource.meshInfo);
  if (!sourceManifestBytes) return null;
  let sourceManifest;
  try {
    sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
  } catch (error) {
    errors.push(`${component.componentName} source manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
  const receipts = component.sourceFragments?.receipts ?? [];
  check(Array.isArray(sourceManifest.fragments), `${component.componentName} source manifest has no fragment list`, errors);
  check(exactJson(sourceManifest.fragments, receipts.map((receipt) => receipt.fragment)), `${component.componentName} fragment order differs from the exact source manifest`, errors);
  check(receipts.length === expected.fragmentCount, `${component.componentName} fragment receipt count drifted`, errors);
  check(new Set(receipts.map((receipt) => receipt.fragment)).size === receipts.length, `${component.componentName} fragment receipts contain duplicates`, errors);
  try {
    const directoryUrl = new URL("./", localDataUrl(receipts[0].path, publicDataRoot));
    const actualNames = (await list(directoryUrl)).sort();
    const expectedNames = receipts.map((receipt) => receipt.fragment).sort();
    check(exactJson(actualNames, expectedNames), `${component.componentName} raw fragment directory is incomplete or has extras`, errors);
  } catch (error) {
    errors.push(`${component.componentName} fragment directory could not be listed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const parsedFragments = [];
  const verifiedReceipts = [];
  let vertexOffset = 0;
  let triangleOffset = 0;
  const boundsNanometre = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  };
  for (const [manifestOrder, receipt] of receipts.entries()) {
    try {
      const stored = await read(localDataUrl(receipt.path, publicDataRoot));
      const decoded = maybeGunzip(stored);
      check(receipt.manifestOrder === manifestOrder, `${component.componentName}/${receipt.fragment} manifest order drifted`, errors);
      check(stored.byteLength === receipt.storedBytes, `${component.componentName}/${receipt.fragment} stored bytes drifted`, errors);
      check(digest("sha256", stored) === receipt.storedSha256, `${component.componentName}/${receipt.fragment} stored SHA-256 drifted`, errors);
      check(decoded.byteLength === receipt.decodedBytes, `${component.componentName}/${receipt.fragment} decoded bytes drifted`, errors);
      check(digest("sha256", decoded) === receipt.decodedSha256, `${component.componentName}/${receipt.fragment} decoded SHA-256 drifted`, errors);
      check(receipt.storedEncoding === (decoded === stored ? "identity" : "gzip"), `${component.componentName}/${receipt.fragment} encoding receipt drifted`, errors);
      const parsed = parseLegacyMeshFragment(decoded, `${component.componentName}/${receipt.fragment}`);
      check(receipt.vertexOffset === vertexOffset && receipt.vertexCount === parsed.vertexCount, `${component.componentName}/${receipt.fragment} vertex receipt drifted`, errors);
      check(receipt.triangleOffset === triangleOffset && receipt.triangleCount === parsed.triangleCount, `${component.componentName}/${receipt.fragment} triangle receipt drifted`, errors);
      parsedFragments.push(parsed);
      verifiedReceipts.push({
        ...receipt,
        storedBytes: stored.byteLength,
        storedSha256: digest("sha256", stored),
        decodedBytes: decoded.byteLength,
        decodedSha256: digest("sha256", decoded),
      });
      vertexOffset += parsed.vertexCount;
      triangleOffset += parsed.triangleCount;
      mergeBounds(boundsNanometre, parsed.boundsNanometre);
    } catch (error) {
      errors.push(`${component.componentName}/${receipt.fragment} failed verification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  check(canonicalLedgerSha256(verifiedReceipts) === expected.storedLedgerSha256, `${component.componentName} recomputed stored ledger SHA-256 drifted`, errors);
  check(canonicalLedgerSha256(verifiedReceipts, true) === expected.decodedLedgerSha256, `${component.componentName} recomputed decoded ledger SHA-256 drifted`, errors);
  check(vertexOffset === expected.vertexCount, `${component.componentName} recomputed vertex count drifted`, errors);
  check(triangleOffset === expected.triangleCount, `${component.componentName} recomputed triangle count drifted`, errors);
  check(exactJson(boundsNanometre, expected.boundsNanometre), `${component.componentName} recomputed native bounds drifted`, errors);

  const positions = Buffer.concat(parsedFragments.map((fragment) => fragment.positions));
  const triangles = Buffer.alloc(triangleOffset * 3 * 4);
  let triangleWriteOffset = 0;
  vertexOffset = 0;
  for (const parsed of parsedFragments) {
    for (let index = 0; index < parsed.triangleCount * 3; index += 1) {
      triangles.writeUInt32LE(parsed.indices.readUInt32LE(index * 4) + vertexOffset, triangleWriteOffset);
      triangleWriteOffset += 4;
    }
    vertexOffset += parsed.vertexCount;
  }

  const geometry = component.browserGeometry ?? {};
  check(geometry.format === "parallel_binary_arrays_v1", `${component.componentName} browser format drifted`, errors);
  check(geometry.coordinateUnits === "nanometre" && geometry.coordinateFrame === "MICrONS_Phase1_aligned_EM_native", `${component.componentName} browser coordinate frame drifted`, errors);
  check(geometry.vertexCount === expected.vertexCount && geometry.triangleCount === expected.triangleCount, `${component.componentName} browser counts drifted`, errors);
  check(exactJson(geometry.boundsNanometre, expected.boundsNanometre), `${component.componentName} browser bounds drifted`, errors);
  check(geometry.positions?.bytes === expected.positions.bytes && geometry.positions?.sha256 === expected.positions.sha256, `${component.componentName} positions receipt drifted`, errors);
  check(geometry.triangles?.bytes === expected.triangles.bytes && geometry.triangles?.sha256 === expected.triangles.sha256, `${component.componentName} triangles receipt drifted`, errors);
  const positionFile = await verifyReceipt(geometry.positions, errors, read, publicDataRoot, `${component.componentName} browser positions`, expected.positions.sha256);
  const triangleFile = await verifyReceipt(geometry.triangles, errors, read, publicDataRoot, `${component.componentName} browser triangles`, expected.triangles.sha256);
  if (positionFile) check(positionFile.equals(positions), `${component.componentName} browser positions are not an exact source-fragment concatenation`, errors);
  if (triangleFile) check(triangleFile.equals(triangles), `${component.componentName} browser triangles do not preserve exact source triangles with index rebasing only`, errors);
  const derivation = geometry.derivation ?? {};
  check(derivation.algorithmId === "concatenate_legacy_mesh_fragments_rebase_indices_v1", `${component.componentName} browser derivation ID drifted`, errors);
  for (const field of ["vertexWelding", "smoothing", "repair", "decimation", "holeFilling", "normalGeneration", "coordinateTransformApplied"]) {
    check(derivation[field] === false, `${component.componentName} browser ${field} must remain false`, errors);
  }
  return { vertexCount: vertexOffset, triangleCount: triangleOffset, boundsNanometre };
}

export async function validateMicronsObservedCellNucleusReference({
  contractUrl = CONTRACT_URL,
  publicDataRoot = PUBLIC_DATA_ROOT,
  read = readFile,
  list = readdir,
} = {}) {
  const errors = [];
  const contract = await readJson(contractUrl, read);
  errors.push(...collectMicronsSemanticErrors(contract));
  const manifestBytes = await verifyReceipt(contract.assetBundle.manifest, errors, read, publicDataRoot, "asset manifest", "063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1");
  let manifest = null;
  if (manifestBytes) {
    try {
      manifest = JSON.parse(manifestBytes.toString("utf8"));
    } catch (error) {
      errors.push(`asset manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const classification = contract.identityChain.classificationTable;
  const somaValence = contract.identityChain.somaValenceTable;
  const [classificationBytes, somaValenceBytes] = await Promise.all([
    verifyReceipt(classification, errors, read, publicDataRoot, "cell-type classification table"),
    verifyReceipt(somaValence, errors, read, publicDataRoot, "soma-valence table"),
  ]);
  if (classificationBytes) {
    check(digest("md5", classificationBytes) === classification.md5, "cell-type classification MD5 drifted", errors);
    check(classificationBytes.toString("utf8").split(/\r?\n/).includes(classification.exactSourceRow), "exact inhibitory/chandelier identity row is absent", errors);
  }
  if (somaValenceBytes) {
    check(digest("md5", somaValenceBytes) === somaValence.md5, "soma-valence MD5 drifted", errors);
    check(somaValenceBytes.toString("utf8").split(/\r?\n/).includes(somaValence.exactSourceRow), "exact root-to-nucleus identity row is absent", errors);
  }

  const componentReports = [];
  if (manifest) {
    check(manifest.documentType === "microns_observed_cell_nucleus_asset_manifest", "asset manifest document type drifted", errors);
    check(manifest.sourceRelease === "v185.4" && manifest.metadataDepositVersion === "185.3", "asset manifest release pins drifted", errors);
    check(manifest.rootId === ROOT_ID && manifest.nucleusId === NUCLEUS_ID, "asset manifest object IDs drifted", errors);
    check(manifest.admittedComponentCount === 2, "asset manifest must contain exactly two admitted components", errors);
    check(exactJson(manifest.components?.map((component) => component.componentName), ["cell", "nucleus"]), "asset manifest component set or order drifted", errors);
    for (const componentName of ["cell", "nucleus"]) {
      const component = manifest.components?.find((item) => item.componentName === componentName);
      if (component) {
        componentReports.push(await verifyComponent(
          component,
          EXPECTED_COMPONENTS[componentName],
          EXPECTED_SOURCE_RECEIPTS[componentName],
          errors,
          read,
          list,
          publicDataRoot,
        ));
      }
    }
    try {
      const browserDirectory = new URL("./", localDataUrl(manifest.components[0].browserGeometry.positions.path, publicDataRoot));
      const browserFiles = (await list(browserDirectory)).sort();
      check(exactJson(browserFiles, [
        "cell.positions.f32le.bin",
        "cell.triangles.u32le.bin",
        "nucleus.positions.f32le.bin",
        "nucleus.triangles.u32le.bin",
      ]), "browser geometry directory contains missing or extra files", errors);
    } catch (error) {
      errors.push(`browser geometry directory could not be listed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const nucleusBounds = componentReports[1]?.boundsNanometre;
  if (nucleusBounds) {
    const somaCentre = contract.identityChain.somaValenceTable.somaCentreNanometre;
    check(somaCentre.every((value, axis) => value >= nucleusBounds.min[axis] && value <= nucleusBounds.max[axis]), "linked nucleus bounds do not contain the source soma centre", errors);
  }
  if (errors.length) {
    throw new Error(`MICrONS observed cell+nucleus validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return {
    releaseId: contract.releaseId,
    rootId: ROOT_ID,
    nucleusId: NUCLEUS_ID,
    admittedComponentCount: 2,
    sourceFragmentCount: 97,
    vertexCount: componentReports.reduce((sum, report) => sum + report.vertexCount, 0),
    triangleCount: componentReports.reduce((sum, report) => sum + report.triangleCount, 0),
    crossRegionJoinCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const report = await validateMicronsObservedCellNucleusReference();
    console.log(`MICrONS observed cell+nucleus validation passed: root ${report.rootId}, nucleus ${report.nucleusId}, ${report.sourceFragmentCount} source fragments, ${report.vertexCount} vertices, ${report.triangleCount} triangles, ${report.crossRegionJoinCount} cross-region joins, ${report.registrationCount} registrations.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
