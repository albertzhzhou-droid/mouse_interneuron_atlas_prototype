# I65 · 无效类型请求与重复链接迁移

日期：2026-10-07（America/Toronto）。实际工作跨UTC 2026-10-08；原始执行时钟保留。实施范围为F13／F15／F17有限修复，完整Goal保持active。

沿用当前新版首页、分级 SiteNavigation／侧栏、Breadcrumb、独立研究页面及浅色阅读布局。类型页面明确请求未知、空、重复、其他对象种类或过期编号时，现在显示不可用状态，不以 DE-1／首条记录替代，不选择来源行并禁用 dossier 导出；真实激活有效来源记录后恢复准确档案。没有明确请求时，原 DE-1 默认行为保留。

修改现有 InterneuronTypeAtlas 与外层 ResearchCollectionPage，完整保留重复 URL 参数，拒绝格式不完整的 canonical 请求，并阻止重复 legacy type 自动升级成有效 canonical 链接。有效 dossier 内容与导出生产器、现有来源标签浏览器、CSS、导航、原始来源数据、加载器及 package 保持。查询／完整筛选的 URL 历史恢复未在本轮完成。

真实浏览先发现 canonical 空编号仍显示 DE-1，修复后又发现重复 legacy 编号会自动取得有效 focus；两个原始失败均保留，再修复并重验。最终完整 research 实际 exit0：1582 项测试、1567 通过、15 既有条件 skip、0 fail、0 cancel，包含生产 build、strict types、完整 lint 与必需 validators；新增11项实际组件／外层路由测试全部通过。前两次完整检查各自真实通过但对应中间源码，不能代替最终检查。工作区直接检查的未完成／终止结果亦保留，不改成通过。

最终11条原生页面记录通过：重复链接原 URL 及刷新后仍不可用，canonical 空／重复／错误种类没有替代档案，未指定编号仍为 DE-1；390px 的零匹配、来源筛选不替换请求，native Enter 准确恢复 DE-2／80 sampled nuclei，后续零匹配仍保留该档案。新版侧栏及 Breadcrumb 始终存在，没有整页横向溢出。输入工具一次 target-token 拒绝及上一轮记录 helper 失败原样保留，未补造 action 时钟；最终稳定逐条原始记录与真实键盘动作单独保存。

同轮 UPG-173 的 ST4／rheobase 两次不同输入方式导出未在预期 Downloads 文件集合出现新文件；旧文件全内容及元数据保持。页面提示不算落盘，旧文件不代替新导出；UPG-173 继续 in progress，没有 ACTUAL_READY 或科学 completion。

当前 runtime ordered membership 198、private scopes 8、Positions40＋23保持；ResearchCollectionPage 属于原198成员，因此 whole-runtime SHA合法更新为990fd1ffd752aef551db386c123f9af30e0519ea036d96c0e62e62557ee4f8b0，不能声称整个runtime字节不变。新增测试及独立时间轴为准确 CORE2，canonical输入2614→2616。真正 accepted I64 保留2026-10-08T01:16:54.057749+00:00原时钟；原98-member archive全内容另核对，原文及每次局部修复前态独立保存。本轮工程完整检查与Stage当前清单检查、Root本轮变动文件对等应分别说明；不把继承的I64全部Root来源检查改写成一次新的2616输入Root物理重放。

32sources／42sets／387profiles、45named／181selectable／142census／39supplementary、13rosters／4objects、exact completed83／243以及身份／内部结构／REG准入不变。F13／F15／F17仅有限推进；200%实际缩放、screen reader、完整浏览历史、整站性能预算及M2／M4仍按原目标待验，完整F01–F20／243＋21／M0–M4保持active。

实际执行、失败尝试、原生逐条观察、截图与末尾范围见[QA](qa/2026-10-07-implementation-65/verification-summary.json)。本轮通过范围以实际receipt为准。
