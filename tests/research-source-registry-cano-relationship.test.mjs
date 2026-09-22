import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  CANO_GOMEZ_DATA_DIRECTORY,
  CANO_GOMEZ_REGISTRY_PATH,
  loadCanoGomezSourceRegistryPackage,
  loadResearchSourceRegistry,
  validateCanoGomezSourceRegistryRelationship,
} from "../scripts/validate-research-source-registry-0.1.mjs";

const CONFIRMED_PROFILES = Object.freeze([
  ["CHOL_IN_Best3_Htr1b", 146],
  ["CHOL_IN_Best3_Slc9a3", 119],
  ["CHOL_IN_Galr1_Ccdc3", 150],
  ["CHOL_IN_Galr1_P2rx5", 66],
  ["CHOL_IN_Galr1_Rasgrp1", 20],
  ["CHOL_IN_Nr5a2_Cdh23", 78],
  ["CHOL_IN_Nr5a2_Rxfp2", 82],
  ["CHOL_IN_Pde5a_Piezo2", 100],
  ["CHOL_IN_Pitx2_ Srpx2", 74],
  ["CHOL_IN_Pitx2_Eya1", 35],
  ["CHOL_IN_Pitx2_Skor2", 53],
]);

const SOURCE_OBJECTS = Object.freeze([
  {
    objectId: "cholinergic",
    sourceFileName: "GSE318731_P56_cholinergic_multiome.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds",
    sourceRdsBytes: 127862795,
    nucleusCount: 3199,
    sourceScopedGroupCount: 5,
  },
  {
    objectId: "gabaergic",
    sourceFileName: "GSE318731_P56_gabaergic_multiome.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_gabaergic_multiome.rds",
    sourceRdsBytes: 1646402816,
    nucleusCount: 73364,
    sourceScopedGroupCount: 24,
  },
  {
    objectId: "glutamatergic",
    sourceFileName: "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    publicUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    sourceRdsBytes: 1832005077,
    nucleusCount: 92782,
    sourceScopedGroupCount: 28,
  },
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function verifiedIntegrity(bytes) {
  return {
    status: "verified",
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    missingReason: null,
  };
}

function relationshipFixture() {
  const auditBytes = Buffer.from("synthetic all-nucleus audit fixture");
  const rosterBytes = Buffer.from("synthetic confirmed-roster fixture");
  const identityMode = "BASE_R_STREAM_META_DATA_ROW_ONLY";
  const artifacts = [
    {
      artifactKind: "all_nucleus_assignment_audit",
      fileName: "GSE318731_all_nucleus_assignment_audit.csv.gz",
      rowCount: 169345,
      compressedBytes: auditBytes.byteLength,
      compressedSha256: sha256(auditBytes),
    },
    {
      artifactKind: "confirmed_interneuron_nucleus_roster",
      fileName: "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz",
      rowCount: 923,
      compressedBytes: rosterBytes.byteLength,
      compressedSha256: sha256(rosterBytes),
    },
  ];
  const canoRegistry = {
    releaseId: "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0",
    datasetId: "GSE318731",
    lifeStage: "P56",
    identityAuthority: {
      mode: identityMode,
      crossAssayCellIdentityVerified: false,
      sameCellAssertionAdmitted: false,
    },
    sourceReferences: {
      publication: {
        doi: "10.64898/2026.06.11.731752",
        articleUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13308138/",
      },
    },
    inputReceipts: {
      authorityMode: identityMode,
      combinedReceiptFileName: null,
      combinedReceiptSha256: null,
      sourceObjects: SOURCE_OBJECTS.map((item) => ({
        objectId: item.objectId,
        receiptKind: "base_r_stream_meta_data_row_only_receipt",
        receiptSha256: sha256(`${item.objectId}:receipt`),
        rawMetadataCompressedSha256: sha256(`${item.objectId}:compressed`),
        rawMetadataUncompressedSha256: sha256(`${item.objectId}:uncompressed`),
        orderedSourceNucleusIdsSha256: sha256(`${item.objectId}:ids`),
      })),
    },
    denominatorReconciliation: {
      sourceTotalNucleusCount: 169345,
      sourceObjectCount: 3,
      sourceScopedGroupCount: 57,
      paperReportedNeuronTypeCount: 516,
      paperReportedTypeCountUsedAsInterneuronDenominator: false,
      confirmedInterneuronNucleusCount: 923,
      confirmedInterneuronProfileCount: 11,
      generatedGeometryCount: 0,
      internalStructureObjectCount: 0,
      sameCellLinkCount: 0,
      atlasRegistrationCount: 0,
    },
    sourceObjects: SOURCE_OBJECTS.map((item) => ({
      ...item,
      sourceRdsSha256: sha256(`${item.objectId}:rds`),
      identityAuthorityMode: identityMode,
      crossAssayCellIdentityVerified: false,
    })),
    artifacts,
    profiles: CONFIRMED_PROFILES.map(([sourceLocalLabel, nucleusCount], index) => ({
      profileId: `cano.gomez.p56.chol_in.synthetic.${index}`,
      recordKind: "source_local_exact_nucleus_roster_profile",
      unitOfObservation: "nucleus",
      sourceObjectId: "cholinergic",
      sourceGroup: "CHOL_IN",
      sourceLocalLabel,
      nucleusCount,
      assignmentAuthority: "source_explicit_groups_equals_CHOL_IN",
      stableIdentityField: "compound_nucleus_key",
      markerEvidenceStatus: "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE",
      geometryAuthority: {
        geometryObjectCount: 0,
        internalStructureObjectCount: 0,
        sameCellLinkCount: 0,
        atlasRegistrationCount: 0,
      },
      rosterLink: {
        artifactFileName: "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz",
      },
    })),
  };
  const registryBytes = Buffer.from(JSON.stringify(canoRegistry));
  const assets = [
    ...canoRegistry.sourceObjects.map((item) => ({
      id: `ASSET-CANOGOMEZ-${item.objectId.toUpperCase()}-RDS`,
      kind: "remote_geo_rds_source_object",
      accession: item.sourceFileName,
      url: SOURCE_OBJECTS.find((expected) => expected.objectId === item.objectId).publicUrl,
      bundled: false,
      integrity: {
        status: "remote_checksum_verified",
        bytes: item.sourceRdsBytes,
        sha256: item.sourceRdsSha256,
        missingReason: null,
      },
    })),
    {
      id: "ASSET-CANOGOMEZ-REGISTRY",
      kind: "checksum_pinned_project_derivative",
      accession: canoRegistry.releaseId,
      url: null,
      bundled: true,
      integrity: verifiedIntegrity(registryBytes),
    },
    ...artifacts.map((artifact) => {
      const bytes = artifact.artifactKind === "all_nucleus_assignment_audit" ? auditBytes : rosterBytes;
      return {
        id: `ASSET-CANOGOMEZ-${artifact.artifactKind}`,
        kind: "checksum_pinned_project_derivative",
        accession: artifact.fileName,
        url: null,
        bundled: true,
        integrity: verifiedIntegrity(bytes),
      };
    }),
  ];
  const canoSource = {
    id: "SRC-CANOGOMEZ-2026",
    citation: {
      doi: canoRegistry.sourceReferences.publication.doi,
      articleUrl: canoRegistry.sourceReferences.publication.articleUrl,
    },
    accessions: ["GSE318731", "BIL:10.35077/g.1196"],
    speciesScopes: [{ scientificName: "Mus musculus", taxonId: "NCBITaxon:10090" }],
    lifeStageScopes: [{ value: "P56" }],
    regionScopes: [{ value: "mouse spinal cord" }],
    experimentalUnits: [
      { unit: "P56_multiome_nucleus", count: 169345 },
      { unit: "source_scoped_group", count: 57 },
      { unit: "confirmed_CHOL_IN_nucleus", count: 923 },
    ],
    recordSets: [{
      recordSetId: "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES",
      parentSourceId: "SRC-CANOGOMEZ-2026",
      recordKind: "source_explicit_confirmed_interneuron_profile",
      unitOfObservation: "source_local_neuron_type_assignment",
      assignmentAuthority: "checksum_pinned_GSE318731_groups_equals_CHOL_IN",
      includedRecordCount: {
        value: 11,
        unit: "source_local_CHOL_IN_profiles",
        scope: "11 exact profiles, not the paper-reported 516 neuronal types; 516 is not an interneuron denominator",
      },
      cellRosterAvailability: "bundled_exact",
      dataPath: CANO_GOMEZ_REGISTRY_PATH,
      idField: "profiles[].profileId",
      childRosterRef: {
        status: "bundled_exact",
        path: CANO_GOMEZ_REGISTRY_PATH,
        idField: "profiles[].profileId",
      },
    }],
    assets,
    rights: {
      status: "article_CC-BY-NC-4.0_GEO_RDS_NOASSERTION",
      note: "Article CC-BY-NC-4.0 is separate from GEO RDS reuse, which remains NOASSERTION; source RDS files are exact link-only and not bundled. The three project derivatives are bundled only in the private research repository pending separate public-release review.",
    },
    admission: {
      status: "confirmed_only_source_local_profiles_admitted",
      note: "Exactly 11 source-explicit CHOL_IN profiles and 923 exact source-local nuclei are admitted; motor, sensory, projection and ambiguous assignments remain excluded.",
    },
    missingness: [
      { field: "cell_geometry_and_internal_structure", status: "UNAVAILABLE", reason: "All geometry and internal-structure counts remain zero." },
      { field: "atlas_registration", status: "NOT_ESTABLISHED", reason: "Registration count remains zero." },
      { field: "cross_source_identity", status: "NOT_ESTABLISHED", reason: "No cross-source identity is asserted." },
      { field: "cross_assay_identity", status: "NOT_ESTABLISHED", reason: "The row-only route creates no cross-assay claim." },
    ],
  };
  return {
    researchRegistry: { sources: [canoSource] },
    canoRegistry,
    packageFiles: new Map([
      [CANO_GOMEZ_REGISTRY_PATH, registryBytes],
      [`${CANO_GOMEZ_DATA_DIRECTORY}/${artifacts[0].fileName}`, auditBytes],
      [`${CANO_GOMEZ_DATA_DIRECTORY}/${artifacts[1].fileName}`, rosterBytes],
    ]),
  };
}

test("relates the exact P56 Cano source card to three RDS receipts and three private derived artifacts", () => {
  const fixture = relationshipFixture();
  assert.equal(
    validateCanoGomezSourceRegistryRelationship(fixture.researchRegistry, fixture.canoRegistry, fixture.packageFiles),
    fixture.researchRegistry,
  );
});

test("rejects widened life stage, receipt drift, denominator drift and repaired raw profile labels", () => {
  const widened = relationshipFixture();
  widened.researchRegistry.sources[0].lifeStageScopes[0].value = "adult";
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(widened.researchRegistry, widened.canoRegistry, widened.packageFiles), /exactly P56/i);

  const receiptDrift = relationshipFixture();
  receiptDrift.researchRegistry.sources[0].assets[0].integrity.sha256 = "0".repeat(64);
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(receiptDrift.researchRegistry, receiptDrift.canoRegistry, receiptDrift.packageFiles), /source-card receipt does not match/i);

  const denominatorDrift = relationshipFixture();
  denominatorDrift.canoRegistry.denominatorReconciliation.sourceScopedGroupCount = 58;
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(denominatorDrift.researchRegistry, denominatorDrift.canoRegistry, denominatorDrift.packageFiles), /must remain 57/i);

  const repairedLabel = relationshipFixture();
  repairedLabel.canoRegistry.profiles[8].sourceLocalLabel = "CHOL_IN_Pitx2_Srpx2";
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(repairedLabel.researchRegistry, repairedLabel.canoRegistry, repairedLabel.packageFiles), /raw label anomalies/i);
});

