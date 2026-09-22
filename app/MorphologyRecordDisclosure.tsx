import { morphologyShrinkageInterpretation } from "./morphology-comparison.js";
import type { MorphologySourceFrameDisclosure } from "./morphology-source-frame-disclosure";

function rawSourceText(value: string | null) {
  return value ?? "Not supplied";
}

function ageText(disclosure: MorphologySourceFrameDisclosure) {
  const age = disclosure.preparation.numericAge;
  if (age.status !== "reported") return "Unavailable · numeric age not reported by source";
  const range = age.minimum === age.maximum || age.maximum === null
    ? age.minimum
    : `${age.minimum}–${age.maximum}`;
  return `Reported · ${range ?? "value unavailable"}${age.scale ? ` ${age.scale}` : ""}`;
}

function extentText(disclosure: MorphologySourceFrameDisclosure) {
  const [x, y, z] = disclosure.sourceCoordinates.extentMicrometre;
  const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return disclosure.preparation.dimensionality === "2D"
    ? `${format(x)} × ${format(y)} µm · z unavailable`
    : `${format(x)} × ${format(y)} × ${format(z)} µm`;
}

function membershipText(disclosure: MorphologySourceFrameDisclosure) {
  return disclosure.membership.collection === "census"
    ? "Frozen 142-record census · census contribution 1 · supplementary contribution 0"
    : "7-object supplementary route collection · census contribution 0 · supplementary contribution 1";
}

function axonCoverageText(disclosure: MorphologySourceFrameDisclosure) {
  return disclosure.truncation.axonField === "reconstructed_source_field"
    ? "Reconstructed source axon field; whole biological axon not established"
    : "Axon not reconstructed; biological absence not inferred";
}

export default function MorphologyRecordDisclosure({
  disclosure,
  geometryVerification,
}: {
  disclosure: MorphologySourceFrameDisclosure;
  geometryVerification: "verified" | "pending" | "unavailable";
}) {
  const thicknessRaw = disclosure.preparation.slicingThicknessMicrometre === null
    ? "Not supplied"
    : String(disclosure.preparation.slicingThicknessMicrometre);
  return (
    <section className="morphology-record-disclosure morphology-source-preparation" aria-label={`Record-specific source disclosure for NeuroMorpho ${disclosure.neuronId}`}>
      <header>
        <strong>Record-specific source disclosure</strong>
        <span>{disclosure.preparation.dimensionality === "2D" ? "2D SOURCE PLANE · Z UNAVAILABLE" : "3D SOURCE COORDINATES"}</span>
      </header>
      <dl>
        <div className="wide"><dt>Collection membership</dt><dd>{membershipText(disclosure)}</dd></div>
        <div><dt>Protocol (source field)</dt><dd>{rawSourceText(disclosure.preparation.protocol)}</dd></div>
        <div><dt>Numeric age</dt><dd>{ageText(disclosure)}</dd></div>
        <div className="wide"><dt>Section direction / thickness</dt><dd className="morphology-raw-field-disclosure"><span><b>sourceSectionWording</b>{disclosure.preparation.sourceSectionWording}</span><span><b>slicingDirectionRaw</b>{rawSourceText(disclosure.preparation.slicingDirectionRaw)}</span><span><b>slicingThicknessMicrometre</b>{thicknessRaw}</span></dd></div>
        <div><dt>Source-coordinate extent</dt><dd>{extentText(disclosure)}</dd></div>
        <div><dt>Source domain (verbatim)</dt><dd>{disclosure.truncation.sourceDomainVerbatim}</dd></div>
        <div className="wide"><dt>Shrinkage</dt><dd className="morphology-shrinkage-disclosure"><span><b>Normalized status</b>{morphologyShrinkageInterpretation(disclosure.preparation.shrinkage)}</span><span><b>reportedRaw</b>{rawSourceText(disclosure.preparation.shrinkage.reportedRaw)}</span><span><b>correctedRaw</b>{rawSourceText(disclosure.preparation.shrinkage.correctedRaw)}</span></dd></div>
        <div><dt>Integrity (verbatim)</dt><dd>{disclosure.truncation.sourcePhysicalIntegrityVerbatim}</dd></div>
        <div><dt>Truncation / axon coverage</dt><dd>{axonCoverageText(disclosure)}</dd></div>
        <div className="wide"><dt>Standardized geometry SHA-256</dt><dd className="morphology-exact-hash"><code>{disclosure.geometryReceipt.sha256}</code><span>{geometryVerification === "verified" ? "Runtime bytes verified" : geometryVerification === "unavailable" ? "Geometry unavailable" : "Runtime verification pending"}</span></dd></div>
        <div className="wide"><dt>Raw SWC SHA-256</dt><dd className="morphology-exact-hash"><code>{disclosure.geometryReceipt.rawSwcSha256}</code></dd></div>
      </dl>
      {disclosure.preparation.paperPreparationContext && <p><strong>Paper context:</strong> {disclosure.preparation.paperPreparationContext}</p>}
      {disclosure.preparation.unresolvedPreparationConflict && <p className="conflict"><strong>Unresolved preparation-stage boundary:</strong> {disclosure.preparation.unresolvedPreparationConflict}</p>}
    </section>
  );
}
