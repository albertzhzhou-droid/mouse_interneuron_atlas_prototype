import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Remove only an auxiliary preload eliminated by bundling. Required entry,
 * stylesheet and actual runtime import failures still fail the build. */
export function reconcileRscPreloads(manifest, emittedFiles, runtimeChunks) {
  const output = structuredClone(manifest);
  const files = new Set(emittedFiles);
  const removed = [];
  const requireFile = (url, context) => {
    if (typeof url !== "string" || !files.has(url)) throw new Error(`Missing required RSC asset: ${context}: ${url}`);
  };
  requireFile(output.clientEntryUrl, "client entry");
  const reconcile = (deps, context) => {
    for (const url of deps.css ?? []) requireFile(url, `${context} stylesheet`);
    deps.js = (deps.js ?? []).filter((url, index) => {
      if (files.has(url)) return true;
      if (typeof url !== "string" || index === 0) throw new Error(`Missing required RSC asset: ${context}: ${url}`);
      const filename = path.posix.basename(url);
      if (runtimeChunks.some(code => code.includes(filename))) throw new Error(`Missing runtime-imported RSC asset: ${url}`);
      removed.push({ context, url, reason: "auxiliary preload absent from emitted files and all emitted runtime imports" });
      return false;
    });
  };
  reconcile(output.clientEntryDeps, "client entry dependencies");
  for (const [key, deps] of Object.entries(output.clientReferenceDeps)) reconcile(deps, `client reference ${key}`);
  for (const [key, deps] of Object.entries(output.serverResources ?? {})) reconcile(deps, `server resource ${key}`);
  return { manifest: output, removed };
}

export function parseRscPreloadManifest(source) {
  const match = /^\s*export default\s+(\{[\s\S]*\})\s*;?\s*$/.exec(source);
  if (!match) throw new Error("Unsupported RSC asset manifest; expected a JSON-only default export");
  return JSON.parse(match[1]);
}

async function staticFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await staticFiles(file));
    else if (entry.isFile() && /\.(js|css)$/.test(entry.name)) files.push(file);
  }
  return files;
}

/** @vitejs/plugin-rsc 0.5.34 records dependencies before Vite 8's final chunk
 * elimination. Reconcile its generated JSON-only manifests after buildApp;
 * never patch installed packages or silently omit a required runtime asset. */
export function ohriRscPreloadPlugin() {
  let config;
  return {
    name: "ohri-reconcile-emitted-rsc-preloads",
    apply: "build",
    enforce: "post",
    configResolved(value) { config = value; },
    buildApp: {
      order: "post",
      async handler() {
        const client = path.resolve(config.root, config.environments.client.build.outDir);
        const files = await staticFiles(path.join(client, "_next/static"));
        const emitted = files.map(file => "/" + path.relative(client, file).split(path.sep).join("/"));
        const chunks = await Promise.all(files.filter(file => file.endsWith(".js")).map(file => readFile(file, "utf8")));
        const receipt = [];
        // These are the two manifests the current builder writes after all
        // environment bundles finish. Fail if its format or outputs change.
        for (const name of ["rsc", "ssr"]) {
          const directory = path.resolve(config.root, config.environments[name].build.outDir);
          const file = path.join(directory, "__vite_rsc_assets_manifest.js");
          const source = await readFile(file, "utf8");
          const result = reconcileRscPreloads(parseRscPreloadManifest(source), emitted, chunks);
          await writeFile(file, `export default ${JSON.stringify(result.manifest, null, 2)}\n`);
          receipt.push({ environment: name, removed: result.removed });
        }
        const directory = path.resolve(config.root, config.environments.rsc.build.outDir);
        await writeFile(path.join(directory, "ohri-rsc-preload-reconciliation.json"), JSON.stringify({ emittedFiles: emitted, results: receipt }, null, 2) + "\n");
      },
    },
  };
}
