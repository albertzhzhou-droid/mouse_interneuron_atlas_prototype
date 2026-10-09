import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBilPublishedWorkflowAudit, ROOT, AUDIT_PATH } from '../tools/build_bil_xenium_published_workflow_audit.mjs';
import { validateBilPublishedWorkflowAudit } from '../app/bil-xenium-published-workflow-audit.js';
export async function validateBilPublishedWorkflowFiles() {
  const saved = await readFile(path.join(ROOT, AUDIT_PATH));
  const expected = await buildBilPublishedWorkflowAudit();
  if (!saved.equals(Buffer.from(JSON.stringify(expected, null, 2) + '\n'))) throw new Error('Published workflow source audit is stale or promoted');
  return validateBilPublishedWorkflowAudit(expected);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await validateBilPublishedWorkflowFiles()));
