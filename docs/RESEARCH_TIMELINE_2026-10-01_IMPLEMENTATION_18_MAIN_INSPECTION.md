# I18：主视图准确 SWC 分支检查与恢复

日期：2026-10-01（America/Toronto）。用户完整目标继续 active；前一轮 I17 为已完成并验证的实际增量。

本轮在现有主视图接入共享 SWC 检查器：准确节点选择、祖先路径、后代边、源坐标和 cable 描述、来源半径许可、淡化与聚焦。显示变换作用于 picking、overlay 和 focus，不能改变来源坐标或授予注册。切换源、失败和 renderer 清理释放监听与旧选择。

主场景 source-view 升至 schema 0.2，包含准确 selectedNodeId／contextDimmed／overlayAuthority；27 个指定 build inputs 覆盖共享检查器及其样式和视野计算依赖。恢复继续要求同源私有字节 proof、no-store、实际新 scene／camera／layers／clip／bounds 与 inspection 回验。I17 schema 0.1 和旧 build 凭据保持历史范围，不改写旧验收记录。

范围内 14 个启动前输入保存在 `/private/tmp/ohri-i18-before/`，QA 中记录精确路径与哈希；其他原有未提交工作保留。未改变任何科学源文件、原坐标、直径字段、集合成员或 same-cell／REG 门槛。最终完整工程结果与当前native证据分别记录于末段。

首轮专项 22/23：新增 bounds 测试在计算基线前未更新 parent world matrix，已修正测试准备；首次类型检查和 lint 暴露新增可选 transform 参数推断及 render 中读取 ref，分别用准确类型注释和 React state 解除，未降低检查。随后 23/23 专项及完整 strict 类型／针对性 lint 通过。

首次 native 已成功选择并淡化节点62、聚焦、改变相机后恢复，以及跨页面 fresh no-store 恢复，camera／inspection一致。二维194469节点24在390px／Enter也恢复成功、无横溢。但截图显示检查器位于 model-stage 内，遮挡实际画布；本轮修正为挂载到画布下方的独立 DOM 容器，renderer 尺寸与工具内容不互相撑高。修正前证据保留 `qa/2026-10-01-implementation-18/before-layout-fix/`，首次完整入口主动中断为exit130，不能当作完整通过。修正后专项23/23；完整入口和 native 必须重新验证。

剩余全目标仍包括 legacy fallback PNG／全局 state import／其他 viewer 的实际视图整合、其余 F01–F20 差额及 M2／M4 真实数据证据链。


最终 native 复验：检查器完全位于画布外，390px页面canvas500px、检查器top等于canvas bottom、document scrollWidth390px。浅底高亮不足已用仅主视图的深金／深绿显示色修正；第二次完整入口因该实际视觉差额主动中断exit130，保存在before-contrast-fix，不能当作通过。最新build退出0，当前专项23/23。当前27 build inputs的SWC／radius节点62淡化聚焦恢复、刷新页面恢复、实际点击节点136、二维390px／Enter节点24、No Diameter242822、错source/node/build、missing生成副本清inspect/proof/receipt/DER及fresh retry均通过。相机最大差0；MICrONS独立参考下隐藏NMO节点62与7辅助文件、Z80240nm cell shader clipping／隐藏nucleus恢复通过，0 joins／0 REG。

原始科学输入从未移动或修改。missing试验仅临时移走dist生成副本108974（184927B，SHAe3c932a063b379c3e0606d0420ade0830210e7bb9c54e7b20830442e8334a25a），已原byte/hash恢复；Failed to fetch与静态ENOENT为实测范围，不声称HTTP404。首次新测试和类型/lint失败日志保持原范围；后续通过不改写旧结果。最终修正代码的完整 npm run test:research 终态exit0：1,221 tests／1,206 passed／15 conditional skips／0 failed；build、strict typecheck、全项目lint、全部数据及历史snapshot validators均通过。676当前input byte receipts通过，398固定科学输入无变化，冻结2.34／2.90 manifest byte/hash保持。当前专项23/23包含4个新增测试，不用179条CPU重放宣称179次native验收。最终文档同步、重建及重建后正式恢复的独立结果见QA summary；其他legacy实际导出及全Goal仍active。

第一次跑到终态的当前代码完整入口exit1：1,221 tests／1,205 passed／15 conditional skips／1 failed；build／strict／全项目lint／全部validators已经通过。唯一失败是既有research-visual-target静态测试把effect依赖数组固定为五项，未包含新增clearInspection；实际取消加载和释放源几何逻辑仍在。测试已更新为要求该依赖，并额外要求layout阶段先释放inspection、清当前geometry proof以及fetch effect取消；没有删除原断言或放宽科学许可。该测试编辑前副本另存有限rollback，加入当前manifest；原14文件启动前rollback不改写。失败终态日志单独保留，随后40相关专项全部通过；最终完整入口复验结果见上段及QA summary，不能用专项或旧通过替代。
