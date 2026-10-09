#!/usr/bin/env python3
"""Reproducible literal-table extraction; no traces, classification or model inference."""
from pathlib import Path
import argparse, hashlib, json, re, zipfile, xml.etree.ElementTree as E

PINS={
 'data-sheet-1-file36551718.docx':(687234,'7ef955d8378020d95eeff07be83ad0c602699337fdb89b79f6796c3e96b845e2'),
 'PMC9385948.fullText.xml':(228780,'b997e9c1565ba55dd361dcf47ac315883a9d1108c55d74c48db87f70f8bb7517'),
 'figshare-article-20428674.json':(35029,'ea6183d6e34233889e2900b14d980ad61edaf28f616052291bfaefac2406d865'),
}
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
PREFIX='garcia-ramirez-2022:aggregate-physiology:'
PROPERTIES=['membrane_potential','input_resistance','time_constant','capacitance','rheobase','ap_threshold','ap_half_width','fahp_duration','sahp_duration','normalized_fahp_amplitude','pic_on_voltage','fi_slope']
PARTITIONS=['reporter_population','firing_pattern','k_means','hierarchical']
EXPECTED_COUNTS=[[143,28],[88,49,24,10],[23,11,68,69],[15,20,32,25,27,52]]

def sha(raw):return hashlib.sha256(raw).hexdigest()
def word_text(node):
    pieces=[]
    for child in node.iter():
        if child.tag=='{'+NS['w']+'}t':pieces.append(child.text or '')
        elif child.tag=='{'+NS['w']+'}tab':pieces.append('\t')
        elif child.tag in ('{'+NS['w']+'}br','{'+NS['w']+'}cr'):pieces.append('\n')
    return ''.join(pieces)
def article_text(node):return ''.join(node.itertext())
def article_locator(section,title,ordinal,paragraph):
    return {'fileName':'PMC9385948.fullText.xml','sectionId':section.get('id'),'sectionTitleRaw':title,'paragraphOrdinalWithinSection':ordinal,'elementSha256':sha(E.tostring(paragraph,encoding='utf-8'))}
def table_locator(index,row,column):
    return {'fileName':'data-sheet-1-file36551718.docx','ooxmlMember':'word/document.xml','tableOrdinal':index,'rowOneBased':row,'columnOneBased':column}

