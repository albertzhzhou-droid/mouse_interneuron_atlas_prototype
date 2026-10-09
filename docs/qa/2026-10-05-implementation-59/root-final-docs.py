from pathlib import Path
import json, hashlib, os
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
q=r/'docs/qa/2026-10-05-implementation-59'
def read(p):
    f=os.open(p,os.O_RDONLY); s=os.fstat(f)
    b=b''.join(os.pread(f,min(4096,s.st_size-i),i) for i in range(0,s.st_size,4096))
    e=os.fstat(f); os.close(f)
    assert len(b)==s.st_size and (s.st_size,s.st_mtime_ns)==(e.st_size,e.st_mtime_ns)
    return b
def pin(b): return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
copies=[]
def copy(src,dst):
    src=Path(src);dst=Path(dst);b=read(src);dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(b)
    copies.append({'source':str(src),'path':str(dst.relative_to(r)),**pin(b)})
copy('/private/tmp/ohri-i59-full-research.log',q/'full-research-final.log')
for src,dst in [('/private/tmp/ohri-i59-root-intake.py','root-intake.py'),('/private/tmp/ohri-i59-sync.py','sync-current-stage.py'),('/private/tmp/ohri-i59-native-proxy/proxy.mjs','native-proxy/proxy.mjs'),('/private/tmp/ohri-i59-native-proxy/requests.jsonl','native-proxy/requests.jsonl'),('/private/tmp/ohri-i59-native-proxy/README.md','native-proxy/README.md')]:
    copy(src,q/dst)
for folder,out in [('/private/tmp/ohri-i59-actual-dom-source-replay-20261005','independent-source-native-export'),('/private/tmp/ohri-i59-followon-actual-source-replay-20261005','independent-source-followon')]:
    for p in sorted(Path(folder).iterdir()):
        if p.is_file() and not p.is_symlink(): copy(p,q/out/p.name)
