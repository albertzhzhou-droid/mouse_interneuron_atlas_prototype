# I07：研究索引的无损传输与实际加载记录

2026-09-30，继续用户已授权的MD实施；UPG230来源索引传输差额。当前2.91，冻结2.90保留，不删除既有dirty内容；source记录／namespace／missingness／原canonical JSON与manifest不改。原10,682,233B固定641-record索引无损gzip约269,594B；此值仅字节预算，不是浏览器速度改善或完整App性能证明。

范围：一个确定的gzip派生输入与其source hash、allowlisted server byte route；默认verified loader保留canonical URL，由生产静态服务器使用同目录gzip表示，另提供明确的gzip API用于独立测量。两条路径仍按相同canonical decoded hash和schema验证。记录manifest／fetch body／hash／JSON decode-parse／schema验证各阶段实际时间；已有source未改变时不重复fetch；abort与generation规则保留。

本轮前态 `/private/tmp/ohri-i07-before` 只含受影响文件；回滚限本增量。无外部托管/上传/发布，原始索引继续可访问。M2/M4和全Goal不因传输优化核销。

实际实现与来源边界：

- canonical JSON仍为10,682,233 B，SHA-256 `c3f879e0c34fc558683a50b598202ddb50036718ee56d63dc952cb0a46d648ac`；gzip为269,594 B，SHA-256 `731d550ae6847760f49ba0e03d5e77bd2a5f859ea41ebe2b57721818802b54a3`。压缩表示相对decoded字节少97.4762%，不等于历史网络传输或等待时间改善幅度。
- builder检查gzip确定性、解码逐字节相等和原manifest hash。API只允许这一固定文件，正确声明HTTP gzip，由浏览器解压；Cano原始gzip字节接口继续保持不同的编码语义。
- WeakMap保存加载receipt，原index／record对象不增加字段。fresh测量绕过shared cache并请求no-store，不替换当前collection；空Resource Timing保持null，不以Content-Length伪造actual transfer。
- 档案中按需展开加载记录。真实页面分别提供“Measure canonical URL”和“Measure explicit gzip route”，明确两条当前URL可能都gzip，不能充作历史前后对照。

工程验证：初始52/52专项通过；registry/transport 19/19通过；最终loader/active-record 37/37及molecular-concordance/transport 12/12通过。完整入口第一次发现UPG230旧validator固定要求planned，与已实施的partial范围不符；只允许planned/partial并新增拒绝whole-App completed的负例。第二次完整入口发现默认API破坏按canonical公共文件模拟fetch的现有molecular fixture；生产测量同时显示canonical URL也使用gzip，因此恢复原默认URL，保留明确API作为独立入口，不放宽fixture。最终完整入口退出0：**1,140 tests／1,125 passed／15 conditional skips／0 failed**，build／strict typecheck／lint及所有validators通过；550当前input byte receipts。[最终完整日志](qa/2026-09-30-implementation-07/full-research-validation-291.log)保留，失败中间日志也单独保留。

正式浏览验证在仅监听127.0.0.1的3003生产服务器，Codex In-app Browser／当前本机macOS：最终默认canonical请求实际encoded269,594 B、transfer269,894 B、decoded10,682,233 B，641条／原hash校验通过。该次默认data-ready586.3 ms；同一最终build两次fresh分别159.4 ms（canonical）、133.1 ms（明确API）。前一buildfresh值78.3／261.1 ms，均保留于[实际DOM receipt](qa/2026-09-30-implementation-07/browser-index-load-receipts.json)，展示明显单次波动，不据此声称默认速度改善。未取得I07前的同设备baseline，不声称整页JS parse/execute、场景ready或性能预算已完成。

两次测量后两个档案入口均仍是 `sci_entity:mouse.sc.vsx2_hoxa10`；source species／条件未被测量结果覆盖。390px下document宽与scrollWidth均390，加载详情／textarea均288px；Enter可折叠再展开。桌面与窄屏截图已实际查看：[正式页面](qa/2026-09-30-implementation-07/index-loading-production.png)、[390px](qa/2026-09-30-implementation-07/index-loading-narrow.png)。测量包括此数据请求成本，排除几何、全App JS execution和辅助技术完整验收。

队列UPG230为partially completed，精确completed仍79／243；原全部目标保持active。后续继续旧viewer的共享source identity／actual-view导出，以及全App键盘、zoom、辅助技术和可比性能预算，不由本增量核销科学M2/M4。
