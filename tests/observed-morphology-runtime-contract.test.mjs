import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const [sceneCanvasSource, atlasPrototypeSource, atlasTypesSource, morphologyLoaderSource] = await Promise.all([
  readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/atlas-types.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/morphology-census-data.ts", import.meta.url), "utf8"),
]);

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sourceDeclaresBinding(source, identifier) {
  const declaration = new RegExp(`\\b(?:const|let|var|function|class|enum)\\s+${escapeRegExp(identifier)}\\b`);
  if (declaration.test(source)) return true;

  for (const match of source.matchAll(/import\s*\{([\s\S]*?)\}\s*from/g)) {
    const localNames = match[1]
      .split(",")
      .map((entry) => entry.trim().replace(/^type\s+/, ""))
      .filter(Boolean)
      .map((entry) => entry.split(/\s+as\s+/).at(-1));
    if (localNames.includes(identifier)) return true;
  }

  return new RegExp(`import\\s+(?:type\\s+)?${escapeRegExp(identifier)}\\s+from`).test(source)
    || new RegExp(`import\\s+\\*\\s+as\\s+${escapeRegExp(identifier)}\\s+from`).test(source);
}

function explicitRecordMembership(source, contractName) {
  const contract = escapeRegExp(contractName);
  const directLookup = new RegExp(`${contract}\\.records\\.(?:some|find)\\s*\\(`);
  const frozenIdSet = new RegExp(`new\\s+Set\\s*\\(\\s*${contract}\\.records\\.map\\s*\\(`);
  return directLookup.test(source) || frozenIdSet.test(source);
}

function loadMorphologyLoaderWithMocks({ expectedRecord, geometryBytes, expectedSha256, audit }) {
  const output = ts.transpileModule(morphologyLoaderSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  const expectedMembership = expectedRecord.comparisonMembership;
  const requireMock = (specifier) => {
    if (specifier === "react") return { useEffect() {}, useState() {} };
    if (specifier === "./source-local-morphology-geometry.js") {
      return { sha256Hex: async () => expectedSha256 };
    }
    if (specifier === "./morphology-source-frame-disclosure") {
      return {
        morphologySourceFrameDisclosureFor(record) {
          audit.disclosureChecks += 1;
          if (record.assetId !== expectedRecord.assetId) throw new Error("asset identity drifted");
          if (record.geometry.path !== expectedRecord.geometry.path) throw new Error("geometry path drifted");
          if (record.geometry.bytes !== expectedRecord.geometry.bytes) throw new Error("geometry bytes drifted");
          const membership = record.comparisonMembership ?? {
            collection: "census",
            censusContribution: 1,
            supplementaryContribution: 0,
          };
          if (
            membership.collection !== expectedMembership.collection ||
            membership.censusContribution !== expectedMembership.censusContribution ||
            membership.supplementaryContribution !== expectedMembership.supplementaryContribution
          ) throw new Error("membership drifted");
          return { neuronId: expectedRecord.neuronId, assetId: expectedRecord.assetId };
        },
        assertGeometryMatchesSourceFrameDisclosure(disclosure, geometry) {
          audit.geometryDisclosureChecks += 1;
          assert.equal(geometry.neuronId, disclosure.neuronId);
          assert.equal(geometry.assetId, disclosure.assetId);
          return true;
        },
      };
    }
    throw new Error(`unexpected mocked import: ${specifier}`);
  };
  const fetchMock = async () => {
    audit.fetches += 1;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => geometryBytes.buffer.slice(
        geometryBytes.byteOffset,
        geometryBytes.byteOffset + geometryBytes.byteLength,
      ),
    };
  };
  Function("require", "module", "exports", "fetch", output)(
    requireMock,
    compiledModule,
    compiledModule.exports,
    fetchMock,
  );
  return compiledModule.exports;
}

