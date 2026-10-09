#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LOG_DIRECTORY = 'data/source-candidates/nmo-249676-standardization-20261003';
export const LOG_AUDIT_PATH = 'data/nmo249676-standardization-log-audit-0.1.json';
const STEM = '061118B-S6-02_cell_2-RQ';
const PINNED_LOGS = Object.freeze({
  standardized: { name: STEM + '.CNG.swc.std', bytes: 1906, sha256: '83c46e6fb0b837d555a92572884f5b0ad49b83e3c04ccc0f1468eb29096dca1d' },
  original: { name: STEM + '.std', bytes: 7253, sha256: '035730855f12191c39168f92d6bc3e0ffd266e7e9c93f361e7aa93735f3ed8a3' },
});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const basename = name => name.split(/[\\/]/).at(-1);

export function parseStandardizationLog(bytes, role) {
  assert.ok(['original', 'standardized'].includes(role));
  assert.ok(bytes.every(b => b === 9 || b === 10 || b === 13 || b >= 32 && b <= 126), 'Log must be plain ASCII text');
  const lines = bytes.toString('ascii').split(/\r?\n/);
  const header = lines[0].match(/^# Standardization file for (.+) created with StdSwc version (\S+) on (\S+)\.$/);
  assert.ok(header, 'Missing source log header; HTML and guessed content are rejected');
  assert.equal(basename(header[1]), STEM + (role === 'standardized' ? '.CNG.swc' : '.ASC.swc'));
  const entries = [], declaredCounts = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const count = line.match(/^Number of type (A|B1|B2|C) irregularities = (\d+)$/);
    if (count) { assert.equal(declaredCounts[count[1]], undefined); declaredCounts[count[1]] = Number(count[2]); continue; }
    const entry = line.match(/^(\d+\.\d+)\s+(.+?)\s+\((no action taken|removed)\)$/);
    assert.ok(entry, `Unrecognized log entry at source line ${i + 1}`);
    const coordinate = lines[i + 1]?.trim().match(/^(A|B1|B2|C)\s+X, Y, Z:\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/);
    assert.ok(coordinate, `Missing coordinate locator after source line ${i + 1}`);
    const description = entry[2], details = {};
    let kind, match;
    if ((match = description.match(/^Radius of line (\d+) at ([\d.]+) >= ([\d.]+) stdevs above the mean\.$/))) {
      kind = 'radius_warning'; Object.assign(details, { pointIds: [Number(match[1])], reportedRadius: Number(match[2]), standardDeviationMultiplier: Number(match[3]) });
    } else if ((match = description.match(/^(?:Length of segment ending at point|Seg length ending at pt\.) (\d+) (>=|<=) ([\d.]+)(?: stdevs above mean)? at ([\d.]+)\.$/))) {
      kind = entry[3] === 'removed' ? 'short_segment_removed' : 'long_segment_warning';
      Object.assign(details, { pointIds: [Number(match[1])], comparator: match[2], reportedCriterion: Number(match[3]), reportedLength: Number(match[4]) });
    } else if ((match = description.match(/^Line (\d+) has (\d+) daughters\.\s+Type is (\d+)\.$/))) {
      kind = 'daughter_count_warning'; Object.assign(details, { pointIds: [Number(match[1])], reportedDaughterCount: Number(match[2]), reportedSwcType: Number(match[3]) });
    } else if ((match = description.match(/^Line (\d+) and line (\d+) have the same coordinates\.\s+Parents do not match\.$/))) {
      kind = 'duplicate_coordinate_different_parent_warning'; details.pointIds = [Number(match[1]), Number(match[2])];
    } else if ((match = description.match(/^Line (\d+) of rad ([\d.]+) links to (\d+) of rad ([\d.]+)\.$/))) {
      kind = 'radius_link_warning'; Object.assign(details, { pointIds: [Number(match[1]), Number(match[3])], reportedRadii: [Number(match[2]), Number(match[4])] });
    } else assert.fail(`Unsupported description at source line ${i + 1}`);
    const position = coordinate.slice(2).map(Number); assert.ok(position.every(Number.isFinite));
    entries.push({ sourceLine: i + 1, coordinateSourceLine: i + 2, code: entry[1], category: coordinate[1], action: entry[3], kind, position, ...details });
    i++;
  }
  const categories = Object.fromEntries(['A', 'B1', 'B2', 'C'].map(c => [c, entries.filter(e => e.category === c).length]));
  for (const [category, value] of Object.entries(declaredCounts)) assert.equal(categories[category], value, `Source summary ${category} disagrees with entries`);
  return { stage: role === 'original' ? 'ASC_to_CNG_conversion_history' : 'CNG_quality_check', sourceFileName: basename(header[1]), software: 'StdSwc', softwareVersion: header[2], sourceDateLiteral: header[3], sourceDateInterpretation: 'Unresolved day/month order; source literal retained', lineEnding: bytes.includes(Buffer.from('\r\n')) ? 'CRLF' : 'LF', entryCount: entries.length, categories, declaredCounts, entries };
}

