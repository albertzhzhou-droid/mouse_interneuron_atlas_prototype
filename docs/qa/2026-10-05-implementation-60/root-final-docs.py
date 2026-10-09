from pathlib import Path
import os, json, hashlib, sys
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
q=r/'docs/qa/2026-10-05-implementation-60'
def read(p):
    fd=os.open(p,os.O_RDONLY);a=os.fstat(fd);parts=[]
    for i in range(0,a.st_size,4096): parts.append(os.pread(fd,min(4096,a.st_size-i),i))
    b=os.fstat(fd);os.close(fd);out=b''.join(parts)
    assert len(out)==a.st_size and (a.st_ino,a.st_size,a.st_mtime_ns)==(b.st_ino,b.st_size,b.st_mtime_ns),str(p)
    return out
def pin(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
copies=[]
def copy(src,dst):
    src=Path(src);dst=Path(dst);b=read(src);dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(b)
    copies.append({'source':str(src),'path':str(dst.relative_to(r)),**pin(b)})
def folder(src,dst):
    for p in sorted(Path(src).iterdir()):
        if p.is_file() and not p.is_symlink():copy(p,q/dst/p.name)
assert len(sys.argv)==3,'Provide the actual PASS source and native replay receipt paths'
source_path,native_path=map(Path,sys.argv[1:]);source=json.loads(read(source_path));native=json.loads(read(native_path))
assert str(source['status']).startswith('PASS') and str(native['status']).startswith('PASS'),(source['status'],native['status'])
intake=json.loads(read(q/'intake-preservation.json'))
for row in intake['candidateTargets']:assert pin(read(r/row['path']))==row['after'],row['path']
copy('/private/tmp/ohri-i60-full-research-node26.log',q/'full-research-final.log')
full=read(q/'full-research-final.log').decode();assert all(s in full for s in ['tests 1534','pass 1519','fail 0','cancelled 0','skipped 15'])
for src,dst in [('/private/tmp/ohri-i60-index-native-proxy','native-proxy'),('/private/tmp/ohri-i60-proxy-independent-peer','independent-proxy-peer'),('/private/tmp/ohri-i60-native-live-replay','independent-native-log-dom'),('/private/tmp/ohri-i60-intake-preservation-helpers-20261005','independent-source-preservation-preparation'),('/private/tmp/ohri-i60-production-static-copy-readonly-20261005','production-static-copy-review'),('/private/tmp/ohri-i60-exact-native-export-landing-20261005','native-export-landing'),('/private/tmp/ohri-i60-comparison-source-replay','independent-scientific-source-export')]:folder(src,dst)
copy('/private/tmp/ohri-i60-sync.py',q/'sync-current-stage.py')
copy('/private/tmp/ohri-i60-final-docs.py',q/'root-final-docs.py')
paragraph='''新版独立Profile comparison页面保留分级侧栏、Breadcrumb和light reading layout。准确0–4完整source keys、anchor、query、namespace及page由七个URL字段恢复，版本和当前private decoded-index receipt限定权限；11种实际无效请求清空basket/report/exports，不替代对象。跨namespace/空筛选保持basket，第五项disabled；0/1项不生成报告；nativeEnter/Space、anchor移除、Roome157末页14/一项、refresh/link、重复外参/fragment及history/reset、route卸载/fresh恢复通过。完整research实际exit0：1534/1519pass/15既有conditional skips/0fail/0cancel，含build/types/lint/必需validators。误选Node24的gzip重压失败原样保留，源字节/解码正确；使用原Node26重跑通过，不重建gzip或放宽gate。49actual DOM captures的52pairs/208来源维度/52完整receipt由原387profile index及五taxonomy scopes独立复算；21receipt实际展开，两个准确JSON49648B/CSV18219B落盘并独立内容核对，event API两5s timeout保留。canonical请求75延迟12s后304/cached恢复仅supplemental；80的304/代理502不算checksum proof。实际84完整原gzip200后同长度decoded错误字节使页面校验失败并保持结果关闭，87完整原gzip200准确恢复同书签；临时部署副本metadata/重启使ETag换epoch，四份副本原timestamps已恢复，root源码/源字节不改。CmdShiftR无新请求证据、API measurement native0、network initiator/body consumption不冒称。Actual390/1280无整页overflow，原生ArrowRight后续capture局部scroll0→40，2px表格焦点/Tab出口及新版截图通过；错误heading locator原attempt保留。四产品afterimages不变，Compare static closure40→41仅bookmark JS；runtime198/Positions40+23 membership与字节保持。2585canonical/2588stage最终doc epoch另封存。32sources/42sets/387/181morphologies/83of243不变；200%zoom/screenreader/whole-App budgets/M2/M4及完整Goal仍未完成。'''
t=r/intake['timeline'];assert '## Final engineering and actual acceptance' not in t.read_text()
t.write_text('''# I60 · Exact molecular comparison bookmarks

Status: four sealed product paths integrated; full engineering, bounded actual browser acceptance and independent scientific source/export and transport replay passed. Current canonical/stage verification and final independent preservation are separately sealed in QA. Full scientific Goal remains active.

The current independent Profile comparison route, grouped SiteNavigation/sidebar, Breadcrumb and light reading layout are retained. Seven URL fields qualify exact ordered0–4 source keys, a member anchor, query, namespace and candidate page against version1 and the current private verified decoded-index receipt. No public cloned index grants this authority. Filters retain an independent basket; basket/anchor/page/Reset push history, query/namespace replace it, and popstate restores without writing. Reset owns only these seven fields and preserves repeated external fields, fragment, path and router state.

The scientific comparator, five source-taxonomy scopes, evidence slot rules, JSON/CSV schemas, styles, index assets, wrappers and package remain unchanged. This increment creates no similarity score, same-cell or same-type relation, deduplication, marker classification, pooled denominator, animal, geometry, internal structure or REG.

Before mutation, six originals and four physical absences were checked against all2581 canonical inputs and the acceptedI59 59-member checkpoint. Four sealed candidate afterimages remain exact. Three helper/type/test files enter existing filename families and one new timeline enters CORE. Final canonical membership is2585, operational stage2588; the original preimages and prior accepted checkpoint remain retained.

## Final engineering and actual acceptance

'''+paragraph+'''

The initial bundledNode24.19.0/zlib implementation recompressed the unchanged canonical JSON differently and failed the existing byte-for-byte gzip gate before the main test suite. Root and stage source/transport/receipt/manifest pins and lossless decode matched. The failed full log and runtime diagnostic remain in QA. ExistingNode26.0.0 passes the original transport gate and complete required entry point; no source gzip or validation condition was changed. Production build, strict types, full-project lint, validators and1534 tests completed with1519 passed/15 existing conditional skips/0 failed/0 cancelled.

Actual states are captured with original tool UTC brackets and native action clocks. Three early/unmounted observations explicitly lack the comparison section; they are not mounted readiness proofs. Eleven bad bookmarks retain their requested URL and show current candidates without a substituted saved basket. Source strings, qualifiers, conflict objects, unknown Cano marker fields and cohort context are independently reconstructed from unchanged original inputs, without importing the product comparator. Three pair disclosures were natively opened and remain open across seven captures, giving21 expanded-receipt observations. Native disclosure-open flags distinguish these observations from merely retained closed payloads. JSON and CSV each have one actual nativeEnter action and two absent pre-export exact-path baselines; filesystem birth/mtime occur within their action-start to after-capture windows. The event API timeout is not rewritten as success. Exact downloadedJSON49648B SHA876000269ce0529ad2e84dd984b41c983d410c5d308015ab27d45e9bbd2c2ae4; CSV18219B SHAf2b49ed140c2ffaf30c03f315bf3f7346ca221d7b91bd0512de517ac3e79789d. No generatedAt field is invented.

## Native index transport scope

The current provider fetches the canonical/data route; the API compressed-measurement route has its own independent owner and no native phase here. Both exact paths were reviewed offline; canonical can negotiate original plain or gzip representations. Actual75 is a12-second delay with304 and zero wire body, so it proves waiting-to-qualified cached recovery only. Actual80 rejects a304 before controlled substitution and produces502; it is not a decoded checksum rejection. An attempted stagepublic metadata epoch does not change the production dist/client copy and is retained as an unsuccessful tool attempt. ActualCmdShiftR did not establish a separate fresh request or cache bypass.

For actual84 and87, only temporary deployed-copy timestamps were advanced and the parent-owned production listener restarted so the cached production ETag changed. Original file bytes remained exact. The earlier actual08 ready state is a valid-bookmark baseline; actual80 HTTP502/unavailable intervenes before84. No directly adjacent ready-to-empty checksum transition is claimed. Actual84 verifies the original628095B gzip/715236a4…SHA under200 and hands the626119B temp fault gzip/b69d9d98…SHA to the response; decoding changes only finalLF tospace, still12327624B, so the product refuses the decoded SHA and provides no candidates, basket, report or export. Actual87 receives and hands the complete original gzip under200; the same qualifiedI1/I2 bookmark restores. All four temporary public/deployed-copy timestamps were restored exactly after stopping the owned3004/3005 listeners. The user3011 preview is untouched. Proxy route ownership is not a captured browser network initiator, and handed bytes alone do not establish browser consumption. Native DOM verifies the associated application state separately. The final strict temporal receipt accepts only this fault/recovery phase and the explicitly limited cached-delay supplement, without a full200 delay or native API measurement claim.

## Layout, remaining evidence and final boundary

Actual390x844 and1280x720 have document width equal to viewport width. The keyboard-focused table has a2px visible outline; the original immediate ArrowRight capture still has scroll0 while the subsequent Tab-exit capture has scroll40, with the other tables unchanged. Default browser viewport is restored. Desktop/narrow screenshots were visually inspected, and current sidebar, independent route and Breadcrumb remain intact. The guessed Research explorer heading selector failed; observed destination UI confirms route unmount and the original attempt remains separate. Fresh reopening, Reset/back and native Link navigation restore all four qualified keys. Warning/error capture is empty.

Compare static dependency closure grows40→41 with only the bookmark JS; the index receipt helper was already reachable. The d.ts/test are canonical verification inputs, not mounted runtime modules. Eight declared private scopes and their198-member compact authority remain exact, with no I60 owned intersection. Positions40 build+23 separate source authority retains membership and bytes; this unchanged scope uses priorI59 actual-view evidence, without a new I60 render/restore claim. Current canonical/stage manifest checks and independent final preservation are recorded after the docs are written.83of243 and allF01–F20/M0–M4 complete Goal remain active; this increment does not satisfy mouse-spinal internal source/frame/parent/slice gaps or all-App accessibility/performance budgets.
''')
p=r/'docs/UPGRADE_PLAN_2026-09-24.md';s=p.read_text();assert '## 73. I60' not in s
old=s.splitlines()[3];assert old.startswith('最近更新：')
new='最近更新：2026-10-05（America/Toronto），I60新版Profile comparison准确书签／history／失败恢复通过完整工程及局部实际UI/source/export核验；I59与I58证据保留。当前32sources/42sets/387profiles；45 named routes／181 selectable／142 census／39 supplementary保持；exact completed83/243，完整Goal及M2／M4仍active。第69–73节记录当前范围，最终封存以各轮QA为准。  '
s=s.replace(old,new,1)+'\n\n## 73. I60 · 准确分子比较书签\n\n'+paragraph+'见[I60时间轴]('+intake['timeline'].split('/')[-1]+')及[QA](qa/2026-10-05-implementation-60/verification-summary.json)。\n';p.write_text(s)
p=r/'docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md';s=p.read_text();assert '### I60' not in s
p.write_text(s+'\n\n### I60 · 准确分子比较书签（完整工程与局部实际浏览/source/export通过）\n\n'+paragraph+' 本轮推进F08/F13/F15/F16/F17；逐来源比较及其书签不核销核心mouse-spinal内部结构或完整Goal。\n')
x=json.loads(read(q/'verification-summary.json'))
x.update(status='PASS_BOUNDED_ENGINEERING_NATIVE_SOURCE_EXPORT_PENDING_FINAL_CANONICAL_PRESERVATION',canonicalInputs=2585,operationalStageInputs=2588,actualBrowserValidated=True,nativeDownloadLandingVerified=True,fullResearch={'actualExitCode':0,'tests':1534,'passed':1519,'conditionalSkipped':15,'failed':0,'cancelled':0,'log':{'path':str((q/'full-research-final.log').relative_to(r)),**pin(read(q/'full-research-final.log'))}},actualDOMCaptures=49,actualReportPairs=52,independentScientificDimensionRows=208,actualExpandedReceipts=21,actualInvalidBookmarkCases=11,actualViewportTests=[390,1280],scientificSourceReplay={'path':str((q/'independent-scientific-source-export'/source_path.name).relative_to(r)),**pin(read(source_path))},nativeTemporalReplay={'path':str((q/'independent-native-log-dom'/native_path.name).relative_to(r)),**pin(read(native_path))},nativeTemporalScope='canonical_fault_recovery_with_cached_delay_supplemental',nativeCanonicalRequestIds={'cachedDelay':75,'rejected304':80,'decodedChecksumFault':84,'fullOriginalRecovery':87},nativeAPIMeasurementPhases=0,mainFull200DelayAcceptanceEstablished=False,productCorrections=0,sourceCountsUnchanged=True,unverified=['200% zoom','screen reader','whole-App budgets','native full200 delay','browser cache bypass'],fullGoalComplete=False)
(q/'verification-summary.json').write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
(q/'independent-evidence-copy-receipt.json').write_text(json.dumps(copies,ensure_ascii=False,indent=2)+'\n')
print('I60 bounded final docs written; canonical --write, stage sync/current validator and final independent preservation remain required.')
