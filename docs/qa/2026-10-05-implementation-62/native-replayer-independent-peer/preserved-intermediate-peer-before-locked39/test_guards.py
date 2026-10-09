import copy,json,pathlib,unittest
from replay import *
F=strict_load(HERE/'I62_LITERAL_SOURCE_REFERENCE_FIXTURE.json')
def clock(start='2026-10-05T09:00:00.000Z',end='2026-10-05T09:00:00.001Z'):return {'startedAt':start,'finishedAt':end}
def raw_registry(source_id=GAR,url=None):
    s=one_source(F['registry'],source_id);rs=s['recordSets'][0];url=url or '/sources?source='+source_id+'&recordSet='+rs['recordSetId']
    base={'name':'synthetic-prepared-only','toolCaptureWindowUTC':clock(),'url':url,'sidebar':True,'breadcrumb':True,'hydration':[{'ariaBusy':'false','inert':False}],'statuses':[],'dossier':{'present':True,'sourceId':source_id,'title':s['title'],'scopeFields':[{'label':k,'text':v} for k,v in scope_fields(s).items()],'units':[{'unit':readable(u['unit']),'count':'Not retained' if u['count'] is None else f"{u['count']:,}",'scope':u['scope']} for u in s['experimentalUnits']],'recordSets':[{'id':r['recordSetId'],'text':r['childRosterRef']['missingReason'],'fields':[{'label':k,'text':v} for k,v in expected_record_fields(r).items()],'informationLinks':[{'text':'Open published aggregate physiology tables','href':HREF}] if source_id==GAR else [],'exactChildNavigationCount':0} for r in s['recordSets']],'assets':[{'id':a['id'],'text':(a['integrity']['sha256'][:12]+'…'+a['integrity']['sha256'][-8:]) if a['integrity']['sha256'] else a['integrity']['status']} for a in s['assets']],'exportButtons':[{'text':'Export source dossier','disabled':False,'tag':'BUTTON'}]}}
    side={'name':base['name'],'toolCaptureWindowUTC':clock('2026-10-05T09:00:00.002Z','2026-10-05T09:00:00.003Z'),'rows':[{'recordSetId':r['recordSetId'],'entriesLists':[],'details':[]} for r in s['recordSets']],'unsupportedEarlierPreparedTestIdCountIsNotEvidence':True}
    return base,side
def export(source_id=GAR):
    value=copy.deepcopy(F['expectedDossiers'][source_id]);value['exportedAt']='2026-10-05T09:00:00.000Z';return value
def raw_destination(open=True,key='ST1'):
    t=F['garciaTables'][key]
    r={'name':'synthetic-destination-only','toolCaptureWindowUTC':clock(),'url':HREF if key=='ST1' else HREF.replace('#','&physiologyTable='+key+'#'),'sidebar':True,'breadcrumb':True,'details':[{'id':'garcia-ramirez-physiology-panel','open':open,'summary':'Adult Shox2 and Chx10 electrophysiology','text':'Reporter, firing, k-means and hierarchical groups partition the same 171-observation study pool. Group counts retain that denominator; individual animal assignments are unavailable.' if open else ''}],'controls':[],'tables':[]}
    if open:
        r['controls']=[{'tag':'SELECT','value':key,'options':[{'value':s} for s in ['ST1','ST2','ST3','ST4']]},{'tag':'INPUT','value':''},{'tag':'BUTTON','text':'Export study facts','disabled':False}]
        r['tables']=[{'caption':t['captionRaw'],'thead':['Source property']+[g['labelRaw']+'n = '+str(g['recordedObservationCount']) for g in t['groups']]+['Source test','Reported p'],'rows':[{'cells':[v['raw'] for v in row['values']]+[row['reportedComparison']['statisticRaw'],row['reportedComparison']['pValueRaw']],'locators':[f"Data Sheet 1 · table {v['locator']['tableOrdinal']}, row {v['locator']['rowOneBased']}, column {v['locator']['columnOneBased']}" for v in row['values']]} for row in t['propertyRows']]}]
    return r
