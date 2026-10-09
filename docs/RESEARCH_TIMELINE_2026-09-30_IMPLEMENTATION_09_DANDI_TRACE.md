# I09：固定DANDI版本的原始采样预览

2026-09-30，实施UPG154的独立trace-only信息入口。固定001469／0.250611.1844 metadata与完整61条asset manifest；代表NWB只读15块HTTP206源范围，共3,918,112B，按Content-Range／asset ETag及每块SHA-256核对。355,191,072B整NWB及148,803,537,183B corpus未下载，整文件SHA仅declared。

缓存h5py只读重放准确DTR electrode table及32个group refs，无网络；源subject、ElectricalSeries、table、group稳定ID保持，session_id确实缺失。源volts／conversion1／offset0保留，物理校准未独立证实；electrode坐标单位缺失，无atlas或cell/type/morphology/synapse关联。CC BY 4.0为immutable Dandiset声明，asset无单独license字段；保留准确citation及该范围。

首秒channel0的30,000个int16原值无损派生76,202B，SHA-256 ba4bd75e9637ca171c05d43d864c633e33c52c33d679d6e144ebe54b975f40e5。按需加载、运行时bytes/hash验证后才绘制每点；100ms窗口／source sample cursor／JSON receipt／exact CSV及同源恢复。UI若关闭立即unmount／abort，late response不能发布。原core31sources／387profiles等分母未扩大。

专项与真实浏览详见下文。UPG154仅有界预览，全部Goal与M2／M4继续active。前态为 `/private/tmp/ohri-i09-before` 的受影响文件，无整库复制／外部发布。

## 验证与实际浏览

23／23 trace＋registry＋manifest专项通过，最终带引用trace专项7／7通过；离线h5py／PyYAML重建逐字节一致，重新取得工具对20个已有固定源文件复核后0新网络字节。原始元数据与15块range完全保留。使用temp Python3.9.6、h5py3.14.0和PyYAML6.0.3；未修改项目或系统Python依赖。完整入口最终退出0：**1,158 tests／1,143 passed／15 conditional skips／0 failed**，build／strict／lint及全部validators通过；595当前input byte receipts，canonical31sources／41sets／13rosters／4objectsets／387profiles、243任务／79精确completed保持。[最终完整日志](qa/2026-09-30-implementation-09/full-research-validation-291.log)、[23专项](qa/2026-09-30-implementation-09/targeted-registry-manifest-tests.log)、[最终trace专项](qa/2026-09-30-implementation-09/targeted-final-trace-tests.log)。

初始lint发现effect内同步setState与render读取ref，已改为初始null与异步loadedGeneration state，未禁用规则。两个完整工程中间结果也通过1158／1143／15／0：随后分别按实际窄屏截图修正坐标文字过小，以及给独立导出补完整citation／source URL／DOI／license。各中间日志保留，不冒充最终build。响应式SVG使用实际容器宽度，390px保持260px高、13px坐标字；窗口的3000原始点全部绘制，不做decimation。

正式浏览为127.0.0.1:3003/source-audits、当前本机Codex In-app Browser，明确单loopback监听。打开details才载入76202B并通过实际SHA；样本0为19／0s，最后29999为2／0.9999667s，键盘Next＋End的5999为−10／0.1999667s，均与源原值一致。修改volts为microvolts的restore被拒绝且窗口27000保持；准确receipt恢复0窗／0cursor。关闭主details后0plot／0receipt，重开重新核验源并按当前URL恢复3000窗／cursor0，不残留旧cursor或restore text。最终带citation版本再次实际恢复及CSV请求通过。

390viewport／document均390，panel358／plot333.609375，SVG260高／13px标签／3000points；准确electrode表32行展开后无横向页面溢出。Enter控制details／Next／restore／导出，Home／End控制sample cursor均已使用。原生subject与ElectricalSeries／group／table IDs、unknown cell／section／session及calibration retained。见[实际DOM记录](qa/2026-09-30-implementation-09/browser-trace-receipts.json)、[最终带引用receipt](qa/2026-09-30-implementation-09/final-attributed-receipt.json)、[最终桌面](qa/2026-09-30-implementation-09/trace-plot-wide-final.png)、[最终窄屏](qa/2026-09-30-implementation-09/trace-plot-390.png)、[窄屏来源身份](qa/2026-09-30-implementation-09/trace-identity-390.png)。截图已逐张目视检查。导出Blob请求已观察，落盘未核实；source-view不是完整355MB recording replay。

UPG154状态为partially completed — bounded trace preview only。只有channel0首秒有bundled samples，其余31channel及后续recording未提供viewer，physical calibration与source session字段缺口仍保留。raw HTTP范围的ETag／本地hash不作为整个NWB的SHA验证；metadata count不扩大cell／interneuron分母。其余legacy来源／view exports、M2／M4与完整Goal仍待完成，目标active。后续优先解决形态比较器二维source虽然有diameter但不应生成三维radius frusta的具体差额，再继续view receipt剩余入口；目前该问题仅静态定位，需真实浏览核实和独立实施。
