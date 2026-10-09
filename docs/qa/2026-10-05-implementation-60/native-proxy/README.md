# I60 local index transport QA proxy (preparation only)

This temp-only helper is a narrow adaptation of the independently reviewed I59 proxy. Importing `proxy.mjs`, preparing the fixture, changing the private config and running the tests do not start a server. No root/stage/source/index/metadata file is changed. Native browser observations remain parent-owned and pending.

Fixed listener `127.0.0.1:3005`; fixed upstream `127.0.0.1:3004`. There are no host, origin, port or credential options, HTTP admin/config endpoints, alternate source URLs or product QA hooks. The upstream is the normal verified stage's `vinext start` production server. Request `Host` never chooses another upstream. Default/pass raw response status, header order/case and body bytes are forwarded unchanged. WebSocket upgrades pass to the same fixed loopback origin. Sensitive header values are redacted in the local log only.

## Exact ownership

Exactly two GET paths are independently allowlisted: `/api/source-records/search-index.json` (compressed measurement) and `/data/research_explorer_index_v1/search-index.json` (canonical comparison provider). Query variants, HEAD/POST, the direct `.gz`, asset manifest, RNA chunks and every other route pass through unchanged. Their local config rules and log request IDs stay distinct; controlling one does not control the other. Private helper/config/log paths, including encoded `@fs` forms, are rejected rather than forwarded.

The current API's canonical `route.ts` declares Content-Type `application/json; charset=utf-8`, Content-Encoding `gzip` and its original compressed Content-Length. Current production loader `fetch` reads browser-decoded bytes and checks canonical decoded byte count and SHA before JSON parsing. Source inspection establishes this design; it is not a claim that live wire headers have been observed. API fault requires live upstream status200, exactly one expected gzip/type/Content-Length header, no transfer-encoding ambiguity, and the complete original gzip length/SHA before any controlled body is submitted. Canonical fault selects its representation from actual response headers: an unencoded JSON200 requires exact12327624 Content-Length and original plain JSON SHA; exactly one gzip encoding requires original628095 compressed Content-Length/SHA plus original decoded length/SHA. Both remain canonical-owned requests.304, unsupported/duplicate encoding, transfer-encoding ambiguity and representation mismatches are rejected. I59 historical canonical gzip/304 and independent read-only current vinext Accept-Encoding/source inspection motivated this distinction; neither substitutes for observing the current native headers. Default/pass/delay preserve whichever original response actually arrives; source/header rejection gates apply to controlled substitution only.

Original gzip: 628095 bytes, SHA256 `715236a44109be7bcd209c589d88342a7df9fbb4a2bbfc18f5d3f6ddbaac436b`.
Decoded original: 12327624 bytes, SHA256 `c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085`.

## Modes and private config

- `pass`: raw forwarding.
- `delay`: hold before contacting upstream for an integer1–12000ms (default12000). Disconnect clears the timer and destroys any started upstream; late callbacks cannot revive the response.
- `decoded_checksum_fault`: on API, first retrieve and verify the original gzip, then return the bounded temp gzip fixture with only response Content-Length changed. On canonical, choose only the actual original plain/gzip representation after strict header/source gates. Plain returns the same-length plain fixture with all original headers unchanged. Gzip returns the same decoded fault through the temp gzip fixture, changing only compressed Content-Length. No Accept-Encoding/request header is forced, and no representation is inferred from API path ownership. Its decode changes only final LF byte10 at offset12327623 to space32, keeps all original JSON values and exactly12327624 decoded bytes, and changes decoded SHA. It is a controlled negative fixture, never a new scientific source. Incomplete, stale, differently encoded or unpinned upstream and malformed/substituted fixture produce explicit502 with no fixture body.

Current fixture: 626119 bytes, SHA256 `b69d9d989646c542c1efcf001201910ed9680db001d5e9a41092fe07b2cfb6a6`; decoded SHA256 `d6e8b386b3c9ff8cd785174d419116a07b78779e2fd60abbaf5eb4760e581552`.

Config is schemaVersion1 plus rules keyed only by the two exact allowlisted routes. It is loaded per request and normalized/snapshotted at request start. Files are under the real private temp directory, regular/bounded, opened with O_NOFOLLOW; local atomic replacement writes an exclusive mode0600 temporary, fsyncs and renames it. Config cannot change an already selected rule. No config path is exposed to the Web.

Bundled Node24 executable used for all preparation:

```sh
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i60-index-native-proxy/set-mode.mjs canonical pass
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i60-index-native-proxy/set-mode.mjs canonical delay 12000
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i60-index-native-proxy/set-mode.mjs canonical decoded_checksum_fault
```

