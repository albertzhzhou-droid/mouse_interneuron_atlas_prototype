"use client";

import {
  researchMvpRelease,
  type AtlasEntity,
} from "./atlas-types";

type MissingValue = { value: null; missingReason: string };
type Condition = {
  id: string;
  sourceId: string;
  species: string;
  lifeStage: string;
  strain: string | MissingValue;
  sex: string | MissingValue;
  injuryLevel: string;
  injuryType: string;
  completeness: string | MissingValue;
  phase: string | MissingValue;
  intervention: string;
  comparator: string;
  experimentalUnit: string;
  sampleSize: string | MissingValue;
  causalTest: string | MissingValue;
  endpoint: string;
  measurement: string;
  resultSummary: string;
  humanCausalEvidence?: boolean;
  statementIds: string[];
};

type Claim = {
  id: string;
  entityIds: string[];
  sourceIds: string[];
  conditionIds: string[];
  causalGrades: string[];
  endpoint: string;
  statement: string;
  humanCausalEvidence?: boolean;
  statementIds: string[];
};

type EvidenceStatement = {
  id: string;
  sourceId: string;
  kind: string;
  text: string;
};

const conditions = researchMvpRelease.conditions as unknown as Condition[];
const claims = researchMvpRelease.claims as unknown as Claim[];
const statements = researchMvpRelease.evidenceStatements as EvidenceStatement[];
const sources = researchMvpRelease.sources;

const conditionById = new Map(conditions.map((condition) => [condition.id, condition]));
const statementById = new Map(statements.map((statement) => [statement.id, statement]));
const sourceById = new Map(sources.map((source) => [source.id, source]));

export const RESEARCH_CONDITION_IDS = conditions.map((condition) => condition.id);

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isMissing(value: unknown): value is MissingValue {
  return Boolean(
    value
      && typeof value === "object"
      && "value" in value
      && (value as MissingValue).value === null
      && "missingReason" in value,
  );
}

function displayField(value: string | MissingValue) {
  if (isMissing(value)) return `Missing · ${prettify(value.missingReason)}`;
  return value;
}

function claimsForEntity(entityId: string) {
  return claims.filter((claim) => claim.entityIds.includes(entityId));
}

function claimsForCondition(conditionId: string) {
  return claims.filter((claim) => claim.conditionIds.includes(conditionId));
}

function statementSummary(condition: Condition, kinds: string[]) {
  const linked = condition.statementIds
    .map((id) => statementById.get(id))
    .filter((statement): statement is EvidenceStatement => Boolean(statement) && kinds.includes(statement.kind));
  return linked.length
    ? linked.map((statement) => `${statement.id}: ${statement.text}`).join(" · ")
    : "None recorded for this condition";
}

