# I20：实际视图导出范围及备用 PNG 记录

日期：2026-10-01。当前实现、完整工程检查及实际导出／重新导入验收通过；完整 Goal 保持 active。

上一轮 I19 完成实际全局导入及最终构建复验，本轮以前一轮为 progress。当前 F16 差额为全局 JSON 把整个 mainSceneView 列为非权威再生字段，及无 WebGL 的备用 PNG 未嵌入 actual-view 不可用记录。

范围：10 个已有文件启动前原副本、bytes/hash 与有限 rollback，以及4个新文件见 qa/2026-10-01-implementation-20/scope.json。398 固定科学输入在开始时重新逐文件核验不变；2.34／2.90 冻结文件不改写。保留已有 dirty 工作，不提交、推送或发布。

实现：JSON／CSV 单次捕获同一来源视图，实际源、构建、相机、图层、裁切、分支属于 fresh replay 的依据；事件时间、当前页序号／绑定等重新生成，viewport 与相机 aspect 随当前画布适配。容差直接引用实际 verifier 的1e-8常数；不声称像素相等。不可用记录仅支持 settings-only。

PNG 保留 ohri-source-view，并新增 ohri-png-export iTXt。后者区分实际主场景像素与 accessible text fallback，保留点击时 requested settings、当前来源、构建和导出范围；图像尺寸从已编码 IHDR 读取。备用快照必须携带当前对象的 unavailable，不能携带 actual geometry。编码像素块不重绘；既有 OHRI 记录拒绝重复以避免冲突。

启动时验收范围：专项 formatter／PNG CRC 与像素保持测试、原 source-view/import 回归、严格类型／lint、完整 research 入口、真实 JSON／CSV／PNG 文件导出与重导入、WebGL 不可用快照以及窄屏检查。未取得实际下载文件前不声明 native export Blob landing。

未满足的其它 viewer/export、F01–F20差额、真实同一小鼠脊髓细胞 M2／M4 源链继续保留；UPG-091 仍 in progress。

首次工程检查：34项 source-view/import/export 通过、focused lint退出0。类型声明中的 source 仅为object，严格检查无法读取 neuronId；现显式声明 neuronId/assetId，随后typecheck和生产build退出0。失败日志保留，尚未声称完整research通过。

首次当前浏览器 Export JSON notice 已观察，但10秒download event观察超时，未据此认定导出失败或声称落地。导出 URL 现保留为一个可重试的最新下载链接，替换或卸载时释放；形态文件名使用当前 NMO 记录。该链接也允许直接验证实际生成文件，不用构造 envelope 代替真实导出。

首个完整research终态exit1：1243 tests／1227 passed／15 conditional skips／1 failed／0 cancelled。失败仅为旧 rendered-html 测试要求 round-trip 字段内联于Atlas；现仍保留原全部版本、microns provenance与设置恢复断言，并改为检查已接入的共享导出模块。该测试编辑前有额外原文件rollback。

当前浏览器 waitForEvent/downloadMedia 都观察超时，开发日志无error/warn，不推断WebGL或下载失败。新增可展开的实际导出文本／PNG预览，最新可重试链接保留；Export text PNG 使用相同备用编码与metadata路径，明确是用户请求文字快照而非伪造WebGL故障。原WebGL unavailable路径的native失败条件仍单独未验证。

第二次完整终态exit1：1243／1227 passed／15 conditional skips／0 failed／1 cancelled。唯一取消是既有base-R stream test timeout120000ms；未改该测试，单独同精确测试复跑exit0、1/1通过（11.42s）。两次完整终态日志分别保留，不混算完整通过。

实际预览JSON为487081字符，按DOM分段读取完整内容；首次单次读取被200KB观察上限截断，原截断文本单独保留。实际rendered PNG与text PNG已由同Blob的data-URL预览取得完整编码，不通过构造fixture代替。图像目检发现旧renderer页脚固定INF/SYN字样与当前隐藏图层不一致；现改为从同一actual source-view receipt读取reference visibility，未知时明确not captured。修正前native文件保留在before-footer-native，后续必须取得当前构建的新文档。

完整research在reference visibility及CSV metadata修正后exit0：1244 tests／1229 passed／15 conditional skips／0 failed／0 cancelled（49.74s测试阶段）。随后native二维图像验收补充2D非三维重建及No Diameter的可见页脚说明，因此该完整通过保留为before-source-caption范围，当前代码仍需复验。空筛选CSV已实际验证0 evidence entity＋1独立viewport_metadata、无entity ID/kind；常规7 entities＋1metadata，format1.0.0，各行同一captured源。native当前全JSON实际导出后导入已达到no-store、node62/dim和camera完全一致；390px二维node24/Enter、PNG及无横向溢出通过，当前caption补充后仍需最终新文档。


最终代码与实际验收：source-labelled2D／No Diameter页脚补充后的完整research通过保留于before-wrapped-footer；390px/DPR1实际图片暴露页脚maxWidth压缩过小，现测量字体宽度、按行换行并扩展页脚。不会放大或重绘源canvas，保持标题至少15px、detail至少12px。含该最后修正的完整research终态exit0：1244 tests／1229 passed／15 conditional skips／0 failed／0 cancelled，测试阶段51891.098416ms；production build、strict typecheck、全项目lint及全部validators通过。最后相关source-view/import/export/rendered-html专项74/74通过，10项新formatter／PNG测试包括unique metadata、全部CRC及原encoded pixel chunks保持。

当前实际产物均重新取得：JSON108974 radius/node62/dim/focus、二维194469/node24/dim/focus及No Diameter242822；常规CSV7entities＋1viewport_metadata，空筛选CSV0entities＋1metadata。两个实际完整JSON经公开file chooser从其他记录重新导入，实际fresh no-store scene应用回验通过，camera数值完全一致。当前8份actual-view documents（5JSON＋3PNG）逐一匹配29指定build-input实际bytes/hash与原source byte replay，0 mismatch；文字PNG为准确currentNeuronId108974的unavailable，no actual geometry。

三幅实际主场景PNG648×579／364×676／648×562及1280×720用户请求text PNG由同Blob data-URL preview完整读取；逐PNG signature／IHDR／chunk bounds／全部CRC／唯一双iTXt／source/build/image-kind对账通过，四幅原分辨率目检说明可读、无页脚截断。2D保留deposited z，不宣称3D重建；No Diameter不宣称caliber/可测量源半径；requested settings不充当actual geometry proof。原source pixels可能因用户focus相机而在frustum裁切，不称整个arbor均落于画面。

native自动下载落盘仍未被in-app download event观察到，产物依据实际app可读预览／同Blob编码，与构造fixture和落盘观察分别记录。真实WebGL unavailable故障条件未natively模拟；用户请求text路径使用相同fallback encoder和metadata、明确用户选择，CPU负例和静态接线保持独立证据。398固定scientific输入最后逐文件bytes/SHA对账不变，冻结manifest在最终文档检查另核。10已有输入原rollback、4新增文件和后增1个rendered-html测试原rollback分别保留。没有提交、推送、发布或改写其他来源数据。

没有新增任务分母：registry继续243条、79精确completed，UPG-091仍in progress。全F01–F20与M2/M4目标未通过整体完成审计；下一增量继续尚未覆盖的legacy viewer/export及准确source-dependent输入，保留科学门槛。
