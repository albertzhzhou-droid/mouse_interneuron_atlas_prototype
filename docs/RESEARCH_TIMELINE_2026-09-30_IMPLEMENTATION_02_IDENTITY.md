# I02：共享对象身份、父子层级与关系证据

日期：2026-09-30。完整用户Goal保持active；I01是已验证阶段，不是全部目标完成。当前未打包2.91继续原位实施软件余差，本轮不新增来源或几何，不改变387source profiles／31sources／41recordsets／13exact rosters／4source-object sets的科学分母。

## 当前已实现

- 新共享identity contract保存source/release/namespace/kind/nativeID完整字符串，主对象key还包含其精确祖先context。同ID不同section/run/namespace/release不碰撞；specimen、section、cell、component、synapse明确known／unknown／ambiguous／not applicable，unknown parent为null和原因。source记录的计数单位保留，不将contour、detection、nucleus assignment或image/mask row全部当cell。
- Source-supported parent证据必须绑定同一source/release/namespace、精确父子ID/level和field locator。修改parent使原关联及exported hierarchy失效。MICrONS和BANC保留准确cell→component context；specimen/section稳定ID未知，不能由age/region/study/frame补齐。PALM仅AQ848源animal ID；acquisition不是section，detection不是unique molecule或cell。native DAT为轮廓对象，Micro image/mask row不获得虚构cell。
- 只有四类关系枚举。默认co_display_only；改变枚举必须有独立source adapter的verified evidence registry entry、精确endpoints/bindings、来源receipt和该关系的QC。共享label/marker/DOI不生成证明。cell与其distinct nucleus不是同一physical object；source population身份不开放geometry transfer、内构或REG。
- 当前真实positive仅Cano deposited profile→nucleus source population assignment：11profiles／923rows的runtime decodedSHA及source group/label/mapping验证后生成。原NA/unknown、P56datasetcontext保留，原RDS未重新取得。decodedCSV receipt显式写representation和428,897B，不冒充gzip文件字节。
- 五来源Objects和Cano名单已接可展开的Source identity/parent panel。当前selection同步决定hierarchy；Cano过滤/分页清除row时返回aggregate scope。JSON/exportedview携带当前hierarchy；restore若有该新字段须符合canonical namespace、parent和missingness，旧字段缺省仍从当前准确源重新派生。

## 当前验证及边界

10个新core tests通过，含真实MIC/BANC、native/PALM/Micro、全部11Cano profile assignments、distinct parent/component、不同population和实际MICrONS view restore的identity/missingness篡改。physical/section positive仅synthetic contract fixtures，不是新的科学source admission。相关Objects replay与Cano共28/28 targetedtests通过。局部lint曾发现control-regex规则，已改逐字符检查；不关闭规则。

本轮完整research入口退出0：1,095 tests／1,080 passed／15 conditional skips／0 failed，正式build、strict typecheck、lint及全部入口validator通过。当前509个input receipts保持逐字节重放；文档更新后的manifest另行生成。完整日志：[I02复验](qa/2026-09-30-implementation-02/full-research-validation-291.log)。

生产3003实际验证MICrONS nucleus4309→cell648518346349516051和未知specimen/section；PALM column1→source animalAQ848而cell/section未知；Micro train row0无虚构cell或geometry。切换source清除旧identity/geometry。Cano核GAGAAACGTTTGCGCC-1_1明确same_source_population、cell/specimen未知，Enter可展开panel；筛选零结果清除旧component与relationship并回到profile aggregate。390px时document width390、identity panel254／scrollWidth252，未出现该panel横向溢出；主App其他旧卡片仍有长code截断余差。截图保存在[本轮QA目录](qa/2026-09-30-implementation-02/)。只验证这组页面路径，不声称全App或辅助技术完成。

当前没有新的same-physical-object／same-section来源证明，没有鼠脊髓真实同细胞内构或atlas registration。UPG097和102仅更新为partial，未核销全部legacy入口；UPG118 mandatory内部source contract尚待在此身份层级上实施。其后还需source scope/field locators、其他view replay、可访问性和生产性能差额。全Goal未完成。

回滚仅撤回source-object-identity、新panel/CSS/tests及Objects/Cano/replay新增hunks；保留I01和启动前dirty内容。现有2.90冻结manifest不变；当前2.91 receipts随新authoritative inputs复核后再生成，不将I01的1,085通过当成I02通过。
