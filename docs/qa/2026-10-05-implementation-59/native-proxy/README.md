# I59 local native held/error proxy — prepared, not started

This helper listens only on127.0.0.1:3005 and forwards HTTP to127.0.0.1:3004. Endpoints are fixed; no public bind/upstream flags are accepted. Import and logic tests create no server/socket. The parent owns explicit startup and browser observation.

Parent startup command:

```
/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /private/tmp/ohri-i59-native-proxy/proxy.mjs
```

Optional flags select private files under the real `/private/tmp/ohri-i59-native-proxy` tree: `--config /private/tmp/ohri-i59-native-proxy/config.json --log /private/tmp/ohri-i59-native-proxy/requests.jsonl`. Symlink files and ancestors outside this real directory are rejected. The default config has empty rules. Logs are append-only0600. There is no HTTP configuration/control endpoint; requests for this helper's private directory, including encoded Vite filesystem URLs, receive a local404 without upstream access. Other ordinary HTTP requests pass unchanged to the fixed origin. WebSocket upgrades pass to that same origin and do not use counts controls; upgrade forwarding has no observed live-browser claim here.

## Private request rules

Only GET of the complete raw target exactly equal to one of these paths is controllable:

- `/data/cano_chol_rna_counts_v1/counts-093.json.gzip`
- `/data/cano_chol_rna_counts_v1/counts-021.json.gzip`
- `/data/cano_chol_rna_counts_v1/counts-000.json.gzip`

HEAD, query variants, nearby/prefix paths and other assets remain ordinary pass-through. Accepted modes are `pass`, `delay` (default12000ms, integer1–12000), `404`, and `wrong_chunk` with another of these exact three paths as `replacementPath`. Delay occurs before upstream connection; a downstream close clears the timer and cannot revive an old request. Wrong-chunk mode retrieves the other original upstream gzip and forwards its own original bytes/status/headers. It never edits an original file or decompresses/recompresses it. Default and delay modes preserve the actual raw gzip payload and headers. Local404/503/502 replies are explicit proxy failures, never source-byte proof.

Config is loaded afresh for each request, then held as that request's immutable rule snapshot. Replace config atomically from a sibling file so a new request sees complete JSON; malformed config intentionally returns503 and logs a private error. Existing requests keep their previous rules. To arm a paired delay after the original single Chat request finishes, copy `config-delay-pair.example.json` to a temporary sibling and rename it to `config.json`. The error-sibling example delays093 but returns404 for021. The wrong-chunk example requests000 under021. Empty rules restore normal forwarding. No browser action is needed to edit config.

## Evidence semantics

Each HTTP request has a distinct requestId and `request_start`, selected rule/config SHA, `upstream_start`, raw request/response headers, byte totals/hash, response finish or downstream disconnect events. Host/request headers and upstream status/headers are forwarded unmodified; sensitive Cookie/Authorization/Set-Cookie values are redacted only in the local log. Source compressed-body hashes are computed incrementally without decompression. `upstreamReceivedBodySha256` measures bytes received by this proxy; `handedToResponseBodySha256` measures bytes passed to the outgoing response. Neither proves that the browser consumed, decompressed, verified or rendered them. Partial hashes after disconnection are explicitly partial totals.

`downstream_disconnect` means a response closed before proxy finish or an incoming request aborted. Its proxyAbortCause distinguishes known upstream failure. It does not identify the React component or establish that a user action caused the cancellation. Correlate native browser action/initiator/request/DOM evidence separately. A completed request followed by cancellation during browser decoding may have no proxy disconnect; absence of stale pair output/proof remains a browser acceptance requirement. Different requests for the same093/021 URL receive different IDs; do not merge the retained single-feature request and private pair request.

## Native priority sequence for parent

Use the same current build through3005 and the exact `/explore/cell-types?type=cano.gomez.p56.chol_in.sha256.e34a2e59ec5151d120eff617` route. New origin state is separate from3004; keep exact source/profile selection and current upgraded layout.

1. Start with empty rules, load the exact53-nucleus Skor2 profile/roster and open RNA. Verify retained Chat51/53 and267 total. Pair is initially closed. Record its absence and the one ordinary single-feature093 request.
2. Arm the paired delay only after that single-feature proof is ready; open pair. The two new093/021 requests must stay loading with no pair counts/exports. Close pair before12s and retain DOM plus request evidence; wait beyond12s and prove old pair results never revive. Reopen requires fresh requests.
3. Repeat during outer RNA close, explicit profile switch, non-Cano switch and route unmount. Parent/outer close removes the pair and aborts owned I/O. A fresh profile defaults its RNA/pair disclosure state; old profile output must not reappear.
4. While a pair is delayed, change first feature or second feature. Old keyed pair results clear and old pending requests cannot overwrite the new profile/feature pair. Choosing first Pitx2 also starts the retained single-feature021 request, separately from its new pair021/093 requests. Closing only pair should cancel its requests while permitting the retained first-feature request to finish; do not falsely claim all same-URL requests belong to the pair. Closing outer RNA removes both. Verify current DOM/feature labels and actual browser initiation/abort facts.
5. Arm093 delay plus021404. The entire pair fails, no partial/current/old pair export remains, and the delayed sibling cancels when the owned loader rejects. Restore empty rules, click Retry and require two fresh original verified chunks. Do not claim successful single-feature Chat output is a pair result.
6. Arm wrong-chunk021→000. The gzip remains valid original000 bytes but must fail021 compressed receipt verification and withhold pair proof/export. Restore pass and retry; match proxy actual compressed hashes/lengths to unchanged exact source receipts and browser exported chunk proof. No workspace source file is mutated.
7. Optionally control000 while selecting Xkr4/Gm1992 through ordinary exact controls. The pair requests one unique000 chunk, distinct from the retained first-feature request. Pair receipt requestCount1 and both original feature rows1/2 must agree. Verify no stale pair response after close/feature switch.

Relevant original receipt values:093=33,805B/SHA `2bc6fd586ad879a8d7013f8cc44fbb6fdbea88a83b77ae07bc023c6ba9000110`;021=41,923B/SHA `1d9a8be599a0d520b27f8079dbe364745ab61011dd3b1f3bfb4cd95f63f7007e`;000=49,394B/SHA `22fd9914548b4b3b1cc1b6b66cad82c4123a12776e9cbe839e84f1fd885339d0`. The application remains responsible for its own compressed/decoded checksum checks and private pair ownership. Proxy traces alone do not admit source/render proof, biological meaning, geometry or registrations.

## Prepared validation limit

Fifteen Node logic tests use mock request/response streams and a fake timer; gzip fixtures are synthetic test payloads. They verify pass-through bytes/headers,12s scheduling, close/late-callback cleanup, incoming abort, started-upstream destruction,404, valid wrong-gzip substitution, strict path/method/config scope, per-request config snapshots, private-file protection and log redaction. They use no live upstream or listening server and do not run native GUI/network/AT checks. Root/stage/app/source/gzip assets are untouched.
