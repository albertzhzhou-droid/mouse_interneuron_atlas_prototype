#!/usr/bin/env python3
"""Read captured actual DOM and current factual source JSON; never control UI or mint render proof."""
import argparse,collections,datetime,hashlib,json,os,re
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA=ROOT/'docs/qa/2026-10-05-implementation-58'
OUT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--through-step',type=int,default=10);args=parser.parse_args()
assert 10<=args.through_step<=99
stats={'strategy':'full_file_os_pread4096','files':0,'preadCalls':0,'bytesRead':0};cache={}
def read(p,fresh=False):
 p=Path(p)
 if p in cache and not fresh:return cache[p]
 fd=os.open(p,os.O_RDONLY);h=hashlib.sha256();parts=[];n=0
 try:
  before=os.fstat(fd)
  while True:
   b=os.pread(fd,4096,n);stats['preadCalls']+=1
   if not b:break
   parts.append(b);h.update(b);n+=len(b);stats['bytesRead']+=len(b)
  after=os.fstat(fd);assert (before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_ino,after.st_size,after.st_mtime_ns) and n==after.st_size
 finally:os.close(fd)
 stats['files']+=1;cache[p]=({'bytes':n,'sha256':h.hexdigest()},b''.join(parts));return cache[p]
helperPin,_=read(Path(__file__).resolve())
auditPath=ROOT/'data/trevisan-v1-exact-input-crosswalk-audit-0.1.json';auditPin,auditBody=read(auditPath);audit=json.loads(auditBody)
assert auditPin=={'bytes':122391,'sha256':'ec34da947a38f574bf6c80495a3f1ede02377a5adc3020d8e079c2a880fb07be'}
samples=audit['samples'];byKey={f"trevisan-v1:GSE275595:{s['geoSampleAccession']}:source-sample":s for s in samples};assert len(samples)==len(byKey)==29
owned=('sampleAudit','sampleAuditDate','sampleKey','sampleQuery','sampleCohort')
def visible(query,cohort):
 terms=query.strip().lower().split();result=[]
 for sample in samples:
  title=sample['sampleTitle']
  if cohort=='atlas' and re.fullmatch(r'P(?:0|14|28|56)[CLT]R[12]',title) is None:continue
  if cohort=='en1' and re.fullmatch(r'P0(?:Het|Ko)R[12]',title) is None:continue
  if cohort=='embryonic' and sample['age']['developmentalEpoch']!='embryonic':continue
  text=' '.join([sample['geoSampleAccession'],title]+[f['value'] for f in sample['characteristics'].values()]).lower()
  if all(term in text for term in terms):result.append(sample)
 return result
def decode(url):
 u=urlsplit(url);p=parse_qs(u.query,keep_blank_values=True);state={'query':'','cohort':'all','selectedKey':None,'error':None,'status':'default'}
 if not any(k in p for k in owned):return state
 def invalid(message):state.update(error=message,status='invalid',selectedKey=None);return state
 if any(len(p.get(k,[]))>1 for k in owned):return invalid('This sample link repeats a source or selection parameter.')
 get=lambda k,d=None:p.get(k,[d])[0]
 if get('sampleAudit')!=audit['auditId'] or get('sampleAuditDate')!=audit['auditDate']:return invalid('This sample link does not match the current V1 source audit and date.')
 query=get('sampleQuery','');cohort=get('sampleCohort','all')
 if len(query)>180 or cohort not in ('all','atlas','en1','embryonic'):return invalid('This sample link has an invalid search or sample set.')
 state.update(query=query,cohort=cohort,selectedKey=get('sampleKey'),status='ready')
 if state['selectedKey'] is not None and state['selectedKey'] not in byKey:return invalid('This sample link does not identify an exact current GEO sample.')
 if state['selectedKey'] is not None and byKey[state['selectedKey']] not in visible(query,cohort):return invalid('The linked sample is outside its saved search or sample set.')
 return state
def rowtext(s):return s['sampleTitle']+s['geoSampleAccession']
paths=[]
for p in sorted(QA.glob('actual-*.json')):
 match=re.match(r'actual-(\d+)-',p.name)
 if match and int(match.group(1))<=args.through_step:paths.append(p)
