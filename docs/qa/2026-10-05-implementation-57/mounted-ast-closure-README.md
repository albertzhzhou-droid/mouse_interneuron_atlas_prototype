# I57 mounted route closure audit

This is a read-only audit of the sealed three-path I57 proposal against the actual current project. It changes no project file and repeats no I57 focus tests or native browser acceptance.

Replay with the existing verified lock dependencies:

```sh
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i57-mounted-closure-review/compute-mounted-closure.mjs
```

The script accepts one consistent root state: all three target files must match the sealed before/absence state, or all three must match the sealed after state. The baseline Explorer file comes from its physically verified saved preimage; the overlay comes from the physically verified sealed proposal. Every other mounted input comes from the actual current root. All reads use explicit 4096-byte positions; every cached root input is rehashed at the end to reject a changing epoch. The report is regenerated on replay, including its timestamp.

The actual dedicated Explorer route is `/research/explorer`. Its pageId-selected Collection branch imports `ResearchExplorer`; the new ResultGroup is a direct value import, which imports the existing I26 hook, its JavaScript helper and stylesheet. The local runtime module/CSS closure grows from 111 to 115 paths, with no removal. The back-edge from ResultGroup to the Explorer record type is explicitly type-only and is excluded.

Two new canonical code/test pins are required: `app/ResearchExplorerResultGroup.tsx` and `tests/research-explorer-keyboard-groups.test.mjs`. The existing Explorer input must be repinned. The four reused I26 inputs are already pinned once in both the canonical manifest and compact runtime recipe. The current parent recipe has already admitted both new code/test paths once, with the sealed actual hashes; timeline/documentation inputs remain parent owned. No further code membership addition was missing at the final read epoch.

The actual `/explore/positions` branch mounts Ronzano, and Collection's Explorer type import is erased. Its baseline and I57-overlay module edges and path membership are identical. The selected route has 37 reachable local module/CSS/JSON paths; excluding its self transport and adding the established metadata-verification inputs reproduces exactly the declared 40 renderer build paths. The separately declared derived positions JSON plus 22 XLSX sources remain 23 source-verification inputs, hence 63 authority inputs. No original source verification is repeated or promoted by this audit.

The eight current private renderer build scopes contain 40, 41, 40, 24, 38, 62, 25 and 40 inputs. Their union, existing auxiliary source inputs and the separate 23 Ronzano source inputs exactly reproduce the existing 198-member compact/runtime recipe. None of the three I57-owned paths appears in any private renderer build scope. Retain the runtime recipe membership and Ronzano 40+23 authority membership. Canonical regeneration may change shared transport hashes independently of membership.

This is static reachable-module evidence, not native hydration/focus acceptance, per-call execution coverage, network/bundle-size evidence, or actual rendered scientific proof.

`replay.stderr.log` preserves the first QA script resolver-recursion attempt. The correction resolves the two external Three.js URLs before registering the Node resolver hook. `replay-corrected.stderr.log` preserves a meaningful refusal of the old before epoch after the parent applied all three sealed files. The final replay binds the actual consistent after state and current 2573-input canonical manifest. Neither refusal changed the candidate or root.
