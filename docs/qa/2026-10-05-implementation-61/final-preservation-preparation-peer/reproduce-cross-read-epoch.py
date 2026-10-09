"""Execute only exact_read against this peer's tiny synthetic file, never main."""
import hashlib
import json
import os
from pathlib import Path

BASE = Path('/private/tmp/ohri-i61-final-preservation-bounded-peer-20261005')
HELPER = Path('/private/tmp/ohri-i61-final-preservation-preparation-20261005/check_i61_final_preservation.py')
body = HELPER.read_bytes()
namespace = {'__name__': 'bounded_peer_only', '__file__': str(HELPER)}
exec(compile(body, str(HELPER), 'exec'), namespace)
exact_read, epoch, strict_json = [namespace[key] for key in ['exact_read', 'epoch', 'strict_json']]
target = BASE / 'synthetic-observation.json'
target.write_bytes(b'{"count":84}\n')
observed, failures = {}, []
before_pin, before_body = exact_read(target, observed, failures, True)
first_epoch = observed[target]
replacement = BASE / 'synthetic-observation.replacement.json'
replacement.write_bytes(b'{ "count" : 84 }\n')
os.replace(replacement, target)
second_epoch = epoch(target.stat())
assert second_epoch != first_epoch
try:
    after_pin, after_body = exact_read(target, observed, failures, True)
    assert strict_json(before_body) == strict_json(after_body) == {'count': 84}
    assert before_pin != after_pin
    assert observed[target] == second_epoch
    assert epoch(target.stat()) == observed[target]
    result = {'status': 'COUNTEREXAMPLE_CONFIRMED_CROSS_READ_EPOCH_OVERWRITTEN', 'helperBytes': len(body), 'helperSha256': hashlib.sha256(body).hexdigest(), 'firstVerifiedPin': before_pin, 'secondBodyPinDiscardableByCaller': after_pin, 'firstObservedEpoch': list(first_epoch), 'secondObservedEpoch': list(second_epoch), 'finalObservedEpoch': list(observed[target]), 'sameParsedJson': True, 'endEpochAssertionPassesDespitePriorCanonicalPinNowMismatch': True, 'singleReadEpochFailures': failures, 'rootSourceOrStageFilesRead': 0, 'privateProducerOrFinalMainExecuted': False}
except AssertionError as error:
    result = {'status': 'CROSS_READ_EPOCH_DRIFT_NOW_REFUSED', 'helperBytes': len(body), 'helperSha256': hashlib.sha256(body).hexdigest(), 'assertion': str(error), 'firstObservedEpoch': list(first_epoch), 'secondPhysicalEpoch': list(second_epoch), 'retainedObservedEpoch': list(observed[target]), 'rootSourceOrStageFilesRead': 0, 'privateProducerOrFinalMainExecuted': False}
target_receipt = BASE / ('cross-read-counterexample-' + hashlib.sha256(body).hexdigest()[:12] + '.json')
with target_receipt.open('x') as stream:
    json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps(result))
