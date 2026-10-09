import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateCrozatNaVDocument, crozatNaVInformation, filterCrozatNaVRows, makeCrozatNaVExport, crozatNaVCsv } from '../app/crozat-nav-inhibition-information.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateCrozatNaVInformation({ root = ROOT, python = 'python3' } = {}) {
  const result = spawnSync(python, [path.join(root, 'tools/build_crozat_nav_inhibition_information.py'), '--root', root, '--check'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || 'exact-source extraction failed');
  const [doc, schema] = await Promise.all(['data/crozat-nav-inhibition-information-0.1.json', 'schemas/crozat-nav-inhibition-information.schema.json'].map(name => readFile(path.join(root, name), 'utf8').then(JSON.parse)));
  const check = new Ajv2020({ allErrors: true }).compile(schema);
  assert.ok(check(doc), JSON.stringify(check.errors)); validateCrozatNaVDocument(doc);
  assert.deepEqual(doc, crozatNaVInformation, 'runtime factual derivative differs from replayed source');
  const rows = filterCrozatNaVRows(); assert.equal(rows.length, 84);
  const exported = makeCrozatNaVExport(rows); assert.equal(exported.independentPhysicalCellCount, null);
  assert.equal(crozatNaVCsv(rows).trimEnd().split('\n').length, 85);
  return { originalXlsxAndAuthorArticleInputReplay: JSON.parse(result.stdout), sourceWorkbooks: 2,
    observedWorksheetRows: 84, densityRows: 56, percentageRows: 28, nativeLabelCollisionRows: 6,
    sourceConflictsRetained: 3, sourceVersion: 2, explicitFileLicense: 'CC BY 4.0',
    uniquePhysicalCells: null, pairs: 0, mappedAnimals: 0, newSourceProfiles: 0,
    geometry: 0, internalObjects: 0, registrations: 0, actualBrowserObserved: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await validateCrozatNaVInformation()));
