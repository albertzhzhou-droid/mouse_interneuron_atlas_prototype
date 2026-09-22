"""Bounded recovery checks; no external requests and no scientific fixtures."""

import gzip
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location(
    "cano_recovery", Path(__file__).resolve().parents[1] / "tools/fetch_cano_gomez_sources.py"
)
recovery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(recovery)


class Response(io.BytesIO):
    status = 206

    def __init__(self, data, url, start, end, total):
        super().__init__(data)
        self.url = url
        self.headers = {"Content-Range": f"bytes {start}-{end}/{total}"}

    def geturl(self):
        return self.url


class RecoveryTests(unittest.TestCase):
    def test_resume_requests_only_missing_bytes_and_refuses_tamper(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            (directory / "0-9.part").write_bytes(b"0123")
            def respond(request, timeout):
                self.assertEqual(request.headers["Range"], "bytes=4-9")
                return Response(b"456789", request.full_url, 4, 9, 10)
            with patch.object(recovery.urllib.request, "urlopen", respond):
                path, receipt = recovery.fetch_chunk("https://example.test/object", directory, 0, 9, 10)
            self.assertEqual(path.read_bytes(), b"0123456789")
            with patch.object(recovery.urllib.request, "urlopen", side_effect=AssertionError("unexpected network")):
                self.assertEqual(recovery.fetch_chunk("https://example.test/object", directory, 0, 9, 10)[1], receipt)
            path.write_bytes(b"9876543210")
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                recovery.fetch_chunk("https://example.test/object", directory, 0, 9, 10)

    def test_wrong_range_or_origin_is_never_accepted(self):
        for origin, start in [("https://elsewhere.test/object", 0), ("https://example.test/object", 1)]:
            with self.subTest(origin=origin, start=start), tempfile.TemporaryDirectory() as folder:
                response = Response(b"0123", origin, start, 3, 4)
                with patch.object(recovery.urllib.request, "urlopen", return_value=response):
                    with self.assertRaises(ValueError):
                        recovery.fetch_chunk("https://example.test/object", Path(folder), 0, 3, 4)
                self.assertFalse((Path(folder) / "0-3.chunk").exists())

    def test_full_object_is_hashed_and_gzip_checked_before_publish(self):
        payload = gzip.compress(b"test transport bytes, never a biological fixture", mtime=0)
        def respond(request, timeout):
            start, end = map(int, request.headers["Range"].split("=")[1].split("-"))
            return Response(payload[start:end+1], request.full_url, start, end, len(payload))
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            with patch.dict(recovery.SOURCES, {"TEST": ("fixture.rds", len(payload), None)}), patch.object(recovery.urllib.request, "urlopen", respond):
                receipt = recovery.fetch_source("TEST", directory, 2, 16)
                self.assertTrue(receipt["gzipCrcVerified"])
                self.assertEqual((directory / "fixture.rds").read_bytes(), payload)
                self.assertFalse((directory / "fixture.rds.ranges").exists())
                self.assertEqual(recovery.fetch_source("TEST", directory, 2, 16), receipt)
                (directory / "fixture.rds").write_bytes(b"x" * len(payload))
                with self.assertRaisesRegex(ValueError, "does not match"):
                    recovery.fetch_source("TEST", directory, 2, 16)

    def test_wrong_pinned_checksum_cannot_publish(self):
        payload = gzip.compress(b"transport fixture", mtime=0)
        def respond(request, timeout):
            start, end = map(int, request.headers["Range"].split("=")[1].split("-"))
            return Response(payload[start:end+1], request.full_url, start, end, len(payload))
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            with patch.dict(recovery.SOURCES, {"TEST": ("fixture.rds", len(payload), "0" * 64)}), patch.object(recovery.urllib.request, "urlopen", respond):
                with self.assertRaisesRegex(ValueError, "checksum/size mismatch"):
                    recovery.fetch_source("TEST", directory, 2, 16)
            self.assertFalse((directory / "fixture.rds").exists())


if __name__ == "__main__":
    unittest.main()
