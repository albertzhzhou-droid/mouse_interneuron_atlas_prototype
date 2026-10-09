#!/usr/bin/env python3
"""Extracts only read functions. Full sync main is never executed."""
import ast, hashlib, os, pathlib, tempfile, unittest
from unittest.mock import patch
SOURCE=pathlib.Path('/private/tmp/ohri-i61-sync-final-stage.py')
ORIGINAL=SOURCE.read_bytes()
tree=ast.parse(ORIGINAL)
FUNCTIONS=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['strict_read_once','read']],type_ignores=[])
class Guards(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent);self.base=pathlib.Path(self.temp.name)
  self.root=self.base/'root';self.stage=self.base/'stage';self.root.mkdir();self.stage.mkdir()
  self.ns={'os':os,'r':self.root,'t':self.stage,'read_epoch_failures':[],'first_root_epochs':{},'first_stage_epochs':{}}
  exec(compile(FUNCTIONS,str(SOURCE),'exec'),self.ns)
  self.rootfile=self.root/'runtime.json';self.stagefile=self.stage/'runtime.json';self.rootfile.write_bytes(b'abc');self.stagefile.write_bytes(b'abc')
 def tearDown(self):self.temp.cleanup()
 def test_original_helper_stable(self):self.assertEqual(SOURCE.read_bytes(),ORIGINAL)
 def test_strict_returns_original_accepted_epoch(self):
  s=self.rootfile.stat();b,e=self.ns['strict_read_once'](self.rootfile);self.assertEqual(b,b'abc');self.assertEqual(e,(s.st_ino,s.st_size,s.st_mtime_ns))
 def test_four_k_positions(self):
  self.rootfile.write_bytes(b'a'*9001);calls=[];original=os.pread
  def read(fd,n,offset):calls.append((n,offset));return original(fd,n,offset)
  with patch.object(os,'pread',read):self.assertEqual(len(self.ns['strict_read_once'](self.rootfile)[0]),9001)
  self.assertEqual(calls,[(4096,0),(4096,4096),(809,8192)])
 def test_untracked_stage_compare_does_not_anchor(self):
  self.assertEqual(self.ns['read'](self.stagefile),b'abc');self.assertEqual(self.ns['first_stage_epochs'],{})
  self.stagefile.write_bytes(b'new first planned copy');self.ns['read'](self.stagefile,track_stage=True)
  self.assertIn(self.stagefile,self.ns['first_stage_epochs'])
 def test_first_root_epoch_is_retained(self):
  self.ns['read'](self.rootfile);first=self.ns['first_root_epochs'].copy();self.ns['read'](self.rootfile)
  self.assertEqual(self.ns['first_root_epochs'],first)
 def test_duplicate_root_runtime_epoch_change_fatal(self):
  self.ns['read'](self.rootfile);first=self.ns['first_root_epochs'].copy();self.rootfile.write_bytes(b'new runtime')
  with self.assertRaises(AssertionError):self.ns['read'](self.rootfile)
  self.assertEqual(self.ns['first_root_epochs'],first);self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_first_final_stage_epoch_is_retained(self):
  self.ns['read'](self.stagefile,track_stage=True);first=self.ns['first_stage_epochs'].copy();self.ns['read'](self.stagefile)
  self.assertEqual(self.ns['first_stage_epochs'],first)
 def test_duplicate_final_stage_epoch_change_fatal(self):
  self.ns['read'](self.stagefile,track_stage=True);first=self.ns['first_stage_epochs'].copy();self.stagefile.write_bytes(b'changed stage')
  with self.assertRaises(AssertionError):self.ns['read'](self.stagefile)
  self.assertEqual(self.ns['first_stage_epochs'],first);self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_unseen_only_specific_epoch_retry_up_to_three(self):
  original=self.ns['strict_read_once'];calls=[]
  def f(p):
   calls.append(1)
   if len(calls)<3:raise AssertionError('Source epoch changed: controlled tiny descriptor')
   return original(p)
  self.ns['strict_read_once']=f;self.assertEqual(self.ns['read'](self.rootfile),b'abc');self.assertEqual(len(calls),3);self.assertEqual(len(self.ns['read_epoch_failures']),2)
 def test_unseen_epoch_three_failures_not_four(self):
  calls=[]
  def f(p):calls.append(1);raise AssertionError('Source epoch changed: controlled tiny descriptor')
  self.ns['strict_read_once']=f
  with self.assertRaises(AssertionError):self.ns['read'](self.rootfile)
  self.assertEqual(len(calls),3);self.assertEqual(self.ns['first_root_epochs'],{})
 def test_seen_root_single_read_epoch_error_no_retry(self):
  self.ns['read'](self.rootfile);calls=[]
  def f(p):calls.append(1);raise AssertionError('Source epoch changed: controlled tiny descriptor')
  self.ns['strict_read_once']=f
  with self.assertRaises(AssertionError):self.ns['read'](self.rootfile)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_seen_stage_single_read_epoch_error_no_retry(self):
  self.ns['read'](self.stagefile,track_stage=True);calls=[]
  def f(p):calls.append(1);raise AssertionError('Source epoch changed: controlled tiny descriptor')
  self.ns['strict_read_once']=f
  with self.assertRaises(AssertionError):self.ns['read'](self.stagefile)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_accepted_root_path_poststat_change_no_retry(self):
  original=self.ns['strict_read_once'];calls=[]
  def f(p):
   calls.append(1);answer=original(p);p.write_bytes(b'change after accepted fd');return answer
  self.ns['strict_read_once']=f
  with self.assertRaisesRegex(AssertionError,'after accepted read'):self.ns['read'](self.rootfile)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['first_root_epochs'],{})
 def test_accepted_final_stage_path_poststat_change_no_retry(self):
  original=self.ns['strict_read_once'];calls=[]
  def f(p):
   calls.append(1);answer=original(p);p.write_bytes(b'change after accepted fd');return answer
  self.ns['strict_read_once']=f
  with self.assertRaisesRegex(AssertionError,'after accepted read'):self.ns['read'](self.stagefile,track_stage=True)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['first_stage_epochs'],{})
 def test_eof_no_retry(self):
  with patch.object(os,'pread',lambda *args:b''):
   with self.assertRaisesRegex(AssertionError,'Unexpected EOF'):self.ns['read'](self.rootfile)
  self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_io_no_retry(self):
  with patch.object(os,'pread',side_effect=OSError('controlled tiny IO')):
   with self.assertRaises(OSError):self.ns['read'](self.rootfile)
  self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_pin_error_no_retry(self):
  calls=[]
  def f(p):calls.append(1);raise AssertionError('Current manifest pin drift: controlled tiny pin')
  self.ns['strict_read_once']=f
  with self.assertRaises(AssertionError):self.ns['read'](self.rootfile)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['read_epoch_failures'],[])
 def test_similar_epoch_prefix_no_retry(self):
  calls=[]
  def f(p):calls.append(1);raise AssertionError('Source epoch changed after accepted read: controlled tiny pin')
  self.ns['strict_read_once']=f
  with self.assertRaises(AssertionError):self.ns['read'](self.rootfile)
  self.assertEqual(len(calls),1);self.assertEqual(self.ns['read_epoch_failures'],[])
if __name__=='__main__':unittest.main()