Replace `canonical` with `api` for the independent API measurement phase. The mode setter always resets the other route to pass, preventing a previous phase from retaining an unintended fault. Each mode update prints explicit scope/target and normalized config SHA. Parent should copy the exact config before each native phase and bind that SHA and a real action/DOM UTC bracket to explicit request IDs. Start only after stage build/full checks pass. Parent startup requires the fixed-loopback sandbox escalation approved for this command:

```sh
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i60-index-native-proxy/proxy.mjs
```

This document supplies the command; the preparation agent has not executed it. Do not run both I59 and I60 proxies on3005. Stop only the parent-owned process after QA, then freeze the complete local requests.jsonl and full hash. `--config`/`--log` only permit private files; there are no server routing options. Do not use HTTP to configure the proxy.

## Native acceptance scope and known route distinction

Current `ResearchActiveRecordProvider.tsx` calls the loader without a transport argument, so defaults to the canonical `/data/.../search-index.json` route. `MolecularConcordanceWorkbench.tsx` consumes that provider's indexState. `ResearchIndexLoadingEvidence.tsx` calls the API with compressed/forceFresh measurement independently. The parent explicitly authorized adding the canonical route after this path distinction was found. Canonical comparison and API measurement phases must bind their own target/config/request IDs; an API fault is never comparison readiness/failure evidence.

For canonical comparison readiness, configure canonical delay with API pass, freshly load the actual dedicated current page, capture the provider verifying/zero Add/report/export DOM before the12s response, and capture the verified index and bookmark restoration afterward. For canonical checksum failure, retain the exact qualified comparison address, configure canonical fault/API pass and use an actual fresh document reload so old in-memory index cache cannot bypass the request. Capture actual checksum-unavailable state with basket/report/exports unavailable, then configure pass and fresh reload to restore the same current exact source bookmark. A config change or client-side remount by itself is not proof of a fresh source fetch. Fault retains the original cache/ETag headers; an ordinary reload may revalidate304 or reuse an in-memory/cached fault. Use an actual cache-bypassing fresh/hard document reload and require the observed full200 original-source pass response before claiming recovery. Provider no-cache does not itself mean no-store; measurement forceFresh requests no-store independently. Actual header/source gate failure502 is not a decoded-SHA rejection and must be reported distinctly.

For API measurement separately, keep canonical pass, configure API fault, capture controlled_body_ready+response_finished and the native compressed measurement checksum failure. Then configure API pass and use ordinary fresh no-store measurement retry to capture the original decoded receipt. Capture API delay measurement as its own loading/readiness phase; do not claim it disabled comparison Add actions. Browser cache/in-memory cached index/measurement state must be distinguished. Use ordinary native actions and current upgraded route/sidebar/layout; no product hooks.

Every new-run exclusive request log has an independent requestId, tool UTC, method/target, route-classified requestOwner, rule/config SHA, upstream target and redacted headers. requestOwner is an intended route consumer classification, not a captured browser/network initiator. Target starts include original source pins. `upstream_body_complete` describes original received bytes; `controlled_body_ready` records original source SHA, served gzip SHA, fault decoded SHA/length and exact mutation; `response_finished` records bytes handed to ServerResponse. Disconnect, timer and upstream failure are separately recorded. These proxy facts do not establish browser body consumption/decoding or application state; native capture proves those separately. Do not infer initiators from URL, invent clocks from mtime or call synthetic cancellation tests actual browser cancellation.

## Offline verification

```sh
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test /private/tmp/ohri-i60-index-native-proxy/proxy.test.mjs
```

30 offline guards use fake request streams, fake timers and injected production-loader fetch. They cover fixed loopback route ownership; unchanged direct/raw forwarding and header redaction; bounded delay/disconnect/late callbacks; plain/gzip fixture exact original pins, same JSON/decoded length/one byte mutation; independent canonical/API rules/owner IDs; incomplete/wrong/oversized upstream; bad/duplicate/partial response headers; buffer-stage cancellation; bad fixture; private file and atomic replacement restrictions; current production loader decoded-SHA rejection and independent fresh pass receipt. No test calls `http.listen`, real `http.request` or browser APIs. Additional wire tests cover canonical actual gzip classification/source gates, exact canonical/API ownership separation, unsupported encoding/304/cross-format rejection. Logger startup exclusively creates a new mode0600 log: restarting against an existing log fails before server creation, so request IDs cannot silently append/restart at1. Parent must choose a fresh private --log filename for another run; preserve earlier logs. Fixture output uses the same guarded real-parent/O_NOFOLLOW atomic writer, including escaped-parent/leaf symlink negatives. `fixture-preparation-receipt.json` and final preparation seal pin source/code/fixture bytes. Both initial config routes are pass; root may mutate config/log during authorized native QA without changing the sealed helper/fixture.
