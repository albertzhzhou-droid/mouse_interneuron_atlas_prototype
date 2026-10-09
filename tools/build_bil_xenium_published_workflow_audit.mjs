import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CANDIDATE = 'data/source-candidates/published-xenium-registration-20261002';
export const AUDIT_PATH = 'data/bil-xenium-published-workflow-audit-0.1.json';
const SOURCES = [
  { key: 'registration', repository: 'isst001/spatial-image-registration', commit: 'e46d4cbcb807818cb2ac676a7a7ea73739e5667c', treeSha: 'f31a2836bff905cd7109c69fc5c6eaf9720d36aa', blobs: 11, acquired: 10 },
  { key: 'cano', repository: 'PoolLab/cano-gomez_et_al_2026', commit: '530f6546fd6cc7b344b26d850fa87ee7baab60fb', treeSha: 'da676a6315fa1b3c604382bd9df3c3567aaa2022', blobs: 7, acquired: 7 },
];
const digest = b => createHash('sha256').update(b).digest('hex');
const blobDigest = b => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex');
function requireEvidence(value, message) { if (!value) throw new Error(`Published Xenium workflow: ${message}`); }
const safe = p => typeof p === 'string' && p.length > 0 && !p.startsWith('/') && !p.split('/').some(x => ['', '.', '..'].includes(x));

function verifyGitTree(tree) {
  const directories = [{ path: '', sha: tree.sha }, ...tree.tree.filter(e => e.type === 'tree')];
  for (const directory of directories) {
    const prefix = directory.path ? directory.path + '/' : '';
    const entries = tree.tree.filter(e => e.path.startsWith(prefix) && !e.path.slice(prefix.length).includes('/'));
    const sorted = entries.map(e => ({ ...e, leaf: e.path.slice(prefix.length) })).sort((a, b) => Buffer.compare(Buffer.from(a.leaf + (a.type === 'tree' ? '/' : '')), Buffer.from(b.leaf + (b.type === 'tree' ? '/' : ''))));
    const raw = Buffer.concat(sorted.map(e => Buffer.concat([Buffer.from(`${e.mode.replace(/^0/, '')} ${e.leaf}\0`), Buffer.from(e.sha, 'hex')])));
    const sha = createHash('sha1').update(Buffer.concat([Buffer.from(`tree ${raw.length}\0`), raw])).digest('hex');
    requireEvidence(sha === directory.sha, 'Git tree object hash mismatch');
  }
}

