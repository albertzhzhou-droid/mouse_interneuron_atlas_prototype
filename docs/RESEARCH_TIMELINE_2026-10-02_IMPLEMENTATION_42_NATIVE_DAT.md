# I42 · 逐文件原始 DAT 核验

2026-10-02，推进原 UPG-193，服务准确小鼠原生胞体轮廓与 F02/F03/F13/F14/F16。完整 Goal 与 M2/M4 继续保留。

七份已有原始 V3 DAT 从70-byte header逐对象解析到准确terminal marker。保留234个完整top-level源对象、89个原contour与全部nested block counts；仅原72个准入loop／5,149 vertices可显示。源tree、marker、spine、text与额外contour不自动成为native neurite、生物spine或内部结构。逐文件保留URL／filename／NMOID／bytes／SHA／权利与citation、parser版本及input pins、原source名称／类型／closed flags、坐标单位／frame与准入vertex／segment／closure basis。

源marker大小字段与实际解析字段的差额按准确文件、offset、名称和declared/actual bytes列出；不改原bytes、不使用通用放宽规则。外部固定parser源码只以临时文本读其byte布局，SHA与旧pinned receipt相同，未执行或复制外部程序。独立本地Python读取器重新遍历所有对象，完整structured audit与JS exact equal；原旧contour scanner的所有89数组亦保持。NMO45718独有legacy例外不向其他文件传播。

当前NeuroMorpho条款网页支持CC BY4及原paper、RRID、Tecuatl2024三项citation；没有程序化请求JSP。两个project-only DAT以相同原bytes另存public镜像，旧source catalogs保持。XML v4 NMF说明不是V3 binary byte specification，原µm convention与未标定／未注册frame边界显式保留。

浏览器必须先核对原始DAT bytes/hash、完整parser audit，再核对派生JSON与所有准入原ordered points，之后才发immutable private combined proof。源view／PNG携带actual raw DAT receipt；API元数据bytes仍declared-only。fresh restore重新请求原DAT、轮廓与选用的DER；失败／取消／换记录沿既有清除规则执行。原几何与异常、未注册坐标、No Diameter及源分类不变，无新增cell／surface／volume／internal／REG。

17原文件编辑前preimages及2,317既有authoritative pins已保存；后增owned文件须在修改前补入同ZIP。回滚只恢复明确owned preimages、移除本轮明确新增路径再重建current manifest；不Git reset或清除其他dirty work。

专项、全工程、实际browser、compiled source与input preservation的当前结果以`docs/qa/2026-10-02-implementation-42/verification-summary.json`为准；未通过的required checks不宣称完成。完整F01–F20、243原任务及M0–M4继续逐项核验。

18相关Node检查通过，包括七文件独立全量重放、same-size／missing原DAT拒绝、嵌入thumbnail的假contour不参与顶层目录、source property／closure／ID／coordinates篡改与两阶段取消。实际七来源capture及raw SHA改变的saved view拒绝／fresh original sequence与no-store复验通过；真实compiled asset故障使canvas和capture清零，源码与compiled故障副本准确恢复。首次只改public源副本不影响已编译preview，未计为bad-wire通过；之后准确dist served asset实际失败已通过。两个浏览器工具尝试失败（unscoped两个同名region、超长textarea截断）保留；按main scope及30,000-character逐DOM片段读取成功，完整源receipt未伪造。初次lint两处未使用字段失败已修复；一份多行shell脚本出现encoding错误、未执行修改，后续使用bundled runtime及正常patch成功；最终required check另封存。
