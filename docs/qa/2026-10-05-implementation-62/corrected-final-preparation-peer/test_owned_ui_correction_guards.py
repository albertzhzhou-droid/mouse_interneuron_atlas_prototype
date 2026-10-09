from pathlib import Path
import unittest
from owned_ui_correction_guard import *
BEFORE_BODY=Path('/private/tmp/ohri-i62-source-information-navigation-candidate/proposed/app/ResearchSourceRegistry.tsx').read_bytes()
def edit(style=b' style={{ minHeight: 44, fontSize: 12 }}'):
 return BEFORE_BODY.replace(NEEDLE,NEEDLE[:-1]+style+b'>',1)
class GuardTests(unittest.TestCase):
 def test_one_exact_parent_style_delta(self):
  assert_ui_delta(BEFORE_BODY,edit())
 def test_allowed_whitespace_only(self):
  assert_ui_delta(BEFORE_BODY,edit(b' style={{ minHeight:44,fontSize:12 }}'))
 def test_original_pin_required(self):
  with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY+b'\n',edit())
 def test_unchanged_UI_is_not_the_correction(self):
  with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY,BEFORE_BODY)
 def test_wrong_height_and_font_and_extra_style(self):
  for s in [b' style={{ minHeight: 43, fontSize: 12 }}',b' style={{ minHeight: 44, fontSize: 11 }}',b' style={{ minHeight: 44, fontSize: 12, color:"red" }}']:
   with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY,edit(s))
 def test_foreign_href_or_prefetch_change(self):
  for a in [edit().replace(b'information.link.href',b'"/foreign"'),edit().replace(b'prefetch={false}',b'prefetch={true}')]:
   with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY,a)
 def test_other_UI_bytes_changed(self):
  with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY,edit()+b'\n')
 def test_duplicated_link_refused(self):
  with self.assertRaises(AssertionError):assert_ui_delta(BEFORE_BODY,edit()+NEEDLE)
if __name__=='__main__':unittest.main(verbosity=2)
