export const SOURCE_RECORD_DELTA_CONTRACT_ID = "source-record-display-delta-0.1";

export const SOURCE_RECORD_DELTA_BOUNDARY = Object.freeze({
  authority: "DISPLAY_ONLY",
  relationshipStatus: "not_established",
  crossSourceSameCellIdentityCount: 0,
  crossSourceSameTypeIdentityCount: 0,
  admittedGeometryPrimitiveCount: 0,
  generatedBiologicalGeometryPrimitiveCount: 0,
  joinCount: 0,
  registrationCount: 0,
  measurementUse: "forbidden",
});

const MAX_DISPLAY_ROWS = 64;
const MAX_DISPLAY_VALUE_LENGTH = 20_000;

function isPlainRecord(value) {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function nonEmptyString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function validateRecordDescriptor(descriptor, field) {
  if (!isPlainRecord(descriptor)) throw new TypeError(`${field} must be an object`);
  return {
    id: nonEmptyString(descriptor.id, `${field}.id`),
    label: nonEmptyString(descriptor.label, `${field}.label`),
    namespace: nonEmptyString(descriptor.namespace, `${field}.namespace`),
    value: descriptor.value,
  };
}

function validateRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_DISPLAY_ROWS) {
    throw new TypeError(`rows must contain 1-${MAX_DISPLAY_ROWS} explicitly whitelisted display rows`);
  }
  const ids = new Set();
  const labels = new Set();
  return rows.map((row, index) => {
    if (!isPlainRecord(row)) throw new TypeError(`rows[${index}] must be an object`);
    const id = nonEmptyString(row.id, `rows[${index}].id`);
    const label = nonEmptyString(row.label, `rows[${index}].label`);
    if (!/^[a-z][a-z0-9._-]*$/.test(id)) {
      throw new TypeError(`rows[${index}].id must be a stable lower-case display-row ID`);
    }
    if (ids.has(id)) throw new TypeError(`duplicate display-row ID ${id}`);
    if (labels.has(label)) throw new TypeError(`duplicate display-row label ${label}`);
    if (typeof row.read !== "function") throw new TypeError(`rows[${index}].read must be a function`);
    ids.add(id);
    labels.add(label);
    return { id, label, read: row.read };
  });
}

function readExactDisplayValue(row, descriptor, side) {
  let value;
  try {
    value = row.read(descriptor.value);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new TypeError(`${side} display row ${row.id} failed: ${reason}`);
  }
  if (
    typeof value !== "string"
    || !value.trim()
    || value.length > MAX_DISPLAY_VALUE_LENGTH
  ) {
    throw new TypeError(
      `${side} display row ${row.id} must return a non-empty string of at most ${MAX_DISPLAY_VALUE_LENGTH} characters`,
    );
  }
  return value;
}

function freezeRows(rows) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

/**
 * Compare exactly two source records through an explicit display-row whitelist.
 *
 * Equality is strict string equality. The helper does not normalize labels,
 * harmonize values, traverse unlisted fields, infer missing values, or establish
 * a biological relationship between records.
 *
 * @template T
 * @param {{
 *   oldRecord: {id: string, label: string, namespace: string, value: T},
 *   currentRecord: {id: string, label: string, namespace: string, value: T},
 *   rows: ReadonlyArray<{id: string, label: string, read: (record: T) => string}>
 * }} options
 */
export function buildSourceRecordDelta(options) {
  if (!isPlainRecord(options)) throw new TypeError("source-record delta options must be an object");
  const oldRecord = validateRecordDescriptor(options.oldRecord, "oldRecord");
  const currentRecord = validateRecordDescriptor(options.currentRecord, "currentRecord");
  if (oldRecord.id === currentRecord.id) {
    throw new TypeError("oldRecord.id and currentRecord.id must identify two distinct source records");
  }
  const rows = validateRows(options.rows);
  const sharedRows = [];
  const changedRows = [];

  for (const row of rows) {
    const oldValue = readExactDisplayValue(row, oldRecord, "oldRecord");
    const currentValue = readExactDisplayValue(row, currentRecord, "currentRecord");
    if (oldValue === currentValue) {
      sharedRows.push({ id: row.id, label: row.label, value: oldValue });
    } else {
      changedRows.push({ id: row.id, label: row.label, oldValue, currentValue });
    }
  }

  return Object.freeze({
    contractId: SOURCE_RECORD_DELTA_CONTRACT_ID,
    mode: "EXACT_WHITELISTED_DISPLAY_STRING_DELTA",
    oldRecord: Object.freeze({
      id: oldRecord.id,
      label: oldRecord.label,
      namespace: oldRecord.namespace,
    }),
    currentRecord: Object.freeze({
      id: currentRecord.id,
      label: currentRecord.label,
      namespace: currentRecord.namespace,
    }),
    whitelistedRowIds: Object.freeze(rows.map((row) => row.id)),
    sharedRows: freezeRows(sharedRows),
    changedRows: freezeRows(changedRows),
    summary: Object.freeze({
      whitelistedRowCount: rows.length,
      sharedRowCount: sharedRows.length,
      changedRowCount: changedRows.length,
      unlistedFieldCountInspected: 0,
    }),
    boundary: SOURCE_RECORD_DELTA_BOUNDARY,
  });
}