test("rejects package-byte drift, public redistribution, cross-assay promotion and model authority", () => {
  const packageDrift = relationshipFixture();
  packageDrift.packageFiles.set(
    `${CANO_GOMEZ_DATA_DIRECTORY}/GSE318731_all_nucleus_assignment_audit.csv.gz`,
    Buffer.from("changed audit bytes"),
  );
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(packageDrift.researchRegistry, packageDrift.canoRegistry, packageDrift.packageFiles), /packaged bytes do not match/i);

  const publicPromotion = relationshipFixture();
  publicPromotion.researchRegistry.sources[0].rights.note = "Article CC-BY-NC-4.0; GEO RDS and all derivatives are public.";
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(publicPromotion.researchRegistry, publicPromotion.canoRegistry, publicPromotion.packageFiles), /must not be generalized|private-repository-only/i);

  const crossAssayPromotion = relationshipFixture();
  crossAssayPromotion.canoRegistry.identityAuthority.crossAssayCellIdentityVerified = true;
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(crossAssayPromotion.researchRegistry, crossAssayPromotion.canoRegistry, crossAssayPromotion.packageFiles), /cross-assay or same-cell/i);

  const geometryPromotion = relationshipFixture();
  geometryPromotion.canoRegistry.profiles[0].geometryAuthority.geometryObjectCount = 1;
  assert.throws(() => validateCanoGomezSourceRegistryRelationship(geometryPromotion.researchRegistry, geometryPromotion.canoRegistry, geometryPromotion.packageFiles), /model authority/i);
});

test("relates the checked-in production Cano package to the canonical source card", async () => {
  const [researchRegistry, canoPackage] = await Promise.all([
    loadResearchSourceRegistry(),
    loadCanoGomezSourceRegistryPackage(),
  ]);
  assert.equal(
    validateCanoGomezSourceRegistryRelationship(researchRegistry, canoPackage.registry, canoPackage.packageFiles),
    researchRegistry,
  );
});
