import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const CHUNKS = Object.freeze({
  '/data/cano_chol_rna_counts_v1/counts-093.json.gzip': { bytes: 33805, sha256: '2bc6fd586ad879a8d7013f8cc44fbb6fdbea88a83b77ae07bc023c6ba9000110' },
  '/data/cano_chol_rna_counts_v1/counts-021.json.gzip': { bytes: 41923, sha256: '1d9a8be599a0d520b27f8079dbe364745ab61011dd3b1f3bfb4cd95f63f7007e' },
  '/data/cano_chol_rna_counts_v1/counts-000.json.gzip': { bytes: 49394, sha256: '22fd9914548b4b3b1cc1b6b66cad82c4123a12776e9cbe839e84f1fd885339d0' },
});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function instant(value) {
  assert.ok(typeof value === 'string' && /(?:Z|[+]00:00)$/.test(value), 'Explicit UTC timestamp required');
  const time = Date.parse(value); assert.ok(Number.isFinite(time), 'Invalid UTC timestamp'); return time;
}
export function windowOf(value) {
  assert.ok(Array.isArray(value) && value.length === 2, 'Two-element native UTC observation window required');
  const result = value.map(instant); assert.ok(result[0] <= result[1], 'Reversed native window'); return result;
}
export function indexLog(text) {
  assert.ok(text.endsWith('\n'), 'Log snapshot has a partial trailing line');
  const requests = new Map(), entries = [];
  let lastTime = -Infinity;
  for (const [index, line] of text.trimEnd().split('\n').entries()) {
    const entry = JSON.parse(line), time = instant(entry.time);
    assert.ok(time >= lastTime, 'Proxy log timestamp order regressed'); lastTime = time;
    entries.push({ ...entry, line: index + 1, timeMs: time });
    if (!Object.hasOwn(entry, 'requestId')) continue;
    assert.ok(Number.isSafeInteger(entry.requestId) && entry.requestId > 0);
    if (entry.event === 'request_start') {
      assert.ok(!requests.has(entry.requestId), 'Request ID reused: split proxy sessions before replay');
      requests.set(entry.requestId, []);
    }
    const events = requests.get(entry.requestId); assert.ok(events, 'Request event without independent start');
    assert.equal(entry.method, events[0]?.method ?? entry.method);
    assert.equal(entry.requestedTarget, events[0]?.requestedTarget ?? entry.requestedTarget);
    events.push(entries.at(-1));
  }
  return { requests, entries, lastTime };
}
function event(events, name) {
  const matches = events.filter(item => item.event === name);
  assert.ok(matches.length <= 1, `Duplicate terminal/authority event ${name}`); return matches[0];
}
function noPairExport(doc) {
  assert.ok(!doc.pairJSON, 'Pair proof still present');
  assert.ok(!doc.pairProfile && !doc.pairNucleus, 'Pair counts still present');
  assert.deepEqual(doc.pairTable ?? [], [], 'Pair count table still present');
  const exports = (doc.pairExports ?? []).filter(item => /export/i.test(item.text));
  assert.ok(exports.every(item => item.disabled === true), 'Pair export enabled while withheld');
}
export function selectedProfileKey(doc) {
  const params = new URL(doc.url).searchParams;
  const urlKey = params.get('focusKind') === 'molecular_profile' ? params.get('focusId') : params.get('type');
  if (doc.profileId && urlKey) assert.equal(doc.profileId, urlKey, 'Actual DOM profile and current provider URL disagree');
  return doc.profileId ?? urlKey;
}
export function assertDom(doc, state, pairRequests = [], phase = {}) {
  assert.ok(typeof doc.url === 'string' && new URL(doc.url).origin === 'http://127.0.0.1:3005', 'DOM must belong to actual proxy origin');
  if (state === 'held') {
    assert.equal(doc.pairChild, 1); assert.equal(doc.pairDisclosure, true); noPairExport(doc);
    assert.match(doc.pairResult ?? '', /loading and verifying both source feature counts/i);
  } else if (state === 'pair_closed') {
    assert.equal(doc.pairChild, 0); assert.equal(doc.pairDisclosure, false); noPairExport(doc);
  } else if (state === 'rna_closed') {
    assert.equal(doc.rnaDisclosure, false); assert.equal(doc.pairChild, 0); noPairExport(doc);
    assert.ok(!doc.singleJSON && !doc.rnaJSON, 'Single feature proof survived outer close');
  } else if (state === 'non_cano') {
    assert.equal(doc.pairChild, 0); noPairExport(doc); assert.ok(!doc.singleJSON && !doc.rnaJSON);
    assert.ok(!selectedProfileKey(doc)?.startsWith('cano.gomez.p56.chol_in.'), 'Not switched outside CHOL profile');
  } else if (state === 'profile_switched_closed') {
    assert.equal(doc.rnaDisclosure, false); assert.equal(doc.pairChild, 0); noPairExport(doc); assert.ok(!doc.singleJSON && !doc.rnaJSON);
    assert.ok(typeof phase.profileIdBefore === 'string' && phase.profileIdBefore.startsWith('cano.gomez.p56.chol_in.'), 'Exact prior source profile key required');
    const currentKey = selectedProfileKey(doc);
    assert.ok(currentKey && currentKey !== phase.profileIdBefore, 'Current profile did not change from prior exact key');
    if (phase.profileIdAfter) assert.equal(currentKey, phase.profileIdAfter);
  } else if (state === 'pair_error') {
    assert.equal(doc.pairChild, 1); noPairExport(doc);
    assert.match(doc.pairResult ?? '', /Pair counts and exports are unavailable/i, 'No source-pair-specific failed status');
    assert.ok(!/Loading and verifying both source feature counts/i.test(doc.pairResult ?? ''), 'Pair still only pending');
  } else if (state === 'pair_ready') {
    assert.equal(doc.pairChild, 1); assert.equal(doc.pairDisclosure, true);
    const proof = JSON.parse(doc.pairJSON);
    assert.equal(proof.documentType, 'source_chol_in_rna_feature_pair_counts');
    assert.equal(proof.verification.status, 'runtime_pair_both_source_vectors_sha256_verified');
    assert.equal(proof.verification.requestCount, pairRequests.length);
    if (phase.expectedFirstFeature) assert.equal(proof.firstFeature, phase.expectedFirstFeature, 'Pair proof does not belong to its current first feature');
    if (phase.expectedSecondFeature) assert.equal(proof.secondFeature, phase.expectedSecondFeature, 'Pair proof does not belong to its current second feature');
    if (phase.profileIdAfter) {
      assert.equal(proof.currentProfile.profileId, phase.profileIdAfter, 'Ready pair belongs to old/foreign source profile');
      assert.equal(selectedProfileKey(doc), phase.profileIdAfter, 'Ready proof does not match selected source profile');
    }
    if (phase.expectedSourceFeatureRows) {
      assert.deepEqual(proof.sourceFeatureRows, phase.expectedSourceFeatureRows);
      assert.deepEqual(proof.verification.sourceFeatureRows, phase.expectedSourceFeatureRows);
    }
    const targets = pairRequests.map(events => events[0].requestedTarget).sort();
    assert.deepEqual(proof.verification.chunks.map(item => item.requestedUrl).sort(), targets);
    for (const item of proof.verification.chunks) {
      const original = CHUNKS[item.requestedUrl]; assert.ok(original);
      assert.equal(item.compressedSha256, original.sha256); assert.equal(item.receivedBytes, original.bytes);
      assert.equal(item.status, 'runtime_both_sha256_verified');
      assert.equal(item.responseUrl, `http://127.0.0.1:3005${item.requestedUrl}`);
    }
    assert.ok((doc.pairExports ?? []).some(item => /export.*json/i.test(item.text) && item.disabled === false), 'Ready JSON action not enabled');
    assert.ok((doc.pairExports ?? []).some(item => /export.*csv/i.test(item.text) && item.disabled === false), 'Ready CSV action not enabled');
  } else if (state === 'single_ready') {
    const proof = JSON.parse(doc.singleJSON ?? doc.rnaJSON);
    assert.equal(proof.documentType, 'source_chol_in_rna_counts');
    assert.equal(proof.verification.status, 'runtime_both_sha256_verified');
    const original = CHUNKS[proof.verification.requestedUrl]; assert.ok(original);
    assert.equal(proof.verification.compressedSha256, original.sha256);
    assert.equal(proof.verification.receivedBytes, original.bytes);
    assert.equal(proof.verification.responseUrl, `http://127.0.0.1:3005${proof.verification.requestedUrl}`);
    if (phase.expectedFirstFeature) assert.equal(proof.feature, phase.expectedFirstFeature, 'Single proof does not belong to the current explicitly chosen feature');
    if (phase.expectedFirstSourceFeatureRow) assert.equal(proof.sourceFeatureRow, phase.expectedFirstSourceFeatureRow);
    if (phase.profileIdAfter) {
      assert.equal(proof.currentProfile.profileId, phase.profileIdAfter, 'Single proof belongs to old/foreign source profile');
      assert.equal(selectedProfileKey(doc), phase.profileIdAfter, 'Single proof does not match selected source profile');
    }
  } else assert.fail(`Unknown DOM state ${state}`);
}
function successful(events, expectedTarget = events[0].requestedTarget) {
  const original = CHUNKS[expectedTarget]; assert.ok(original, 'Unrecognized expected original body');
  const finish = event(events, 'response_finished'), complete = event(events, 'upstream_body_complete'), headers = event(events, 'upstream_headers');
  assert.ok(finish && complete && headers, 'No complete successful transport'); assert.equal(finish.statusCode, 200);
  assert.equal(headers.statusCode, 200); assert.deepEqual(finish.headers, headers.headers, 'Original upstream response headers changed');
  assert.equal(finish.upstreamReceivedBytes, original.bytes); assert.equal(finish.handedToResponseBytes, original.bytes);
  assert.equal(finish.upstreamReceivedBodySha256, original.sha256); assert.equal(finish.handedToResponseBodySha256, original.sha256);
  assert.ok(!event(events, 'downstream_disconnect'), 'Successful response also canceled');
  assert.equal(finish.browserConsumptionEstablished, false, 'Proxy log cannot claim browser consumption');
  return finish;
}
function abortedBeforeDeadline(events) {
  const delay = event(events, 'delay_scheduled'), disconnect = event(events, 'downstream_disconnect');
  assert.ok(delay && disconnect, 'Missing actual scheduled delay or disconnect');
  assert.ok(delay.delayMs > 0 && delay.delayMs <= 12000);
  const deadline = delay.timeMs + delay.delayMs;
  assert.ok(disconnect.timeMs < deadline, 'Disconnect happened after controlled delay deadline');
  assert.equal(disconnect.proxyAbortCause, null, 'Proxy/upstream failure cannot establish native abort');
  assert.equal(disconnect.responseFinished, false);
  assert.equal(disconnect.upstreamReceivedBytes, 0); assert.equal(disconnect.handedToResponseBytes, 0);
  assert.ok(!event(events, 'upstream_start') && !event(events, 'response_finished'), 'Canceled held request revived');
  return { deadline, disconnect };
}
function configCanonical(input) {
  const config = input.config ?? input;
  assert.equal(config.schemaVersion, 1); const rules = {};
  for (const [target, rule] of Object.entries(config.rules)) rules[target] = rule.mode === 'delay' ? { mode: 'delay', delayMs: rule.delayMs ?? 12000 } : { ...rule };
  return { schemaVersion: 1, rules };
}
function verifiedReplacement(phase, indexed, loadJson, kind, captureWindow, triggerTime) {
  const ids = kind === 'pair' ? phase.replacementPairRequestIds : [phase.replacementSingleRequestId];
  assert.ok(ids?.length > 0 && ids.every(Number.isSafeInteger), 'Explicit replacement request IDs required');
  assert.equal(new Set(ids).size, ids.length, 'Replacement IDs duplicated');
  assert.ok(ids.every(id => !phase.requests.some(owner => owner.requestId === id)), 'Replacement reused an old canceled request ID');
  assert.ok(phase.replacementConfigPath, 'Replacement actual configuration snapshot required');
  const config = configCanonical(loadJson(phase.replacementConfigPath)), configSha = sha(JSON.stringify(config));
  const events = ids.map(id => {
    const items = indexed.requests.get(id); assert.ok(items, 'Replacement request absent');
    const selected = event(items, 'rule_selected'); assert.ok(selected);
    assert.equal(selected.configSha256, configSha, 'Replacement uses a different actual configuration');
    assert.deepEqual(selected.rule, config.rules[items[0].requestedTarget] ?? { mode: 'pass' });
    assert.ok(['pass', 'delay'].includes(selected.rule.mode), 'Rejected/replaced body cannot establish fresh current proof');
    assert.ok(items[0].timeMs >= triggerTime, 'Replacement request predates old tuple cancellation/failure trigger');
    const finish = successful(items); assert.ok(finish.timeMs <= captureWindow[0], 'Replacement ready capture predates its actual bytes');
    const upstream = event(items, 'upstream_start'); assert.ok(upstream && upstream.controlledBodySubstitution === false);
    assert.equal(upstream.upstreamTarget, items[0].requestedTarget);
    return items;
  });
  if (kind === 'pair') assert.equal(new Set(events.map(items => items[0].requestedTarget)).size, events.length, 'Replacement pair duplicate chunk');
  return events;
}
export function replayPhase(phase, indexed, loadJson, priorRequestIds = new Set()) {
  assert.ok(phase.id && phase.ownerEvidence?.trim(), 'Explicit native request ownership evidence required');
  const range = windowOf(phase.windowUTC), ids = new Set();
  assert.ok(phase.requests?.length > 0, 'Phase has no explicit request IDs');
  const owned = phase.requests.map(owner => {
    assert.ok(['pair', 'single_feature'].includes(owner.role), 'Unknown or inferred request owner');
    assert.ok(!ids.has(owner.requestId), 'One request cannot have both pair/single feature ownership'); ids.add(owner.requestId);
    assert.ok(!priorRequestIds.has(owner.requestId), 'Fresh phase reused prior request ID');
    const events = indexed.requests.get(owner.requestId); assert.ok(events, 'Owned request absent');
    assert.equal(events[0].method, 'GET'); assert.ok(CHUNKS[events[0].requestedTarget]);
    assert.ok(events[0].timeMs >= range[0] && events[0].timeMs <= range[1], 'Owned request outside native phase window');
    return { ...owner, events };
  });
  const pair = owned.filter(item => item.role === 'pair'), single = owned.filter(item => item.role === 'single_feature');
  assert.ok(pair.length > 0); assert.equal(new Set(pair.map(item => item.events[0].requestedTarget)).size, pair.length, 'Pair loaded same chunk more than once');
  const config = configCanonical(loadJson(phase.configPath)), expectedConfigSha = sha(JSON.stringify(config));
  for (const item of owned) {
    const selected = event(item.events, 'rule_selected'); assert.ok(selected);
    assert.equal(selected.configSha256, expectedConfigSha, 'Actual request used different phase configuration');
    assert.deepEqual(selected.rule, config.rules[item.events[0].requestedTarget] ?? { mode: 'pass' });
  }
  let deadlines = [], triggerTime = null;
  if (['abort_pair', 'abort_outer', 'switch_profile', 'feature_cancel', 'feature_replaced'].includes(phase.kind)) {
    assert.ok(phase.action?.evidence?.trim(), 'Native action witness is required');
    const actionWindow = windowOf(phase.action.windowUTC);
    assert.ok(phase.action.evidencePath, 'Original native action bracket file is required');
    const actionWitness = loadJson(phase.action.evidencePath);
    assert.deepEqual(phase.action.windowUTC, [actionWitness.startUTC, actionWitness.endUTC], 'Sidecar changed actual native action bracket');
    assert.ok(actionWindow[0] >= range[0] && actionWindow[1] <= range[1]);
    triggerTime = actionWindow[0];
    const aftermathState = phase.kind === 'abort_pair' ? 'pair_closed' : phase.kind === 'switch_profile' ? phase.switchedState ?? 'profile_switched_closed' : phase.kind === 'feature_replaced' ? 'replacement_tuple_held' : 'rna_closed';
    const firstCommitted = phase.captures.filter(item => item.state === aftermathState && windowOf(item.windowUTC)[0] >= actionWindow[1]).sort((left, right) => windowOf(left.windowUTC)[1] - windowOf(right.windowUTC)[1])[0];
    assert.ok(firstCommitted, 'No native committed aftermath brackets the actual abort effect');
    const effectObservedBy = windowOf(firstCommitted.windowUTC)[1];
    for (const item of pair) {
      const result = abortedBeforeDeadline(item.events); deadlines.push(result.deadline);
      assert.ok(result.disconnect.timeMs >= actionWindow[0] && result.disconnect.timeMs <= effectObservedBy, 'Actual disconnect not between native action and committed DOM aftermath');
    }
    if (phase.kind === 'abort_pair') {
      for (const item of single) successful(item.events);
    } else for (const item of single) {
      const result = abortedBeforeDeadline(item.events); deadlines.push(result.deadline);
      assert.ok(result.disconnect.timeMs >= actionWindow[0] && result.disconnect.timeMs <= effectObservedBy);
    }
  } else if (phase.kind === 'error_sibling') {
    const failed = pair.filter(item => event(item.events, 'local_response')?.statusCode === 404);
    assert.equal(failed.length, 1, 'Expected one independently owned pair 404');
    assert.equal(event(failed[0].events, 'rule_selected').rule.mode, '404');
    const failure = event(failed[0].events, 'response_finished'); assert.ok(failure && failure.statusCode === 404);
    triggerTime = failure.timeMs;
    for (const item of pair.filter(item => item !== failed[0])) {
      const result = abortedBeforeDeadline(item.events); deadlines.push(result.deadline);
      assert.ok(result.disconnect.timeMs >= triggerTime && result.disconnect.timeMs - triggerTime <= 2000, 'Sibling cancel not correlated with 404');
    }
  } else if (phase.kind === 'wrong_chunk') {
    let substitutions = 0;
    for (const item of pair) {
      const rule = event(item.events, 'rule_selected').rule;
      if (rule.mode === 'wrong_chunk') {
        substitutions++; assert.equal(item.events[0].requestedTarget, '/data/cano_chol_rna_counts_v1/counts-021.json.gzip');
        assert.equal(rule.replacementPath, '/data/cano_chol_rna_counts_v1/counts-000.json.gzip');
        const upstream = event(item.events, 'upstream_start'); assert.equal(upstream.upstreamTarget, rule.replacementPath); assert.equal(upstream.controlledBodySubstitution, true);
        const finish = successful(item.events, rule.replacementPath);
        triggerTime = Math.max(triggerTime ?? -Infinity, finish.timeMs);
      } else successful(item.events);
    }
    assert.equal(substitutions, 1, 'Expected actual valid000 body under021');
  } else if (phase.kind === 'pass_retry') {
    assert.equal(pair.length, 2, 'Expected fresh independent two-chunk retry');
    assert.deepEqual(pair.map(item => item.events[0].requestedTarget).sort(), Object.keys(CHUNKS).filter(target => !target.includes('000')).sort());
    for (const item of pair) { assert.equal(event(item.events, 'rule_selected').rule.mode, 'pass'); successful(item.events); }
  } else if (phase.kind === 'single_chunk') {
    assert.equal(pair.length, 1); assert.equal(single.length, 1, 'Single feature and pair must own separate000 IDs');
    for (const item of owned) { assert.equal(item.events[0].requestedTarget, '/data/cano_chol_rna_counts_v1/counts-000.json.gzip'); successful(item.events); }
  } else assert.fail(`Unknown native phase kind ${phase.kind}`);
  assert.ok(phase.captures?.length > 0, 'Native DOM captures required');
  const states = [];
  for (const capture of phase.captures) {
    const captureWindow = windowOf(capture.windowUTC);
    assert.ok(captureWindow[0] >= range[0] && captureWindow[1] <= range[1], 'Capture outside native window');
    const doc = loadJson(capture.path);
    if (capture.state === 'replacement_pair_ready') {
      assert.ok(['switch_profile', 'error_sibling'].includes(phase.kind), 'Unexpected replacement-pair outcome');
      assert.ok(typeof phase.profileIdAfter === 'string' && phase.profileIdAfter.startsWith('cano.gomez.p56.chol_in.'), 'Exact replacement source-profile identity required');
      assert.ok(typeof phase.expectedFirstFeature === 'string' && phase.expectedFirstFeature.length && typeof phase.expectedSecondFeature === 'string' && phase.expectedSecondFeature.length && phase.expectedFirstFeature !== phase.expectedSecondFeature, 'Exact replacement feature tuple required');
      assert.ok(Array.isArray(phase.expectedSourceFeatureRows) && phase.expectedSourceFeatureRows.length === 2 && phase.expectedSourceFeatureRows.every(row => Number.isSafeInteger(row) && row > 0) && phase.expectedSourceFeatureRows[0] !== phase.expectedSourceFeatureRows[1], 'Exact ordered replacement source feature rows required');
      assert.ok(phase.replacementOpenEvidencePath, 'Original replacement native open/retry bracket required');
      const opened = loadJson(phase.replacementOpenEvidencePath), openedWindow = windowOf([opened.startUTC, opened.endUTC]);
      assert.ok(openedWindow[0] >= triggerTime && openedWindow[1] <= captureWindow[0], 'Replacement open outside trigger/current-proof ordering');
      const replacement = verifiedReplacement(phase, indexed, loadJson, 'pair', captureWindow, openedWindow[0]);
      assertDom(doc, 'pair_ready', replacement, phase);
      if (phase.kind === 'switch_profile') assert.notEqual(phase.profileIdAfter, phase.profileIdBefore, 'Replacement revived old selected profile');
    } else if (capture.state === 'replacement_tuple_held') {
      assert.equal(phase.kind, 'feature_replaced'); assertDom(doc, 'held', [], phase);
      assert.equal(doc.firstFeature, phase.firstFeatureAfter, 'New tuple kept old first feature');
      assert.notEqual(phase.firstFeatureAfter, phase.firstFeatureBefore);
      if (phase.secondFeatureAfter) assert.equal(doc.secondFeature, phase.secondFeatureAfter);
    } else if (capture.state === 'replacement_single_ready_pair_closed') {
      assert.equal(phase.kind, 'feature_replaced'); assertDom(doc, 'pair_closed', [], phase);
      assert.ok(typeof phase.profileIdAfter === 'string' && phase.profileIdAfter.startsWith('cano.gomez.p56.chol_in.'), 'Exact replacement single source-profile identity required');
      assertDom(doc, 'single_ready', [], { ...phase, expectedFirstFeature: phase.firstFeatureAfter });
      const replacement = verifiedReplacement(phase, indexed, loadJson, 'single', captureWindow, triggerTime);
      const proof = JSON.parse(doc.singleJSON ?? doc.rnaJSON);
      assert.equal(replacement[0][0].requestedTarget, proof.verification.requestedUrl, 'Current single proof does not belong to its replacement request');
    } else assertDom(doc, capture.state, pair.map(item => item.events), phase);
    assert.ok(doc.toolCaptureWindowUTC, 'Strict replay requires original embedded native capture bracket; legacy09 remains supplemental');
    assert.deepEqual(capture.windowUTC, [doc.toolCaptureWindowUTC.start, doc.toolCaptureWindowUTC.end], 'Sidecar changed actual embedded native capture bracket');
    if (capture.state === 'held') {
      if (phase.kind === 'feature_replaced') assert.equal(doc.firstFeature, phase.firstFeatureBefore, 'Old-tuple held capture does not show original first feature');
      for (const item of pair) {
        const delay = event(item.events, 'delay_scheduled'); assert.ok(delay);
        const disconnect = event(item.events, 'downstream_disconnect');
        assert.ok(captureWindow[0] >= delay.timeMs && captureWindow[1] < delay.timeMs + delay.delayMs, 'Held DOM outside actual pending interval');
        if (disconnect) assert.ok(captureWindow[1] <= disconnect.timeMs, 'Held DOM window extends after disconnect');
      }
    }
    if (capture.afterDeadline === true) {
      assert.ok(deadlines.length > 0); assert.ok(captureWindow[0] > Math.max(...deadlines), 'No postdeadline native observation');
      assert.ok(indexed.lastTime >= Math.max(...deadlines) || range[1] > Math.max(...deadlines), 'Insufficient final observation coverage');
      assert.ok(['pair_closed', 'rna_closed', 'non_cano', 'profile_switched_closed', 'pair_error', 'replacement_pair_ready', 'replacement_single_ready_pair_closed'].includes(capture.state), 'Afterdeadline capture neither withholds canceled tuple nor proves explicit new replacement');
    }
    if (capture.state === 'pair_ready') {
      for (const item of pair) assert.ok(event(item.events, 'response_finished').timeMs <= captureWindow[0], 'Ready capture predates complete actual bytes');
    }
    if (capture.state === 'single_ready') {
      const proof = JSON.parse(doc.singleJSON ?? doc.rnaJSON), matches = single.filter(item => item.events[0].requestedTarget === proof.verification.requestedUrl);
      assert.equal(matches.length, 1, 'Single-ready proof lacks one separately owned matching feature request');
      const finish = successful(matches[0].events);
      assert.ok(finish.timeMs <= captureWindow[0], 'Single-ready capture predates separately owned feature bytes');
    }
    if (capture.state === 'pair_error' && triggerTime !== null) assert.ok(captureWindow[0] >= triggerTime);
    states.push({ path: capture.path, state: capture.state, windowUTC: capture.windowUTC, afterDeadline: capture.afterDeadline === true });
  }
  if (deadlines.length) assert.ok(phase.captures.some(item => item.afterDeadline === true), 'Required postdeadline no-revival capture absent');
  if (['abort_pair', 'abort_outer', 'switch_profile', 'feature_cancel'].includes(phase.kind)) {
    assert.ok(states.some(item => item.state === 'held'), 'No actual held/no-export capture');
    const closedState = phase.kind === 'abort_pair' ? 'pair_closed' : phase.kind === 'switch_profile' ? phase.switchedState ?? 'profile_switched_closed' : 'rna_closed';
    assert.ok(states.some(item => (item.state === closedState || phase.kind === 'switch_profile' && item.state === 'replacement_pair_ready') && item.afterDeadline), 'Native action aftermath not captured');
  }
  if (phase.kind === 'feature_replaced') {
    assert.ok(states.some(item => item.state === 'held') && states.some(item => item.state === 'replacement_tuple_held'));
    assert.ok(states.some(item => item.state === 'replacement_single_ready_pair_closed' && item.afterDeadline), 'Current replacement feature and old-tuple no-revival not observed');
  }
  if (['wrong_chunk', 'error_sibling'].includes(phase.kind)) assert.ok(states.some(item => item.state === 'pair_error'), 'Failure withholding not observed');
  if (['pass_retry', 'single_chunk'].includes(phase.kind)) assert.ok(states.some(item => item.state === 'pair_ready'), 'Ready proof not observed');
  if (phase.kind === 'single_chunk') assert.ok(states.some(item => item.state === 'single_ready'), 'Independent first-feature proof not observed');
  return { id: phase.id, kind: phase.kind, requests: owned.map(item => ({ requestId: item.requestId, role: item.role, target: item.events[0].requestedTarget, lines: [item.events[0].line, item.events.at(-1).line] })), captures: states, ownerEvidence: phase.ownerEvidence, transportFactsOnly: true, browserConsumptionInferredFromProxy: false };
}