def raw_table_companion(raw,key='ST1',source_rows=None):
    t=F['garciaTables'][key];rows=t['propertyRows'] if source_rows is None else source_rows
    sections=[]
    if raw['tables']:
        expected=[]
        for row in rows:
            cells=[{'tag':'TH','text':row['propertyLabelRaw'],'locator':None}]
            for v in row['values']:
                l=v['locator'];cells.append({'tag':'TD','text':v['raw'],'locator':f"Data Sheet 1 · table {l['tableOrdinal']}, row {l['rowOneBased']}, column {l['columnOneBased']}"})
            cells += [{'tag':'TD','text':row['reportedComparison']['statisticRaw'],'locator':None},{'tag':'TD','text':row['reportedComparison']['pValueRaw'],'locator':None}];expected.append({'cells':cells})
        sections=[{'sourceStudy':'garcia-ramirez-2022','text':'fake scoped producer DOM only','controls':[],'tables':[{'caption':t['captionRaw'],'thead':raw['tables'][0]['thead'],'rows':expected}]}]
    return {'name':raw['name'],'toolCaptureWindowUTC':clock('2026-10-05T09:00:00.002Z','2026-10-05T09:00:00.003Z'),'sections':sections}

class Guards(unittest.TestCase):
 def test_01_actual_ready_required_before_future_capture_read(self):
    with self.assertRaisesRegex(ValueError,'ACTUAL_READY'):run_actual(HERE/'I62_ACTUAL_REPLAY_MANIFEST_DRAFT_NOT_READY.json')
 def test_02_duplicate_top_or_nested_key_refused(self):
    for s in ['{"source":1,"source":2}','{"source":{"count":171,"count":684}}']:
        with self.assertRaisesRegex(ValueError,'duplicate JSON key'):strict_loads(s)
 def test_03_nan_infinities_overflow_refused(self):
    for x in ['NaN','Infinity','-Infinity','1e9999','-1e9999']:
        with self.assertRaises(ValueError):strict_loads('{"value":'+x+'}')
 def test_04_false_zero_not_equal(self):
    with self.assertRaisesRegex(ValueError,'type mismatch'):exact(False,0)
 def test_05_two_dossiers_literal_positive(self):
    for s in [GAR,CRO]:check_dossier(export(s),F,s)
 def test_06_only_export_time_varies(self):
    value=export();value['exportedAt']='2026-10-05T09:00:01.000Z';check_dossier(value,F,GAR)
    value['newProof']=True
    with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_07_export_time_utc_required(self):
    for stamp in ['2026-10-05T09:00:00',0,None,'not-timeZ']:
        value=export();value['exportedAt']=stamp
        with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_08_foreign_dossier_owner_refused(self):
    with self.assertRaises(ValueError):check_dossier(export(CRO),F,GAR)
 def test_09_recorded_pool_not_four_cohorts(self):
    value=export();value['source']['experimentalUnits'][0]['count']=684
    with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_10_unknown_animal_identity_not_zero_or_filled(self):
    for v in [0,171,False]:
        value=export();value['source']['experimentalUnits'][0]['independentAnimalCount']=v
        with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_11_subset_is_not_extra_current_animals(self):
    value=export();value['source']['experimentalUnits'][1]['count']=79
    with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_12_navigation_cannot_mint_byte_or_render_proof(self):
    for field in ['sourceBytesVerifiedByThisReceipt','renderedViewCaptured']:
        value=export();value['recordSetNavigation'][0][field]=True
        with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_13_child_rows_unavailable_without_new_info_receipt(self):
    value=export();value['recordSetNavigation'][0]['entries']=[{'id':'ST1'}]
    with self.assertRaises(ValueError):check_dossier(value,F,GAR)
    value=export();value['informationNavigationReceipt']={'sourceBytesVerified':False}
    with self.assertRaises(ValueError):check_dossier(value,F,GAR)
 def test_14_crozat_assets_counts_current_only(self):
    value=export(CRO);value['source']['assets'].pop()
    with self.assertRaises(ValueError):check_dossier(value,F,CRO)
    value=export(CRO);value['source']['experimentalUnits'][2]['count']=659
    with self.assertRaises(ValueError):check_dossier(value,F,CRO)
 def test_15_two_registry_current_dom_positive(self):
    for s in [GAR,CRO]:r,c=raw_registry(s);check_registry_dom(r,F,c)
 def test_16_child_selector_base_unsupported_not_used(self):
    r,c=raw_registry();r['dossier']['recordSets'][0]['exactChildNavigationCount']=12345
    check_registry_dom(r,F,c)
 def test_17_real_child_anchor_or_details_fail(self):
    for field,value in [('entriesLists',[{'label':'Navigation entries for '+GSET,'links':[{'href':'/objects','text':'physical cell'}]}]),('details',[{'open':True,'summary':'Open this exact record set'}])]:
        r,c=raw_registry();c['rows'][0][field]=value
        with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_18_companion_owner_clock_required(self):
    r,c=raw_registry();c['name']='other'
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
    r,c=raw_registry();c['toolCaptureWindowUTC']=clock('2026-10-05T08:59:59.000Z','2026-10-05T08:59:59.001Z')
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_19_hydration_must_commit(self):
    r,c=raw_registry();r['hydration'][0]['ariaBusy']='true'
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_20_current_dossier_owner_not_previous_source(self):
    r,c=raw_registry();r['dossier']['sourceId']=CRO
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_21_information_link_exact_source_tuple_relative(self):
    for href in [HREF.replace(GAR,CRO),HREF.replace(GSET,CSET),'https://evil.example'+HREF,HREF.split('?')[0]]:
        r,c=raw_registry();r['dossier']['recordSets'][0]['informationLinks'][0]['href']=href
        with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_22_foreign_unknown_conflicting_set_no_action(self):
    for query in ['recordSet='+CSET,'recordSet=UNKNOWN','recordSet='+GSET+'&recordSet='+CSET]:
        r,c=raw_registry(url='/sources?source='+GAR+'&'+query);r['dossier']['recordSets'][0]['informationLinks']=[];r['statuses']=['The requested record set is unknown, ambiguous or not owned by this source. No replacement record set was opened.'];check_registry_dom(r,F,c)
        r['dossier']['recordSets'][0]['informationLinks']=[{'text':'Open published aggregate physiology tables','href':HREF}]
        with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_23_unknown_conflicting_source_no_prior_dossier(self):
    for query in ['source=UNKNOWN','source='+GAR+'&source='+CRO]:
        r,c=raw_registry(url='/sources?'+query);r['dossier']={'present':True,'sourceId':None,'recordSets':[],'exportButtons':[]};r['statuses']=['The requested source is unknown or ambiguous. No replacement source was selected.'];c['rows']=[];check_registry_dom(r,F,c)
        r['dossier']['sourceId']=GAR
        with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_24_dossier_denominator_asset_scope_exact(self):
    r,c=raw_registry();r['dossier']['units'][0]['count']='684'
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
    r,c=raw_registry();r['dossier']['assets'][0]['text']='wrong hash'
    with self.assertRaises(ValueError):check_registry_dom(r,F,c)
 def test_25_destination_all_four_source_tables_positive(self):
    for t in ['ST1','ST2','ST3','ST4']:check_destination_dom(raw_destination(key=t),F)
 def test_26_destination_qualifiers_headers_values_locators_exact(self):
    for edit in ['url','header','value','locator']:
        r=raw_destination()
        if edit=='url':r['url']=HREF.replace(GAR,CRO)
        if edit=='header':r['tables'][0]['thead'][1]='171 animals'
        if edit=='value':r['tables'][0]['rows'][0]['cells'][0]='-48.2 ± 0'
        if edit=='locator':r['tables'][0]['rows'][0]['locators'][0]='Data Sheet 1 · table 1, row 3, column 2'
        with self.assertRaises(ValueError):check_destination_dom(r,F)
 def test_27_destination_closed_withholds_captured_tables_exports(self):
    r=raw_destination(open=False);check_destination_dom(r,F,False)
    r['controls']=[{'tag':'BUTTON','text':'Export study facts','disabled':False}]
    with self.assertRaises(ValueError):check_destination_dom(r,F,False)
 def test_28_source_context_subset_unknown_scope_fixture(self):
    check_inputs(F);self.assertEqual(F['sourceScope']['Crozat']['selectedWorkbooks'],25);self.assertEqual(F['sourceScope']['Crozat']['retainedWorkbooks'],26);self.assertEqual(F['sourceScope']['Crozat']['unselectedWorkbookId'],56062547)
 def test_29_native_copy_path_cannot_read_downloads_or_symlink(self):
    with self.assertRaises(ValueError):approve_copy_path('/Users/zhouzhenghang/Downloads/src-garcia-ramirez-2022-source-dossier.json')
    folder=HERE/'synthetic-copy-guard';folder.mkdir(exist_ok=True);file=folder/'copy.json';file.write_text('{}');link=folder/'copy-link.json'
    if not link.is_symlink():link.symlink_to(file)
    with self.assertRaises(ValueError):approve_copy_path(link)
    self.assertEqual(approve_copy_path(file),file)
 def test_30_history_relation_original_action_owns_state(self):
    before,_=raw_registry();after=copy.deepcopy(before);after['toolCaptureWindowUTC']=clock('2026-10-05T09:00:03.000Z','2026-10-05T09:00:03.001Z');action={'name':'native-back-synthetic-only','startedAt':'2026-10-05T09:00:01.000Z','finishedAt':'2026-10-05T09:00:02.000Z','error':None};check_state_relation(before,after,action,'registry_restoration')
    for edit in ['clock','url','owner']:
        changed=copy.deepcopy(after)
        if edit=='clock':changed['toolCaptureWindowUTC']=clock()
        if edit=='url':changed['url']='/sources?source='+CRO
        if edit=='owner':changed['dossier']['sourceId']=CRO
        with self.assertRaises(ValueError):check_state_relation(before,changed,action,'registry_restoration')
 def test_31_full_table_companion_literal_row_headers_and_tags(self):
    for key in ['ST1','ST2','ST3','ST4']:
        r=raw_destination(key=key);c=raw_table_companion(r,key);out=check_destination_dom(r,F,True,c);self.assertTrue(out['DOMRowHeaderLabelsCaptured']);self.assertEqual(out['actualTableDOM']['rowHeadersExact'],12)
    r=raw_destination(open=False);check_destination_dom(r,F,False,raw_table_companion(r))
 def test_32_table_companion_source_owner_row_header_clock_and_locator_guard(self):
    for edit in ['study','name','clock','header','tag','locator']:
        r=raw_destination();c=raw_table_companion(r)
        if edit=='study':c['sections'][0]['sourceStudy']='crozat-2025'
        if edit=='name':c['name']='other-source'
        if edit=='clock':c['toolCaptureWindowUTC']=clock('2026-10-05T08:59:59.000Z','2026-10-05T08:59:59.001Z')
        if edit=='header':c['sections'][0]['tables'][0]['rows'][0]['cells'][0]['text']='Membrane potential [V]'
        if edit=='tag':c['sections'][0]['tables'][0]['rows'][0]['cells'][0]['tag']='TD'
        if edit=='locator':c['sections'][0]['tables'][0]['rows'][0]['cells'][1]['locator']='Data Sheet 1 · table 1, row 3, column 2'
        with self.assertRaises(ValueError):check_destination_dom(r,F,True,c)
 def test_33_independent_search_uses_every_literal_token(self):
    r=raw_destination();r['controls'][1]['value']='resistance input';r['url']=HREF.replace('#','&physiologyQuery=resistance+input#');source_rows=[x for x in F['garciaTables']['ST1']['propertyRows'] if x['propertyId']=='input_resistance'];r['tables'][0]['rows']=[r['tables'][0]['rows'][1]];check_destination_dom(r,F,True,raw_table_companion(r,source_rows=source_rows))
 def test_34_published_url_unknown_duplicate_or_query_mismatch_never_authorizes_table(self):
    for query in ['physiologyTable=ST9','physiologyTable=ST1&physiologyTable=ST1','physiologyTable=ST2','physiologyQuery=unknown']:
        r=raw_destination();r['url']=HREF.replace('#','&'+query+'#')
        with self.assertRaises(ValueError):check_destination_dom(r,F,True,raw_table_companion(r))

if __name__=='__main__':unittest.main(verbosity=2)
