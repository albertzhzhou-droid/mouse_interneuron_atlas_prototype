# I15：形态档案的当前渲染规则与旧声明对账

2026-09-30（America/Toronto），继续用户完整MD Goal，同一dirty工作树、2.91.0-research.1，未发布。上一轮I14改变实际来源加载链、完成工作与产生有效验收，属于progress；本轮不重复其producer。当前修复I14实际浏览发现的两条二维旧档案“surface可用”说明，并将整个179条形态档案／科学导出按准确范围统一。

## 变更与准确范围

新增共享declared rendering policy，分别从规范142 census、7 supplementary 8.6.124和30 Todd supplementary 8.6.126来源取得原dimensionality／diameter、frame、geometry声明与准确locator。必须匹配当前档案的focus完整键／namespace／成员贡献／文件path与SHA／未注册frame；改source、version、frame、file或membership不输出政策。政策只说明原source声明与项目3D＋diameter＋current private proof门槛；明确actual source-byte verification及current rendered view均not_included。它不能替代I14 actual runtime proof，也不生成内部结构或registration。

Research Explorer与active-record两档案入口展示相同Current morphology rendering policy。2D禁止surface／thickness／depth，No Diameter不接受placeholder radius，合法3D在当前私有geometry验证之后才允许明确DER。原Radius-derived surface字段在原index／record／JSON中逐字保留，UI和CSV标作Archived radius-surface declaration，original value／authority／locator／index保留；不将旧项目文字作为当前许可。

scientific source scope及dossier升schema0.2.0，record字段／所有原fieldLocators与missingness无损，新增renderingPolicy及archive interpretation。CSV输出当前declared source与rendering gate独立group，再保留archive scope的旧field。CSV重新从当前exact声明推导policy，拒绝篡改许可、复制其他对象policy、虚构actual geometry/view verification、修改原field和旧schema；不把科学dossier改称视图恢复。

准确范围：179个实际geometry文件的bytes／SHA、native dim／diameter与各自声明一致。142 frozen有94 native diameter／92个3D surface gate／2个2D；7 supplementary有5／5／0；30 Todd有10／10／0。总109原diameter输入／107个条件性DER gate／2个2D／70 No Diameter；该分来源对象统计不等于合并population或animal／cell分母。149条旧surface声明与30条独立Todd原fields分别保留，全部671当前档案的所有原field与source scope未损失。

## 验证状态

18项专项及typecheck通过，新增6项有实际179-file重放、all671 source fields、两条2D JSON/CSV、独立supplement/Todd版本、changed metadata和CSV伪造负例。第一次测试合并数预期遗漏5条supplement直径，已用三个规范源及全部实际geometry对账修正测试，未修改原source字段。完整research入口退出0：1,201 tests／1,186 passed／15 conditional skips／0 failed，build／strict typecheck／lint及全部validators通过，650当前input byte receipts。实际日志见[本轮完整入口](qa/2026-09-30-implementation-15/full-research-validation-291.log)。

正式3003页面核验两个档案入口194469的policy与原record完全相同；194468同样保留diameter且禁surface。Todd322379 no-diameter／322382条件性DER与45674独立8.6.124 supplement均实际准备schema0.2 dossier，unknown物理身份与candidate-only source信息保留。native准备的6份JSON独立用当前CSV函数重放；JSON／CSV中的policy只declared metadata，actual source-byte／rendered view不包含。原生CSV按钮响应notice，Blob落盘未观察，派生CSV属于从实际prepared JSON重建，不声称浏览器下载文件。

切换旧prepared清零；Back完成后准确109005 census policy、Forward完成后准确45674 supplement policy，两个方向prepared count0。切到Alkaslasi I1分子档案policy0／旧prepared0，新dossier.renderingPolicy为null，aggregate单位保留。390px下Explorer用Enter展开旧声明与field locators、prepare有效，两个入口policy widths288／306、document width390，无横向溢出。所有实际JSON、DOM、CSV重放与已视觉检查截图见[QA目录](qa/2026-09-30-implementation-15/)。

最后仅同步文档／任务描述和当前清单，不再改功能JS；后续最终构建与相应source-scope／policy／queue／manifest检查分别保存。原科学输入相对本轮前manifest逐byte／SHA核对；task registry描述更新与科学数据分开记录，2.34／2.90 frozen manifest保留。

## 后续与回滚

此增量只补真实scientific disclosure/export gap。individual／main-scene实际camera／layers／clip／inspection／renderer-build full-view restore仍待继续；M2／M4真实same-cell源链和所有MD其他条件未完成。31／41／13／4／387及243任务、79 exact completed保持；UPG091仍in progress，不把policy新增计为全部完成。

回滚限/private/tmp/ohri-i15-before/owned-inputs.json的11份本轮前态、本轮新增policy JS／d.ts／UI／CSS／专项测试／本时间轴及当前清单重建，不覆盖其他dirty改动、不改原scientific index／geometry／SWC或2.34／2.90 frozen manifests。
