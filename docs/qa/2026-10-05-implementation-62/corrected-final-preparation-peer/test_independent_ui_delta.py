from pathlib import Path
import unittest
from owned_ui_correction_guard import assert_ui_delta, NEEDLE
HERE=Path(__file__).resolve().parent
B=(HERE/'exact-ui-before.tsx').read_bytes()
A=(HERE/'exact-ui-after.tsx').read_bytes()
STYLE=b' style={{ minHeight: 44, fontSize: 12 }}'
class UiDeltaTests(unittest.TestCase):
    def rejected(self,old,new):
        with self.assertRaises(AssertionError): assert_ui_delta(old,new)
    def test_01_real_pinned_delta(self):self.assertEqual(assert_ui_delta(B,A)['exactAddedStyleLiteral'],STYLE.decode())
    def test_02_no_correction(self):self.rejected(B,B)
    def test_03_wrong_height(self):self.rejected(B,A.replace(b'minHeight: 44',b'minHeight: 43'))
    def test_04_wrong_font(self):self.rejected(B,A.replace(b'fontSize: 12',b'fontSize: 13'))
    def test_05_extra_style(self):self.rejected(B,A.replace(b'fontSize: 12',b'fontSize: 12, color: "red"'))
    def test_06_foreign_href(self):self.rejected(B,A.replace(b'information.link.href',b'"/foreign"'))
    def test_07_changed_prefetch(self):self.rejected(B,A.replace(b'prefetch={false}',b'prefetch={true}'))
    def test_08_changed_label(self):self.rejected(B,A.replace(b'information.link.label',b'"wrong label"'))
    def test_09_other_code_byte(self):self.rejected(B,A+b'\n')
    def test_10_duplicate_link(self):self.rejected(B,A+NEEDLE)
    def test_11_wrong_before_pin(self):self.rejected(B+b'\n',A)
    def test_12_missing_link(self):self.rejected(B,A.replace(NEEDLE[:-1],b'<span'))
    def test_13_extra_attribute(self):self.rejected(B,A.replace(STYLE,STYLE+b' title="other"'))
    def test_14_guard_whitespace_but_pinned_final_still_exact(self):
        changed=A.replace(STYLE,b' style={{ minHeight:44,fontSize:12 }}')
        result=assert_ui_delta(B,changed)
        self.assertNotEqual(result['after'],assert_ui_delta(B,A)['after'])
if __name__=='__main__':unittest.main(verbosity=2)