assert paths,'No actual snapshots captured'
records={};aux=[];rows=[];allKeys=set();invalidNames=[]
for p in paths:
 pin,body=read(p);x=json.loads(body);records[p.name]=x
 if not isinstance(x,dict) or not isinstance(x.get('url'),str) or 'sampleRows' not in x:
  aux.append({'path':str(p.relative_to(ROOT)),'actual':pin,'kind':'parent_native_observation_or_summary_not_DOM_membership','nativeDownloadPathVerifiedByThisReplay':False});continue
 if urlsplit(x['url']).path=='/explore/cell-types':
  links=x['sampleLinks'];assert len(links)==6 and len({r['href'] for r in links})==6
  linkChecks=[]
  for link in links:
   u=urlsplit(link['href']);state=decode(link['href']);assert u.path=='/source-audits' and u.fragment=='source-exact-inputs' and state['status']=='ready' and state['selectedKey'] in byKey
   assert state['query']=='' and state['cohort']=='all'
   linkChecks.append({'sourceKey':state['selectedKey'],'exactCurrentQualifiedAuditDate':True})
  text=x['trevisanText'];assert all(v in text for v in ['All 29 GEO sample characteristics','Four workbook sheets, 29 original barcode files and one representative matrix','Earlier source-availability audit','no cluster-label column is supplied; the per-nucleus mapping remains held','GEO file-specific reuse terms remain unverified','387-profile total','14 reported clusters','89,494'])
  assert 'All 13,241,486 sparse entries passed structural checks across 32,285 features and 8,000 native columns' in text
  assert len(x['clusterButtons'])==14
  rows.append({'path':str(p.relative_to(ROOT)),'actual':pin,'kind':'current_V1_article_reference_and_six_checked_sample_links','checks':{'sixQualifiedExactSourceLinks':True,'sourceSampleAndMatrixScopeBounded':True,'existing14ArticleClustersRemainSeparateFrom387Profiles':True},'links':linkChecks});continue
 assert urlsplit(x['url']).path=='/source-audits'
 workspace=next((w for w in x['workspaces'] if w['id']=='source-exact-inputs'),None);assert workspace is not None
 if workspace['open'] is False:
  assert x['sampleRows']==x['selected']==x['fields']==[] and x.get('input') is None and x.get('cohort') is None
  rows.append({'path':str(p.relative_to(ROOT)),'actual':pin,'kind':'committed_closed_workspace','checks':{'unmountedNoSourceRowsDetailFields':True,'URLBookmarkRetainedDoesNotBecomeMountedSelectionProof':True}});continue
 state=decode(x['url']);expectedVisible=visible(state['query'],state['cohort']);expectedSelected=byKey.get(state['selectedKey'])
 assert x.get('input')==state['query'] and x.get('cohort')==state['cohort'],('filters',p.name)
 assert [r['text'] for r in x['sampleRows']]==[rowtext(s) for s in expectedVisible],('source membership/order',p.name)
 assert all(r['disabled'] is False for r in x['sampleRows'])
 expectedTexts=[] if expectedSelected is None else [rowtext(expectedSelected)]
 assert x['selected']==expectedTexts and [r['text'] for r in x['sampleRows'] if r['selected']=='true']==expectedTexts,('selected identity',p.name)
 for sample in expectedVisible:
  prefix=f"{sample['sampleTitle']}{sample['geoSampleAccession']}{sample['age']['sourceText']} · {sample['characteristics']['region']['value']}{sample['workbookRowCount']:,}{sample['nativeBarcodeCount']:,}{sample['barcodeMatchedRowCount']:,} / {sample['barcodeMissingRowCount']:,}"
  assert prefix in x['workbenchText'],('actual visible table age/region/row and column counts',p.name,sample['geoSampleAccession'])
 assert x['scrollWidth']<=x['width'],('page horizontal overflow',p.name)
 expectedFields=[] if expectedSelected is None else [f"{k}{v['value']}Source field: {v['locator']}" for k,v in expectedSelected['characteristics'].items()]
 assert x['fields']==expectedFields,('source field values/locators',p.name)
 if state['error']:
  assert x['alerts']==[state['error']+' No sample was selected. Choose a visible sample or reset these filters.'];invalidNames.append(p.name)
 else:assert x['alerts']==[]
 dossier=x.get('dossier','')
 selectedChecks={}
 if expectedSelected is not None:
  s=expectedSelected;assert s['sampleTitle']+' · exact source conditions' in dossier and 'Open '+s['geoSampleAccession'] in dossier
  assert s['nativeBarcodeFile'] in dossier and s['nativeBarcodeSha256'] in dossier
  reasons=[]
  if s['workbookRowCount']==0:reasons.append('No final-workbook rows are available for this sample.')
  if s['barcodeMissingRowCount']>0 or s['barcodeMatchedRowCount']!=s['workbookRowCount']:reasons.append('The exact final-workbook to source-native barcode crosswalk is incomplete.')
  if s['clusterAssignment'] is None:reasons.append('No exact per-nucleus cluster assignment is supplied.')
  if audit['rights']['publicAssetPackagingAllowed'] is not True:reasons.append('File-specific reuse and release scope remain unresolved.')
  assert reasons and 'Runtime nucleus-roster gate: unavailable' in dossier and all(reason in dossier for reason in reasons)
  for e in s['matchingExamples']:
   assert f"{e['sheet']} · row {e['row']}: {e['rawValue']} → source matrix column {e['nativeMatrixColumnOneBased']}. This source match does not assign a cluster." in dossier
  selectedChecks={'sourceKey':state['selectedKey'],'exactFiveSourceValuesAndLocators':True,'sourceNativeFileAndSHAExact':True,'heldNucleusReasonsFromSourceExact':True,'matchingExamplesExactButNotCopiedAsCellRoster':len(s['matchingExamples']),'embryonicAgeNotConverted':s['age']['convertedToPostnatalAge'] is False}
 else:assert 'Export selected sample JSON' not in dossier and ' · exact source conditions' not in dossier
 for sample in expectedVisible:allKeys.add(f"trevisan-v1:GSE275595:{sample['geoSampleAccession']}:source-sample")
 rows.append({'path':str(p.relative_to(ROOT)),'actual':pin,'kind':'actual_source_workspace_DOM','URLState':state,'visibleRows':len(expectedVisible),'selectedCount':len(expectedTexts),'checks':{'originalSampleFullKeysAndOrderExact':True,'filtersReplayedIndependentlyFromSource':True,'selectionFieldsAndGateExact':True,'allVisibleTableSourceAgeRegionAndCountsExact':True,'capturedPageWidthNoOverflow':True,'invalidFailClosed':state['status']=='invalid' if state['error'] else None},'selectedSourceChecks':selectedChecks})
