# I08：旧形态比较入口的共享来源身份

2026-09-30，继续用户授权的MD实施。差额为UPG097／102在149个已准入比较记录（142固定census＋7独立routes）的旧入口。准确来源、namespace、native string ID及unknown实验层级在卡片和科学JSON／CSV一致；选中2–4对象保留全部1／3／6组typed co_display_only关系。物种、年龄、label、repository ID与已知形态观察不能补造physical cell／specimen／section／synapse身份。所有源文件、科学几何和既有dirty改动保留。

## 实际改动与证据范围

- adapter按固定source-frame和supplementary合同核对149个唯一观察键、asset、geometry bytes／hash、源维度／frame、collection membership和7条准确route版本。当前合同派生hierarchy；导入／CSV前重算canonical identity及pairwise关系，changed namespace／ID／null原因／关系升级均拒绝。
- receipt schema 0.4.0、release 2.91.0-research.1，保留previousReceiptRelease 2.30.0-research.1、原descriptive metrics／分析单位／source bounds／target-plane scale。CSV在原指标后保留每个对象准确hierarchy及涉及它的pairwise关系。actual完整camera／renderer／clip／inspection图层恢复仍未实现，此文档不作为完整view replay。
- 原生可展开详情提供当前prepared receipt。source、mode、viewport revision／scale或源验证状态变化后同步失效；准备／JSON／CSV均使用同一当前runtime绑定。

## 浏览中发现并修复的两个问题

首次完整工程入口通过后，真实生产浏览发现：切换／移除／新增选中对象时旧逻辑清空全部runtime maps，而未变更且仍mounted的viewport不会重新报告，因此导出永久禁用。现在只使实际变更／移除对象失效，未变更对象保留准确当前绑定；新viewport仍须自己通过源及runtime gate。popstate恢复requested modes，当前mode不一致的绑定仍不能导出。

随后发现全部7个supplementary几何被旧source-frame比较误拒绝：bounds的min/max字段插入顺序不同，实际数值与固定合同完全一致。抽出可直接测试的runtime gate，比较精确JSON值而不以对象键顺序判漂移；数组顺序、finite值、单位、frame、变换、身份、零REG和2D无推断z仍严格核对。未更改任何原geometry。专项直接读取149个实际geometry文件，重核bytes／SHA-256并通过同一runtime gate；14种错误值及两个2D对象推断z均拒绝。

## 最终验收

最终30／30专项通过，strict typecheck／lint通过。完整research入口退出0：**1,151 tests／1,136 passed／15 conditional skips／0 failed**，build、全部validators、strict和lint通过；564当前input byte receipts。见[最终完整日志](qa/2026-09-30-implementation-08/full-research-validation-291.log)、[专项日志](qa/2026-09-30-implementation-08/targeted-tests.log)。两个先前工程通过日志各1,147／1,132／15／0，保留为浏览修复前／source-frame修复前中间结果，不冒充最终build验收。

正式页面为仅监听127.0.0.1的3003生产服务器，Codex In-app Browser／当前本机。实际四census、mixed NMO45674＋三census、2D NMO194468、缩放、radius-derived、移除至三对象、重新新增至四对象均可准备准确当前记录。每次source／mode／scale／member变更旧textarea立即清零。2D zoom的target distance 11.474458→9.179567、micrometre/CSS-pixel 13.790212→11.032170，来自真实DOM receipt；不据此声称共同物理尺度。三／四对象深链接、Back／Forward的选中IDs与1／3／6关系正确，旧receipt清零。

390px viewport／document均390；4张identity卡width336、scroll334，receipt textarea约310.4／scroll310，没有页面横向溢出。Enter展开／收起identity、准备和CSV请求通过。[实际DOM记录](qa/2026-09-30-implementation-08/browser-comparison-receipts.json)、[深链接记录](qa/2026-09-30-implementation-08/deep-link-three-receipt.json)、[桌面截图](qa/2026-09-30-implementation-08/morphology-identity-wide.png)、[窄屏身份](qa/2026-09-30-implementation-08/morphology-identity-390.png)、[窄屏准备](qa/2026-09-30-implementation-08/morphology-receipt-390.png)已保存并目视检查。Blob下载请求可观察，落盘未核实；未再打开曾异常阻塞的file chooser。

UPG097／102仍partial；其他legacy adapters／intake／view export未全部接入，真实physical／section跨源证明仍缺。M2／M4及全部Goal继续未完成，目标active。无commit／publish／外部消息。回滚只按 `/private/tmp/ohri-i08-before` 的受影响文件逐项恢复，包含source-frame TS前态；不要覆盖其他dirty内容或冻结2.90。