export function checkStandardizedLogAgainstSwc(log, swcBytes) {
  assert.equal(log.stage, 'CNG_quality_check');
  const nodes = swcBytes.toString('utf8').split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#')).map(l => l.trim().split(/\s+/).map(Number));
  assert.ok(nodes.every(n => n.length === 7 && n.every(Number.isFinite))); const byId = new Map(nodes.map(n => [n[0], n]));
  assert.equal(byId.size, nodes.length);
  return log.entries.map(e => {
    assert.equal(e.action, 'no action taken'); assert.equal(e.pointIds.length, 1);
    const nodeId = e.pointIds[0], node = byId.get(nodeId); assert.ok(node, `Logged point ${nodeId} missing`);
    assert.deepEqual(node.slice(2, 5), e.position, `Logged point ${nodeId} coordinate mismatch`);
    const matchingCoordinateNodeIds = nodes.filter(n => n.slice(2, 5).every((v, a) => v === e.position[a])).map(n => n[0]);
    const result = { sourceLine: e.sourceLine, nodeId, coordinatesExactlyMatch: true, matchingCoordinateNodeIds };
    if (e.kind === 'radius_warning') { assert.equal(node[5], e.reportedRadius); result.radiusExactlyMatches = true; }
    if (e.kind === 'daughter_count_warning') {
      const daughterIds = nodes.filter(n => n[6] === nodeId).map(n => n[0]); assert.equal(daughterIds.length, e.reportedDaughterCount); assert.equal(node[1], e.reportedSwcType);
      Object.assign(result, { daughterIds, daughterCountExactlyMatches: true, typeExactlyMatches: true });
    }
    if (e.kind === 'long_segment_warning') {
      const parent = byId.get(node[6]); assert.ok(parent); const serializedLength = Math.hypot(...node.slice(2, 5).map((v, a) => v - parent[a + 2]));
      Object.assign(result, { parentNodeId: node[6], serializedSwcSegmentLength: serializedLength, loggedLength: e.reportedLength, difference: serializedLength - e.reportedLength, lengthComparisonScope: 'Recorded value versus rounded SWC coordinates; no equality or biological accuracy inferred' });
    }
    return result;
  });
}