/** Inspect retained text and Git inventories only. Never import or execute upstream R. */
export async function buildBilPublishedWorkflowAudit(readBytes = p => readFile(path.join(ROOT, p))) {
  const inputs = new Map();
  async function bytes(relative) {
    requireEvidence(safe(relative), 'unsafe source input path');
    const b = Buffer.from(await readBytes(relative));
    inputs.set(relative, { path: relative, bytes: b.length, sha256: digest(b) });
    return b;
  }
  const json = async p => JSON.parse((await bytes(`${CANDIDATE}/${p}`)).toString('utf8'));
  const metadata = await json('metadata-fetch-receipt.json');
  const fetches = await json('source-fetch-receipt.json');
  requireEvidence(metadata.requests.length === 4 && fetches.requests.length === 17, 'request inventory changed');
  requireEvidence(new Set(metadata.requests.map(r => r.path)).size === 4 && new Set(fetches.requests.map(r => r.path)).size === 17, 'duplicate fetch receipt');
  for (const receipt of metadata.requests) {
    const b = await bytes(`${CANDIDATE}/${receipt.path}`);
    requireEvidence(receipt.status === 200 && receipt.url === receipt.finalUrl && b.length === receipt.bytes && digest(b) === receipt.sha256, 'metadata receipt bytes changed');
  }
  const text = new Map();
  const repositories = [];
  for (const source of SOURCES) {
    const commit = await json(`${source.key}-commit.json`), tree = await json(`${source.key}-tree.json`);
    requireEvidence(commit.sha === source.commit && tree.sha === source.treeSha && tree.sha === commit.commit.tree.sha && tree.truncated === false, 'commit or complete tree mismatch');
    verifyGitTree(tree);
    const api = `https://api.github.com/repos/${source.repository}`;
    requireEvidence(metadata.requests.some(r => r.path === `${source.key}-commit.json` && r.url === `${api}/commits/main`) && metadata.requests.some(r => r.path === `${source.key}-tree.json` && r.url === `${api}/git/trees/${tree.sha}?recursive=1`), 'metadata origin changed');
    const blobs = tree.tree.filter(x => x.type === 'blob');
    requireEvidence(blobs.length === source.blobs && new Set(tree.tree.map(x => x.path)).size === tree.tree.length, 'tree inventory changed');
    const acquired = [], omitted = [];
    for (const blob of blobs) {
      requireEvidence(safe(blob.path) && Number.isSafeInteger(blob.size), 'unsafe Git blob');
      const sourcePath = `${source.key}/${blob.path}`;
      const receipt = fetches.requests.find(r => r.path === sourcePath);
      if (blob.size > 100000) {
        requireEvidence(source.key === 'registration' && blob.path === 'inst/extdata/contour_img.png' && blob.size === 926076 && !receipt, 'unexpected unacquired payload');
        omitted.push({ path: blob.path, bytes: blob.size, gitBlobSha: blob.sha, status: 'inventory_only_not_acquired_or_image_verified' });
        continue;
      }
      const b = await bytes(`${CANDIDATE}/${sourcePath}`);
      const url = `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${blob.path}`;
      requireEvidence(receipt && receipt.url === url && receipt.finalUrl === url && receipt.status === 200 && receipt.bytes === blob.size && b.length === blob.size && digest(b) === receipt.sha256 && blobDigest(b) === blob.sha && receipt.gitBlobSha === blob.sha, `source blob receipt changed: ${sourcePath}`);
      text.set(sourcePath, b.toString('utf8'));
      acquired.push({ path: blob.path, bytes: blob.size, gitBlobSha: blob.sha, sha256: digest(b) });
    }
    requireEvidence(acquired.length === source.acquired, 'acquired blob count changed');
    repositories.push({ ...source, commitDate: commit.commit.committer.date, treeSha: tree.sha, treeTruncated: false, acquiredFiles: acquired, unacquiredFiles: omitted, licence: source.key === 'registration' ? 'MIT_software_notice_present' : 'no_licence_file_in_pinned_tree' });
  }
  function locator(sourcePath, exactLine) {
    const lines = text.get(sourcePath)?.split('\n');
    const matches = lines?.flatMap((line, i) => line.trim() === exactLine ? [i + 1] : []) ?? [];
    requireEvidence(matches.length === 1, `source locator changed: ${exactLine}`);
    const source = SOURCES.find(s => sourcePath.startsWith(s.key + '/'));
    return { path: `${CANDIDATE}/${sourcePath}`, line: matches[0], sourceUrl: `https://github.com/${source.repository}/blob/${source.commit}/${sourcePath.slice(source.key.length + 1)}#L${matches[0]}` };
  }
  const code = 'registration/R/image_registration_public_release.R';
  const licence = text.get('registration/LICENSE');
  requireEvidence(licence.startsWith('MIT License\n') && licence.includes('Copyright (c) 2026 Satoshi Ishishita'), 'software licence notice changed');
  const anchors = text.get('registration/inst/extdata/contour_anchors_example.csv').trim().split('\n');
  requireEvidence(anchors[0] === 'x,y' && anchors.length === 25 && anchors.slice(1).every(line => line.split(',').length === 2 && line.split(',').every(v => Number.isFinite(Number(v)))), 'example anchor schema changed');
  const registrationTree = JSON.parse((await readBytes(`${CANDIDATE}/registration-tree.json`)).toString()).tree;
  const canoTree = JSON.parse((await readBytes(`${CANDIDATE}/cano-tree.json`)).toString()).tree;
  const missingInputs = ['data/input/seurat_object.rds', 'data/anchors/anchor_spatial_sample_01.csv', 'data/outputs', 'R/run_example.R', 'inst/extdata/contour_img_example.png'];
  requireEvidence(missingInputs.every(p => !registrationTree.some(x => x.path === p)), 'published input/output inventory changed');
  for (const p of ['data/input', 'data/anchors', 'data/ouputs']) requireEvidence(registrationTree.some(x => x.path === p && x.type === 'blob' && x.size < 20), 'placeholder ceased to be a small file');
  const namedProcessedInputs = ['Xen_GLUT_COMBINED_v24_named.rds', 'Xen_GABA_COMBINED_v9_named.rds', 'Xen_CHOL_COMBINED_v6_named.rds'];
  requireEvidence(namedProcessedInputs.every(name => !canoTree.some(x => x.path.endsWith('/' + name) || x.path === name)), 'processed Xenium input is now present');
  const canoSex = 'cano/04_Sex_Differences';
  const audit = {
    schemaVersion: '0.1.0', auditId: 'bil-xenium-published-workflow-audit-0.1', checkedDate: '2026-10-02',
    scope: 'pinned_public_software_inventory_not_exact_run_mapping', collectionDoi: '10.35077/g.1196',
    repositories, sourceInputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path)),
    availability: { completeGitTreeInventories: 2, listedBlobs: 18, acquiredTextBlobs: 17, acquiredSourceBytes: repositories.reduce((n, r) => n + r.acquiredFiles.reduce((m, f) => m + f.bytes, 0), 0), sourceRCodeExecuted: false, specimenDataAcquired: false, exampleTargetAnchorRows: 24, exampleAnchorSchema: ['x', 'y'], missingRegistrationPaths: missingInputs, placeholdersAreFilesNotDirectories: ['data/input', 'data/anchors', 'data/ouputs'], namedProcessedInputs, processedInputEvidence: namedProcessedInputs.map(name => locator(canoSex, `${name.startsWith('Xen_GLUT') ? 'glut' : name.startsWith('Xen_GABA') ? 'gaba' : 'chol'}_neurons = readRDS("./${name}")`)), findingScope: 'these_two_complete_pinned_git_trees_only_not_all_public_or_private_data' },
    identity: { originalCellIdMapPresent: false, biologicalSectionMapPresent: false, specimenMapPresent: false, curatedCellTypeMapPresent: false, exactRunSourceObjectKey: null, exactRunAnalysisUuid: null, exactRunRoiUuid: null,
      operations: [
        { operation: 'split_source_ids_on_underscore', locator: locator(code, 'split_ids <- strsplit(old_ids, "_", fixed = TRUE)') },
        { operation: 'select_eighth_field_by_default', locator: locator(code, 'cell_id_field_index = 8,') },
        { operation: 'make_unique_suffixes', locator: locator(code, 'new_ids <- make.unique(new_ids)') },
        { operation: 'replace_seurat_cell_names', locator: locator(code, 'seu <- RenameCells(object = seu, new.names = new_ids)') },
        { operation: 'output_renamed_centroid_ids', locator: locator(code, 'centroids_warped$cell_id <- cent_sel$cell_id') },
      ], requiredInput: 'Exact original-to-renamed ID crosswalk, including source ROI/analysis namespace, collision suffixes and section/specimen identifiers. A matching eighth field or generated suffix alone is insufficient.' },
    coordinate: { exactOutlineToCellTransform: null, sourceRunAnchorPairsPresent: false, savedSourceRotationPresent: false, sourcePolygonSelectionPresent: false, physicalCalibrationOfTargetImage: null,
      operations: [
        { operation: 'manual_polygon_selection', locator: locator(code, 'poly <- locator(type = "l")') },
        { operation: 'manual_rotation', locator: locator(code, 'angle_deg <- as.numeric(readline("Rotation angle in degrees (e.g. 90): "))') },
        { operation: 'manual_spatial_anchors', locator: locator(code, 'anchor_spatial <- as.data.frame(locator(n = n_anchor_points))') },
        { operation: 'thin_plate_spline_model', locator: locator(code, 'tps_fit <- fit_tps_models(') },
        { operation: 'target_image_y_inversion', locator: locator(code, 'centroids_warped$y <- img_h - centroids_warped$y') },
      ], defaultTypeColumn: 'RNA_snn_res.14', defaultTypeLocator: locator(code, 'cell_type_column = "RNA_snn_res.14"'), requiredInput: 'Exact run/section selection polygon, source and target anchor pairs, applied rotation/centre, target-image calibration and source-supported output with parent cell IDs; example target anchors alone do not define this transform.' },
    rights: { softwareLicenceAppliesToBILFiles: false, bilPolicyDifferenceResolved: false, canoSoftwareReuseAuthorisedByThisAudit: false, dataRightsVerifiedBySoftwareLicence: false },
    admission: { geometryViewerAdmission: false, sectionLinkedCellNucleusGeometryCount: 0, interneuronObjects: 0, atlasRegistrations: 0, sameCellMorphologyJoins: 0, fullGoalComplete: false },
  };
  return audit;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const audit = await buildBilPublishedWorkflowAudit();
  if (process.argv.includes('--write')) await writeFile(path.join(ROOT, AUDIT_PATH), JSON.stringify(audit, null, 2) + '\n');
  console.log(JSON.stringify({ acquiredTextBlobs: audit.availability.acquiredTextBlobs, verifiedInputs: audit.sourceInputs.length, originalCellIdMap: false, geometryObjects: 0 }));
}
