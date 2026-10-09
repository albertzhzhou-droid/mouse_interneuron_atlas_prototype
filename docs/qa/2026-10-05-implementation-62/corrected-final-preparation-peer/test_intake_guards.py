import hashlib
import json
import os
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import source_epoch_guard as guard
import capture_i62_real_intake as intake

HERE = Path(__file__).resolve().parent

class GuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='i62-tiny-', dir=HERE)
        self.base = Path(self.temp.name)
        self.file = self.base / 'source.json'
        self.file.write_bytes(b'{"value":1}\n')
    def tearDown(self):
        self.temp.cleanup()
    def test_01_strict_duplicate_root_nested(self):
        for b in [b'{"x":1,"x":2}', b'{"x":{"v":1,"v":2}}']:
            with self.assertRaises(AssertionError): guard.strict_json(b)
    def test_02_nonfinite_literals_and_overflow(self):
        for b in [b'{"x":NaN}',b'{"x":Infinity}',b'{"x":-Infinity}',b'{"x":1e9999}',b'{"x":-1e9999}']:
            with self.assertRaises(AssertionError): guard.strict_json(b)
    def test_03_physical_path_duplicates(self):
        row={'path':'a.json','bytes':1,'sha256':'a'*64}
        with self.assertRaises(AssertionError): intake.indexed([row,row])
    def test_04_paths_and_invalid_pins(self):
        for name in ['/tmp/a','../a','a/../b','a\\b','a//b','./a','']:
            with self.assertRaises(AssertionError): intake.relative(name)
        for size in [-1,True,'1']:
            with self.assertRaises(AssertionError): intake.indexed([{'path':'a','bytes':size,'sha256':'a'*64}])
        with self.assertRaises(AssertionError): intake.indexed([{'path':'a','bytes':1,'sha256':'A'*64}])
    def test_05_repeated_same_read_preserves_first_epoch(self):
        obs, failures={},[]
        a,b=guard.exact_read(self.file,obs,failures,True);first=obs[self.file]
        c,d=guard.exact_read(self.file,obs,failures,True)
        self.assertEqual((a,b),(c,d));self.assertEqual(obs[self.file],first);self.assertEqual(failures,[])
    def test_06_cross_read_semantic_whitespace_change_refused(self):
        obs, failures={},[];guard.exact_read(self.file,obs,failures,True);first=obs[self.file]
        self.file.write_bytes(b'{ "value": 1 }\n')
        with self.assertRaisesRegex(AssertionError,'between reads'):guard.exact_read(self.file,obs,failures,True)
        self.assertEqual(obs[self.file],first);self.assertEqual(failures,[])
    def test_07_same_byte_inode_replacement_refused(self):
        obs, failures={},[];guard.exact_read(self.file,obs,failures);first=obs[self.file]
        other=self.base/'replace.json';other.write_bytes(self.file.read_bytes());os.replace(other,self.file)
        with self.assertRaisesRegex(AssertionError,'between reads'):guard.exact_read(self.file,obs,failures)
        self.assertEqual(obs[self.file],first)
    def test_08_short_pread_actual_progress(self):
        original=os.pread;offsets=[]
        def short(fd,n,off):offsets.append(off);return original(fd,min(n,2),off)
        with patch.object(guard.os,'pread',short):actual,body=guard.exact_read(self.file,{},[],True)
        self.assertEqual(body,self.file.read_bytes());self.assertEqual(actual,guard.pin(body))
        self.assertEqual(offsets,list(range(0,len(body),2)))
    def test_09_unexpected_eof_never_retries(self):
        calls=[];failures=[]
        def empty(fd,n,off):calls.append(off);return b''
        with patch.object(guard.os,'pread',empty),self.assertRaisesRegex(AssertionError,'Unexpected EOF'):guard.exact_read(self.file,{},failures)
        self.assertEqual(calls,[0]);self.assertEqual(failures,[])
    def test_10_io_error_never_retries(self):
        calls=[];failures=[]
        def bad(fd,n,off):calls.append(off);raise OSError('synthetic I/O')
        with patch.object(guard.os,'pread',bad),self.assertRaises(OSError):guard.exact_read(self.file,{},failures)
        self.assertEqual(calls,[0]);self.assertEqual(failures,[])
    def test_11_hash_mismatch_no_read_retry(self):
        original=os.pread;calls=[]
        def wrapped(fd,n,off):calls.append(off);return original(fd,n,off)
        with patch.object(guard.os,'pread',wrapped):
            actual,_=guard.exact_read(self.file,{},[])
            with self.assertRaises(AssertionError):assert actual=={'bytes':len(self.file.read_bytes()),'sha256':'0'*64}
        self.assertEqual(calls,[0])
    def drift_reader(self,permanent):
        original=os.fstat;calls=[]
        def mocked(fd):
            s=original(fd);calls.append(1);drift=len(calls)%2==0 and (permanent or len(calls)==2)
            return SimpleNamespace(st_dev=s.st_dev,st_ino=s.st_ino,st_size=s.st_size,st_mode=s.st_mode,st_mtime_ns=s.st_mtime_ns+int(drift))
        return mocked,calls
    def test_12_only_unobserved_epoch_mismatch_may_retry(self):
        mocked,calls=self.drift_reader(False);obs,failures={},[]
        with patch.object(guard.os,'fstat',mocked):actual,_=guard.exact_read(self.file,obs,failures)
        self.assertEqual(actual,guard.pin(self.file.read_bytes()));self.assertEqual(len(calls),4);self.assertEqual(len(failures),1)
    def test_13_permanent_epoch_refusal_at_most_three(self):
        mocked,calls=self.drift_reader(True);obs,failures={},[]
        with patch.object(guard.os,'fstat',mocked),self.assertRaises(guard.EpochMismatch):guard.exact_read(self.file,obs,failures)
        self.assertEqual(len(calls),6);self.assertEqual(len(failures),3);self.assertEqual(obs,{})
    def test_14_observed_mid_read_epoch_never_refreshes(self):
        obs,failures={},[];guard.exact_read(self.file,obs,failures);first=obs[self.file]
        mocked,calls=self.drift_reader(True)
        with patch.object(guard.os,'fstat',mocked),self.assertRaisesRegex(AssertionError,'cannot refresh'):guard.exact_read(self.file,obs,failures)
        self.assertEqual(obs[self.file],first);self.assertEqual(len(calls),2);self.assertEqual(len(failures),1)
    def test_15_output_refuses_outside_private_tmp_and_overwrite(self):
        with self.assertRaises(AssertionError):intake.create_output('/usr/i62-forbidden-output')
        dest=intake.create_output(str(self.base/'new-output'));intake.write_owned(dest,'capture.json',b'{}')
        with self.assertRaises(FileExistsError):intake.write_owned(dest,'capture.json',b'{"changed":1}')
        self.assertEqual((dest/'capture.json').read_bytes(),b'{}')
    def test_16_prepared_config_does_not_bind_final_epoch_or_invent_members(self):
        raw=(HERE/'I62_PENDING_ACCEPTED_I61_RECIPE_CONFIG.json').read_bytes();self.assertEqual(guard.pin(raw),intake.CONFIG_PIN)
        config=guard.strict_json(raw)
        self.assertTrue(config['noPreparationPinIsAnAcceptedI61FinalBaseline']);self.assertFalse(config['intakeExecuted']);self.assertFalse(config['applyImplemented'])
        self.assertEqual(config['acceptedMemberCount'],'must be obtained from actual acceptedI61 checkpoint; no estimate')
        builds=set().union(*(s['paths'] for s in config['privateScopes']));sources=set(config['additionalSourceOnlyRuntimePathsExpected'])
        self.assertEqual(len(builds),172);self.assertEqual(len(sources),26);self.assertFalse(builds&sources)
        self.assertEqual(builds|sources,set(config['runtimePathsExpected']));self.assertEqual(len(config['runtimePathsExpected']),198)
        self.assertNotIn('package.json',config['rootMutableExtras']);self.assertEqual(config['canonicalAdditions'][-1],intake.TIMELINE)

if __name__=='__main__':unittest.main(verbosity=2)