test("cached morphology geometry revalidates the current source record and disclosure", async () => {
  const expectedSha256 = "a".repeat(64);
  const geometry = {
    neuronId: 45674,
    assetId: "neuromorpho-45674",
    geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
    segments: [[0, 0, 0, 1, 1, 1, 1, 1, 3, "observed"]],
  };
  const geometryBytes = new TextEncoder().encode(JSON.stringify(geometry));
  const validRecord = {
    neuronId: geometry.neuronId,
    assetId: geometry.assetId,
    geometry: {
      available: true,
      path: "/data/geometry-45674.json",
      sha256: expectedSha256,
      bytes: geometryBytes.byteLength,
      rawSwcSha256: "b".repeat(64),
      missingReason: null,
    },
    morphometrics: { computed: { segmentCount: geometry.segments.length } },
    comparisonMembership: {
      collection: "supplementary",
      censusContribution: 0,
      supplementaryContribution: 1,
    },
  };
  const audit = { disclosureChecks: 0, geometryDisclosureChecks: 0, fetches: 0 };
  const loader = loadMorphologyLoaderWithMocks({
    expectedRecord: validRecord,
    geometryBytes,
    expectedSha256,
    audit,
  });

  await loader.loadVerifiedMorphologyGeometry(validRecord);
  await loader.loadVerifiedMorphologyGeometry(structuredClone(validRecord));
  assert.deepEqual(audit, { disclosureChecks: 2, geometryDisclosureChecks: 2, fetches: 1 });

  const driftedRecords = [
    { label: "asset", mutate: (record) => { record.assetId = "drifted-asset"; } },
    { label: "path", mutate: (record) => { record.geometry.path = "/data/drifted.json"; } },
    { label: "bytes", mutate: (record) => { record.geometry.bytes += 1; } },
    {
      label: "membership",
      mutate: (record) => {
        record.comparisonMembership = {
          collection: "census",
          censusContribution: 1,
          supplementaryContribution: 0,
        };
      },
    },
  ];
  for (const { label, mutate } of driftedRecords) {
    const record = structuredClone(validRecord);
    mutate(record);
    await assert.rejects(
      loader.loadVerifiedMorphologyGeometry(record),
      /drifted/,
      `${label} drift with the same neuron ID and SHA must fail before cache reuse`,
    );
  }

  const currentRecordDrift = structuredClone(validRecord);
  currentRecordDrift.morphometrics.computed.segmentCount += 1;
  await assert.rejects(
    loader.loadVerifiedMorphologyGeometry(currentRecordDrift),
    /geometry identity or authority receipt mismatch/,
    "cached geometry must still be asserted against the current record",
  );
  assert.equal(audit.fetches, 1, "no drifted record may trigger or evade the existing cache entry");
});