function ConditionCard({ condition }: { condition: Condition }) {
  const linkedStatements = condition.statementIds
    .map((id) => statementById.get(id))
    .filter((statement): statement is EvidenceStatement => Boolean(statement));
  return (
    <details className="condition-card" open={condition.lifeStage === "neonatal" || condition.species === "Homo sapiens"}>
      <summary>
        <span>{condition.id}</span>
        <strong>{condition.species} · {prettify(condition.lifeStage)}</strong>
        <em>{prettify(condition.injuryType)} · {prettify(condition.endpoint)}</em>
      </summary>
      <dl>
        <div><dt>Model</dt><dd>{condition.injuryLevel} · {displayField(condition.completeness)}</dd></div>
        <div><dt>Phase</dt><dd>{displayField(condition.phase)}</dd></div>
        <div><dt>Intervention</dt><dd>{condition.intervention}</dd></div>
        <div><dt>Comparator</dt><dd>{condition.comparator}</dd></div>
        <div><dt>Causal test</dt><dd>{displayField(condition.causalTest)}</dd></div>
        <div><dt>Sample</dt><dd>{condition.experimentalUnit} · {displayField(condition.sampleSize)}</dd></div>
        <div><dt>Measurement</dt><dd>{condition.measurement}</dd></div>
        <div><dt>Result</dt><dd>{condition.resultSummary}</dd></div>
      </dl>
      {condition.humanCausalEvidence === false && (
        <p className="human-causal-guard">Human causal population evidence: false</p>
      )}
      <ul className="statement-list">
        {linkedStatements.map((statement) => (
          <li key={statement.id}>
            <span>{statement.id} · {prettify(statement.kind)}</span>
            {statement.text}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ResearchEvidenceCard({ entity }: { entity: AtlasEntity }) {
  const linkedClaims = claimsForEntity(entity.id);
  const linkedSources = Array.from(
    new Set(linkedClaims.flatMap((claim) => claim.sourceIds)),
  ).map((id) => sourceById.get(id)).filter((source): source is (typeof sources)[number] => Boolean(source));

  return (
    <div className="research-evidence-card">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">STRUCTURED EVIDENCE · {entity.ledgerId}</p>
        <h2>{entity.name}</h2>
        <p>{linkedClaims.length} claim stream{linkedClaims.length === 1 ? "" : "s"} · condition separated</p>
      </div>
      <div className="status-badge-row">
        <span className="badge synthetic">Entity geometry SYN</span>
        <span className="badge schematic">Path SCH</span>
        {linkedClaims.flatMap((claim) => claim.causalGrades).map((grade, index) => (
          <span className="badge claim" key={`${grade}-${index}`}>{grade}</span>
        ))}
      </div>
      <div className="classification-note">
        <span>Independent identity axes</span>
        <div>{entity.classificationAxes.map((axis) => <em key={axis}>{prettify(axis)}</em>)}</div>
      </div>

      {linkedClaims.map((claim) => (
        <section className="claim-stream" key={claim.id} aria-labelledby={`${claim.id}-title`}>
          <div className="claim-stream-heading">
            <span>{claim.id}</span>
            <strong id={`${claim.id}-title`}>{claim.statement}</strong>
          </div>
          {claim.humanCausalEvidence === false && (
            <p className="human-causal-guard">Context only · human causal evidence fixed false</p>
          )}
          <div className="condition-stack">
            {claim.conditionIds.map((id) => {
              const condition = conditionById.get(id);
              return condition ? <ConditionCard key={id} condition={condition} /> : null;
            })}
          </div>
        </section>
      ))}

      <div className="source-stack">
        {linkedSources.map((source) => (
          <a key={source.id} className="source-link" href={source.sourceUrl} target="_blank" rel="noreferrer">
            {source.id} · {source.citation} · DOI {source.doi} ↗
          </a>
        ))}
      </div>
      <p className="coordinate-warning">
        No claim or condition is linked to exact cell xyz. Evidence entity geometry remains SYN;
        the separately bundled atlas and SWCs do not create a registration.
      </p>
    </div>
  );
}

const COMPARISON_ROWS: Array<[string, (condition: Condition) => string]> = [
  ["Identity / claim", (condition) => claimsForCondition(condition.id)
    .map((claim) => `${claim.entityIds.join(" + ")} · ${claim.id}`)
    .join(" · ")],
  ["Species / stage", (condition) => `${condition.species} · ${prettify(condition.lifeStage)}`],
  ["Lesion", (condition) => `${condition.injuryLevel} · ${prettify(condition.injuryType)} · ${displayField(condition.completeness)}`],
  ["Phase", (condition) => displayField(condition.phase)],
  ["Intervention", (condition) => condition.intervention],
  ["Comparator", (condition) => condition.comparator],
  ["Causal test", (condition) => displayField(condition.causalTest)],
  ["Causal grade", (condition) => claimsForCondition(condition.id)
    .flatMap((claim) => claim.causalGrades)
    .filter((grade, index, all) => all.indexOf(grade) === index)
    .join(" · ")],
  ["Endpoint", (condition) => prettify(condition.endpoint)],
  ["Sample", (condition) => `${condition.experimentalUnit} · ${displayField(condition.sampleSize)}`],
  ["Result", (condition) => condition.resultSummary],
  ["Negative / counterfinding", (condition) => statementSummary(
    condition,
    ["negative_finding", "null_result", "counterfinding"],
  )],
  ["Boundary / limitation", (condition) => statementSummary(condition, ["boundary", "limitation"])],
];

export function ComparisonPanel({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selected = selectedIds
    .map((id) => conditionById.get(id))
    .filter((condition): condition is Condition => Boolean(condition));
  const stratificationDimensions = ["species", "lifeStage", "injuryType", "endpoint"]
    .filter((key) => new Set(selected.map((condition) => condition[key as keyof Condition])).size > 1)
    .map(prettify);

  return (
    <div className="comparison-panel">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">US-04 · STRATIFIED COMPARISON</p>
        <h2>Compare experiment conditions</h2>
        <p>Select 2–4 rows. Differences are shown side by side and are never pooled.</p>
      </div>
      <div className="comparison-picker" aria-label="Condition comparison selection">
        {conditions.map((condition) => {
          const checked = selectedIds.includes(condition.id);
          return (
            <label key={condition.id}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && selectedIds.length >= 4}
                onChange={() => onToggle(condition.id)}
              />
              <span><strong>{condition.id}</strong>{condition.species} · {condition.lifeStage} · {prettify(condition.endpoint)}</span>
            </label>
          );
        })}
      </div>
      {selected.length < 2 ? (
        <div className="evidence-empty" role="status">
          <strong>Select at least two conditions</strong>
          <p>A comparison needs two independent condition rows; no values will be auto-filled.</p>
        </div>
      ) : (
        <>
          {stratificationDimensions.length > 0 && (
            <div className="comparison-guard" role="note">
              Stratify, do not aggregate: {stratificationDimensions.join(" · ")}
            </div>
          )}
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Dimension</th>
                  {selected.map((condition) => <th scope="col" key={condition.id}>{condition.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(([label, getValue]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {selected.map((condition) => <td key={condition.id}>{getValue(condition)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function missingEntries(condition: Condition) {
  return Object.entries(condition)
    .filter(([, value]) => isMissing(value))
    .map(([key, value]) => ({ key, reason: (value as MissingValue).missingReason }));
}

export function GapsPanel({ entity }: { entity: AtlasEntity | null }) {
  const linkedClaims = entity ? claimsForEntity(entity.id) : [];
  const linkedConditions = linkedClaims.flatMap((claim) => claim.conditionIds)
    .map((id) => conditionById.get(id))
    .filter((condition): condition is Condition => Boolean(condition));
  const gaps = linkedConditions.flatMap((condition) =>
    missingEntries(condition).map((entry) => ({ conditionId: condition.id, ...entry })),
  );
  return (
    <div className="gaps-panel">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">US-06 · EXPLICIT MISSINGNESS</p>
        <h2>{entity ? `${entity.shortLabel} gaps` : "No matching entity"}</h2>
        <p>Missing data are not zero values and do not imply biological absence.</p>
      </div>
      {entity ? (
        <>
          <div className="gap-summary-grid">
            <div><span>Spatial identity</span><strong>0 REG</strong><small>No evidence entity or type population has an atlas transform</small></div>
            <div><span>Morphology</span><strong>142 unlinked OBS</strong><small>Source-local reconstructions; zero complete axons reported</small></div>
            <div><span>Cross-study types</span><strong>0 exact</strong><small>Russ and Sathyamurthy labels remain in separate namespaces</small></div>
            <div><span>Model precision</span><strong>Unavailable</strong><small>No segment naming, fine-label continuity or measurement authority</small></div>
          </div>
          <h3>Highest-impact cross-lane gaps</h3>
          <ul className="model-gap-list">
            <li><strong>Type identity</strong><span>No validated Russ ↔ Sathyamurthy ↔ canonical-family mapping.</span></li>
            <li><strong>Non-lumbar morphology</strong><span>The current 142-record query census is entirely lumbar source context.</span></li>
            <li><strong>Complete axons and synapses</strong><span>Zero complete axons are reported; morphology cannot establish a connectome.</span></li>
            <li><strong>Cell-to-anatomy transforms</strong><span>No molecular cell, SWC or SCI entity has a validated reference-atlas transform.</span></li>
            <li><strong>Whole-spine molecular coverage</strong><span>Adult cervical, thoracic and sacral source-local populations remain future ingestion work.</span></li>
            <li><strong>Condition-resolved SCI space</strong><span>Spatial spots, cells and experimental states remain source-local and are not fused into the 3D reference.</span></li>
          </ul>
          <h3>Condition fields with explicit missing reasons</h3>
          {gaps.length ? (
            <ul className="gap-list">
              {gaps.map((gap) => (
                <li key={`${gap.conditionId}-${gap.key}`}>
                  <strong>{gap.conditionId}</strong>
                  <span>{prettify(gap.key)}</span>
                  <em>{prettify(gap.reason)}</em>
                </li>
              ))}
            </ul>
          ) : <p>No required condition field is missing in the selected evidence slice.</p>}
        </>
      ) : (
        <div className="evidence-empty"><strong>Query result: zero</strong><p>This is not a finding that the cell type does not exist.</p></div>
      )}
      <div className="asset-gap-stack">
        {researchMvpRelease.assets.map((asset) => (
          <div key={asset.id}>
            <span>{asset.assetType}</span>
            <strong>{asset.spatialStatus} · {asset.importStatus}</strong>
            <p>{asset.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
