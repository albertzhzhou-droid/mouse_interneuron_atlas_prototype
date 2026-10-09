"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { curatorAdjudicationContract, curatorFeedbackContract, publicWorkbenchManifest } from "./atlas-types";
import {
  buildAdjudicationPacket,
  evaluateAdjudicationReadiness,
  normalizeZipSha256,
  validateAdjudicationPacket,
} from "./curator-adjudication";

type CuratorFeedback = {
  feedbackSchemaVersion: string;
  distributionVersion: string;
  releaseId: string;
  releaseManifestContentSha256: string;
  registrationCount: number;
  exportedAt: string;
  responses: Record<string, string>;
  privacy: string;
};

type AdjudicationPacket = {
  adjudicationSchemaVersion: string;
  createdAt: string;
  distributionVersion: string;
  releaseId: string;
  releaseManifestContentSha256: string;
  registrationCount: number;
  packageZipSha256: string;
  feedbackRecords: Array<{ curatorId: string; verdict: string }>;
  adjudicator: { curatorId: string; disposition: string; resolutionNotes: string };
  disagreementPreserved: boolean;
  boundary: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function isStringRecord(value: Record<string, unknown>): value is Record<string, string> {
  return Object.values(value).every((response) => typeof response === "string");
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function parseCuratorFeedback(value: unknown): CuratorFeedback {
  const expectedKeys = ["feedbackSchemaVersion", "distributionVersion", "releaseId", "releaseManifestContentSha256", "registrationCount", "exportedAt", "responses", "privacy"];
  if (!isRecord(value) || !hasOnlyKeys(value, expectedKeys)) throw new Error("expected only the versioned curator feedback fields");
  if (value.feedbackSchemaVersion !== curatorFeedbackContract.feedbackSchemaVersion) throw new Error("feedback schema version does not match this workbench");
  if (value.distributionVersion !== curatorFeedbackContract.distributionVersion) throw new Error("curator distribution version does not match this package");
  if (value.releaseId !== publicWorkbenchManifest.releaseId) throw new Error("feedback release ID does not match this workbench");
  if (value.releaseManifestContentSha256 !== publicWorkbenchManifest.manifestContentSha256) throw new Error("feedback release-manifest hash does not match this workbench");
  if (value.registrationCount !== 0) throw new Error("feedback cannot claim a nonzero registration count");
  if (typeof value.exportedAt !== "string" || Number.isNaN(Date.parse(value.exportedAt))) throw new Error("feedback export timestamp is invalid");
  if (value.privacy !== curatorFeedbackContract.privacy || !isRecord(value.responses)) throw new Error("feedback privacy or response payload is invalid");
  const responses = value.responses;
  const knownResponseKeys = [...curatorFeedbackContract.requiredResponseKeys, ...curatorFeedbackContract.optionalResponseKeys];
  if (!hasOnlyKeys(responses, knownResponseKeys.filter((key) => key in responses))) throw new Error("feedback contains an unknown response field");
  if (!curatorFeedbackContract.requiredResponseKeys.every((key) => typeof responses[key] === "string" && responses[key].trim())) {
    throw new Error("feedback is missing a required response");
  }
  if (!isStringRecord(responses) || !Object.values(responses).every((response) => response.length <= 10_000)) {
    throw new Error("feedback responses must be bounded strings");
  }
  if (!/^(accept|revise|unable_to_assess)$/.test(responses.overall_verdict)) throw new Error("overall verdict is invalid");
  if (!/^(yes|no)$/.test(responses.zip_verified)) throw new Error("ZIP verification outcome is invalid");
  if (!normalizeZipSha256(responses.zip_sha256)) throw new Error("ZIP SHA-256 must be a 64-character hexadecimal value");
  if (responses.attestation !== "confirmed") throw new Error("feedback attestation is missing");
  return value as CuratorFeedback;
}

function parseAdjudicationPacket(value: unknown): AdjudicationPacket {
  const expectedKeys = ["adjudicationSchemaVersion", "createdAt", "distributionVersion", "releaseId", "releaseManifestContentSha256", "registrationCount", "packageZipSha256", "feedbackRecords", "reviewSummary", "adjudicator", "disagreementPreserved", "boundary"];
  if (!isRecord(value) || !hasOnlyKeys(value, expectedKeys)) throw new Error("expected only the versioned adjudication packet fields");
  validateAdjudicationPacket(value, curatorAdjudicationContract);
  if (value.releaseManifestContentSha256 !== publicWorkbenchManifest.manifestContentSha256) {
    throw new Error("adjudication packet release-manifest hash does not match this workbench");
  }
  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) {
    throw new Error("adjudication packet creation timestamp is invalid");
  }
  return value as AdjudicationPacket;
}

function verdictLabel(value: string) {
  if (value === "accept") return "Accept";
  if (value === "revise") return "Revise";
  return "Unable to assess";
}

export default function CuratorFeedbackInbox({ onNotice }: { onNotice: (notice: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const packetInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<CuratorFeedback[]>([]);
  const [verifiedPacket, setVerifiedPacket] = useState<AdjudicationPacket | null>(null);
  const [adjudicatorId, setAdjudicatorId] = useState("");
  const [disposition, setDisposition] = useState("defer_pending_evidence");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const summary = useMemo(() => ({
    accept: feedback.filter((record) => record.responses.overall_verdict === "accept").length,
    revise: feedback.filter((record) => record.responses.overall_verdict === "revise").length,
    unable: feedback.filter((record) => record.responses.overall_verdict === "unable_to_assess").length,
  }), [feedback]);
  const readiness = useMemo(
    () => evaluateAdjudicationReadiness(feedback, curatorAdjudicationContract),
    [feedback],
  );

  const importFeedback = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > curatorFeedbackContract.maximumFileBytes) {
      onNotice("Curator feedback import rejected · maximum size is 2 MB");
      return;
    }
    try {
      const incoming = parseCuratorFeedback(JSON.parse(await file.text()));
      const curatorId = incoming.responses.curator_id.trim().toLocaleLowerCase();
      if (feedback.some((record) => record.responses.curator_id.trim().toLocaleLowerCase() === curatorId)) {
        throw new Error("a feedback record from this curator ID is already loaded");
      }
      if (feedback.length >= curatorFeedbackContract.maximumFeedbackRecords) {
        throw new Error("local feedback record limit reached");
      }
      setFeedback((records) => [...records, incoming]);
      onNotice("Curator feedback loaded · local only; release remains unchanged");
    } catch (error) {
      onNotice("Curator feedback import rejected · " + (error instanceof Error ? error.message : "invalid JSON"));
    }
  };

  const exportReceipt = () => {
    if (!feedback.length) return;
    downloadJson({
      receiptSchemaVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      distributionVersion: curatorFeedbackContract.distributionVersion,
      releaseId: publicWorkbenchManifest.releaseId,
      releaseManifestContentSha256: publicWorkbenchManifest.manifestContentSha256,
      registrationCount: 0,
      feedback,
      summary,
      boundary: "Local receipt only; importing feedback does not adjudicate a review, modify the release, acquire data or create a registration.",
    }, "ohri-curator-feedback-receipt-" + curatorFeedbackContract.distributionVersion + ".json");
    onNotice("Curator feedback receipt exported · local only");
  };

  const exportAdjudicationPacket = () => {
    try {
      const packet = buildAdjudicationPacket({
        feedback,
        feedbackContract: curatorFeedbackContract,
        adjudicationContract: curatorAdjudicationContract,
        releaseManifest: publicWorkbenchManifest,
        adjudicator: { curatorId: adjudicatorId, disposition, resolutionNotes },
      });
      downloadJson(packet, "ohri-curator-adjudication-" + curatorFeedbackContract.distributionVersion + ".json");
      onNotice("Local adjudication packet exported · release remains unchanged and 0 REG");
    } catch (error) {
      onNotice("Adjudication packet not exported · " + (error instanceof Error ? error.message : "invalid adjudication fields"));
    }
  };

  const importAdjudicationPacket = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > curatorAdjudicationContract.maximumPacketBytes) {
      onNotice("Adjudication packet import rejected · maximum size is 2 MB");
      return;
    }
    try {
      setVerifiedPacket(parseAdjudicationPacket(JSON.parse(await file.text())));
      onNotice("Adjudication packet verified locally · read-only; release remains unchanged and 0 REG");
    } catch (error) {
      onNotice("Adjudication packet import rejected · " + (error instanceof Error ? error.message : "invalid JSON"));
    }
  };

  return (
    <section className="curator-feedback-inbox" aria-labelledby="curator-feedback-heading">
      <div>
        <span>LOCAL-ONLY CURATOR FEEDBACK</span>
        <h2 id="curator-feedback-heading">Review receipt inbox</h2>
        <p>Load feedback generated by this exact curator package. Nothing uploads, modifies evidence, downloads data or creates registration.</p>
      </div>
      <dl className="catalog-detail-grid">
        <div><dt>Package distribution</dt><dd>{curatorFeedbackContract.distributionVersion}</dd></div>
        <div><dt>Release hash</dt><dd>{publicWorkbenchManifest.manifestContentSha256}</dd></div>
        <div><dt>Independent records</dt><dd>{feedback.length} of {curatorFeedbackContract.minimumIndependentCuratorsForComparison} minimum for local comparison</dd></div>
        <div><dt>Registration count</dt><dd>0 · feedback cannot alter it</dd></div>
      </dl>
      <div className="catalog-actions">
        <button type="button" onClick={() => inputRef.current?.click()}>Import curator feedback</button>
        <button type="button" disabled={!feedback.length} onClick={exportReceipt}>Export local review receipt</button>
        <button type="button" onClick={() => packetInputRef.current?.click()}>Verify adjudication packet</button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void importFeedback(event)}
          aria-label="Import curator feedback JSON"
        />
        <input
          ref={packetInputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void importAdjudicationPacket(event)}
          aria-label="Verify adjudication packet JSON"
        />
      </div>
      {!feedback.length && <p className="catalog-empty">No local feedback is loaded. A completed feedback form is not an approval until human adjudication.</p>}
      {feedback.length > 0 && (
        <>
          <p className="feedback-summary" aria-live="polite">{summary.accept} accept · {summary.revise} revise · {summary.unable} unable to assess</p>
          <ul className="feedback-record-list">
            {feedback.map((record) => (
              <li key={record.responses.curator_id + record.exportedAt}>
                <span><b>{record.responses.curator_id}</b> · {record.responses.expertise} · {new Date(record.exportedAt).toLocaleString()}</span>
                <strong>{verdictLabel(record.responses.overall_verdict)}</strong>
                <button type="button" onClick={() => setFeedback((records) => records.filter((candidate) => candidate !== record))}>Remove local copy</button>
              </li>
            ))}
          </ul>
        </>
      )}
      <section className="curator-adjudication" aria-labelledby="curator-adjudication-heading">
        <div>
          <span>UPG-007 · LOCAL ADJUDICATION PACKET</span>
          <h3 id="curator-adjudication-heading">Independent-curator comparison</h3>
          <p>Only matching, human-reported ZIP digests are compared. This browser does not recalculate or certify the original ZIP digest.</p>
        </div>
        <dl className="catalog-detail-grid">
          <div><dt>Comparison status</dt><dd>{readiness.readyForHumanAdjudication ? "ready for human adjudication" : "not ready"}</dd></div>
          <div><dt>Unique curators</dt><dd>{readiness.uniqueCuratorCount} of {readiness.minimumIndependentCurators}</dd></div>
          <div><dt>Reported ZIP digest</dt><dd>{readiness.reportedZipSha256[0] ?? "not yet matched"}</dd></div>
          <div><dt>Verdicts</dt><dd>{readiness.verdictCounts.accept} accept · {readiness.verdictCounts.revise} revise · {readiness.verdictCounts.unable_to_assess} unable</dd></div>
        </dl>
        {!readiness.readyForHumanAdjudication && (
          <ul className="adjudication-blockers">
            {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        )}
        {readiness.readyForHumanAdjudication && (
          <div className="adjudication-form">
            <label>
              Adjudicator stable ID
              <input value={adjudicatorId} maxLength={300} onChange={(event) => setAdjudicatorId(event.target.value)} />
            </label>
            <label>
              Disposition
              <select value={disposition} onChange={(event) => setDisposition(event.target.value)}>
                <option value="defer_pending_evidence">Defer pending evidence</option>
                <option value="return_for_revision">Return for revision</option>
                {!readiness.hasVerdictDisagreement && <option value="recommend_next_private_review">Recommend next private review</option>}
              </select>
            </label>
            <label>
              Resolution notes
              <textarea value={resolutionNotes} maxLength={10_000} onChange={(event) => setResolutionNotes(event.target.value)} placeholder="State why the records are deferred, returned, or eligible for another private review." />
            </label>
            <button type="button" onClick={exportAdjudicationPacket}>Export local adjudication packet</button>
          </div>
        )}
        <p className="feedback-boundary">An adjudication packet preserves every loaded curator response and disagreement. It is not an acceptance, publication authorization, data admission or registration record.</p>
        {verifiedPacket && (
          <section className="adjudication-verification" aria-labelledby="adjudication-verification-heading">
            <div>
              <span>READ-ONLY PACKET VERIFICATION</span>
              <h4 id="adjudication-verification-heading">Version-locked local packet</h4>
              <p>The packet structure and this release identity match locally. This does not independently authenticate a person, recompute the original ZIP hash, approve a release, or change any evidence.</p>
            </div>
            <dl className="catalog-detail-grid">
              <div><dt>Created locally</dt><dd>{new Date(verifiedPacket.createdAt).toLocaleString()}</dd></div>
              <div><dt>Named adjudicator</dt><dd>{verifiedPacket.adjudicator.curatorId}</dd></div>
              <div><dt>Disposition</dt><dd>{verifiedPacket.adjudicator.disposition.replaceAll("_", " ")}</dd></div>
              <div><dt>Preserved records</dt><dd>{verifiedPacket.feedbackRecords.length} · {verifiedPacket.disagreementPreserved ? "disagreement visible" : "no verdict disagreement"}</dd></div>
              <div><dt>Reported ZIP digest</dt><dd>{verifiedPacket.packageZipSha256}</dd></div>
              <div><dt>Registration count</dt><dd>{verifiedPacket.registrationCount} · packet cannot alter it</dd></div>
            </dl>
          </section>
        )}
      </section>
      <p className="feedback-boundary">A receipt is an audit aid, not adjudication, approval, public-release authorization, data acquisition or a registration record.</p>
    </section>
  );
}
