import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const extractorUrl = new URL(
  '../tools/extract_cano_gomez_multiome_metadata.R',
  import.meta.url,
);

const readExtractor = () => readFile(extractorUrl, 'utf8');

const assertBalancedRDelimiters = (source) => {
  const opening = new Map([
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
  ]);
  const closing = new Set(opening.values());
  const stack = [];
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (comment) {
      if (character === '\n') comment = false;
      continue;
    }
    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '#') {
      comment = true;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (opening.has(character)) {
      stack.push({ character, index });
      continue;
    }
    if (closing.has(character)) {
      const last = stack.pop();
      assert.ok(last, `unexpected closing delimiter ${character} at ${index}`);
      assert.equal(opening.get(last.character), character);
    }
  }

  assert.equal(quote, null, 'unterminated R string or backtick identifier');
  assert.deepEqual(stack, [], 'unclosed R delimiter');
};

test('Cano-Gomez extractor source has balanced R delimiters', async () => {
  assertBalancedRDelimiters(await readExtractor());
});

test('Cano-Gomez extractor pins the three exact source objects and denominators', async () => {
  const source = await readExtractor();

  for (const literal of [
    'GSE318731_P56_cholinergic_multiome.rds',
    'GSE318731_P56_gabaergic_multiome.rds',
    'GSE318731_P56_glutamatergic_multiome_UPDATE.rds',
    'expected_nuclei = 3199L',
    'expected_nuclei = 73364L',
    'expected_nuclei = 92782L',
    'expected_groups = 5L',
    'expected_groups = 24L',
    'expected_groups = 28L',
    'EXPECTED_TOTAL_NUCLEI <- 169345L',
    'EXPECTED_TOTAL_GROUPS <- 57L',
  ]) {
    assert.ok(source.includes(literal), `missing contract literal: ${literal}`);
  }
});

test('Cano-Gomez extractor verifies every identity/order boundary', async () => {
  const source = await readExtractor();

  for (const literal of [
    'anyDuplicated(nuclei) > 0L',
    'SeuratObject::Cells(object)',
    'colnames(object)',
    'colnames(object[[assay_name]])',
    'names(active_ident)',
    'assert_identical_order(',
    'meta_data_row_names_nonempty = TRUE',
    'meta_data_row_names_unique = TRUE',
  ]) {
    assert.ok(source.includes(literal), `missing identity check: ${literal}`);
  }
});

test('Cano-Gomez extractor preserves raw fields and emits auditable profiles', async () => {
  const source = await readExtractor();

  for (const literal of [
    'REQUIRED_RAW_METADATA_COLUMNS <- c("groups", "neuron_types")',
    'storage_mode = storage.mode(values)',
    'factor_levels = as.list(factor_levels)',
    'observed_value_counts = count_values(serialized)',
    'na_count = sum(is.na(serialized))',
    'empty_string_count = if (is_textual)',
    'zero_count_levels = as.list(zero_count_levels)',
    'raw_labels_preserved = TRUE',
    'label_normalization_applied = FALSE',
  ]) {
    assert.ok(source.includes(literal), `missing metadata receipt field: ${literal}`);
  }

  assert.doesNotMatch(source, /groups_manual|is_interneuron|is_motor|is_projection/);
});

test('Cano-Gomez extractor makes stable keys and byte-deterministic artifacts', async () => {
  const source = await readExtractor();

  assert.ok(source.includes('sep = "|"'));
  assert.ok(
    source.includes(
      'compound_key_expression = "GSE318731|exact source filename|row.name"',
    ),
  );
  assert.ok(source.includes('args = c("-n", "-9", "-c", shQuote(input_path))'));
  assert.ok(source.includes('open = "wb"'));
  assert.ok(source.includes('sha256_file('));
  assert.ok(source.includes('format_version = CONTRACT_VERSION'));
  assert.doesNotMatch(source, /Sys\.time\(|generated[_A]?t/i);
});

test('reported 516 types is reconciled but never a hard failure', async () => {
  const source = await readExtractor();

  assert.ok(source.includes('REPORTED_TYPE_TOTAL_NOT_ASSERTED <- 516L'));
  assert.ok(source.includes('matches_reported_type_total'));
  assert.ok(source.includes('hard_assertion_applied = FALSE'));
  assert.ok(source.includes('reported_516_type_denominator_hard_assertion_applied = FALSE'));
  assert.doesNotMatch(source, /abort\([^)]*516|stopifnot\([^)]*516/s);
});

test('runtime prerequisites and fail-closed output behavior are explicit', async () => {
  const source = await readExtractor();

  for (const literal of [
    'REQUIRED_PACKAGES <- c("SeuratObject", "jsonlite", "digest")',
    'R >= 4.2.0 is required;',
    'length(arguments) != 4L',
    'Output path already exists:',
    'Missing required R package(s):',
    'Required executable `gzip` was not found.',
    'quit(save = "no", status = 1L, runLast = FALSE)',
  ]) {
    assert.ok(source.includes(literal), `missing failure contract: ${literal}`);
  }
});
