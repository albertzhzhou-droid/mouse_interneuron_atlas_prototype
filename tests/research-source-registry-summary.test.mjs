import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveResearchSourceRegistrySummary,
  formatResearchSourceRegistrySummary,
  formatResearchSourceRegistryTab,
} from "../app/research-source-registry-summary.js";
import {
  CANONICAL_DENOMINATOR_DISPLAYS,
  findStaleCanonicalDenominatorLiterals,
  validateResearchSourceRegistryDenominators,
} from "../scripts/validate-research-source-registry-denominators.mjs";

const registry = JSON.parse(await readFile(new URL("../data/research-source-registry-0.1.json", import.meta.url), "utf8"));

function sampleRegistry() {
  return {
    sourceCount: 1,
    sources: [{
      id: "SRC-A",
      recordSets: [{
        recordSetId: "RS-A",
        childRosterRef: { status: "bundled_exact" },
        sourceObjectSetRef: { status: "bundled_exact" },
      }],
    }],
  };
}

test("derives all four canonical units from the registry structure", () => {
  const summary = deriveResearchSourceRegistrySummary(registry);
  assert.deepEqual(summary, {
    sourceCount: 27,
    recordSetCount: 36,
    bundledExactCellProfileRosterCount: 11,
    bundledExactSourceObjectSetCount: 2,
  });
  assert.equal(formatResearchSourceRegistrySummary(summary), "27 sources · 36 record sets · 11 exact cell/profile rosters + 2 exact source-object sets");
  assert.equal(formatResearchSourceRegistryTab(summary), "Sources · 27 canonical packages");
  assert.equal(Object.isFrozen(summary), true);
});

test("source, record-set, roster and source-object-set mutations propagate independently", () => {
  const sourceMutation = sampleRegistry();
  sourceMutation.sources.push({ id: "SRC-B", recordSets: [] });
  sourceMutation.sourceCount = 2;
  assert.deepEqual(deriveResearchSourceRegistrySummary(sourceMutation), {
    sourceCount: 2,
    recordSetCount: 1,
    bundledExactCellProfileRosterCount: 1,
    bundledExactSourceObjectSetCount: 1,
  });

  const recordSetMutation = sampleRegistry();
  recordSetMutation.sources[0].recordSets.push({
    recordSetId: "RS-B",
    childRosterRef: { status: "not_retained" },
    sourceObjectSetRef: { status: "not_retained" },
  });
  assert.equal(deriveResearchSourceRegistrySummary(recordSetMutation).recordSetCount, 2);

  const rosterMutation = sampleRegistry();
  rosterMutation.sources[0].recordSets[0].childRosterRef.status = "not_retained";
  assert.equal(deriveResearchSourceRegistrySummary(rosterMutation).bundledExactCellProfileRosterCount, 0);
  assert.equal(deriveResearchSourceRegistrySummary(rosterMutation).bundledExactSourceObjectSetCount, 1);

  const objectMutation = sampleRegistry();
  objectMutation.sources[0].recordSets[0].sourceObjectSetRef.status = "not_retained";
  assert.equal(deriveResearchSourceRegistrySummary(objectMutation).bundledExactCellProfileRosterCount, 1);
  assert.equal(deriveResearchSourceRegistrySummary(objectMutation).bundledExactSourceObjectSetCount, 0);
});

test("rejects a declared source denominator that disagrees with the registry array", () => {
  const drifted = sampleRegistry();
  drifted.sourceCount = 2;
  assert.throws(() => deriveResearchSourceRegistrySummary(drifted), /Declared and actual research source counts disagree/);
});

test("enumerates every retained UI display and finds stale literals", async () => {
  const receipt = await validateResearchSourceRegistryDenominators();
  assert.equal(receipt.enumeratedDisplayCount, 8);
  assert.deepEqual(new Set(receipt.units), new Set([
    "sources",
    "record_sets",
    "cell_profile_rosters",
    "source_object_sets",
  ]));
  assert.equal(receipt.staleLiteralCount, 0);
  assert.equal(CANONICAL_DENOMINATOR_DISPLAYS.length, 8);

  const stale = findStaleCanonicalDenominatorLiterals([
    { path: "app/Fake.tsx", source: "Sources · 27 canonical packages" },
    { path: "app/Fake2.tsx", source: "27 sources · 33 record sets · 9 exact cell/profile rosters + 1 exact source-object set" },
    { path: "app/Fake3.tsx", source: "27 canonical source packages" },
    { path: "app/Fake4.tsx", source: "33 record sets" },
    { path: "app/Fake5.tsx", source: "9 exact rosters" },
    { path: "app/Fake6.tsx", source: "1 bundled exact source-object set" },
  ]);
  assert.equal(stale.length, 9);
});
