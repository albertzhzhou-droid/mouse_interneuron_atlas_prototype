import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBilXeniumCoordinateSourceAudit } from '../app/bil-xenium-coordinate-source-audit.js';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateBilCoordinateSourceFiles(audit, schemaAudit, readBytes = p => readFile(path.join(ROOT, p))) {
  const result = validateBilXeniumCoordinateSourceAudit(audit, schemaAudit);
  const files = [...audit.sourceInputs, ...audit.priorSourceDependencies];
  for (const file of files) {
    const bytes = await readBytes(file.path);
    if (bytes.byteLength !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`BIL original coordinate input changed: ${file.path}`);
  }
  return { ...result, verifiedOriginalFileCount: files.length, proofScope: 'sealed offline original-file audit; not a runtime geometry attestation' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const audit = JSON.parse(await readFile(path.join(ROOT, 'data/bil-xenium-coordinate-source-audit-0.1.json')));
  const schema = JSON.parse(await readFile(path.join(ROOT, 'data/bil-xenium-geometry-schema-audit-0.1.json')));
  console.log(JSON.stringify(await validateBilCoordinateSourceFiles(audit, schema)));
}
