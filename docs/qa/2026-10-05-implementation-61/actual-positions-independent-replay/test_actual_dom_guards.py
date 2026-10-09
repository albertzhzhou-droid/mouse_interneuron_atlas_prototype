#!/usr/bin/env python3
"""Offline mutated-descriptor guards; these cases are not new native observations."""
import copy, importlib.util, json, pathlib, unittest
P=pathlib.Path(__file__).with_name('replay_i61_actual_positions_dom.py')
s=importlib.util.spec_from_file_location('i61_dom',P); m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Guards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ds=[m.load(m.QA/(n+'.json')) for n in m.NAMES]
        rb=[m.body(m.QA/'captures'/(n+'.json')) for n in [m.NAMES[1],m.NAMES[3]]]
        ps=[m.strict(v) for v in rb]; allactions=m.load(m.QA/'original-native-actions.json')
        acts=[m.one(allactions,lambda a:a['name']==n) for n in m.ACTIONS]
        math=m.load(m.HERE/'I61_ACTUAL_SOURCE_CAMERA_MATH_REPLAY.json')
        cls.base=[ds,ps,rb,acts,m.body(m.OLD),math['build'],math]
    def case(self): return copy.deepcopy(self.base)
    def rejects(self,f):
        a=self.case();f(a)
        with self.assertRaises((AssertionError,KeyError,TypeError,ValueError)):m.validate(*a)
    def proof_mutation(self,a,index,f):
        f(a[1][index]); value=json.dumps(a[1][index],ensure_ascii=False,indent=2).encode();a[2][index]=value
        domidx=[1,3][index]; m.one(a[0][domidx]['textareas'],lambda t:t['label']==m.CAPTURE_LABEL)['value']=value.decode()
    def test_baseline(self): self.assertEqual(m.validate(*self.case())['fresh']['normalizedRows'],17394)
    def test_missing_original_clock(self):self.rejects(lambda a:a[0][1].pop('toolCaptureWindowUTC'))
    def test_reversed_original_clock(self):self.rejects(lambda a:a[0][1]['toolCaptureWindowUTC'].update(startedAt='2026-10-05T09:20:00Z'))
    def test_late_old_restore_action(self):self.rejects(lambda a:a[3][1].update(endUTC='2026-10-05T09:19:30Z'))
    def test_ambiguous_scoped_capture_button(self):self.rejects(lambda a:a[0][0]['controls'].append(copy.deepcopy(m.button(a[0][0],'Capture actual view'))))
    def test_old_proof_canvas(self):self.rejects(lambda a:a[0][0].update(canvasCount=1))
    def test_old_export_enabled(self):self.rejects(lambda a:m.button(a[0][0],'Export actual view receipt').update(disabled=False))
    def test_rebuilt_producer_string(self):self.rejects(lambda a:m.one(a[0][1]['textareas'],lambda t:t['label']==m.CAPTURE_LABEL).update(value=json.dumps(a[1][0])))
    def test_newline_added_to_saved_producer(self):self.rejects(lambda a:a[2].__setitem__(0,a[2][0]+b'\n'))
    def test_transverse_keeps_old_capture(self):self.rejects(lambda a:m.one(a[0][2]['textareas'],lambda t:t['label']==m.CAPTURE_LABEL).update(value=a[2][0].decode()))
    def test_transverse_export_enabled(self):self.rejects(lambda a:m.button(a[0][2],'Export actual view receipt').update(disabled=False))
    def test_restore_stale_verification_sequence(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['sourceVerification'].update(verificationSequence=2)))
    def test_restore_default_cache(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['sourceVerification'].update(requestCacheMode='default')))
    def test_restore_old_scene(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['view']['runtimeBinding'].update(sceneInstanceId=a[1][0]['view']['runtimeBinding']['sceneInstanceId'])))
    def test_restore_wrong_current_build(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['rendererBuild']['inputs'].__setitem__(37,{'path':'package.json','bytes':40345,'sha256':'0'*64})))
    def test_nonnull_row_not_observed(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['view'].update(selectedRow={'id':'foreign:row:1'})))
    def test_wrong_restored_layers(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['view']['layers'].update(axes=False)))
    def test_wrong_restored_camera(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p['view']['camera']['position'].__setitem__(0,p['view']['camera']['position'][0]+.01)))
    def test_capture_before_verified_source(self):self.rejects(lambda a:self.proof_mutation(a,1,lambda p:p.update(generatedAt='2026-10-05T09:19:34Z')))
    def test_layout_sidebar_absent(self):self.rejects(lambda a:a[0][3].update(sidebar=False))
    def test_horizontal_document_overflow(self):self.rejects(lambda a:a[0][3].update(scrollWidth=1600))
    def test_math_cropping_not_hidden(self):self.rejects(lambda a:a[6]['results'][0]['cropped'].update(points=1))
    def test_strict_duplicate_key(self):
        with self.assertRaises(AssertionError):m.strict(b'{"x":1,"x":2}')
    def test_strict_nan(self):
        with self.assertRaises(AssertionError):m.strict(b'{"x":NaN}')
    def test_strict_float_overflow(self):
        with self.assertRaises(AssertionError):m.strict(b'{"x":1e999}')
if __name__=='__main__':unittest.main()
