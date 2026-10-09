import copy
import unittest
from check_exact_two_native_landings import EXPECTED, baseline_guard, dossier_guard, utc_ns
from source_epoch_guard import strict_json

BASE={'status':'I62_EXACT_TWO_EXPORT_PATHS_PRE_NATIVE_BASELINE','directoryEnumeration':False,'filenameVariantsRead':False,'exactPaths':[{'path':'/Users/zhouzhenghang/Downloads/'+n,'exists':False} for n in EXPECTED]}
DOC={'registryReleaseId':'x','researchUpgradeRegistryId':'y','exportedAt':'2026-10-05T10:00:00.123Z','source':{'id':'SRC-GARCIA-RAMIREZ-2022','recordSets':[{'recordSetId':'RS'}]},'recordSetNavigation':[{'sourceId':'SRC-GARCIA-RAMIREZ-2022','recordSetId':'RS','authority':'declared_metadata_navigation_only','renderedViewCaptured':False,'sourceBytesVerifiedByThisReceipt':False,'newAdmissionCount':0,'crossSourceIdentityJoinCount':0,'registrationCount':0,'status':'unavailable','entries':[]}],'linkedResearchUpgrades':[],'scientificPolicy':{}}
START=utc_ns('2026-10-05T10:00:00Z');END=utc_ns('2026-10-05T10:00:01Z')
class Guards(unittest.TestCase):
    def test_1_exact_absent_baseline(self):
        baseline_guard(BASE)
        for change in ['filename','presence','enumeration']:
            b=copy.deepcopy(BASE)
            if change=='filename':b['exactPaths'][0]['path']+='(1)'
            elif change=='presence':b['exactPaths'][0]['exists']=True
            else:b['directoryEnumeration']=True
            with self.assertRaises(AssertionError):baseline_guard(b)
    def test_2_current_schema_source(self):
        dossier_guard(DOC,'SRC-GARCIA-RAMIREZ-2022',START,END)
        with self.assertRaises(AssertionError):dossier_guard(DOC,'SRC-CROZAT-2025',START,END)
    def test_3_new_information_receipt_schema_refused(self):
        d=copy.deepcopy(DOC);d['sourceInformationNavigation']={}
        with self.assertRaises(AssertionError):dossier_guard(d,'SRC-GARCIA-RAMIREZ-2022',START,END)
    def test_4_existing_source_information_metadata_retained(self):
        d=copy.deepcopy(DOC);d['source']['recordSets'][0]['sourceInformationRef']={'status':'bundled_aggregate_information'}
        dossier_guard(d,'SRC-GARCIA-RAMIREZ-2022',START,END)
    def test_5_export_timestamp_outside_native_window_refused(self):
        for value in ['2026-10-05T09:59:59.999Z','2026-10-05T10:00:01.001Z']:
            d=copy.deepcopy(DOC);d['exportedAt']=value
            with self.assertRaises(AssertionError):dossier_guard(d,'SRC-GARCIA-RAMIREZ-2022',START,END)
    def test_6_false_metadata_authority_not_promoted(self):
        for field,value in [('renderedViewCaptured',True),('sourceBytesVerifiedByThisReceipt',True),('newAdmissionCount',1),('entries',[{'id':'invented'}])]:
            d=copy.deepcopy(DOC);d['recordSetNavigation'][0][field]=value
            with self.assertRaises(AssertionError):dossier_guard(d,'SRC-GARCIA-RAMIREZ-2022',START,END)
    def test_7_foreign_record_set_refused(self):
        d=copy.deepcopy(DOC);d['recordSetNavigation'][0]['recordSetId']='other'
        with self.assertRaises(AssertionError):dossier_guard(d,'SRC-GARCIA-RAMIREZ-2022',START,END)
    def test_8_strict_loader_and_integral_utc_clock(self):
        for body in [b'{"x":1,"x":2}',b'{"x":NaN}',b'{"x":1e9999}']:
            with self.assertRaises(AssertionError):strict_json(body)
        self.assertEqual(utc_ns('2026-10-05T10:00:00.123Z')-utc_ns('2026-10-05T10:00:00Z'),123000000)
if __name__=='__main__':unittest.main(verbosity=2)
