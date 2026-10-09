import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOG_DIRECTORY, LOG_AUDIT_PATH, buildStandardizationLogAudit, parseStandardizationLog, checkStandardizedLogAgainstSwc } from '../tools/audit_nmo249676_standardization_logs_0_1.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audit = await buildStandardizationLogAudit();

test('actual official record-linked logs deterministically preserve upstream removals and unchanged warnings', async () => {
  assert.deepEqual(audit, JSON.parse(await readFile(path.join(root, LOG_AUDIT_PATH))));
  assert.deepEqual(audit.summary, { originalEntries: 58, upstreamShortSegmentRemovals: 42, originalUnchangedWarnings: 16, standardizedUnchangedWarnings: 13, exactStandardizedNodeCoordinateChecks: 13, newGeometryAdmissions: 0 });
  assert.deepEqual(audit.logs[0].declaredCounts, { A: 42, B1: 16, B2: 0, C: 0 });
  for (const log of audit.logs) { assert.equal(log.softwareVersion, '1.31'); assert.equal(log.sourceDateLiteral, '11/10/22'); assert.equal(log.lineEnding, 'CRLF'); assert.equal(log.contentTypeDiscrepancy, true); assert.ok(log.entries.every(e => e.coordinateSourceLine === e.sourceLine + 1)); }
});

test('all 13 standardized entries match exact frozen SWC node coordinates, reported radii and root topology', () => {
  assert.ok(audit.standardizedChecks.every(c => c.coordinatesExactlyMatch));
  assert.equal(audit.standardizedChecks.filter(c => c.radiusExactlyMatches).length, 10);
  const root = audit.standardizedChecks.find(c => c.nodeId === 1); assert.equal(root.daughterIds.length, 8); assert.equal(root.typeExactlyMatches, true);
  assert.equal(audit.standardizedChecks.filter(c => c.parentNodeId).length, 2);
  assert.equal(audit.scientificBoundary.originalStagePointIdsAreNotStandardizedNodeIds, true);
  for (const field of ['radiusOnlyCrossStageMatchingAdmitted','originalNodeCountReconstructed','datToSwcMatrixDeposited','contourAveragingRuleEstablished','geometryDisplayAdmitted','upstreamChangesReappliedLocally']) assert.equal(audit.scientificBoundary[field], false);
  assert.equal(audit.logs[0].entries.filter(e => e.reportedRadius === 0.995).length, 2);
});

test('HTML, substituted filenames, incomplete coordinate locators and changed source summary fail closed', async () => {
  assert.throws(() => parseStandardizationLog(Buffer.from('<html>access challenge</html>'), 'original'), /header/);
  const text = (await readFile(path.join(root, LOG_DIRECTORY, '061118B-S6-02_cell_2-RQ.std'))).toString('ascii');
  for (const bad of [text.replace('061118B-S6-02_cell_2-RQ.ASC.swc', 'another.ASC.swc'), text.replace('X, Y, Z:', 'X, Z:'), text.replace('irregularities = 42', 'irregularities = 41')]) assert.throws(() => parseStandardizationLog(Buffer.from(bad), 'original'));
});

test('a node ID with wrong coordinates or radius cannot be rescued by another matching point', async () => {
  const swc = await readFile(path.join(root, audit.standardizedSwcReceipt.path));
  const badCoordinates = structuredClone(audit.logs[1]); badCoordinates.entries[0].position[0] += 0.01;
  assert.throws(() => checkStandardizedLogAgainstSwc(badCoordinates, swc), /coordinate mismatch/);
  const badRadius = structuredClone(audit.logs[1]); badRadius.entries[0].reportedRadius += 0.01;
  assert.throws(() => checkStandardizedLogAgainstSwc(badRadius, swc));
});
