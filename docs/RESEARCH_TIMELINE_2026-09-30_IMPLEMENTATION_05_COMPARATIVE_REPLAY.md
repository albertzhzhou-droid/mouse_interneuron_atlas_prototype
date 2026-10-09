# I05：两份独立SWC参考的身份与视图恢复

日期：2026-09-30。范围为现有准确snapshot的NeuroMorpho183779（zebrafish）及34024（rat）；不新增source assets或科学对象。保持2.91工作树和冻结2.90父manifest，全部MD Goal仍active。

## 已实施范围

- 两份source reconstruction接共享身份层级：准确source、release、namespace、native record/observation ID已知，physical cell/specimen/section继续null与原因。共享typed关系明确co_display_only，没有源间same-cell／same-section／population关系或几何转移。
- 每个source card可捕获当前视图、导出view receipt、粘贴receipt并恢复。新契约复用共享camera/layer/frame验证，并额外对照完整canonical source object、当前loader三个确切文件receipt、独立scientific scope、准确identity、已渲染generation、THREE版本及由原始几何bounds计算的center/scale。
- renderer每次实际publish加入global clip planes和local clipping开关，camera near/far保留。当前viewer实际无custom clip planes；导入缺失/虚构planes被拒绝。五来源原有旧receipt没有新增optional字段时继续支持原版本协议；comparative新receipt必须带实际clip状态。
- 恢复先验证，随后清除旧viewport/actual-view，重核API/SWC/morphometry所有字节后以新的loader generation恢复camera和requested/actual图层。失败时没有备用几何；重试保留已经核验的恢复plan。无renderer的text-only证据继续独立导出，不能冒充可恢复相机视图。
- 隐藏全部source-centerline仍是合法空白rendered frame；不制造膜、半径surface、胞体、内部对象或mouse身份。rat原23→12soma assertion、L420-LCN/L420_E2未成立关系和历史receipt drift原样保留。

## 当前验证

新增9项view replay＋原6项source loader＋9项共享workspace状态：**24/24通过**。正例使用两份实际源文件经原checksum loader得到的receipt；负例包含另一source payload、过期generation、文件hash、科学scope、身份parent/unknown改变、错误bounds/scale、degenerate camera、renderer差异、图层／clip伪造、text-only状态。strict typecheck和专项lint通过。

完整 `npm run test:research` 退出0：**1,122 tests／1,107 passed／15 conditional skips／0 failed**，正式build、strict/lint及全部research validators通过。[完整复验日志](qa/2026-09-30-implementation-05/full-research-validation-291.log)。当前534项输入receipt；source31／recordset41／roster13／objectset4／profiles387／243任务／79精确completed保持各自单位和旧snapshot，不加入这两份比较source到mouse分母。

正式3003浏览验证：[机器可读结果](qa/2026-09-30-implementation-05/browser-validation.json)。source-centreline隐藏→capture→显示→restore后新generation2的requested/actual均false，camera position差0；原始文件全部重新核验。随后在实际canvas拖动相机，position相对原视图改变约380.64display units，capture→reset→restore后新generation3相机差最大1.1368683772161603e−13，处于浮点舍入范围。实际clip为globalPlanes=[]、localClippingEnabled=false；THREE185、camera near0.1/far4000保留。

Rat card实际拒绝fish source的完整saved receipt；current rat scene未被替代。捕获rat自身receipt、reset与恢复成功，原始三个source conflict保留。390px下document/viewport均390，两个card宽358/scroll356，textarea324；Enter恢复及capture确认rat generation3、renderer324×260和真实centerline实际可见。[正式恢复截图](qa/2026-09-30-implementation-05/rat-view-restored-production.png)、[窄屏截图](qa/2026-09-30-implementation-05/rat-view-restored-narrow.png)均已打开检查。之后恢复viewport并保留本机preview；实际node44149仅监听127.0.0.1:3003，其他端口进程未改。

这些证明本机same-version source-view恢复，不是同一生物细胞、跨物种身份、定位准确度或3D内部结构证明。浏览器Blob落盘继续未验证，不将capture/导出按钮点击记为文件下载成功。

## 输入与回滚

新增 `app/comparative-swc-view-replay.js`、types、专项tests与本timeline。有限修改比较workbench/CSS、共享viewport/types及workspace replay单个comparative layer policy/optional clip验证。没有修改两份原始source contract或六source file的bytes/hash；保留所有既有dirty工作。只撤回本轮新增路径与有限hunks，不reset整库。UPG091/097/102保持partial；其他viewers、legacy source scope、辅助技术与M2/M4证据依赖仍待完成。
