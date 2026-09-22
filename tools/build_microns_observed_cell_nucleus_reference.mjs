import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT_ID = "648518346349516051";
const NUCLEUS_ID = "4309";
const ASSET_DIRECTORY_NAME = `microns_phase1_v185_4_root_${ROOT_ID}_v1`;
const DEFAULT_OUTPUT_ROOT = new URL(
  `../public/data/${ASSET_DIRECTORY_NAME}/`,
  import.meta.url,
);

const SOURCE_LAYOUT = {
  metadata: [
    {
      input: "220309_cell_type_classification.csv",
      output: "source/metadata/220309_cell_type_classification.csv",
      bytes: 38810,
      sha256: "a78f1a946dc11f8a875fd810e7783e5fab719c380631bfae23de7df875ba5a67",
    },
    {
      input: "soma_valence_v185.csv",
      output: "source/metadata/soma_valence_v185.csv",
      bytes: 33983,
      sha256: "f307135c77e44644d220304673ff50f1b0ebbf8d91a581aa5dc7e6ebaad870e3",
    },
  ],
  cell: {
    objectId: ROOT_ID,
    sourceDirectory: `microns_chc_${ROOT_ID}_fragments`,
    sourceBaseUrl: "https://storage.googleapis.com/microns_public_datasets/pinky100_v185/seg/mesh_mip_2_err_40/",
    manifest: {
      input: `microns_chc_${ROOT_ID}_manifest.json`,
      output: "source/cell/manifest.json",
      bytes: 5048,
      sha256: "d1e28ddf669e72ae84df7925e6e32617daad6ab17283473fbd7340b1e54b6fd7",
    },
    info: {
      input: "pinky100_v185_seg_info.json",
      output: "source/cell/segmentation-info.json",
      bytes: 2932,
      sha256: "0b92b9c6458a4f78d418d6833917561ebfc4a40bf2120f6322b05c1894e1f5a1",
    },
    meshInfo: {
      input: "pinky100_v185_mesh_info.json",
      output: "source/cell/mesh-info.json",
      bytes: 134,
      sha256: "febf16d097da8b6d3fa18a5043716be73e2e9e16939b22ea6e052cee3a239ecb",
    },
    sourceFragmentCount: 94,
    storedLedgerSha256: "847ec84da81d8e38362e00d14cbe56d84e327541fc3a3e27bea842f9c4eefe1f",
    decodedLedgerSha256: "847ec84da81d8e38362e00d14cbe56d84e327541fc3a3e27bea842f9c4eefe1f",
  },
  nucleus: {
    objectId: NUCLEUS_ID,
    sourceDirectory: `microns_nucleus_${NUCLEUS_ID}_fragments`,
    sourceBaseUrl: "https://td.princeton.edu/sseung-archive/pinky100-nuclei/seg/mesh_mip_0_err_40/",
    manifest: {
      input: `pinky100_nucleus_${NUCLEUS_ID}_manifest.json`,
      output: "source/nucleus/manifest.json",
      bytes: 135,
      sha256: "9cd8364d28e2b548cc29b16bcdcaf389358d29078be191c3ea0b8956d5804ce6",
    },
    info: {
      input: "pinky100_nuclei_info.json",
      output: "source/nucleus/segmentation-info.json",
      bytes: 590,
      sha256: "3992131bd255b681a1c4a5fb0cc7adaff1000211e7319e4eb9149a091238edc8",
    },
    meshInfo: {
      input: "pinky100_nuclei_mesh_info.json",
      output: "source/nucleus/mesh-info.json",
      bytes: 145,
      sha256: "704ad79402ead7a99af9dfb946538148c9adb7a51cba975bfb24a8b148a2bcfe",
    },
    sourceFragmentCount: 3,
    storedLedgerSha256: "56686bd64a04355d67f2a0fdf1fcaac875a1c186d4d280e8c2263f6303fe5ade",
    decodedLedgerSha256: "6957d4d226303c1844e7983316560f1b3cc66b2c7793ac2adfa3d125aa58df92",
  },
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function relativePublicPath(_outputRoot, relativePath) {
  return `/data/${ASSET_DIRECTORY_NAME}/${relativePath}`;
}

function verifyReceipt(bytes, receipt, label) {
  check(bytes.byteLength === receipt.bytes, `${label} byte receipt mismatch`);
  check(sha256(bytes) === receipt.sha256, `${label} SHA-256 receipt mismatch`);
}

function maybeGunzip(bytes) {
  return bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
}

export function parseNeuroglancerLegacyMeshFragment(input, name = "fragment") {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  check(bytes.byteLength >= 4, `${name} is shorter than the legacy-mesh header`);
  const vertexCount = bytes.readUInt32LE(0);
  const positionBytes = vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT;
  const indexOffset = 4 + positionBytes;
  check(indexOffset <= bytes.byteLength, `${name} position payload is truncated`);
  check((bytes.byteLength - indexOffset) % 12 === 0, `${name} triangle payload is not uint32 triplets`);
  const triangleCount = (bytes.byteLength - indexOffset) / 12;
  const boundsNanometre = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  };
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = bytes.readFloatLE(4 + (vertexIndex * 3 + axis) * 4);
      check(Number.isFinite(value), `${name} contains a non-finite vertex coordinate`);
      boundsNanometre.min[axis] = Math.min(boundsNanometre.min[axis], value);
      boundsNanometre.max[axis] = Math.max(boundsNanometre.max[axis], value);
    }
  }
  for (let index = 0; index < triangleCount * 3; index += 1) {
    check(bytes.readUInt32LE(indexOffset + index * 4) < vertexCount, `${name} contains an out-of-range vertex index`);
  }
  return {
    bytes,
    vertexCount,
    triangleCount,
    positions: bytes.subarray(4, indexOffset),
    indexBytes: bytes.subarray(indexOffset),
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
  return sha256(Buffer.from(canonical, "utf8"));
}

