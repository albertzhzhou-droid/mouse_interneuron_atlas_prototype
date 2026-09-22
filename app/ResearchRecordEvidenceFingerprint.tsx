"use client";

export type EvidenceFingerprintAxis = {
  label: string;
  status: string;
  tone: "observed" | "context" | "missing";
};

export type ResearchRecordEvidenceFingerprintProps = {
  recordId: string;
  sourceLabel: string;
  namespace: string;
  observationUnit: string;
  samplingCount: number | null;
  samplingUnit: string | null;
  samplingSummary?: string | null;
  markers: string[];
  regionContext: string;
  lifeStage: string;
  transmitterContext: string;
  axes: EvidenceFingerprintAxis[];
  recordBoundary: string;
};

export function humanizeEvidenceToken(value: string) {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "Not reported";
}

function safeHeadingId(recordId: string) {
  return `evidence-fingerprint-${recordId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}

function sampledCountLabel(count: number | null, unit: string | null) {
  if (count === null) return "Count not retained";
  const normalizedUnit = humanizeEvidenceToken(unit ?? "observations").toLowerCase();
  const pluralUnit = count === 1
    ? normalizedUnit
    : normalizedUnit === "nucleus"
      ? "nuclei"
      : normalizedUnit === "nuclei" || normalizedUnit.endsWith("s")
        ? normalizedUnit
        : `${normalizedUnit}s`;
  return `${count.toLocaleString("en-US")} sampled ${pluralUnit}`;
}

export default function ResearchRecordEvidenceFingerprint({
  recordId,
  sourceLabel,
  namespace,
  observationUnit,
  samplingCount,
  samplingUnit,
  samplingSummary = null,
  markers,
  regionContext,
  lifeStage,
  transmitterContext,
  axes,
  recordBoundary,
}: ResearchRecordEvidenceFingerprintProps) {
  const headingId = safeHeadingId(recordId);
  const markerText = markers.length ? markers.join(" · ") : "No source marker panel retained";
  const availableAxes = axes.filter((axis) => axis.tone !== "missing");
  const missingAxes = axes.filter((axis) => axis.tone === "missing");

  return (
    <section
      className="research-record-fingerprint"
      aria-labelledby={headingId}
      data-record-id={recordId}
      data-geometry-status="no-admitted-cell-geometry"
    >
      <header>
        <div>
          <span>SELECTED SOURCE-RECORD FINGERPRINT</span>
          <h5 id={headingId}>{sourceLabel}</h5>
          <p>{namespace}</p>
        </div>
        <strong>{samplingSummary ?? sampledCountLabel(samplingCount, samplingUnit)}</strong>
      </header>

      <dl className="research-record-fingerprint-facts">
        <div><dt>Observation unit</dt><dd>{humanizeEvidenceToken(observationUnit)}</dd></div>
        <div><dt>Source markers</dt><dd>{markerText}</dd></div>
        <div><dt>Source-local region evidence</dt><dd>{humanizeEvidenceToken(regionContext)}</dd></div>
        <div><dt>Life stage / transmitter</dt><dd>{humanizeEvidenceToken(lifeStage)} · {humanizeEvidenceToken(transmitterContext)}</dd></div>
      </dl>

      <div className="research-record-fingerprint-axes" aria-label={`Evidence-axis status for ${sourceLabel}`}>
        {availableAxes.map((axis) => (
          <div className={axis.tone} key={axis.label}>
            <strong>{axis.label}</strong>
            <span>{humanizeEvidenceToken(axis.status)}</span>
          </div>
        ))}
      </div>

      {!!missingAxes.length && (
        <details className="research-record-fingerprint-missing" data-missing-axis-count={missingAxes.length}>
          <summary>{missingAxes.length} unavailable or unlinked evidence axes · consolidated</summary>
          <p>These record-level gaps remain explicit and searchable; they are collapsed once to prevent repeated empty cards from dominating the profile.</p>
          <dl>
            {missingAxes.map((axis) => (
              <div key={axis.label}><dt>{axis.label}</dt><dd>{humanizeEvidenceToken(axis.status)}</dd></div>
            ))}
          </dl>
        </details>
      )}

      <p className="research-record-fingerprint-geometry" role="status">
        <strong>0 admitted cell-geometry primitives</strong>
        Source-profile evidence changes this fingerprint only. It does not create a sphere, representative cell, neurite arbor, internal structure, or fallback morphology in 3D.
      </p>

      <details className="research-record-fingerprint-limits">
        <summary>Identity and geometry limits · collapsed</summary>
        <p><strong>Shared project limit:</strong> a shared label, marker, region, or co-display does not establish same-cell identity, same-type identity, atlas registration, morphology, or causality.</p>
        <p><strong>Record-specific boundary:</strong> {recordBoundary}</p>
      </details>
    </section>
  );
}
