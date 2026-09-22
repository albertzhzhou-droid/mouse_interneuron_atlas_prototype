import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateCanoGomezP56MultiomeInterneuronRegistry } from "../scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";

const worker = fileURLToPath(new URL("../tools/extract_cano_gomez_rds_metadata_stream.R", import.meta.url));
const transport = fileURLToPath(new URL("../tools/extract_cano_gomez_rds_metadata_stream.py", import.meta.url));

test("GLUT source-absent metadata types stay NA even when active.ident has labels; the exception requires the exact source pin", { skip: !process.env.CANO_BASE_R_RSCRIPT }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "cano-glut-field-absence-"));
  try {
    const fixture = join(directory, "synthetic-worker-fixture.rds");
    const artifacts = join(directory, "artifacts");
    await mkdir(artifacts);
    execFileSync(process.env.CANO_BASE_R_RSCRIPT, ["-e", [
      'setClass("Seurat", slots=c("meta.data"="data.frame", "active.ident"="factor"))',
      'm <- data.frame(groups=factor(c("G1","G1","G2","G2")), anatomy=rep("Lumbar",4), source=rep("S1",4), Sex=rep("Male",4))',
      'rownames(m) <- c("A1","A2","A3","A4")',
      'saveRDS(new("Seurat", meta.data=m, active.ident=factor(c("T1","T2","T3","T4"))), commandArgs(TRUE)[1])',
    ].join("; "), fixture]);
    execFileSync(process.env.CANO_BASE_R_RSCRIPT, [worker, "GLUT", "4", "2", artifacts], { input: await readFile(fixture) });
    const csv = await readFile(join(artifacts, "metadata.csv"), "utf8");
    assert.equal(csv.trimEnd().split("\n").slice(1).filter((line) => /,"G[12]",NA,"S1","Lumbar","Male"$/.test(line)).length, 4);
    assert.doesNotMatch(csv, /"T[1234]"/);
    const program = [
      "import importlib.util,pathlib,sys,dataclasses",
      "p=pathlib.Path(sys.argv[1]); s=importlib.util.spec_from_file_location('stream',p); m=importlib.util.module_from_spec(s); sys.modules[s.name]=m; s.loader.exec_module(m)",
      "spec=dataclasses.replace(m.SOURCE_SPECS['GLUT'], expected_rows=4, expected_groups=2)",
      "artifacts=pathlib.Path(sys.argv[2])",
      "try:\n m.validate_worker_artifacts(spec,artifacts,'0'*64)\n raise AssertionError('wrong SHA accepted')\nexcept ValueError as e:\n assert 'exact recovered source SHA-256' in str(e)",
      "checked=m.validate_worker_artifacts(spec,artifacts,m.GLUT_SOURCE_WITHOUT_METADATA_TYPES_SHA256)",
      "assert checked['source_absent_assignments']==['neuron_types']",
      "assert checked['metadata_profiles']['neuron_types']['sourceMissingCount']==4",
      "assert checked['metadata_profiles']['neuron_types']['observedNonemptyUniqueCount']==0",
      "print('ok')",
    ].join("\n");
    assert.equal(execFileSync("python3", ["-c", program, transport, artifacts], { encoding: "utf8" }).trim(), "ok");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("real production registry retains GLUT metadata missingness and rejects changing the pin or filling labels", async () => {
  const registry = JSON.parse(await readFile(new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json", import.meta.url), "utf8"));
  await validateCanoGomezP56MultiomeInterneuronRegistry(registry);
  const glut = registry.sourceObjects.find((source) => source.objectId === "glutamatergic");
  const field = glut.metadataFieldAvailability.find((field) => field.field === "neuron_types");
  assert.equal(field.requirement, "SOURCE_ABSENT_ASSIGNMENT");
  assert.equal(field.sourceColumnPresent, false);
  assert.equal(field.sourceMissingCount, 92782);
  assert.equal(glut.rawNonMissingNonEmptyNeuronTypeLabelCount, 0);
  assert.equal(registry.denominatorReconciliation.confirmedInterneuronNucleusCount, 923);
  const wrongPin = structuredClone(registry);
  wrongPin.sourceObjects.find((source) => source.objectId === "glutamatergic").sourceRdsSha256 = "0".repeat(64);
  await assert.rejects(() => validateCanoGomezP56MultiomeInterneuronRegistry(wrongPin), /absent-source receipt|availability counts/);
  const fabricated = structuredClone(registry);
  fabricated.sourceObjects.find((source) => source.objectId === "glutamatergic").metadataFieldAvailability.find((field) => field.field === "neuron_types").observedNonemptyUniqueCount = 277;
  await assert.rejects(() => validateCanoGomezP56MultiomeInterneuronRegistry(fabricated), /availability counts|silent default/);
});