export function replayManifest(manifest, text, loadJson) {
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.status, 'NATIVE_READY', 'Parent native-ready gate missing');
  const indexed = indexLog(text), used = new Set();
  assert.ok(manifest.phases?.length > 0);
  const phases = manifest.phases.map(phase => {
    const result = replayPhase(phase, indexed, loadJson, used);
    for (const item of phase.requests) used.add(item.requestId); return result;
  });
  const roles = new Map(manifest.phases.flatMap(phase => phase.requests.map(owner => [owner.requestId, owner.role])));
  for (const phase of manifest.phases) {
    for (const id of phase.replacementPairRequestIds ?? []) assert.equal(roles.get(id), 'pair', 'Replacement pair ID has no distinct declared pair owner phase');
    if (phase.replacementSingleRequestId) assert.equal(roles.get(phase.replacementSingleRequestId), 'single_feature', 'Replacement feature ID has no distinct declared single owner phase');
  }
  const uncontrolled = [...indexed.requests.entries()].filter(([id, events]) => CHUNKS[events[0].requestedTarget] && !used.has(id));
  return { status: 'PASS_DECLARED_NATIVE_PHASES', phases, unownedControlledRequests: uncontrolled.map(([id, events]) => ({ requestId: id, target: events[0].requestedTarget, startUTC: events[0].time })), browserAutomationPerformedByReplay: false, exportsIndependentlyReplayedHere: false, sourceScientificAdmissionChanged: false, logPartialTrailingLineAccepted: false };
}
export function run(manifestPath, outputPath) {
  const absoluteOutput = path.resolve(outputPath ?? ''), outputParent = fs.realpathSync(path.dirname(absoluteOutput));
  assert.equal(outputParent, '/private/tmp/ohri-i59-native-live-replay', 'Replay output must remain in its real temp directory');
  if (fs.existsSync(absoluteOutput)) assert.ok(!fs.lstatSync(absoluteOutput).isSymbolicLink(), 'Replay output must not be a symlink');
  const pins = [], read = filename => {
    const bytes = fs.readFileSync(filename); pins.push({ path: path.resolve(filename), bytes: bytes.length, sha256: sha(bytes) }); return bytes;
  };
  const manifest = JSON.parse(read(manifestPath));
  assert.equal(manifest.status, 'NATIVE_READY', 'Parent native-ready gate missing');
  const logReadAtUTC = new Date().toISOString(), logBefore = fs.statSync(manifest.logPath), snapshot = read(manifest.logPath).toString('utf8'), logAfter = fs.statSync(manifest.logPath);
  assert.ok(logBefore.size === logAfter.size && logBefore.mtimeMs === logAfter.mtimeMs, 'Live log changed during read; retry after native completion');
  for (const phase of manifest.phases) assert.ok(instant(logReadAtUTC) >= windowOf(phase.windowUTC)[1], 'Final log snapshot read predates native afterdeadline observation');
  const result = replayManifest(manifest, snapshot, filename => JSON.parse(read(filename)));
  for (const phase of manifest.phases) {
    if (phase.action?.evidencePath) {
      const action = JSON.parse(read(phase.action.evidencePath));
      assert.deepEqual(phase.action.windowUTC, [action.startUTC, action.endUTC], 'Sidecar changed actual native action bracket');
    }
    for (const filename of phase.evidencePaths ?? []) read(filename);
  }
  fs.writeFileSync(absoluteOutput, JSON.stringify({ ...result, replayedAtUTC: new Date().toISOString(), logReadAtUTC, inputPins: pins }, null, 2) + '\n', { flag: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, mode: 0o600 });
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 4, 'Usage: node replay.mjs native-manifest.json /private/tmp/ohri-i59-native-live-replay/receipt.json');
  const result = run(process.argv[2], process.argv[3]); console.log(JSON.stringify({ status: result.status, phases: result.phases.length, unownedControlledRequests: result.unownedControlledRequests.length }));
}
