#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { validateGarciaRamirezPhysiology } from '../app/garcia-ramirez-physiology.js';

const root = new URL('../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const md5 = bytes => createHash('md5').update(bytes).digest('hex');
const read = path => readFile(new URL(path, root));
export async function validatePersistedGarciaRamirezPhysiology() {
  const [dataBytes, receiptBytes, schemaBytes, extractorBytes] = await Promise.all([
    read('data/garcia-ramirez-adult-spinal-physiology-0.1.json'),
    read('data/garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json'),
    read('schemas/garcia-ramirez-adult-spinal-physiology-0.1.schema.json'),
    read('tools/extract_garcia_ramirez_physiology.py'),
  ]);
  const facts = JSON.parse(dataBytes), receipt = JSON.parse(receiptBytes), schema = JSON.parse(schemaBytes);
  const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
  assert.ok(validate(facts), JSON.stringify(validate.errors));
  const counts = validateGarciaRamirezPhysiology(facts, receipt);
  assert.equal(receipt.output.path, 'garcia-ramirez-adult-spinal-physiology-0.1.json');
  assert.equal(receipt.output.bytes, 203887);
  assert.equal(receipt.output.sha256, '48e1788f3ee0e4472e7431f349418aea078a4b89b3766c35bcddfb946f4f1bf9', 'Pinned literal source derivative changed');
  assert.equal(receipt.extractorSha256, '8ef0843732f48857093396c64110ffa4a8c46e8d4cb6e5dd06a273b82be068d5', 'Pinned extractor release changed');
  assert.equal(dataBytes.length, receipt.output.bytes);
  assert.equal(sha(dataBytes), receipt.output.sha256, 'Derived facts differ from the extraction receipt');
  assert.equal(sha(extractorBytes), receipt.extractorSha256, 'Extractor source differs from the derivation receipt');
  const inputs = new Map(await Promise.all(receipt.sourceInputs.map(async pin => {
    assert.ok(!/[\\/]/.test(pin.fileName), 'Source file names must remain literal local names');
    const bytes = await read(`data/source-candidates/garcia-ramirez-physiology-20261004/${pin.fileName}`);
    assert.equal(bytes.length, pin.bytes, `Source length changed: ${pin.fileName}`);
    assert.equal(sha(bytes), pin.sha256, `Source SHA changed: ${pin.fileName}`);
    return [pin.fileName, bytes];
  })));
  assert.equal(md5(inputs.get('data-sheet-1-file36551718.docx')), 'cd540639b14fda1fd1149b235384b795');
  const metadata = JSON.parse(inputs.get('figshare-article-20428674.json'));
  assert.equal(metadata.id, 20428674);
  assert.equal(metadata.resource_doi, facts.source.publication.doi);
  assert.equal(metadata.license.url, 'https://creativecommons.org/licenses/by/4.0/');
  const file = metadata.files.find(row => row.id === 36551718);
  assert.equal(file.size, 687234);
  assert.equal(file.supplied_md5, file.computed_md5);
  assert.equal(file.computed_md5, md5(inputs.get('data-sheet-1-file36551718.docx')));
  return { ...counts, sourceInputFiles: inputs.size, exactSourceBytes: [...inputs.values()].reduce((sum, bytes) => sum + bytes.length, 0), rights: 'CC BY 4.0', scope: 'published_aggregate_facts_only' };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(await validatePersistedGarciaRamirezPhysiology()));
}