async function ensureNewOutputRoot(outputRoot) {
  try {
    await stat(outputRoot);
    throw new Error(`output directory already exists: ${new URL(outputRoot).pathname}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(outputRoot, { recursive: true });
}

async function copyPinnedFile(importRoot, outputRoot, receipt, label) {
  const inputUrl = new URL(receipt.input, importRoot);
  const outputUrl = new URL(receipt.output, outputRoot);
  const bytes = await readFile(inputUrl);
  verifyReceipt(bytes, receipt, label);
  await mkdir(new URL("./", outputUrl), { recursive: true });
  await copyFile(inputUrl, outputUrl);
  return {
    path: relativePublicPath(outputRoot, receipt.output),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

async function buildComponent(componentName, specification, importRoot, outputRoot) {
  const manifestReceipt = await copyPinnedFile(
    importRoot,
    outputRoot,
    specification.manifest,
    `${componentName} source manifest`,
  );
  const infoReceipt = await copyPinnedFile(importRoot, outputRoot, specification.info, `${componentName} segmentation info`);
  const meshInfoReceipt = await copyPinnedFile(importRoot, outputRoot, specification.meshInfo, `${componentName} mesh info`);
  const manifest = JSON.parse(await readFile(new URL(specification.manifest.input, importRoot), "utf8"));
  check(Array.isArray(manifest.fragments), `${componentName} source manifest has no fragment list`);
  check(manifest.fragments.length === specification.sourceFragmentCount, `${componentName} source fragment count drifted`);
  check(new Set(manifest.fragments).size === manifest.fragments.length, `${componentName} source manifest has duplicate fragments`);

  const inputDirectory = new URL(`${specification.sourceDirectory}/`, importRoot);
  const actualNames = (await readdir(inputDirectory)).sort();
  const expectedNames = [...manifest.fragments].sort();
  check(JSON.stringify(actualNames) === JSON.stringify(expectedNames), `${componentName} imported fragment directory is incomplete or has extras`);

  const sourceFragmentDirectory = new URL(`source/${componentName}/fragments/`, outputRoot);
  await mkdir(sourceFragmentDirectory, { recursive: true });
  const receipts = [];
  const parsedFragments = [];
  let totalVertexCount = 0;
  let totalTriangleCount = 0;
  const boundsNanometre = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  };

  for (const [manifestOrder, fragment] of manifest.fragments.entries()) {
    const stored = await readFile(new URL(fragment, inputDirectory));
    const decoded = maybeGunzip(stored);
    const parsed = parseNeuroglancerLegacyMeshFragment(decoded, `${componentName}/${fragment}`);
    const outputRelativePath = `source/${componentName}/fragments/${fragment}`;
    await copyFile(new URL(fragment, inputDirectory), new URL(outputRelativePath, outputRoot));
    receipts.push({
      fragment,
      manifestOrder,
      sourceUrl: `${specification.sourceBaseUrl}${fragment}`,
      path: relativePublicPath(outputRoot, outputRelativePath),
      storedEncoding: decoded === stored ? "identity" : "gzip",
      storedBytes: stored.byteLength,
      storedSha256: sha256(stored),
      decodedBytes: decoded.byteLength,
      decodedSha256: sha256(decoded),
      vertexOffset: totalVertexCount,
      vertexCount: parsed.vertexCount,
      triangleOffset: totalTriangleCount,
      triangleCount: parsed.triangleCount,
    });
    parsedFragments.push(parsed);
    totalVertexCount += parsed.vertexCount;
    totalTriangleCount += parsed.triangleCount;
    mergeBounds(boundsNanometre, parsed.boundsNanometre);
  }

  check(
    canonicalLedgerSha256(receipts) === specification.storedLedgerSha256,
    `${componentName} canonical stored-fragment ledger drifted`,
  );
  check(
    canonicalLedgerSha256(receipts, true) === specification.decodedLedgerSha256,
    `${componentName} canonical decoded-fragment ledger drifted`,
  );

  const positions = Buffer.concat(parsedFragments.map((fragment) => fragment.positions));
  const triangles = Buffer.allocUnsafe(totalTriangleCount * 3 * Uint32Array.BYTES_PER_ELEMENT);
  let indexWriteOffset = 0;
  let vertexOffset = 0;
  for (const fragment of parsedFragments) {
    for (let localIndex = 0; localIndex < fragment.triangleCount * 3; localIndex += 1) {
      const sourceIndex = fragment.indexBytes.readUInt32LE(localIndex * 4);
      triangles.writeUInt32LE(sourceIndex + vertexOffset, indexWriteOffset);
      indexWriteOffset += 4;
    }
    vertexOffset += fragment.vertexCount;
  }
  check(indexWriteOffset === triangles.byteLength, `${componentName} combined triangle allocation mismatch`);

  const browserDirectory = new URL("browser/", outputRoot);
  await mkdir(browserDirectory, { recursive: true });
  const positionsName = `browser/${componentName}.positions.f32le.bin`;
  const trianglesName = `browser/${componentName}.triangles.u32le.bin`;
  await writeFile(new URL(positionsName, outputRoot), positions);
  await writeFile(new URL(trianglesName, outputRoot), triangles);
  const extentNanometre = boundsNanometre.max.map((value, axis) => value - boundsNanometre.min[axis]);
  return {
    componentName,
    objectId: specification.objectId,
    sourceFormat: "neuroglancer_legacy_mesh_fragment",
    sourceManifest: manifestReceipt,
    segmentationInfo: infoReceipt,
    meshInfo: meshInfoReceipt,
    sourceFragments: {
      count: receipts.length,
      storedBytes: receipts.reduce((sum, receipt) => sum + receipt.storedBytes, 0),
      decodedBytes: receipts.reduce((sum, receipt) => sum + receipt.decodedBytes, 0),
      storedLedgerCanonicalization: "UTF-8 rows sorted by fragment name: fragment<TAB>storedBytes<TAB>storedSha256<LF>",
      storedLedgerSha256: canonicalLedgerSha256(receipts),
      decodedLedgerCanonicalization: "UTF-8 rows sorted by fragment name: fragment<TAB>decodedBytes<TAB>decodedSha256<LF>",
      decodedLedgerSha256: canonicalLedgerSha256(receipts, true),
      receipts,
    },
    browserGeometry: {
      format: "parallel_binary_arrays_v1",
      coordinateUnits: "nanometre",
      coordinateFrame: "MICrONS_Phase1_aligned_EM_native",
      positions: {
        path: relativePublicPath(outputRoot, positionsName),
        scalarType: "float32_little_endian",
        tupleSize: 3,
        bytes: positions.byteLength,
        sha256: sha256(positions),
      },
      triangles: {
        path: relativePublicPath(outputRoot, trianglesName),
        scalarType: "uint32_little_endian",
        tupleSize: 3,
        indexing: "zero_based_global_vertex_index",
        bytes: triangles.byteLength,
        sha256: sha256(triangles),
      },
      vertexCount: totalVertexCount,
      triangleCount: totalTriangleCount,
      boundsNanometre,
      extentNanometre,
      derivation: {
        algorithmId: "concatenate_legacy_mesh_fragments_rebase_indices_v1",
        fragmentOrder: "exact_source_manifest_order",
        positionPolicy: "copy_source_float32_bytes_without_numeric_conversion",
        trianglePolicy: "copy_source_triangle_order_and_add_cumulative_fragment_vertex_offset",
        vertexWelding: false,
        smoothing: false,
        repair: false,
        decimation: false,
        holeFilling: false,
        normalGeneration: false,
        coordinateTransformApplied: false,
      },
    },
  };
}

function parseArguments(argv) {
  const options = { importRoot: null, outputRoot: DEFAULT_OUTPUT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--import-root") options.importRoot = argv[++index];
    else if (argv[index] === "--output-root") options.outputRoot = argv[++index];
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  check(options.importRoot, "--import-root is required");
  return options;
}

export async function buildMicronsObservedCellNucleusReference({ importRoot, outputRoot = DEFAULT_OUTPUT_ROOT }) {
  const importRootUrl = new URL(`file://${resolve(importRoot).replace(/\/$/, "")}/`);
  const outputRootUrl = outputRoot instanceof URL
    ? outputRoot
    : new URL(`file://${resolve(outputRoot).replace(/\/$/, "")}/`);
  await ensureNewOutputRoot(outputRootUrl);
  const metadata = [];
  for (const receipt of SOURCE_LAYOUT.metadata) {
    metadata.push(await copyPinnedFile(importRootUrl, outputRootUrl, receipt, receipt.input));
  }
  const [cell, nucleus] = await Promise.all([
    buildComponent("cell", SOURCE_LAYOUT.cell, importRootUrl, outputRootUrl),
    buildComponent("nucleus", SOURCE_LAYOUT.nucleus, importRootUrl, outputRootUrl),
  ]);
  const manifest = {
    documentType: "microns_observed_cell_nucleus_asset_manifest",
    schemaVersion: "1.0.0",
    assetId: `MICrONS:Phase1:v185.4:root:${ROOT_ID}:nucleus:${NUCLEUS_ID}`,
    sourceRelease: "v185.4",
    metadataDepositVersion: "185.3",
    rootId: ROOT_ID,
    nucleusId: NUCLEUS_ID,
    admittedComponentCount: 2,
    sourceMetadataFiles: metadata,
    components: [cell, nucleus],
    crossSourceRegistrationCount: 0,
    generatedAtPolicy: "omitted_for_byte_determinism",
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(new URL("asset-manifest.json", outputRootUrl), manifestBytes);
  return {
    outputRoot: outputRootUrl,
    manifest,
    manifestBytes,
    manifestSha256: sha256(manifestBytes),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = await buildMicronsObservedCellNucleusReference(options);
    console.log(JSON.stringify({
      outputRoot: result.outputRoot.pathname,
      manifestBytes: result.manifestBytes.byteLength,
      manifestSha256: result.manifestSha256,
      components: result.manifest.components.map((component) => ({
        componentName: component.componentName,
        fragmentCount: component.sourceFragments.count,
        vertexCount: component.browserGeometry.vertexCount,
        triangleCount: component.browserGeometry.triangleCount,
      })),
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