export async function buildStandardizationLogAudit({ root = ROOT, readImpl = readFile } = {}) {
  const read = p => readImpl(path.join(root, p));
  const receiptPath = LOG_DIRECTORY + '/download-receipt.json', receiptBytes = await read(receiptPath), receipt = JSON.parse(receiptBytes);
  assert.equal(receipt.neuronId, 249676); assert.equal(receipt.files.length, 2);
  const logs = [];
  for (const role of ['original', 'standardized']) {
    const pin = PINNED_LOGS[role], declarations = receipt.files.filter(f => f.role === role); assert.equal(declarations.length, 1); const declaration = declarations[0];
    assert.equal(declaration.httpStatus, 200); for (const key of ['name', 'bytes', 'sha256']) assert.equal(declaration[key], pin[key]);
    assert.ok(declaration.url.startsWith('https://neuromorpho.org/dableFiles/todd/'));
    const p = LOG_DIRECTORY + '/' + pin.name, bytes = await read(p); assert.equal(bytes.length, pin.bytes); assert.equal(sha(bytes), pin.sha256, p);
    logs.push({ receipt: { path: p, bytes: bytes.length, sha256: sha(bytes) }, serverContentType: declaration.headers.contentType, contentTypeDiscrepancy: declaration.headers.contentType !== 'text/plain', interpretedContent: 'Verified ASCII StdSwc log; never executed or interpreted as XML drawing', ...parseStandardizationLog(bytes, role) });
  }
  const authorityPath = 'data/morphology-source-frame-disclosure-0.1.json', manifest = JSON.parse(await read('data/research-iteration-manifest-2.91.json'));
  const pin = manifest.authoritativeInputs.find(p => p.path === authorityPath); assert.ok(pin);
  const authorityBytes = await read(authorityPath); assert.equal(authorityBytes.length, pin.bytes); assert.equal(sha(authorityBytes), pin.sha256);
  const frames = JSON.parse(authorityBytes).records.filter(r => r.neuronId === 249676); assert.equal(frames.length, 1);
  const geometryPath = 'public/data/dorsal_horn_observed_morphology_route_pack_v1/geometry/nmo-249676.json';
  assert.equal(frames[0].geometryReceipt.path, geometryPath.slice(6));
  const geometryBytes = await read(geometryPath); assert.equal(geometryBytes.length, frames[0].geometryReceipt.bytes); assert.equal(sha(geometryBytes), frames[0].geometryReceipt.sha256);
  const geometry = JSON.parse(geometryBytes), swcPath = 'public/data/dorsal_horn_observed_morphology_route_pack_v1/swc/nmo-249676.swc', swcBytes = await read(swcPath);
  assert.equal(geometry.swc.path, 'swc/nmo-249676.swc'); assert.equal(swcBytes.length, geometry.swc.bytes); assert.equal(sha(swcBytes), geometry.swc.sha256); assert.equal(sha(swcBytes), frames[0].geometryReceipt.rawSwcSha256);
  const standardizedChecks = checkStandardizedLogAgainstSwc(logs[1], swcBytes);
  return { schemaVersion: '0.1.0', auditId: 'nmo249676-standardization-log-audit-0.1', auditDate: '2026-10-03', neuronId: 249676,
    downloadReceipt: { path: receiptPath, bytes: receiptBytes.length, sha256: sha(receiptBytes) },
    standardizedSwcReceipt: { path: swcPath, bytes: swcBytes.length, sha256: sha(swcBytes) },
    sourceTerms: { url: 'https://neuromorpho.org/useterm.jsp', checkedDate: '2026-10-03', declaredLicense: 'CC-BY-4.0', publicationCitationRequirements: ['Original reconstruction paper: DOI 10.1097/j.pain.0000000000002677; PMID 35543635 from frozen exact record metadata', 'NeuroMorpho.Org (RRID:SCR_002145)', 'Tecuatl, Ljungquist and Ascoli 2024; DOI 10.1096/fba.2024-00048'], scope: 'Official NeuroMorpho material and these directly linked auxiliary logs; no license inferred for external publisher figures' },
    summary: { originalEntries: logs[0].entryCount, upstreamShortSegmentRemovals: logs[0].entries.filter(e => e.kind === 'short_segment_removed').length, originalUnchangedWarnings: logs[0].entries.filter(e => e.action === 'no action taken').length, standardizedUnchangedWarnings: logs[1].entryCount, exactStandardizedNodeCoordinateChecks: standardizedChecks.length, newGeometryAdmissions: 0 },
    logs, standardizedChecks,
    scientificBoundary: { originalStagePointIdsAreNotStandardizedNodeIds: true, radiusOnlyCrossStageMatchingAdmitted: false, originalNodeCountReconstructed: false, datToSwcMatrixDeposited: false, contourAveragingRuleEstablished: false, sourceNoDiameterDeclarationPreserved: true, upstreamChangesReappliedLocally: false, physicalSectionCorrespondenceEstablished: false, geometryDisplayAdmitted: false, internalOrRegistrationAdmitted: false },
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const audit = await buildStandardizationLogAudit();
  if (process.argv.includes('--write')) await writeFile(path.join(ROOT, LOG_AUDIT_PATH), JSON.stringify(audit, null, 2) + '\n');
  console.log(JSON.stringify(audit.summary));
}
