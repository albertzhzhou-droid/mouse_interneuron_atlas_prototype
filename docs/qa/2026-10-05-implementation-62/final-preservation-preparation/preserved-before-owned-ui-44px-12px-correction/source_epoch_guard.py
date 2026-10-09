from datetime import datetime, timezone
import hashlib
import json
import math
import os
import stat
import sys

def pin(body):
    return {'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}


def only_pin(row):
    return {k: row[k] for k in ['bytes', 'sha256']}


def strict_json(body):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            assert key not in result, f'Duplicate JSON key: {key}'
            result[key] = value
        return result
    def refuse(value):
        raise AssertionError(f'Nonfinite JSON literal: {value}')
    def finite_float(value):
        number = float(value)
        assert math.isfinite(number), f'Nonfinite JSON numeric overflow: {value}'
        return number
    return json.loads(body, object_pairs_hook=unique, parse_constant=refuse, parse_float=finite_float)


def epoch(s):
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns)


class EpochMismatch(Exception):
    pass


def exact_read(path, observed, failures, keep_body=False):
    """4K pread using actual progress; retries only strict epoch mismatch."""
    first_epoch = observed.get(path)
    for attempt in range(1, 4):
        fd = None
        try:
            pb = path.stat()
            if first_epoch is not None:
                assert epoch(pb) == first_epoch, f'Source epoch changed between reads: {path}: {first_epoch} -> {epoch(pb)}'
            fd = os.open(path, os.O_RDONLY)
            a = os.fstat(fd)
            assert stat.S_ISREG(a.st_mode), f'Nonregular source: {path}'
            if epoch(pb) != epoch(a):
                raise EpochMismatch(f'Path/fd epoch mismatch before read: {path}: {epoch(pb)} -> {epoch(a)}')
            digest = hashlib.sha256()
            position, pieces = 0, []
            while position < a.st_size:
                chunk = os.pread(fd, min(4096, a.st_size - position), position)
                assert chunk, f'Unexpected EOF at {position}/{a.st_size}: {path}'
                digest.update(chunk)
                if keep_body:
                    pieces.append(chunk)
                position += len(chunk)
            e = os.fstat(fd)
            pa = path.stat()
            if epoch(a) != epoch(e) or epoch(e) != epoch(pa):
                raise EpochMismatch(f'Source epoch changed: {path}: {epoch(a)} -> {epoch(e)} -> {epoch(pa)}; read {position}')
            assert position == a.st_size
            if first_epoch is not None:
                assert epoch(pa) == first_epoch, f'Source epoch changed between reads: {path}: {first_epoch} -> {epoch(pa)}'
            else:
                observed[path] = epoch(pa)
            return {'bytes': position, 'sha256': digest.hexdigest()}, b''.join(pieces) if keep_body else None
        except EpochMismatch as exc:
            row = {'path': str(path), 'attempt': attempt,
                   'timeUtc': datetime.now(timezone.utc).isoformat(), 'failure': str(exc)}
            failures.append(row)
            print(json.dumps({'strictEpochAttemptRefused': row}), file=sys.stderr, flush=True)
            if first_epoch is not None:
                raise AssertionError(f'Already observed source epoch changed; final epoch cannot refresh: {path}: {first_epoch}; {exc}') from exc
            if attempt == 3:
                raise
        finally:
            if fd is not None:
                os.close(fd)


