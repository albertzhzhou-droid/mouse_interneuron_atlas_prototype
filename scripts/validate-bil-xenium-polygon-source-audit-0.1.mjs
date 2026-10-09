import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBilXeniumPolygonSourceAudit } from '../app/bil-xenium-polygon-source-audit.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateBilPolygonSourceFiles(audit, coordinates, schema, readBytes = p => readFile(path.join(ROOT,p))) {
  const result = validateBilXeniumPolygonSourceAudit(audit,coordinates,schema);
  const files = [...audit.sourceInputs,...audit.priorSourceDependencies];
  for (const file of files) {
    const b=await readBytes(file.path);
    if (b.byteLength !== file.bytes || createHash('sha256').update(b).digest('hex') !== file.sha256) throw new Error(`BIL original polygon input changed: ${file.path}`);
  }
  return { ...result,verifiedOriginalFileCount:files.length,proofScope:'sealed offline original-file audit; not rendered geometry, whole archive or section admission' };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const json = async name => JSON.parse(await readFile(path.join(ROOT,'data',name)));
  const [audit,coordinates,schema] = await Promise.all(['bil-xenium-polygon-source-audit-0.1.json','bil-xenium-coordinate-source-audit-0.1.json','bil-xenium-geometry-schema-audit-0.1.json'].map(json));
  console.log(JSON.stringify(await validateBilPolygonSourceFiles(audit,coordinates,schema)));
}
