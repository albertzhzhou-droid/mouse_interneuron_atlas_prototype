# I11：形态几何的真实运行字节凭据

2026-09-30，继续用户授权的全部MD目标。UPG091／F16后续完整视图恢复前，先完成149准确source observations的实际geometry loader凭据与科学导出约束；本轮不宣称camera／renderer／clipping／topology／inspection全视图重放。

## 实际源码增量

独立byte producer仅接受固定149 disclosure的完整精确JSON值与native ID／asset／path／bytes／SHA／raw-SWC声明hash／frame／dimensionality／collection membership。读HTTP response的实际ArrayBuffer，核对长度与Web Crypto SHA-256后decode／parse，并核当前source-frame及segments原数量。payload及全部内部数组／对象冻结，只有该实际producer能在private WeakMap登记receipt。复制JSON、公开status、换源对象、改file或同长度改bytes均不能取得运行凭据。

receipt保存确切standardized geometry URL／长度／实际sha、native IDs、source frame／dimensionality、runtime sequence与核验时间；scope明确standardized geometry bytes only，raw SWC hash在此只是来源声明，不能被自动写成raw文件已核验。fresh load使用cache=no-store与新sequence；普通cache复用仍需核当前record与private receipt，失败请求仅清除它自己的cache promise，防止旧失败删除后来成功请求。

取消在fetch前、响应后、bytes后和SHA后检查，未完成请求不能登记可信payload。hook在record切换后的effect异步清理之前即拒绝暴露旧payload，避免旧几何短暂挂在新record标题下。未改源坐标、原始直径、metadata、source/missingness或任何scientific count。

比较卡片／runtime map携带真实immutable geometry与private byte receipt。科学comparison builder同时核原public hash与实际private payload，JSON schema提升为0.5.0，geometry嵌入runtimeByteReceipt；CSV新增完整receipt JSON列。sequence属于prepared signature，旧byte代次不冒充当前。serialized receipt是核验记录，不能单凭它重新开放renderer。

## 专项验证及当前状态

最初33／33专项、strict typecheck与专项lint通过；加入mode语义转换后最终39／39专项通过。实际3D NMO108974、2D NMO194468和supplementary NMO45674的源文件用于byte producer正例；所有149真实geometry SHA／frame专项仍保留。8个新source byte测试覆盖immutable值、克隆/错误源、错误长度／同长度checksum、field drift前零请求、cached-current-record拒绝、明确no-store／新代次、early/late abort、404无替代。科学导出负例验证missing／cloned／other-source payload拒绝；CSV与真实private receipt相同。既有cache测试加fresh bypass和新cache值，metadata/同ID旧source gate不放宽。

首次完整research入口退出0：1,169 tests／1,154 passed／15 conditional skips／0 failed；build／strict／lint与全部validators通过。正式浏览已确认0.5科学receipt的实际byte proof、111,972B二维194469与844,047B supplementary45674的准确asset/path/hash以及source切换旧receipt清除。

浏览还确认一个原有mode操作缺陷：初始URL radius请求从2D切到合法3D后已处于radius，再次点击active radius会清空runtime maps，视口因实际mode不变不重建，导致导出永久禁用。updateMode现在区分requested变化与effective变化：重复active选择保留当前binding与prepared receipt；2D的radius请求改为明确centerline时，实际skeleton不变、当前binding保留，但requested provenance变化会清除旧prepared receipt；只有actual mode变化才使viewport绑定失效。专项覆盖3D／planar／No Diameter和两种mode的全部相关转换。最终完整入口与same-active-button／planar请求转换回归正在运行，首次通过日志仅为中间状态；一个中途工程run被停止以接入此相关转换边界，不声明其通过。

## 最终工程与正式页面验收

最终完整入口退出0：**1,170 tests／1,155 passed／15 conditional skips／0 failed**，build／strict typecheck／lint与全部validators通过，609当前input byte receipts。见[最终完整日志](qa/2026-09-30-implementation-11/full-research-validation-291.log)、[最终专项](qa/2026-09-30-implementation-11/targeted-tests.log)。首次1,169／1,154／15／0是mode修复前中间状态；另一个中途run按新相关修改停止，均保留、均不冒充最终通过。

正式页仅监听127.0.0.1:3003。实际receipt schema0.5.0记录标准化geometry的准确asset/path/bytes/actual SHA、source dimensionality、核验时间及sequence。二维194469（111,972B）源radius请求仍actual skeleton；supplementary45674（844,047B）合法radius与centerline均可准备当前private proof。换source与真实mode变化清除旧receipt；重复active radius按钮保留原prepared文本及enabled状态；2D radius请求切到明确skeleton时旧receipt立即清除、Prepare保持可用、新receipt requested=skeleton／actual=skeleton，byte sequence不被伪装成新读取。未展示旧源geometry，也未发生当前source提示error。

390px document／scroll均390；3卡338／scroll336，readonly receipt约310.406px／scroll310，没有页面横向溢出。Enter准备与CSV请求已实际操作；Blob落盘未核实。临时viewport已恢复。见[实际DOM记录](qa/2026-09-30-implementation-11/browser-final-receipts.json)、[桌面截图](qa/2026-09-30-implementation-11/byte-receipt-wide.png)、[窄屏截图](qa/2026-09-30-implementation-11/byte-receipt-390.png)，截图已目视核对。no-store fresh recheck的准确执行由真实源bytes专项验证；本轮尚无完整view restore UI，不把单独API测试改称浏览恢复验收。

## 剩余范围和恢复断点

UPG091继续in progress，完整camera／actual renderer／clip／visible layers／source branch选择与dim／同源force reverify恢复尚未接入UI。M2／M4、全部F维度与所有Goal未完成，目标active。下一轮复用本轮private byte producer，不能恢复为仅hash字符串的运行声明。

回滚只按/private/tmp/ohri-i11-before中本轮受影响文件及补建的I10前态恢复，再移除三个新module/test与本时间轴的manifest输入并重建2.91；不覆盖其他dirty内容或冻结2.90。无commit／publish或外部消息。
