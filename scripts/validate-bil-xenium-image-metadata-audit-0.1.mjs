import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBilXeniumImageMetadataAudit } from '../app/bil-xenium-image-metadata-audit.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateBilImageMetadataSourceFiles(audit, coordinates, schema, readBytes = p => readFile(path.join(ROOT,p))) {
  const result = validateBilXeniumImageMetadataAudit(audit,coordinates,schema);
  for (const row of [...audit.sourceInputs,...audit.priorSourceDependencies]) {
    const bytes = await readBytes(row.path);
    if (bytes.byteLength !== row.bytes || createHash('sha256').update(bytes).digest('hex') !== row.sha256) throw new Error(`BIL original image-metadata input changed: ${row.path}`);
  }
  const receipt = JSON.parse(await readBytes('data/source-candidates/bil-xenium-ome-20261002/receipt.json'));
  if (JSON.stringify(receipt.metadata) !== JSON.stringify(audit.imageMetadata) || receipt.rangeTransferBytes !== audit.integrityScope.rangeTransferBytes || receipt.sourceUrl !== audit.sourceUrl) throw new Error('BIL first-IFD receipt differs from metadata audit');
  return {...result, verifiedOriginalFileCount: audit.sourceInputs.length + audit.priorSourceDependencies.length, proofScope:'sealed offline metadata and numerical consistency; no pixel alignment, biological sections or geometry admission'};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const json = async name => JSON.parse(await readFile(path.join(ROOT,'data',name)));
  const [audit,coordinates,schema] = await Promise.all(['bil-xenium-image-metadata-audit-0.1.json','bil-xenium-coordinate-source-audit-0.1.json','bil-xenium-geometry-schema-audit-0.1.json'].map(json));
  console.log(JSON.stringify(await validateBilImageMetadataSourceFiles(audit,coordinates,schema)));
}
