# I10：来源二维形态的三维半径表面约束

2026-09-30，继续用户授权的MD实施。范围为UPG091／F02当前比较器和共用source-local viewport的可复现科学显示错误，不改变149观察集合、源坐标、原直径数据、原几何hash或任何未知实验身份。完整形态view replay仍是独立后续工作。

## 修复前真实证据

生产页面通过URL请求NMO194468的radius模式，实际科学receipt记录source dimensionality=2D、radiusAuthorized=true、actualMode=radius、radiusSurfaceStatus=DERIVED_FROM_OBSERVED_RADIUS、viewport effectiveRenderMode=radius。参见[修复前DOM receipt](qa/2026-09-30-implementation-10/before-planar-radius-receipt.json)。源码表面算法生成三维frusta；平面相机锁不能使三维extrusion成为来源观测。

NMO194468／194469的来源均为2D且sourceDiameterAvailable=true。194468标准几何162,339 B／SHA-256 9950dc94612fc7d0c674507990913ba2ce9aa867495472db2bc01a2da2a925b4；194469为111,972 B／20aa79c2273bea9a61ada67abfc3e11f8d8b10a2598be89cda9374f4867d924d。两者保留原数据与直径profile，不能把“无三维授权”重标为“No Diameter”。

## 实际修改

比较卡片的按钮、source switch、实际mode判断使用既有canUseRadiusDerivedSurface；共用viewport使用resolveMorphologyRenderMode。两者要求source-labelled 3D和明确来源直径，显式skeleton选择继续优先。2D请求radius时实际只显示原平面centerlines，radius按钮禁用；native sourceRadiusAvailable仍独立用于原直径profile。

浏览首次修复后还发现13轴microdetail表把这两个2D对象标为DERIVED surface；现在同样沿用共享维度门槛，diameter_input保留OBS、radius_derived_surface改为UNAVAILABLE及准确2D理由，源数据未改。

科学receipt沿用同一维度门槛，分别记录requestedMode、actualMode、sourceDiameterAvailable、radiusAuthorized、source_labelled_2d_no_depth_or_extrusion及not_rendered。runtime scale／binding若仍声称radius直接拒绝，CSV输出实际skeleton和radius_authorized=false。原source data、analysis、尺度、hierarchy、分母和零REG／内部对象范围保持。

当前validator将原始diameter input和显示授权分开：94源diameter records保持原合同值，92来源3D可生成DER、2来源2D禁止extrusion；共50surface unavailable包含48 No Diameter和2planar。逐记录维度边界及精确计数均核对，未改写历史0.1数据合同。中间完整入口的计数错误退出1保留，不作为通过结论。

专项覆盖两个准确源对象的正向fallback、原diameter保留、原hash／零z extent、CSV与真实3D正向模式；负例伪造2D runtime radius必须拒绝。既有149份真实geometry byte／source-frame验证继续运行。

## 验证状态

最终36／36专项通过，完整research入口退出0：**1,160 tests／1,145 passed／15 conditional skips／0 failed**，build／strict typecheck／lint及全部validators通过，602当前input byte receipts。见[最终完整日志](qa/2026-09-30-implementation-10/full-research-validation-291.log)与[专项日志](qa/2026-09-30-implementation-10/targeted-tests.log)。此前未更新microdetail的1,159／1,144／15／0通过仅为中间状态；随后旧计数validator退出1的日志保留为[失败中间记录](qa/2026-09-30-implementation-10/intermediate-diameter-count-failure.log)，两者不冒充最终验收。

正式页面监听127.0.0.1:3003。两条2D对象直接radius深链接均requested=radius／actual=skeleton／radiusAuthorized=false／sourceDiameterAvailable=true／not_rendered；原生source swap清除旧receipt，3D NMO45674正向radius仍DER。13轴表及JSON保留diameter_input=OBS而surface=UNAVAILABLE，平面相机保持锁定。NMO194469键盘Enter展开并步进到node317：source type6、radius0.5µm、源坐标−153.5／1,572.38／0µm和原直径profile均可读，未丢弃源信息。

390px document／scroll均390；卡片338／scroll336、viewport336，无页面横向溢出，Enter准备receipt成功；临时viewport已恢复。实际DOM记录见[最终浏览记录](qa/2026-09-30-implementation-10/browser-final-receipts.json)，[桌面](qa/2026-09-30-implementation-10/planar-card-wide.png)、[窄屏检查](qa/2026-09-30-implementation-10/planar-inspection-390.png)、[窄屏receipt](qa/2026-09-30-implementation-10/planar-receipt-390.png)均已保存并目视核对。JS／JSON／CSV经同一实际mode门槛；此轮未核实Blob文件落盘。

UPG091仍in progress，full-view camera／renderer／clip／inspection重放及其他legacy路径未全部完成；79精确completed、M2／M4及全部Goal未改变。目标保持active。

回滚按/private/tmp/ohri-i10-before逐个恢复受影响文件，移除本轮新时间轴与新增manifest输入行后重建当前2.91；不覆盖其他dirty内容或冻结2.90。无commit、publish或外部消息。