test("legacy morphology routes use a non-null fallback whose binding is defined", () => {
  const fallbackMatch = sceneCanvasSource.match(
    /routeContractId:\s*route\?\.contractId\s*\?\?\s*([^,\n}]+)/,
  );
  assert.ok(fallbackMatch, "the route receipt must retain an explicit legacy contract fallback");

  const fallbackExpression = fallbackMatch[1].trim();
  assert.doesNotMatch(fallbackExpression, /^(?:null|undefined)$/);
  if (/^["'`]/.test(fallbackExpression)) return;

  const baseIdentifier = fallbackExpression.match(/^([A-Za-z_$][\w$]*)/)?.[1];
  assert.ok(baseIdentifier, `could not resolve legacy route fallback expression: ${fallbackExpression}`);
  assert.equal(
    sourceDeclaresBinding(sceneCanvasSource, baseIdentifier),
    true,
    `legacy route fallback ${baseIdentifier} must be imported or declared before use`,
  );
});

test("the application imports the current research iteration 2.43 manifest", () => {
  assert.match(atlasTypesSource, /from\s+["']\.\.\/data\/research-iteration-manifest-2\.43\.json["']/);
  assert.doesNotMatch(atlasTypesSource, /from\s+["']\.\.\/data\/research-iteration-manifest-2\.(?:24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40)\.json["']/);
});

test("exports gate both frozen morphology contracts by explicit record membership", () => {
  const exportStateSource = sourceSection(
    atlasPrototypeSource,
    "const exportState = () => {",
    "const exportCsv = () => {",
  );

  assert.equal(
    explicitRecordMembership(atlasPrototypeSource, "observedCellFormLens"),
    true,
    "the frozen observed-cell-form release must be gated by its own records, not census membership",
  );
  assert.equal(
    explicitRecordMembership(atlasPrototypeSource, "morphologyFidelityContract"),
    true,
    "the frozen morphology-fidelity release must be gated by its own records, not census membership",
  );
  assert.doesNotMatch(
    exportStateSource,
    /releaseId:\s*observedMorphologyRoute\s*&&\s*!observedMorphologyRoute\.censusMembership/,
  );
  assert.doesNotMatch(
    exportStateSource,
    /releaseId:\s*morphologyFidelityContract\.releaseId\s*,/,
    "a route-only record must not inherit the frozen fidelity-contract release ID",
  );
});

test("stale morphology runtime receipts reset on state transitions and fail closed in every export", () => {
  const restoreSource = sourceSection(
    atlasPrototypeSource,
    "const restoreLocation = () => {",
    "queueMicrotask(restoreLocation);",
  );
  const resetSource = sourceSection(
    atlasPrototypeSource,
    "const reset = () => {",
    "const share = async () => {",
  );
  const importSource = sourceSection(
    atlasPrototypeSource,
    "const importState = async",
    "const exportBaseName =",
  );

  assert.match(
    restoreSource,
    /locationState\.visualTarget\.neuronId\s*===\s*null\s*\?\s*clearedMorphologyRuntime\(locationState\.visualTarget\.reason\)\s*:\s*pendingMorphologyRuntime\(locationState\.observedCellFormId,\s*locationState\.morphologyFidelityMode\)/,
  );
  assert.match(
    resetSource,
    /const resetTarget = resolveResearchVisualTarget\([\s\S]*?applyResolvedVisualTarget\(resetTarget\)/,
  );
  assert.match(
    importSource,
    /const resolvedImportedTarget = resolveResearchVisualTarget\([\s\S]*?const importedTarget = \{[\s\S]*?applyResolvedVisualTarget\(importedTarget\)/,
  );

  assert.match(
    atlasPrototypeSource,
    /const morphologyRuntimeMatchesCurrentSelection = viewportMorphologyNeuronId !== null\s*&& morphologyRuntime\.requestedNeuronId === viewportMorphologyNeuronId\s*&& morphologyRuntime\.requestedMode === morphologyFidelityMode/,
  );
  assert.match(
    atlasPrototypeSource,
    /const guardedMorphologyRuntime = viewportMorphologyNeuronId === null\s*\? clearedMorphologyRuntime\(morphologyVisualTarget\.reason\)\s*:\s*morphologyRuntimeMatchesCurrentSelection\s*\? morphologyRuntime/,
  );
  const exportSections = [
    sourceSection(atlasPrototypeSource, "const exportState = () => {", "const exportCsv = () => {"),
    sourceSection(atlasPrototypeSource, "const exportCsv = () => {", "const exportPng = async () => {"),
    sourceSection(atlasPrototypeSource, "const exportPng = async () => {", "return ("),
  ];

  for (const exportSource of exportSections) {
    assert.match(exportSource, /\bguardedMorphologyRuntime\b/);
    assert.doesNotMatch(
      exportSource,
      /morphologyRuntime\.(?:actualMode|algorithmId|verificationStatus|sceneObjectStatus|visible|reason)/,
      "exports must read the target-aware identity-guarded receipt rather than stale component state",
    );
    assert.doesNotMatch(exportSource, /runtimeReceipt:\s*morphologyRuntime\b/);
    assert.doesNotMatch(exportSource, /\bmorphologyRuntime,\s*(?:\n|\})/);
  }
});

test("radius mode preserves distinct OBS centerline and DER surface representation metadata", () => {
  const factorySource = sourceSection(
    sceneCanvasSource,
    "function createSourceLocalMorphologyObject(",
    "function createPath(",
  );
  const traversalSource = factorySource.includes("group.traverse((child) => {")
    ? sourceSection(factorySource, "group.traverse((child) => {", "return group;")
    : "";
  const childAwarePropagation = /child\.userData\.representation/.test(traversalSource)
    && /OBS_SKELETON/.test(traversalSource)
    && /DER_RADIUS_SURFACE/.test(traversalSource);
  const separateMetadataApplications = (factorySource.match(/representationRuntimeMetadata\s*\(/g) ?? []).length >= 2
    && /OBS_SKELETON/.test(factorySource)
    && /DER_RADIUS_SURFACE/.test(factorySource);
  const stateAwareSubtreeMetadata = /annotateSubtree\([^;]+"OBS_SKELETON"\)/.test(factorySource)
    && /annotateSubtree\([^;]+"DER_RADIUS_SURFACE"\)/.test(factorySource)
    && /subtree\.traverse\(\(child\) => \{/.test(factorySource);

  assert.equal(
    childAwarePropagation || separateMetadataApplications || stateAwareSubtreeMetadata,
    true,
    "observed centerline descendants must not inherit DER_RADIUS_SURFACE metadata from the radius-mode parent",
  );
});

test("the interactive canvas has keyboard semantics or an explicitly linked equivalent control", () => {
  const focusableCanvas = /domElement\.tabIndex\s*=\s*0/.test(sceneCanvasSource)
    || /domElement\.setAttribute\(\s*["']tabindex["']\s*,\s*["']0["']\s*\)/i.test(sceneCanvasSource);
  const keyboardListener = /domElement\.addEventListener\(\s*["']keydown["']/.test(sceneCanvasSource);
  const keyboardCleanup = /domElement\.removeEventListener\(\s*["']keydown["']/.test(sceneCanvasSource);
  const staticImageRole = /domElement\.setAttribute\(\s*["']role["']\s*,\s*["']img["']\s*\)/.test(sceneCanvasSource);
  const keyboardSemantics = focusableCanvas && keyboardListener && keyboardCleanup && !staticImageRole;

  const describedById = sceneCanvasSource.match(
    /domElement\.setAttribute\(\s*["']aria-describedby["']\s*,\s*["']([^"']+)["']\s*\)/,
  )?.[1];
  const explicitlyLinkedEquivalent = Boolean(
    describedById
    && new RegExp(`id=["']${escapeRegExp(describedById)}["']`).test(atlasPrototypeSource)
    && new RegExp(`${escapeRegExp(describedById)}[\\s\\S]{0,800}(?:keyboard|equivalent|view controls)`, "i")
      .test(atlasPrototypeSource),
  );

  assert.equal(
    keyboardSemantics || explicitlyLinkedEquivalent,
    true,
    "OrbitControls and pointer picking require a focusable keyboard path, or a programmatically linked equivalent-control description",
  );
});
