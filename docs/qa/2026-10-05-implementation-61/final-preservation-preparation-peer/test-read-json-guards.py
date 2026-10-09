"""Only tiny synthetic file reads/JSON; never final main or project-source scans."""
import hashlib
import json
import os
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch

BASE = Path('/private/tmp/ohri-i61-final-preservation-bounded-peer-20261005')
HELPER = Path('/private/tmp/ohri-i61-final-preservation-preparation-20261005/check_i61_final_preservation.py')
code = HELPER.read_bytes()
namespace = {'__name__': 'bounded_peer_only', '__file__': str(HELPER)}
exec(compile(code, str(HELPER), 'exec'), namespace)
strict_json, exact_read, epoch, EpochMismatch = [namespace[name] for name in ['strict_json', 'exact_read', 'epoch', 'EpochMismatch']]

class Guards(unittest.TestCase):
    def setUp(self):
        self.target = BASE / ('synthetic-' + self._testMethodName + '.json')
        self.target.write_bytes(b'{"count":84}\n')
        self.observed, self.failures = {}, []

    def test_regular_json(self):
        self.assertEqual(strict_json('{"count":84,"value":1.25}'), {'count': 84, 'value': 1.25})

    def test_duplicate_root_key_refused(self):
        with self.assertRaises(AssertionError): strict_json('{"count":171,"count":84}')

    def test_duplicate_nested_key_refused(self):
        with self.assertRaises(AssertionError): strict_json('{"scope":{"animal":1,"animal":null}}')

    def test_nonfinite_literal_refused(self):
        for value in ['NaN', 'Infinity', '-Infinity']:
            with self.subTest(value=value), self.assertRaises(AssertionError): strict_json('{"value":' + value + '}')

    def test_numeric_overflow_refused(self):
        for value in ['1e999', '-1e999']:
            with self.subTest(value=value), self.assertRaises(AssertionError): strict_json('{"value":' + value + '}')

    def test_stable_read_hash_and_body(self):
        actual, body = exact_read(self.target, self.observed, self.failures, True)
        self.assertEqual(actual, {'bytes': 13, 'sha256': hashlib.sha256(body).hexdigest()})
        self.assertEqual(body, b'{"count":84}\n'); self.assertEqual(self.failures, [])

    def test_stable_second_read_keeps_epoch(self):
        actual, _ = exact_read(self.target, self.observed, self.failures)
        first = self.observed[self.target]
        again, _ = exact_read(self.target, self.observed, self.failures)
        self.assertEqual(actual, again); self.assertEqual(first, self.observed[self.target])

    def test_actual_progress_short_pread(self):
        original = os.pread
        with patch.object(os, 'pread', side_effect=lambda fd, count, at: original(fd, min(count, 2), at)) as pread:
            actual, body = exact_read(self.target, self.observed, self.failures, True)
        self.assertEqual(body, b'{"count":84}\n'); self.assertEqual(actual['bytes'], 13); self.assertEqual(pread.call_count, 7)

    def test_eof_is_not_retried(self):
        with patch.object(os, 'pread', return_value=b'') as pread, self.assertRaisesRegex(AssertionError, 'EOF'):
            exact_read(self.target, self.observed, self.failures)
        self.assertEqual(pread.call_count, 1); self.assertEqual(self.failures, []); self.assertEqual(self.observed, {})

    def test_io_is_not_retried(self):
        with patch.object(os, 'open', side_effect=OSError('synthetic IO failure')) as opened, self.assertRaises(OSError):
            exact_read(self.target, self.observed, self.failures)
        self.assertEqual(opened.call_count, 1); self.assertEqual(self.failures, [])

    def test_expected_sha_failure_is_not_retry_policy(self):
        with patch.object(os, 'pread', wraps=os.pread) as pread:
            actual, _ = exact_read(self.target, self.observed, self.failures)
            with self.assertRaises(AssertionError): self.assertEqual(actual['sha256'], '0' * 64)
        self.assertEqual(pread.call_count, 1); self.assertEqual(self.failures, [])

    def test_only_epoch_exception_retries_at_most_three(self):
        original = os.fstat
        def mismatched(fd):
            value = original(fd)
            return SimpleNamespace(st_dev=value.st_dev, st_ino=value.st_ino + 1, st_size=value.st_size, st_mtime_ns=value.st_mtime_ns, st_mode=value.st_mode)
        with patch.object(os, 'fstat', side_effect=mismatched) as stat_calls, self.assertRaises(EpochMismatch):
            exact_read(self.target, self.observed, self.failures)
        self.assertEqual(stat_calls.call_count, 3); self.assertEqual([failure['attempt'] for failure in self.failures], [1,2,3])
        self.assertEqual(self.observed, {})

    def test_cross_read_replacement_does_not_erase_verified_epoch(self):
        exact_read(self.target, self.observed, self.failures)
        first = self.observed[self.target]
        replacement = self.target.with_suffix('.replacement')
        replacement.write_bytes(b'{ "count" : 84 }\n'); os.replace(replacement, self.target)
        with self.assertRaises(AssertionError): exact_read(self.target, self.observed, self.failures, True)
        self.assertEqual(first, self.observed[self.target])

    def test_cross_read_same_bytes_replacement_also_refused(self):
        exact_read(self.target, self.observed, self.failures)
        first = self.observed[self.target]
        replacement = self.target.with_suffix('.replacement')
        replacement.write_bytes(self.target.read_bytes()); os.replace(replacement, self.target)
        with self.assertRaises(AssertionError): exact_read(self.target, self.observed, self.failures)
        self.assertEqual(first, self.observed[self.target])

    def test_unseen_epoch_mismatch_can_freshly_retry_once(self):
        original = os.fstat; calls = 0
        def mismatch_once(fd):
            nonlocal calls
            calls += 1; value = original(fd)
            if calls == 1:
                return SimpleNamespace(st_dev=value.st_dev, st_ino=value.st_ino + 1, st_size=value.st_size, st_mtime_ns=value.st_mtime_ns, st_mode=value.st_mode)
            return value
        with patch.object(os, 'fstat', side_effect=mismatch_once):
            actual, body = exact_read(self.target, self.observed, self.failures, True)
        self.assertEqual(actual['bytes'], 13); self.assertEqual(body, b'{"count":84}\n')
        self.assertEqual([row['attempt'] for row in self.failures], [1]); self.assertEqual(calls, 3)

    def test_observed_fd_epoch_mismatch_is_fatal_without_fresh_retry(self):
        exact_read(self.target, self.observed, self.failures); first = self.observed[self.target]
        original = os.fstat
        def mismatch(fd):
            value = original(fd)
            return SimpleNamespace(st_dev=value.st_dev, st_ino=value.st_ino + 1, st_size=value.st_size, st_mtime_ns=value.st_mtime_ns, st_mode=value.st_mode)
        with patch.object(os, 'fstat', side_effect=mismatch) as calls, self.assertRaises(AssertionError):
            exact_read(self.target, self.observed, self.failures)
        self.assertEqual(calls.call_count, 1); self.assertEqual(len(self.failures), 1); self.assertEqual(self.observed[self.target], first)

    def test_observed_mid_read_replacement_cannot_refresh_final_epoch(self):
        exact_read(self.target, self.observed, self.failures); first = self.observed[self.target]
        original = os.pread
        def replace_during_read(fd, count, at):
            body = original(fd, count, at)
            replacement = self.target.with_suffix('.replacement')
            replacement.write_bytes(b'{"count":84}\n'); os.replace(replacement, self.target)
            return body
        with patch.object(os, 'pread', side_effect=replace_during_read) as calls, self.assertRaises(AssertionError):
            exact_read(self.target, self.observed, self.failures)
        self.assertEqual(calls.call_count, 1); self.assertEqual(len(self.failures), 1); self.assertEqual(self.observed[self.target], first)

if __name__ == '__main__':
    print(json.dumps({'helperBytes': len(code), 'helperSha256': hashlib.sha256(code).hexdigest(), 'scope': 'independent synthetic read/JSON guards only; no final main/project read'}), flush=True)
    unittest.main(verbosity=2)