historyPairs=[('actual-03-embryo-before-reload.json','actual-03-embryo-after-reload.json'),('actual-03-embryo-after-reload.json','actual-06-back-embryo.json'),('actual-05-filter-excluded-clears.json','actual-06-back-empty-atlas.json'),('actual-05-filter-excluded-clears.json','actual-06-forward-empty-atlas.json'),('actual-05-atlas-explicit-p0.json','actual-06-forward-explicit-p0.json'),('actual-07-whitespace-query.json','actual-07-whitespace-query-reloaded.json'),('actual-11-unrelated-before-reset.json','actual-11-back-qualified.json'),('actual-11-back-qualified.json','actual-12-fresh-reopen.json'),('actual-14-after-export-selection-status-cleared.json','actual-14-publication-filter-independent.json'),('actual-14-publication-filter-independent.json','actual-14-publication-next-page.json')]
history=[]
for a,b in historyPairs:
 if a not in records or b not in records:continue
 fields=('url','input','cohort','selected','sampleRows','fields','dossier')
 same={k:records[a].get(k)==records[b].get(k) for k in fields};assert all(same.values()),('history facts',a,b,same)
 history.append({'before':a,'after':b,'completeSourceFilterSelectionDossierExact':True,'fields':list(fields)})
if 'actual-11-unrelated-before-reset.json' in records and 'actual-11-unrelated-after-reset.json' in records:
 before=parse_qs(urlsplit(records['actual-11-unrelated-before-reset.json']['url']).query,keep_blank_values=True);after=parse_qs(urlsplit(records['actual-11-unrelated-after-reset.json']['url']).query,keep_blank_values=True)
 assert {k:v for k,v in before.items() if k not in owned}==after=={'qa':['one','two'],'note':['keep']}
 history.append({'before':'actual-11-unrelated-before-reset.json','after':'actual-11-unrelated-after-reset.json','allUnrelatedRepeatedParamsAndFragmentPreserved':True,'noSavedSelectionAfterExplicitReset':records['actual-11-unrelated-after-reset.json']['selected']==[]})
additional=[]
if 'actual-14-existing-pkd2l1-workspace.json' in records:
 legacyPath=ROOT/'data/crozat-experiment-family-observations-0.1.json';legacyPin,legacyBody=read(legacyPath);legacy=json.loads(legacyBody);value=legacy['summary'];text=records['actual-14-existing-pkd2l1-workspace.json']['workbenchText']
 assert value['adapterTableCount']==23 and value['observationRowCount']==2115 and value['completeWithinTablePairGroupCount']==220
 assert '23 declared experiment tables · 2,115 separate-table observation rows · 220 complete condition groups within their own tables' in text and 'these totals do not count unique cells across the deposit' in text
 additional.append({'kind':'existing_PKD2L1_source_workbench_preserved','sourcePath':str(legacyPath.relative_to(ROOT)),'sourceActual':legacyPin,'tables':23,'separateObservations':2115,'withinTableGroups':220,'notUniqueCellDenominator':True})