def extract(input_dir,output_dir):
    source_pins=[]
    for name,(size,digest) in PINS.items():
        raw=(input_dir/name).read_bytes();assert len(raw)==size and sha(raw)==digest,f'Source bytes changed: {name}'
        source_pins.append({'fileName':name,'bytes':size,'sha256':digest})
    meta=json.loads((input_dir/'figshare-article-20428674.json').read_bytes())
    assert meta['id']==20428674 and meta['resource_doi']=='10.3389/fncir.2022.957084' and meta['license']['url']=='https://creativecommons.org/licenses/by/4.0/'
    file=next(f for f in meta['files'] if f['id']==36551718)
    assert file['size']==687234 and file['computed_md5']==file['supplied_md5']=='cd540639b14fda1fd1149b235384b795'
    assert hashlib.md5((input_dir/'data-sheet-1-file36551718.docx').read_bytes()).hexdigest()==file['computed_md5']
    article=E.fromstring((input_dir/'PMC9385948.fullText.xml').read_bytes())
    assert any(n.text=='10.3389/fncir.2022.957084' for n in article.findall('.//article-id'))
    context=[];paragraphs={}
    for section in article.findall('.//body//sec'):
        title=article_text(section.find('title'))
        for ordinal,p in enumerate(section.findall('p'),1):
            locator=article_locator(section,title,ordinal,p);text=article_text(p)
            paragraphs[(title,ordinal)]={'raw':text,'locator':locator}
    titles=['Materials and methods','Spinal cord preparations','Whole-cell patch clamp recordings','Measurement and calculation of passive and active membrane properties','Statistical analyses','Correlations, principal component analysis, and cluster analysis','Further validation of clustering with immunohistochemistry identified cells']
    for title in titles:context.append(paragraphs[(title,1)])
    mice=context[0]['raw'];preparation=context[1]['raw'];measure=context[3]['raw'];stats=context[4]['raw']
    assert '51 Shox2' in mice and '6 Chx10' in mice and '60 of the Shox2' in mice and '28 of the mice' in mice
    assert '8–25 weeks' in preparation and 'segments L2–5' in preparation and '143 Shox2 neurons and 28 Chx10 neurons' in measure
    assert 'mean ± SD' in stats
    with zipfile.ZipFile(input_dir/'data-sheet-1-file36551718.docx') as z:
        assert z.testzip() is None
        doc_raw=z.read('word/document.xml');doc=E.fromstring(doc_raw);body=list(doc.find('w:body',NS))
        assert not doc.findall('.//w:ins',NS) and not doc.findall('.//w:del',NS) and 'word/comments.xml' not in z.namelist()
        tables=[];prior_caption=None
        for body_index,node in enumerate(body,1):
            if node.tag=='{'+NS['w']+'}p':
                txt=word_text(node)
                if txt.startswith('Supplementary Table '):prior_caption=txt
            elif node.tag=='{'+NS['w']+'}tbl':
                index=len(tables)+1;assert prior_caption and prior_caption.startswith(f'Supplementary Table {index}.')
                matrix=[[word_text(c) for c in r.findall('w:tc',NS)] for r in node.findall('w:tr',NS)]
                assert len(matrix)==13 and all(len(r)==len(matrix[0]) for r in matrix)
                headers=matrix[0];assert len(headers)==len(EXPECTED_COUNTS[index-1])+3
                groups=[]
                for col,header in enumerate(headers[1:-2],2):
                    m=re.fullmatch(r'\s*(.*?)\s*\(\s*n\s*=\s*(\d+)\s*\)\s*',header,re.S);assert m,header
                    groups.append({'id':PREFIX+f'ST{index}:group:{col-1}','labelRaw':m[1],'headerRaw':header,'recordedObservationCount':int(m[2]),'countLocator':table_locator(index,1,col),'countUnit':'source_recorded_neuronal_observations','physicalCellRosterAvailable':False})
                assert [g['recordedObservationCount'] for g in groups]==EXPECTED_COUNTS[index-1] and sum(g['recordedObservationCount'] for g in groups)==171
                rows=[]
                for row_n,row in enumerate(matrix[1:],2):
                    prop=PROPERTIES[row_n-2];label=row[0];unit=re.search(r'\[([^]]+)\]',label)
                    values=[]
                    for col,(raw_value,group) in enumerate(zip(row[1:-2],groups),2):
                        m=re.fullmatch(r'\s*([-−]?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)\s*',raw_value,re.S);assert m,raw_value
                        values.append({'groupId':group['id'],'raw':raw_value,'mean':float(m[1].replace('−','-')),'standardDeviation':float(m[2]),'uncertaintyKind':'source_reported_standard_deviation','locator':table_locator(index,row_n,col)})
                    p_raw=row[-1];p_match=re.fullmatch(r'\s*(\*)?(\d+(?:\.\d+)?)\s*',p_raw);assert p_match,p_raw
                    rows.append({'propertyId':prop,'propertyLabelRaw':label,'unitRaw':unit[1] if unit else None,'unitNotPrintedReason':None if unit else ('Source methods normalize fAHP amplitude to AP amplitude; the table does not print a unit.' if prop=='normalized_fahp_amplitude' else 'The source table does not print a F/I slope unit; none is inferred.'),'propertyLocator':table_locator(index,row_n,1),'values':values,'reportedComparison':{'statisticRaw':row[-2],'statisticLocator':table_locator(index,row_n,len(row)-1),'pValueRaw':p_raw,'pValue':float(p_match[2]),'asteriskRaw':bool(p_match[1]),'pValueLocator':table_locator(index,row_n,len(row)),'interpretation':'Source-reported comparison only; no statistical reanalysis, p-value correction or causal inference.'}})
                tables.append({'id':PREFIX+f'ST{index}','sourceTableLabel':f'Supplementary Table {index}','captionRaw':prior_caption,'partitionKind':PARTITIONS[index-1],'sourceFigure':f'Figure {index+2}','ooxmlBodyBlockOneBased':body_index,'ooxmlTableSha256':sha(E.tostring(node,encoding='utf-8')),'sourceHeadersRaw':headers,'groups':groups,'sourceRecordedPoolDenominatorId':PREFIX+'recorded-pool-171','groupCountSum':171,'propertyRows':rows})
        assert len(tables)==4 and sum(len(v['values']) for t in tables for v in t['propertyRows'])==192
    # Preserve exact reported firing composition; there are no cell IDs here.
    main=article.find('.//table-wrap[@id="T1"]');head=main.find('.//thead');top=list(head[0]);bottom=list(head[1]);group_for_column=[]
    for cell in top:
        group_for_column.extend([article_text(cell).strip()]*int(cell.get('colspan','1')))
    assert len(group_for_column)==len(bottom)
    firing=[]
    for column,(group,cell) in enumerate(zip(group_for_column,bottom),1):
        text=article_text(cell).strip();match=re.fullmatch(r'(Shox2|Chx10)\s*\(n\s*=\s*(\d+)\)',text)
        if match:firing.append({'firingPatternRaw':group,'reporterPopulationRaw':match[1],'recordedObservationCount':int(match[2]),'headerRaw':text,'locator':{'fileName':'PMC9385948.fullText.xml','tableId':'T1','headerRowOneBased':2,'columnOneBased':column,'tableElementSha256':sha(E.tostring(main,encoding='utf-8'))}})
    assert [r['recordedObservationCount'] for r in firing]==[78,10,36,13,21,3,8,2]
    pool={'id':PREFIX+'recorded-pool-171','value':171,'unit':'source_recorded_neuronal_observations','Shox2':143,'Chx10':28,'sourceLocator':context[3]['locator'],'independentAnimalCount':None,'cellToAnimalMapping':None,'boundary':'Alternative reporter, firing, k-means and hierarchical partitions refer to this same source-recorded analysis pool; counts are not added across partitions or treated as independent animals.'}
    boundary={'newMolecularProfiles':0,'newPhysicalCellRosterRows':0,'newObservedGeometryObjects':0,'sameCellCrossSourceJoins':0,'registrations':0,'sourceTracesAvailableInAdapterScope':False,'rawAbfFilesAvailableInAdapterScope':False,'physiologyGroupsAreMolecularCellTypes':False,'clusterLabelsAreGeneticLineage':False,'adultAtlasCoordinatesEstablished':False,'M2Admission':0,'M4Admission':0,'text':'These are published aggregate electrophysiology summaries and study-local classification methods. No cell-level roster, raw trace, morphology, atlas placement, molecular equivalence, synapse or internal structure is admitted.'}
    result={'schemaVersion':'0.1.0','adapterId':'ohri-garcia-ramirez-adult-spinal-aggregate-physiology-0.1.0','authority':'source_reported_aggregate_statistics','source':{'publication':{'title':meta['resource_title'],'doi':meta['resource_doi'],'pmid':'35991345','pmcid':'PMC9385948','articleUrl':'https://doi.org/10.3389/fncir.2022.957084','authors':[a['full_name'] for a in meta['authors']]},'supplement':{'doi':meta['doi'],'figshareArticleId':meta['id'],'fileId':file['id'],'publishedFileName':file['name'],'fileUrl':file['download_url'],'metadataUrl':meta['url_public_html'],'md5':file['computed_md5']},'rights':{'name':meta['license']['name'],'url':meta['license']['url'],'metadataLocator':'figshare-article-20428674.json:license','articleLicenseLocator':'PMC9385948.fullText.xml:front/article-meta/permissions/license','attribution':'Garcia-Ramirez DL, Singh S, McGrath JR, Ha NT and Dougherty KJ (2022). Identification of adult spinal Shox2 neuronal subpopulations based on unbiased computational clustering of electrophysiological properties. Frontiers in Neural Circuits 16:957084. CC BY 4.0.'},'inputPins':source_pins},'studyScope':{'species':'Mus musculus','ageWeeksMinimum':8,'ageWeeksMaximum':25,'ageBoundary':'Study-level range; individual recorded-cell ages are not provided.','spinalSegmentsSourceRaw':'L2–5','sex':None,'sexMissingReason':'Sex is not stated in the retained article body methods for these study cohorts.','preparation':'Transverse adult-lumbar spinal slices; whole-cell patch clamp at room temperature.','scopeLocator':context[1]['locator'],'methodLocator':context[2]['locator'],'animalCohorts':[{'reporterPopulationRaw':'Shox2','reportedMice':51,'reporterLineRaw':'Shox2::Cre; Rosa26-flox-Stop-flox-tdTomato','locator':context[0]['locator']},{'reporterPopulationRaw':'Chx10','reportedMice':6,'reporterLineRaw':'Chx10-eGFP','locator':context[0]['locator']}],'priorStudyReuse':{'recordedShox2Observations':60,'reportedMice':28,'isSubsetOfCurrentShox2Cohort':True,'sourceLocator':context[0]['locator'],'boundary':'These records were included again in the current analysis; prior-study observations and animals are not added to the present cohort counts.'},'recordedPool':pool,'statisticsConvention':{'summary':'mean ± SD','sourceLocator':context[4]['locator'],'rawThresholdStatement':'Statistical significance was set at p < 0.05 unless otherwise stated.'},'firingComposition':firing,'interpretationBoundary':boundary},'tables':tables,'sourceMethodStatements':context,'rawSourceDiscrepancies':[{'id':PREFIX+'source-capacitance-formula','kind':'printed_method_formula_held','sourceRawFragment':'Cm = Rin/τ','sourceLocator':context[3]['locator'],'reason':'The printed expression is retained as source text. The adapter uses the published table summaries and performs no capacitance calculation or silent formula correction.'},{'id':PREFIX+'immunostaining-k-count','kind':'unresolved_reported_subgroup_total','reportedStainedShox2Observations':8,'reportedChx10Negative':2,'reportedChx10Positive':6,'kListedChx10PositiveCounts':[1,2,1],'listedPositiveCountSum':4,'sourceLocator':context[6]['locator'],'reason':'The source k-group positive counts list four observations whereas six positive observations are reported; no missing group/cell assignment is inferred.'}],'derivation':{'extractor':'extract_garcia_ramirez_physiology.py','sourceCodeExecuted':False,'statisticalReanalysisPerformed':False,'sourceDocxOoxmlMember':'word/document.xml','sourceDocxOoxmlMemberSha256':sha(doc_raw),'sourceDocxTrackedChanges':0,'sourceDocxComments':0,'supplementTables':4,'propertyRows':48,'aggregateMeanSdValues':192,'reportedStatisticalComparisons':48,'propertyNamesNormalizedForNavigationOnly':True,'unitsNotPrintedRemainNull':True,'rosterCreated':False}}
    output_dir.mkdir(parents=True,exist_ok=True);data=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode();out=output_dir/'garcia-ramirez-adult-spinal-physiology-0.1.json';out.write_bytes(data)
    receipt={'schemaVersion':'0.1.0','scope':'source_literal_tables_and_attributed_context_only','sourceInputs':source_pins,'extractorSha256':sha(Path(__file__).read_bytes()),'output':{'path':out.name,'bytes':len(data),'sha256':sha(data)},'validation':result['derivation'],'admissionBoundary':boundary}
    (output_dir/'garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--input-dir',type=Path,default=Path(__file__).resolve().parent);parser.add_argument('--output-dir',type=Path,default=Path(__file__).resolve().parent/'derived');args=parser.parse_args()
    result=extract(args.input_dir,args.output_dir);print(json.dumps({'tables':len(result['tables']),'meanSdValues':result['derivation']['aggregateMeanSdValues'],'sourceGroupCounts':[[g['recordedObservationCount'] for g in t['groups']] for t in result['tables']],'physicalCellRosterCreated':False,'taxonomyProfilesAdmitted':0}))