(q/'independent-evidence-copy-receipt.json').write_text(json.dumps(copies,indent=2)+'\n')
(q/'actual-locator-attempts-and-limits.json').write_text(json.dumps({'retainedAttempts':[{'phase':'22','locator':'navigation Atlas navigation > Positions','result':'no matches; current DOM is complementary Atlas navigation / navigation Atlas pages','recovery':'exact visible Positions link used; recovered navigation occurred after delay deadline, so route unmount only, no pending-route cancellation claim'},{'phase':'24','locator':'Actual source view restored after fresh verification.','result':'guessed status absent; timeout','recovery':'read exact visible status Restored actual camera, row and layers after fresh verification of all23 source files.; captured current restored JSON'}],'legacyPhase09':'ordered captures only; missing original embedded clocks cannot be supplied retrospectively','phase21':'one delayed000 sibling canceled while original021 completed before profile switch; remains separately bounded','consoleWarningsAndErrors':[],'unverified':['native pending-route cancellation','200% zoom','screen reader','whole-App performance budgets'],'productCandidateCorrections':0},indent=2)+'\n')
t=r/'docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_59_CANO_RNA_PAIRS.md'
s=t.read_text();s=s.replace('Status: seven owned paths exactly integrated, full engineering and actual browser acceptance pending.','Status: seven owned paths exactly integrated; full engineering, bounded native UI and independent source/export replay passed. Final temporal replay, Positions and canonical preservation are recorded separately.')
assert '## Final engineering and actual UI' not in s
s+='''

## Final engineering and actual UI

Full `npm run test:research` exited 0: 1526 tests / 1511 passed / 15 existing conditional skips / 0 failed / 0 cancelled. Production build, strict typecheck, full-project lint and all required validators passed. The seven candidate afterimages remain exact, with no root product correction. The original RDS parser is not rerun by this integration. Operational verification uses 2581 canonical inputs / 2584 stage files, separately from the unchanged private198 membership and Positions40build+23source authority.

Actual browser acceptance retains the current independent Cell types route, grouped sidebar, Breadcrumb and light reading layout. Initial Chat/Pitx2 on the exact53-nucleus Skor2 profile shows partitions37/14/1/1 and totals267/99; the selected native row32 has counts14/2. Switching to the exact raw spaced label `CHOL_IN_Pitx2_ Srpx2` retains74 source nuclei and Chat/Pitx2 partitions65/6/3/0. Two original chunks are independently checksum checked; native404 and a valid original000 body substituted under021 both withhold all pair output, followed by explicit fresh retries of the originals. Closing the outer RNA panel, switching source profiles, replacing feature tuples and closing only the pair have separate native capture/action windows and distinct request ownership. Closing the pair allows its independent single Pitx2 load to finish. Legacy09 observations lack exact embedded clocks and remain supplemental. Temporal log/DOM reconciliation is a separate receipt; proxy bytes handed to a response are not alone proof of browser consumption.

Actual Xkr4/Gm1992 selects source feature rows1/2 with one unique000 pair request. Its separate single Xkr4 request and the earlier intermediate Xkr4/Pitx2 tuple are not merged. Independent original000 gzip and ordered923-metadata replay confirms all11 source profiles. The74-nucleus current profile has partitions28/46/0/0 and totals4676/40; selected native row30 has45/0, totalRNA24052 and detected5470. Unknown second-feature search retains the existing Gm1992 result; choosing the first feature again is disabled. Empty roster, paging and Lumbar18-row filtering clear excluded nucleus selection while preserving the full74 denominator and all11 groups. The DOM explanation and numeric invariance are checked separately.

Both actual Chat/Pitx2 exports landed in the exact Downloads filenames: JSON11358B SHA c4419ba7c8434d82e40499b8386c04b90b5d2f04264a0e23162ac5f53f947ae0 and CSV20468B SHA dd64e6987998d24427a4117d69d7cea26736b23ab00830f0b242803e1a98e347. Independent source replay matches the current selected JSON and53 ordered CSV rows. File birth/mtime lie between the filesystem timestamps of the original before/after native export artifacts. Those older exports have no embedded exact action brackets; this file-landing attribution is separate from strict phase10+ temporal replay. The download-event API still returned a5-second timeout; the independent exact-file evidence establishes landing, without rewriting that attempt. The I58 exact GSM8480605 JSON also has a later positive landing addendum in its QA directory; the sealed earlier I58 observations are preserved as history.

Actual390x844 and1280x720 have document width equal to viewport width. Screenshots were visually inspected; native table-scroll Enter moves the local table0to200 without page overflow. Tab focus and existing reading layout remain visible. Warning/error capture is empty. A cross-source switch to Russ removes the old Cano child after a delayed sibling is canceled. Route navigation to Positions occurs after the controlled delay deadline and proves committed unmount only; no pending-route cancellation claim is made. The mistaken navigation-role/status locator attempts are retained and corrected from observed DOM without changing product code.

The package-only required-validator addition changes existing package fingerprints in three private build scopes, not their membership. Actual Positions rejects the oldI56 build with zero canvases/points, reloads the exact sources, captures the current normalized view and Transverse/Fit, and restores the current view after fresh verification of all23 source files. Three original actual capture receipts and their independent40+23 input replay are separately retained.

Native pending-route cancellation,200% zoom, screen reader and whole-App budgets remain unverified. No new source, profile, nucleus, animal, geometry, same-cell identity, ATAC link, organelle or REG is admitted.32sources/42sets/387profiles/13rosters/4objects/83of243 and fullF01–F20/M0–M4 Goal remain active. Final doc epoch and independent preservation must pass before the next increment.
'''
t.write_text(s)
p=r/'docs/UPGRADE_PLAN_2026-09-24.md';s=p.read_text();assert '## 72. I59' not in s
old=s.splitlines()[3]
assert old.startswith('最近更新：')
new='最近更新：2026-10-05（America/Toronto），I59新版双RNA特征计数通过完整工程及局部实际UI/source/export核验；I58后续准确文件落盘证据单独补记。当前32sources/42sets/387profiles；45 named routes／181 selectable／142 census／39 supplementary保持；exact completed83/243，完整Goal及M2／M4仍active。第69–72节记录当前范围，最终封存以各轮QA为准。  '
s=s.replace(old,new,1)
paragraph='''沿用新版独立Cell types页面、分级侧栏、Breadcrumb和light layout；默认关闭的双特征子视图只输出同来源RNA列的raw>0四分区、准确选中核计数和11完整profile分母。Chat/Pitx2两个chunk与Xkr4/Gm1992一个chunk分别fresh校验，过滤/分页/无匹配查询不替换已选特征或改变完整分母。七候选路径准确应用，9原像/4新路径absence及I58accepted51member checkpoint保存。完整research actual exit0：1526/1511pass/15既有skip/0fail/0cancel，含build/types/lint/必需validator。Actual来源切换、关闭/feature replacement、404与wrongchunk拒绝和fresh retry、独立single继续、53/74分母及390/1280新版layout通过；strict时间归属另附log/DOM receipt。独立原chunk/923metadata重放核对11profiles及两个准确Downloads文件JSON11358B/CSV20468B落盘；event API5s超时仍保留。I58后续[GSM8480605准确下载addendum](qa/2026-10-05-implementation-58/native-selected-json-file-landing-addendum.json)亦已核对，原sealed历史不追改。Package只扩requiredvalidator，private198和Positions40+23 membership不扩大，current Positions旧build清零拒绝/fresh reload/restore另验。2581canonical/2584stage及末尾独立保全随后封存。Native pending-route取消/200%zoom/screenreader/whole-App预算未通过；32sources/42sets/387/83of243、geometry/identity/REG/M2/M4不变，完整Goal继续active。'''
s+='\n\n## 72. I59 · 同来源RNA双特征计数\n\n'+paragraph+'见[I59时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_59_CANO_RNA_PAIRS.md)及[QA](qa/2026-10-05-implementation-59/verification-summary.json)。\n';p.write_text(s)
p=r/'docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md';s=p.read_text();assert '### I59' not in s
s+='\n\n### I59 · 同来源RNA双特征计数（完整工程与局部实际浏览/source/export通过）\n\n'+paragraph+' 本轮推进F03/F13/F14/F16/F17的准确对象操作与导出，不能完成源数据缺口、跨来源identity、内部结构或完整Goal。\n';p.write_text(s)
x=json.loads((q/'verification-summary.json').read_text())
x.update(status='PASS_BOUNDED_ENGINEERING_NATIVE_UI_AND_SOURCE_EXPORT_PENDING_FINAL_REPLAY_AND_PRESERVATION',canonicalAdmissions=4,operationalStageInputs=2584,actualBrowserValidated=True,nativeDownloadLandingVerified=True,fullResearch={'actualExitCode':0,'tests':1526,'passed':1511,'conditionalSkipped':15,'failed':0,'cancelled':0,'log':{'path':str((q/'full-research-final.log').relative_to(r)),**pin(read(q/'full-research-final.log'))}},actualViewportTests=[390,1280],unchangedProductCandidateTargets=7,actualSourceReplayPaths=['independent-source-native-export/I59_ACTUAL_DOM_SOURCE_AND_NATIVE_LANDING_REVIEW.json','independent-source-followon/I59_FOLLOWON_ACTUAL_SOURCE_REVIEW.json'],nativeProxyFrozenLog={'path':str((q/'native-proxy/requests.jsonl').relative_to(r)),**pin(read(q/'native-proxy/requests.jsonl'))},nativeTemporalReplayPending=True,positionsReplayPending=True,unverified=['native pending-route cancellation','200% zoom','screen reader','whole-App budgets'],fullGoalComplete=False)
(q/'verification-summary.json').write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
print('I59 final engineering/source/native UI documented; immutable temporal and Positions replay pending')