if 'actual-13-native-download-attempt.json' in records:
 attempt=records['actual-13-native-download-attempt.json'];assert attempt['landed'] is False
 producer=records['actual-13-native-download-producer-status.json'];changed=records['actual-14-after-export-selection-status-cleared.json']
 assert any('Exported the exact GSM8480605 source-sample audit row; no nucleus roster or source matrix payload.'==v for v in producer['statuses']) and all(not v.startswith('Exported the exact ') for v in changed['statuses'])
 additional.append({'kind':'export_producer_notice_and_selection_clear','producerNoticeExact':True,'nativeDownloadLanded':False,'nativeDownloadedPayloadVerifiedByThisReplay':False,'changedSelectionClearsProducerNotice':True})
if 'actual-15-narrow-embryo.json' in records:
 a=records['actual-15-narrow-embryo.json'];b=records['actual-15-narrow-current-page-header.json'];c=records['actual-15-final-desktop-page-header.json']
 assert a['width']==b['width']==390 and c['width']==1280 and a['scrollWidth']==b['scrollWidth']==390 and c['scrollWidth']==1280
 for field in ('url','input','cohort','selected','sampleRows','fields','dossier'):assert a[field]==b[field]==c[field]
 assert a['tables'][0]['tabIndex']==b['tables'][0]['tabIndex']==0 and a['tables'][0]['scrollWidth']>a['tables'][0]['width'] and b['tables'][0]['scrollLeft']>a['tables'][0]['scrollLeft']
 additional.append({'kind':'actual390_to1280_source_facts_and_local_table_scroll','sourceFactsExactAcrossResize':True,'actual390PageNoOverflow':True,'actual1280PageNoOverflow':True,'recordedScrollableTableFocusTabIndex':0,'recordedScrollMovement':{'before':a['tables'][0]['scrollLeft'],'after':b['tables'][0]['scrollLeft']},'nativeArrowExecutedByThisReplay':False})
invalidSummary=records.get('actual-10-invalid-summary.json')
assert len(invalidNames)==9 and isinstance(invalidSummary,list) and len(invalidSummary)==9 and all(r['selected']==0 and r['alerts'] for r in invalidSummary)
assert allKeys==set(byKey)
assert audit['rights']['publicAssetPackagingAllowed'] is False and all(audit['summary'][k]==0 for k in ['perNucleusClusterAssignmentsValidated','runtimeNucleusRosterRowsAdmitted','canonicalSourceProfileContribution','sameCellJoins','geometryObjects','atlasRegistrations'])
stable=[]
for p in [auditPath]+paths:
 old=cache[p][0];now,_=read(p,True);assert old==now;stable.append({'path':str(p.relative_to(ROOT)),'actual':now,'stable':True})
assert read(Path(__file__).resolve(),True)[0]==helperPin
result={'executedHelper':{'path':str(Path(__file__).resolve()),'actual':helperPin},'increment':'I58','status':'PASS_SCOPED_ACTUAL_DOM_SOURCE_MEMBERSHIP','throughStep':args.through_step,'generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rootWrites':0,'stageWrites':0,'nativeExecutionByThisReplay':False,'nativeDownloadPathVerifiedByThisReplay':False,'privateRendererProofMinted':False,'source':{'path':str(auditPath.relative_to(ROOT)),'actual':auditPin,'samples':29,'all29SourceKeysObserved':True,'sourceAuditId':audit['auditId'],'auditDate':audit['auditDate'],'sourceSummary':audit['summary'],'rightsHeld':True},'summary':{'capturedFiles':len(paths),'actualDOMSnapshots':len(rows),'auxiliaryProducerObservations':len(aux),'sixQualifiedSampleLinks':6,'allSourceKeys':len(allKeys),'invalidCasesFailClosed':len(invalidNames),'completeHistoryDossierPairs':len(history),'additionalSourceAndLifecycleChecks':len(additional)},'actualDOMSourceReconciliation':rows,'historyReconciliation':history,'additionalSourceAndLifecycleChecks':additional,'auxiliaryEvidencePins':aux,'epochStability':stable,'readContract':stats,'limitations':['Reads actual DOM evidence captured by parent; this replay does not operate browser, execute keys, inspect pixels or capture downloads.','Source factual rows and a qualified bookmark do not admit nuclei, exact cluster assignments, animal identities or same-cell geometry.','Only existing actual snapshots through the requested numbered checkpoint are reconciled; later native or final-document QA is separate.','Matching barcode examples are verified as existing source locators but are not serialized as a native-ID roster in this receipt.']}
output=OUT/f'I58_ACTUAL_DOM_SOURCE_MEMBERSHIP_THROUGH_{args.through_step:02}.json';output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'path':str(output),'status':result['status'],'summary':result['summary'],'readContract':stats},indent=2))
