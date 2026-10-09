# 完整 Goal 核验与下一实施断点

最近核验：2026-10-08（America/Toronto；保留既有文件名）。用户目标：**完成 MD 中升级，直到满足所有记载 Goal**。本核验不替换或缩小目标，也不以当前阶段测试通过、版本号或完成条数宣布整体达成。依据为当前源合同、代码、完整复验日志及正式浏览结果；历史规划、旧验证和来源发现仅提供各自范围的证据。

## 当前可确认的实施边界

I01–I16历史范围（其内“最新”及日志均指I16终态；I17/I18/I19当前断点见末段）：`2.91.0-research.1`，31 sources／41 record sets／13 exact cell-profile rosters／4 exact source-object sets／387 source profiles；规范243条至UPG261，79条精确completed。I01声明范围含五来源对象、分子比较、Cano名单、来源审计、Crozat表、独立SWC、WT切面、采样报告和连接断言；I02新增共享identity／typed关系；I03接入mandatory internal source gate并移除旧count＋hash捷径；I04新增一个准确BIL run三原表全行核验与来源字段/身份详情；I05新增两份独立SWC source-view身份、实际clip与严格相机/图层恢复；I06将671个当前研究档案／22准确parent／10,038证据字段的source context、单位、locator与JSON/CSV对齐，并保留13 SCI独立条件。I07另新增无损gzip表示及来源索引actual loading receipt，默认canonical入口保留。I08将149个旧形态比较观察及全部pairwise关系接共享identity和科学receipt，修复runtime map失效及source bounds键顺序误判。I09另加入固定DANDI source-native channel0首秒有界preview、准确时间/cursor、JSON/CSV和同源恢复。I10修复旧比较器／共享viewport／microdetail的2D半径表面门槛，源diameter不变；94原直径输入与92个3D派生授权分开核验。I11已接149观察的actual private geometry byte producer／immutable payload／明确fresh recheck与科学JSON0.5／CSV，并修正重复active及planar requested-to-effective的绑定规则。I12另将149准确比较观察接实际full-view capture／same-source no-store restore／14代码与依赖input build receipts；新scene bounds与applied pose／layers／node／dim回验，失败清除旧scene／proof／verified提示，真实改变后旧capture不复活。I13另接全部1,097 Universe的fixed-index／raw-SWC private proof、shared identity／独立frame与actual full-view restore；955直径输入与916三维授权分开，保留39 source2D已有Z及142 No Diameter，修复画布覆盖和窄屏重叠。I14另接142个individual及179个main-scene的actual private geometry proof与独立source context，准确区分142／7／30及8.6.124／8.6.126，取消／快速换源／失败清除当前authority与旧几何；共享cache只保留完成proof，failed fresh不会回退旧cache。I15另将179形态档案当前declared rendering policy与149旧surface声明分开，schema0.2 scientific dossier／CSV保留原field并拒绝伪造当前许可；两个档案入口、Back／Forward、non-morphology与390px键盘验收通过。I16另将142 frozen individual接actual full-view capture／same-source fresh restore，enabled原type与actual centerline types、node/dim、renderer profile及25代码/样式inputs独立校验；current-build3D/2D/No Diameter、跨390px/Enter恢复与missing file/DER徽标清零及retry通过，主场景179 full-view仍待接入。最新完整research入口退出0：1,207 tests／1,192 passed／15 conditional skips／0 failed，build／strict typecheck／lint通过。各轮实际证据独立保留：[I01时间轴](RESEARCH_TIMELINE_2026-09-29_IMPLEMENTATION_01.md)、[I02身份](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_02_IDENTITY.md)、[I03来源契约](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_03_INTERNAL_CONTRACT.md)、[I04三表](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_04_BIL_SCHEMA.md)、[I05视图](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_05_COMPARATIVE_REPLAY.md)、[I06档案](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_06_RECORD_SCOPE.md)、[I07加载](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_07_INDEX_TRANSPORT.md)、[I08形态比较](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_08_MORPHOLOGY_IDENTITY.md)、[I09原始采样](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_09_DANDI_TRACE.md)。另见[I10平面授权](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_10_PLANAR_RADIUS.md)。另见[I11运行byte proof](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_11_GEOMETRY_RUNTIME.md)。另见[I12来源视图恢复](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_12_MORPHOLOGY_VIEW.md)。另见[I13全集来源视图](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_13_UNIVERSE_VIEW.md)。另见[I14来源加载链](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_14_LEGACY_SOURCE_PROOF.md)。另见[I15科学档案规则](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_15_DOSSIER_RENDERING_POLICY.md)。I16进展另见[I16个体视图](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_16_INDIVIDUAL_VIEW.md)。最新完整日志为[I16完整复验](qa/2026-09-30-implementation-16/full-research-validation-291.log)，其后仅文档／清单检查及最终构建单独保留。本轮本机3003已实际核实仅监听127.0.0.1。

这些证据不是F01–F20、243任务或全部最终科学目标的整体完成证明。下表每行仍保留未满足条件；没有条件的缺失不能视作已满足。

| 验收维度 | 当前直接证据范围 | 整体完成判定／准确余差 |
| --- | --- | --- |
| F01研究入口 | ResearchOverview、active-record provider和Types精确Cano深链接，非形态focus去除旧形态 | 部分完成。I06两个旧档案入口覆盖全部671当前records，实际invalid focus和Back/Forward保持正确source与旧receipt清零；其他入口的同一source scope、错误／返回路径仍需逐route核验。 |
| F02细胞形态 | checksum-gated NMO universe、source-specific native7/72、独立鱼／rat及MICrONS/BANC | 部分完成。I10已真实修正两条2D source记录在comparator／共用viewport／microdetail与科学receipt中的三维表面授权，原diameter保留；I15另对179档案准确保留142／7／30各自native diameter与3D gate，当前规则与原档案declared surface文字区分，实际179-file及JSON／CSV对账通过；I16另接142 individual的实际来源视图保存/恢复与失败清零，2D／No Diameter门槛保留；其他当前准入入口的完整度／失败状态和单位仍需统一对账，不添加未获准几何。 |
| F03胞体细节 | native7/72、NMO50394独立DER、45718专属display crosswalk | 已验证这些对象范围；其他对象的准确原生轮廓／spacing／坐标关系未取得或未验证，不能通用复用crosswalk。 |
| F04真实内部结构 | MICrONS/BANC源内parent、WT局部raw/nucleus平面；13组必需来源契约已接selected-record四内部slot／计数，独立proof与当前bytes必须匹配 | 完整目标未完成。鼠脊髓exact interneuron的volume＋segmentation＋稳定parent＋frame＋raw链缺失；source-adapter／loader的真实producer整合仍待来源准入。synthetic positive不等于真实内构。 |
| F05二维空间分割 | BIL16run元数据、329命名outline候选；一个准确run三Parquet/37.28MB及全部182,698cell IDs、无核/多核/边界QC与逐cell分割方法已核验，10,316行明确5.0µm | M2未完成。该run稳定cell↔cell/nucleus IDs通过；I21另由原cells archive明确microns且全部182,698 IDs／五列与Parquet exact equal，解除该准确run细胞质心单位缺口；原float32 physical-to-image精度、2,262核面积source NaN、208自动聚类未分配保留，I30另取得全部cell／nucleus polygon条目；9,032,645 active vertex rows的原X/Y及full-string parents全exact equal，支持此run边界µm，mask仍未取得／核验。仍需明确outline/cell frame、section/donor crosswalk、exact类型标签及政策差异适用范围。其他15run未取得geometry tables；0viewer geometry。 |
| F06类型全集 | 387source profiles／10namespace、Cano11/923现有核名单、GLUT/GABA独立原标签、精确marker比较；I34新增源RNA counts的32,285features／923已准入核浏览 | 部分完成。RNA counts源LogMaps与3199原metadata列/column stats及原923名单准确对齐，但RNA/ATAC、跨源type/cell身份或marker分类均未新增。其他缺失逐核名单不得生成；所有原始namespace／排除范围／lineage字段的统一入口尚须核对。 |
| F07年龄与条件 | 7native源API字段、29GEO样本条件、Trevisan交叉表、CanoP56datasetcontext；I06所有671档案保留source age/life-stage context与准确record字段，neonatal/adult条件分开 | 部分完成。Trevisan源barcode矛盾及缺cluster/reuse继续阻断；其他来源不能补造animal／individual年龄。 |
| F08跨研究比较 | 2–4 anchor比较及共享四枚举关系；真实Cano source-population proof经runtime roster校验，源内cell→nucleus不误称same physical object；独立fish/rat共显接typed co_display_only | 已验证该范围；I08旧149观察比较器已接全部pairwise共享关系，其他legacy比较入口尚未全部接共享契约，真实same-physical／same-section跨源证明仍缺失。 |
| F09SCI状态 | 现有condition-specific MVP证据及新16连接断言按条件保留；I06全部13SCI条件保留原source键/字段/locators，mouse-human／animal-participant独立展示和导出 | 部分完成。跨入口的损伤／时间／样本／干预scope及来源定位需统一；源无same-cell longitudinal链，不制造恢复轨迹。 |
| F10电生理 | Crozat23表、2,115原观察行、220表内完整条件组及源冲突；I35准确001469记录的全部32通道／5,543,424原时间行／184.7808s与完整源SHA | 部分完成。该一个NWB的355,191,072B完整源及177,389,568原int16采样已实际核验；完整通道／时间窗／cursor／JSON/CSV／exact restore接入，旧I09有界首秒合同保持。Native session_id缺失、物理电压calibration仍未证实；其余NWB和exact physiology-to-cell对象映射仍未完成。电极、群体或表内cell ID不跨实验赋给形态或类型。 |
| F11连接 | 16source assertions，12functional／4unknown，方法图例／筛选／locator／导出 | 有界断言浏览完成；source partner/cell/synapse键与真实边缺失，0显示cell edges不代表生物学无连接。 |
| F12参考解剖 | 原生32annotation states及73label语义hash、实际15/38及声明33/75敏感性 | 同源重放完成。独立解剖误差／定位benchmark未完成；不能以同源覆盖证明准确生物定位。 |
| F13对象身份 | 五来源Objects、Cano11/923、BIL四准确source例行及独立fish/rat source observations已接source/release/namespace/specimen/section/cell/component/synapse共享层级、typed关系、准确parent及null原因；restore校验当前canonical hierarchy | 部分完成。I08另覆盖149比较观察的准确源身份及卡片／JSON／CSV，I09保留一个native recording observation与准确subject ID、unknown cell／section／session；I13另覆盖1,097 Universe，物理parent未知、namespace／release及raw proof独立保留；I14另覆盖179 main-scene独立namespace／frame／版本／membership及142 individual共享hierarchy，当前proof与实际rendered object绑定；其他legacy source adapters／比较／intake／export入口尚未全部整合；BIL cell表身份不制造unknown section/donor，SWC observation不补造physical cell。missing实验ID不从study/frame/age/filename补齐。 I27另将WT bounded component接共享identity，dataset accession、Z sample与partial manual label不补造specimen／section／biological cell；当前图像和JSON／PNG保持该层级。 I28两独立comparative cards的当前view／PNG与私有native proof共用准确source hierarchy；物理specimen／section／cell仍unknown，不从repository ID补齐。 I29五来源Objects的当前view／PNG共用准确canonical identity与私有source ownership，未知parent／frame／calibration仍保留；BANC注释点、MicroStructFormer行不扩大为已读取源文件。 |
| F14易读性 | 对象主操作、可展开详情、按需证据面板、Cano窄屏布局修复；I06来源背景／逐字段出处可展开到旧档案与active-record，671记录无source fallback | 部分完成。I15已在Research Explorer／active-record两个档案入口显示当前形态policy与旧字段各自范围，保留原信息且不误读成当前许可；I16另修复individual换源重复画布、proof对比度、失败残留DER徽标及说明段落误占可伸展grid row，390px/Enter实际核验；其他legacy研究页的主信息／相同source scope／可达field locator仍需逐入口补齐。 |
| F15查询恢复 | Objects搜索／分页／clamp／Back／URL／失效对象，Cano筛选／分页同步clear，I67独立类型页完整对象／query／三筛选／比较／baseline地址恢复 | 已验证原路径及I67有限类型页状态、refresh／Back／Forward、零匹配保留和错误请求关闭；其他Cano／SCI／跨页面完整状态规则仍未整体覆盖，不能据此完成F15。 |
| F16导出复现 | Objects actual revision/layers/camera/frame/hash、strict restore、JSONCSV、真实文件选择恢复；两份comparative SWC的clip/camera/layers/renderer/current loader全部bytes对照及source-derived bounds严格恢复，正式拖动/隐藏/错source/390px已验证 | 部分完成。I06另有671 source-record科学档案JSON/CSV，字段／source scopes／missingness一致，明确不含rendered view；I08另有149观察比较科学receipt及target-plane scale，I11追加实际private byte proof、raw-SWC声明scope及JSON0.5／CSV，source／实际mode／scale／selection后旧receipt清除；重复active保留当前绑定，2D requested改变只更新provenance、保留actual平面绑定；I09另有同源有界trace window/cursor恢复和准确3000采样CSV、引用及rights scope；I12已覆盖149准确比较形态的actual完整view capture／fresh restore／固定build inputs；真实3D drag＋node62／dim／hidden topology、2D node24跨390px／Enter、合法supplementary radius、wrong source／wrong build、missing file清零／retry均通过。I13另有1,097 Universe的raw-SWC source view／fresh restore／20 build inputs、3D与非零源Z二维、No Diameter、复用目录、wrong source／build、missing source／retry和390px验收；I14另接142 individual／179 main-scene current private proof及科学JSON runtime context，当前加载链分集合准确核验；I15另将179档案科学scope／dossier升级0.2并使CSV与原field／当前policy保持一致；政策不包含actual source bytes或view，不等于渲染视图恢复。I16另接142个individual实际camera／layers／clip／inspection与25 build inputs、同源fresh restore及applied pose回验，native current-build3D/2D/No Diameter、type/节点、390px/Enter跨layout、missing源清零/DER badge撤下/重试均通过；I17已接179 main-scene实际camera／layers／slice／source placement／MICrONS clipping、9辅助文件private proof、23指定build inputs及same-source fresh restore；正式3D／2D／No Diameter／Todd、DAT／MICrONS、390px／Enter、wrong source/build与missing源清零／retry已通过。I18已接主视图准确SWC node/branch/dim/focus与27指定build inputs的actual view0.2，同源fresh回验及当前native通过；I19全局state import已经接actual current-build preflight／private geometry、fresh renderer与actual camera／layers／clip／bounds／node／dim回验、最新generation取消及准确settings-only提示；I20已统一主场景JSON／CSV实际round-trip范围及rendered／text PNG的source/build/尺寸/不可用记录，CSV空过滤仍有独立metadata；实际3D与390px二维完整导出后fresh重导入、No Diameter及四PNG原分辨率目检通过，29指定build inputs与全部CRC对账0差异；其他legacy viewers及每个export的actual层／clip／camera／code-build receipt仍未统一；本in-app环境Blob落盘未观察到，不能以点击等同文件落盘。 I27另接WT actual native canvases／17指定build inputs／fresh paired-source restore／integer-enlarged PNG，严格校验native slice／calibration／palette／outline及actual pixels；跨390/1280px恢复、真实错误build与source failure清零/retry通过。其他viewport/export仍有缺口。 I28两独立SWC接31指定inputs、private immutable native proof、fresh三文件no-store restore／actual pose回验和实际canvas PNG／完整来源页脚；真实旋转／hidden、两源隔离、旧build与篡改拒绝、served checksum错误清零／retry及390px键盘恢复通过。其他viewport／export仍未全部统一；PNG独立raw-canvas像素一致性和Blob落盘未观察。 I29另完成五来源Objects的55指定input full-view／严格文件集合hash预检／fresh no-store实际pose与layers、clip、transform回验／actual-canvas PNG；0-byte契约点与无图像外部行分别声明。25实际PNG及11 applied-view对照通过；其他legacy viewer／export整体复现仍待核对。 |
| F17性能可访问性 | I31 source route／Sources四工作区按明确展开加载，初载0canvas／0源文件、close卸载及fresh restore；完整实际preload文件存在性检查与构建纠错；Objects按选中加载、面板按active tab/details加载；source/view实际计时；I07原641条索引gzip逐字节一致，正式页面原URL／明确API实际transfer与数据各阶段receipt、390px／Enter已验证 | 部分完成。I26已接25／48／142长列表单一Tab焦点、方向键/Home/End、Enter/Space及空筛选/分页/返回换源，实际focus-only保留source/view凭据；文件输入390px溢出修正通过，Objects主按钮/source/search/file控件均至少44px。全App200%真实缩放／辅助技术、其他长列表／source路径、同设备生产baseline／parse／execute预算尚未证实。 I29 Objects真实390px／desktop、键盘focus-only／Enter、筛选／分页／Back／Forward及900px原宽引用PNG局部滚动通过；主要source/search/file／buttons至少44px，页面无溢出。真实200%zoom、screen reader及全App预算仍未验证。 |
| F18数据可靠性 | 891当前input byte receipts、候选原文／schema／hash、历史manifest保留、窄gzip接口、identity／mandatory来源契约负例、BIL全三Parquet离线重放及comparative current loader/replay负例、DANDI 15范围与30000原采样离线重建、unverified whole-NWB／校准及source身份篡改拒绝 | 已验证该当前清单；全后续source获取／转换更新路径仍逐增量验证，不把一个清单替代全部未来可靠性。 I27当前870 inputs与WT两native chunks/private pixel proof、全128 mappings及真实served-byte失败回验通过；原compressed chunk hashes仅保留declared scope，不扩大原始文件验证。 I28当前874 inputs及两准确SWC的三文件private ownership／immutability、克隆拒绝和实际served checksum failure回验通过；398固定科学inputs及冻结2.34／2.90不变。 I29当前891 inputs及五来源不可克隆／不可改写producer、准确文件集合预检、0-byte authority和真实核网格served checksum failure／correct-byte Retry通过。原始科学数据／398固定inputs／冻结2.34和2.90不变。 |
| F19稳定性 | I27当前代码完整npm research入口退出0：build／strict／全项目lint／全部validator通过，1,284 tests／1,269 passed／15 conditional skips／0 failed／0 cancelled；真实生产Cano.gz 404已修复并重验 | 当前迭代工程验收通过。尚无全F维度浏览／辅助技术／所有关键异常组合的整体证明，科学终态亦独立。 I28最终代码完整research入口exit0：1,292 tests／1,277 passed／15 conditional skips／0 failed／0 cancelled；build／strict／full lint／全部validators及874inputs通过。整体关键route／辅助技术验收仍未全覆盖。 I29最终代码完整research实际exit0：1,303 tests／1,288 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validators及891inputs通过；未将该Objects增量算作全route／辅助技术或科学终态完成。 |
| F20可持续升级 | 完整243＋21映射、canonical queue、独立timeline／有限rollback、source检索fingerprint | 当前工作机制可复用；每个新增量仍需完整证据、准确状态及断点，不能靠无变化检索或空等待宣告持续推进。 |


I24 当前断点：1,097 Universe／149 comparator／142 individual 的实际 PNG 导出已接入，各范围保持独立并有重叠。11 对当前 native PNG／DOM receipts 对 source／raster／layers／inspection／29 pins 全部一致；50394 native regression21 pins通过。两组fresh no-store恢复相机差异0，node62／dim／type filters、2D／No Diameter和390px／Enter通过。同视角再次capture清旧PNG／URL已实测；待完成编码使用generation失效门控拒绝旧发布。完整research退出0：1267 tests／1252 passed／15 skips／0 failures／0 cancellations，830 inputs。398固定科学inputs与冻结manifest不变；UPG091／053仍在推进，79 exact completed不增加，M2／M4完整Goal未满足。[I24](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_24_MORPHOLOGY_PNG.md)。

## 当前自主下一动作

1. UPG091／完整形态view恢复：I10已真实修正并验证两条2D／有diameter记录的UI、renderer、microdetail与科学receipt边界，原diameter字段及源平面保留。I11已补实际private byte-verified geometry producer／immutable payload与科学导出gate，明确fresh recheck API及模式语义负例已验证。I12已完成149准确比较观察的完整view capture／same-code source reverify restore，科学receipt与完整视图分别验收。I13已完成1,097 Universe的fixed-index／raw-SWC proof、独立frame／identity与actual full-view restore，全部1097实字节重放及正式3D／2D／No Diameter／复用目录／异常恢复通过。I14已完成142 individual／179 main-scene的独立actual source producer与private immutable proof、不同8.6.124／8.6.126版本及142／7／30 membership，正式换源／失败清零／恢复通过；producer不重复；I16已接142 individual实际view与同源fresh restore，current-code完整research入口及正式native复验通过。I15已完成179档案policy与旧surface声明的两个入口／scientific JSON0.2／CSV对账，原索引与直径无损、actual view与byte proof仍独立；该档案说明缺口已解除，I16 individual实际视图缺口已实现；I17已完成179 main-scene现有实际camera／layers／clipping的同源恢复与当前native验收；I18主场景branch/node/dim/focus inspector已实际接入并通过当前native；I19全局state import与I20主场景export scope／CSV metadata／rendered与text PNG记录已接入并通过；下一增量继续其他viewer完整导出；复用private byte producer和同源fresh recheck，不能让149-roster外对象沿用其未覆盖的frame／membership。先确定各现有source adapter准确范围与变更断点，再接共享核心；保留独立counts／unknown physical identity与全部scientific gates。
2. UPG097／102／118：共享core及首批Objects/Cano/selected-record入口已经完成并验证，继续将其接到尚未覆盖的legacy source-adapter／比较／view导出；真实source producer必须独立核验完整proof与当前loader receipts。默认co_display_only；组件所属cell与same_physical_object不混同，source population不开放geometry，未知实验ID保持未知。三项维持partial。
3. UPG051／052／110及091：I06已对Research Explorer与active-record两个旧档案入口的全部671当前记录完成source scope／missingness／field locator／scientific dossier导出。继续将相同契约与actual-view receipt接入其他尚未覆盖的legacy dossier、比较及viewer导出；上游field resolution缺口仍需准确源输入。保持现有科学单位／源版本和既有dirty改动。
4. UPG053／230：沿真实使用路径补键盘／窄屏／辅助技术和生产测量，先定位可复现问题再修，不用一次timing声明性能完成。I06当前档案与I07加载详情390px/Enter通过，I07实际数据阶段计时保留，I08 mixed／2D／zoom／mode／remove／add／Back／Forward／390px／Enter，I09 trace关闭重开／sample键盘／restore／390px／13px坐标通过；两条当前URL都gzip，单次差异不作为历史提速证据。其他长列表／200%／辅助技术与全路线生产baseline仍未完成。
5. M2／M4及其他source-dependent项：BIL一个run的原始schema/ID/方法缺失已由I04解除；I21原始cells archive／全部182,698准确ID和五列对账已解除同run细胞质心单位缺口并保留原float32 physical-to-image关系。三表及这些坐标证据不重复取得；下一个有效输入是准确cell-to-section与section/donor crosswalk、原始outline frame/transform、curated cell labels及适用权利说明。其他来源只有确切新输入／源说明／修订线索才重审已查入口；有独立、尚未执行的公开路线时继续查。保留missing字段，不由另物种／区域／二维资料代替目标。

目标状态保持active。不存在用户暂停请求，也未通过全部Goal完成审计。此文件只是当前证据与下一动作断点，不是缩小范围的验收协议。

I16最后布局验收：旧grid说明段落误占可伸展行已修正，实测由1,756.35px缩至68.5px，桌面/390px画布保持416/360px。含该样式修正的完整入口退出0（1,207 tests／1,192 passed／15 conditional skips／0 failed）；当前native25个build inputs逐文件byte/SHA一致，3D/2D/No Diameter、missing file/retry、旧build拒绝与真实拖动后恢复已复验。wrong source/build输入在fresh前拒绝、当前正确scene保留；fresh失败清零。修正前记录独立保留，固定scientific来源与任务状态不变。


I17 当前断点（最终代码完整检查与native已验收）：179主场景现有camera／requested-effective layers／slice／source placement／MICrONS clipping与23指定build inputs、9辅助文件private bytes proof已接同源fresh restore。核验事件与稳定source身份分开，非法事件仍拒绝；fresh实际proof必须no-store，页内sequence相对当前producer推进。最终修正代码的完整 `npm run test:research` 退出0：1,217 tests／1,202 passed／15 conditional skips／0 failed；build、strict typecheck、全项目lint、全部数据及历史snapshot validators均通过。10新增source-backed CPU专项及两套旧集成检查共35项通过。正式current-code跨页面default→no-store和no-store→新页面default上下文恢复均成功，actual fresh结果为no-store，verifiedAt更新，camera差0；3D radius/SWC、MICrONS裁切／隐藏核与隐藏bundle、45718 DAT、二维390px／Enter、No Diameter、Todd8.6.126、wrong source/build保留正确scene及missing生成副本清proof／receipt／DER徽标和同源retry均再通过。 科学388固定inputs与冻结manifest不变，UPG-091仍partial/in progress、79/243 unchanged。继续main branch inspector、legacy fallback PNG／全局state import及其他viewers；M2／M4与full Goal active。


I18当前断点：179主视图准确SWC检查器、显示变换一致的picking/overlay/focus、画布外工具与浅底高亮、node/dim的view0.2及27指定build inputs恢复已实现。当前专项23/23；当前代码native SWC/radius、fresh跨页面、真实点击节点136、二维390px/Enter节点24、No Diameter、wrong source/node/build、missing清形态/inspector/receipt/DER并原byte/hash恢复后的retry、MICrONS隐藏源分支/7辅助文件/clip均通过，相机差0。最终完整入口exit0：1,221 tests／1,206 passed／15 conditional skips／0 failed，build／strict typecheck／全项目lint／全部validators及676当前input receipts通过。398固定科学输入与冻结manifest不变。继续legacy fallback PNG、全局state import及其他viewers，M2/M4与全Goal active。详见[I18时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_18_MAIN_INSPECTION.md)。


I19当前断点：全局state import先核actual当前build／source／private geometry及persistent state一致性，再同源fresh重建并回验实际camera／layers／clip／bounds／node／dim；28指定build inputs、最新generation／排队提示／晚到取消及settings-only边界已接入。当前相关47/47，含两套静态回归54/54；最终完整research入口exit0：1234 tests／1219 passed／15 conditional skips／0 failed／0 cancelled，build／strict／全项目lint／全部validators及682 inputs通过。当前native3D radius／二维390px/Enter／No Diameter／Todd8.6.126／MICrONS隐藏层与裁切／45718 DAT恢复、wrong build/node/state来源拒绝、missing清零与原bytes/hash还原后的fresh retry、legacy/unavailable settings-only及手动換源取消/连续最新来源均通过。14个actual UI docs ×28build inputs，0差异；六组actual applied回验，相机差0。398科学inputs及冻结manifest不变。构造state fixtures与真实Export JSON落盘分开；notice有、download event未返回，不称Blob落盘通过。剩余legacy fallback PNG、global export round-trip描述范围、其他viewers、F01–F20及M2/M4保持全Goal active。[I19时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_19_STATE_IMPORT.md)。


I20当前断点：主场景JSON／CSV单一actual view capture、准确round-trip权威字段及只再生事件元数据，actual／typed-unavailable分别恢复，容差仍1e-8；CSV1.0.0独立metadata兼容0entity结果。rendered及accessible text PNG均携带准确source/build/requested settings/image dimensions与复现scope，原encoded pixels不变。实际导出预览／同Blob data-URL可检查并保留最新下载链接；原自动download event落盘未观察到。29指定build pins、74/74专项及最终完整1244/1229/15/0fail/0cancel通过，686 inputs；398科学inputs与冻结manifest不变。实际3D108974和二维194469完整JSON全局fresh no-store重新导入、node62/24＋dim＋focus及camera差0，8actual-view docs＋1unavailable PNG对账0差异；4PNG目检可读，390px/DPR1页脚压缩已修复为换行。No Diameter保留原中心线、2D保留deposited z；text为用户选择相同fallback路径，真实WebGL故障条件仍未native模拟。其他legacy viewers／全F维度／M2/M4仍未完成，UPG091in progress、79/243不变、full Goal active。[I20时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_20_EXPORT_SCOPE.md)。


I21 当前断点：准确 BIL:ace-pie-cot 的原 cells.zarr.zip 声明 microns，全部 182,698 cell IDs／X、Y、cell_area、nucleus_area、nucleus_count 与原 Parquet 精确一致，无缺失、重复、差额或容差；2,262 source NaN 保留。指定原 HTTP206 ranges／selected ZIP CRC 离线重放，不核验整 252 MB 档案、mask 或 polygon arrays。原 float32 physical-to-image scale 保留；609 FOV 不成为 section，十套自动聚类各 182,490 assigned／208 unassigned 不成为 curated types。准确运行 UI／JSON 单独接当前 coordinate audit，换源清除；生产键盘返回、四份源行及 390px 无溢出通过。20 相关 tests、119 原文件 byte/SHA、全源行离线重放通过；完整 research 终态 exit0，1250 tests／1235 pass／15 conditional skips／0 fail／0 cancel，build／strict／full lint／validators 与 806 inputs 通过。398 固定科学输入与冻结 manifests 不变。section/cell、donor、curated types、outline frame／rights differences 仍须准确新输入；0 viewer geometry／IN／3D／REG／same-cell morphology，UPG244 partial／UPG255 planned，79/243 exact completed 不变。其他 legacy viewer/export 及全 F/M2/M4 Goal 继续 active。[I21 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_21_BIL_COORDINATES.md)。


I22 当前断点：七个准确 native-contour 记录的私有实际字节 proof、准确 base/delta catalog locator、19 指定 build inputs 与同源 fresh 视图恢复已在声明范围内验收。最终七来源／16 actual UI receipts／七组恢复相机差 0，实际图层和 inspection 一致；390px 父级裁切、暗底标签和重复 label ID 已修正。实际 wrong source／真实旧 build 保留正确 scene，临时两文件 missing 清 canvas／DER／capture／export／readonly receipt，准确还原后的 OBS＋DER no-store retry 通过。50424 的两处 held transitions 和 50408 的两处自交／一条零长度边保持原样，0 新 shells。自动下载落盘未核验，原始 DAT／API bytes 仍 declared-only，physical specimen／section／cell unknown，0 新内部对象／same-cell／REG。

最终代码的完整 research 入口在原 package-lock 的独立临时依赖环境退出 0：1,255 tests／1,240 passed／15 conditional skips／0 failed／0 cancelled，真实 build／strict typecheck／全项目 lint／全部 validators 与 819 input receipts 通过。正常 TS2322 负控实际退出 2，此前虚假的静默 0 不作为通过；原 node_modules 的 dataless 问题未通过覆盖依赖来修复。398 固定科学输入、冻结 2.34／2.90 bytes/SHA 和 11 项 rollback 对账通过。最后文档／登记／清单同步验收独立记录于 QA；UPG091 仍 in progress，79/243 精确 completed 不变。[I22 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_22_NATIVE_CONTOUR_VIEW.md)。整体 F01–F20／243 任务及 M2／M4 仍未完成，Goal 保持 active。

I23 当前断点：七个准确 native viewer 的 PNG 导出接 actual private source/view capture、真实 pixels 与可读页脚，21 指定 build inputs、准确 raster 尺寸和双 iTXt receipt；异步期间换源／变视角拒绝发布，旧预览／链接／receipt 随相应变化清除。最终完整 research 入口实际 exit0：1,261 tests／1,246 passed／15 conditional skips／0 failed／0 cancelled，真实 build／strict／全项目 lint／全部 validators 与 823 inputs 通过。七来源九 actual PNG／DOM JSON 的 source/build/CRC/pixel decode/IHDR/raster/authority 对账 0 差异，390px／Enter、DER1→isolated DER0、secondary-only、source switch 和 fresh OBS/DER no-store 后导出通过；窄屏断词及主入口 overflow:hidden／固定面板裁切已修正，stable gutter 下打开预览／实际滚动保持当前 capture，完整图片与页脚可达；最后样式七来源九PNG全部重验，六份 encoded pixels 与已目检原图一致、三份50394再目检。自动下载事件未返回，不声明落盘；PNG 是指定相机真实区域，不声明所有 enabled traces 全部进入 frustum。398 科学 inputs、冻结 manifests 与 11 rollback 输入保留。其他 legacy viewer/export 与全 F01–F20／243／M2／M4 尚未满足；UPG091 仍 in progress，79/243 exact completed 保持，Goal active。[I23 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_23_NATIVE_CONTOUR_PNG.md)。


I25当前断点：新增公开配准代码与分析仓库的固定版本核验，18列出blob／17实际文本、23 retained inputs；未执行上游R，未取得sample或image pixels。原始ID第八字段截取和make.unique不能代替source-scoped crosswalk，交互变换和示例target anchors不提供准确run的section frame。两固定tree没有该运行的原始→重命名mapping、cell-to-section／donor／curated labels或实际outputs。当前页面与JSON保留independent software context，exactRunEvidence=false，其他run不借用Run8 coordinates；最终代码完整research exit0：1272 tests／1257 pass／15 conditional skips／0 fail／0 cancel，真实build／strict／full lint／validators及860 inputs通过。3份actual DOM export与完整current receipt一致，准确cot与另两run的coordinate scope分开；直接select和Open inspected run都清旧preview，390px／Enter及desktop无横向溢出。自动下载落盘未观察。不重取I04/I21相同表格／ranges，不升级科学准入或任务completed计数。整体Goal active。[I25时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_25_PUBLISHED_WORKFLOW.md)。

I26当前实施断点：三个长列表精确焦点导航已接入，33指定形态build inputs；native方向键不改变已选source、几何或当前视图receipt，Enter／Space沿原选择流程清旧receipt；空集合0入口、非空1入口、分页/返回/换源身份和单位保留。Objects恢复文件输入在390px的4px溢出已修正并通过最终浏览，主按钮/source/search/file控件至少44px，390/1280px均无页面横向溢出。当前代码完整research exit0：1276/1261/15 skips/0 fail/0 cancel，build/strict/full lint/全部validators和866 inputs通过，native两个receipt×33 pins与keyboard checks对账0差异。12 owned rollback、398科学inputs和冻结2.34/2.90不变；实际200%zoom和screen-reader不因窄viewport测试变为通过。UPG053仍in progress，M2/M4与全部Goal active。[I26时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_26_KEYBOARD_LISTS.md)。


I27当前实施断点：WT两个native payload与真实画布像素接17指定input的当前view JSON／fresh no-store restore／PNG，原静态source context保持独立。全部128映射CPU及实际15→16／127、patch显隐、旧build／source／pixel／identity拒绝和390→1280px恢复通过；真实服务raw副本损坏清画布／receipt／PNG／export，准确恢复后fresh retry通过，失败progress残留已修正。三份最终代码actual PNG／DOM pairs的CRC／native pixels／四hash／source／17pins对账0差异，原尺寸560px预览局部滚动且390px页面无溢出，保持当前capture。最终完整research exit0：1284/1269/15 conditional skips/0 fail/0 cancel，build/strict/full lint/全部validators与870inputs通过；398科学inputs、冻结2.34/2.90和八项rollback保留。UI cancel／screen-reader／200%zoom和download landing未实际确认，不提升证据等级。UPG091 in progress／UPG195 completion不重复计数，79/243不变；M2／M4与全部Goal active。[I27时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_27_WT_PLANES.md)。

I28当前实施断点：两独立comparative SWC的私有immutable native proof／31指定build inputs／三文件fresh no-store／actual camera与layers、clip、source transform恢复及实际canvas PNG已接入；原六source bytes、No Diameter、rat三冲突和未知physical parents不变。真实两源旋转、hidden、旧build及八类source/context/event/frame/pose篡改拒绝、390px／Enter、source撤下清旧capture、served同长度SWC checksum失败清当前画布／export而另一源保留、准确还原后pending pose retry通过。首次追加字节未形成有效故障，留存但不计通过。最后rat页脚明确23contours→23somapoints与12type1节点。最终代码完整research exit0：1292/1277/15 conditional skips/0 fail/0 cancel，build/strict/full lint/全部validators和874inputs通过；actual PNG的完整decode／CRC／JSON／source／31pins独立记录。原WebGL画布逐像素独立读取、Blob下载落盘、200%zoom、screen-reader与UI cancel未确认。398science inputs／冻结2.34、2.90／14 rollback保留；UPG091 in progress，79/243不变，完整Goal active。[I28时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_28_COMPARATIVE_PNG.md)。

I29当前实施断点：现有五来源Objects接private immutable producer／55指定inputs full view、准确file-set/hash预检、fresh no-store actual camera/layers/clip/native transform恢复及actual-canvas／explicit no-raster reference PNG。native7/72、50394 DER、MICrONS cortical reference、BANC fly skeleton与contract-only point、PALM无physical calibration及MicroStructFormer外部row均保留原scope；0-byte authority不扩大。最终十类预检拒绝保留正确视图；同文件重复恢复、跨来源、DER load-scope变化、served核网格同长度checksum失败清当前授权及correct-byte pending Retry、键盘/返回/分页/空筛选和390px→desktop通过。25实际PNG／55pins／runtime files／CRC／decode与11 fresh applied-view对照最大差5.684341886080802e-14；全部概览与八份代表原尺寸图片另记QA。最终代码完整research exit0：1303/1288/15 conditional skips/0 fail/0 cancel、build/strict/full lint/全部validators与891inputs。398science／冻结2.34、2.90／11 rollback保留，UPG091 in progress、79/243不变。初始错误hash进入fresh后才拒绝的问题已修正，修复前证据保留且不算最终预检通过；新代码和原依赖分别核验。未声明independent raw-WebGL pixel equality／download landing／actual UI cancel／200%zoom／screen-reader。其他legacy source/view/export及完整F01–F20、M2/M4仍active。[I29时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_29_OBJECTS_VIEW.md)。


I30当前科学断点：准确BIL:ace-pie-cot两组polygon全部原条目已取得及CRC重放；9,032,645 active vertices的X／Y、每行full-string parent cell IDs全部exact equal，原microns声明支持该run边界µm。核数和cell方法全182,698一致，2,262零核与62多核保留，47,355 padded slots不计入顶点；跨cell／nucleus numeric label不能join。I21历史坐标audit不改写。这个新输入减少M2 boundary-unit证据缺口，但section／donor、outline frame、curated labels及rights仍未满足；0新增viewer／same-cell／REG，M4和完整F01–F20／243 Goal仍active。最终代码完整research实际exit0：1,310 tests／1,295 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validators与1,228inputs通过；449source文件、全量polygon／parent核对、27相关Node检查和6 Python反例通过；准确run加15其他run实际清零、16份DOM JSON与builder完整一致、390px／Enter／44px实测通过。398科学inputs及882旧非ownedinputs不变。来源单位证据不建立切片pilot；full Goal继续active。

I30当前最后代码亦包含source select／export的client-ready门控；实际初始服务器HTML禁用、client接管后选择和rendered source key一致，16来源JSON／15换源清除再次通过。含此修正的完整research actual exit0：1,310 tests／1,295 pass／15 conditional skips／0 fail／0 cancel。全App初载／辅助技术及完整科学Goal未由这个准确入口修正而完成。


I31当前断点：来源页面与主页面Sources的四工作区改为明确展开后才挂载，关闭卸载，原来源／导出／restore边界保留；七入口、稳定／legacy锚点及history target恢复已实测。独立初始native4canvas／8源文件→0／0，实际observed localhost资产的HTTP identity响应体基线另留bytes/hash，排除浏览器wire-transfer／JS执行／等待时间与完整预算。UPG230仍partial，未删除资料／viewer来缩小性能分母。当前完整复验范围与最终统计见[I31时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_31_SOURCE_WORKSPACES.md)。M2／M4及全F科学Goal继续active，79/243不变。

I31首轮完整research的实际production preload存在性失败已保留并修复；必需module／CSS／真实import缺失仍拒绝构建，未通过删失败测试获得通过。10已有owned备份、10新增authoritative inputs，当前1,238 receipts；其余1,219旧受控inputs保留。准确科学Goal和UPG230完整预算仍未完成。

I31修复后最终代码完整research actual exit0：1,319 tests／1,304 passed／15 conditional skips／0 fail／0 cancel、build／strict／full lint／全部validators与1,238inputs。最终默认source页面0canvas／0data；source JS普通identity响应体433,328bytes，排除browser原wire／RSC headers／执行和latency。390px四工作区与主Sources进出实际保持正确来源、临时receipt清零；全App缩放／screen reader／完整性能预算和科学Goal仍未验证完成。

## I32 当前来源增量：原始影像标定和数值一致性

准确 BIL:ace-pie-cot 的原 first BigTIFF IFD/OME XML 五段1,606B已取得和离线重放，DAPI 54,030×112,160、16光学层、0.2125µm XY/3.0µm Z与manifest一致。全部182,698源质心在原float32矩阵转换的连续像素域内，29轮廓面积复现原µm² header。来源页面及selected-run JSON接独立metadata audit，其他run清除。该进展解决影像尺寸/物理标定的一项准确输入缺口，未验证image pixels/masks/配准；未提供outline共同原点/方向、section/donor/curated标签或rights解决依据。F05/M2、F04/M4均保持未完成；原矩阵数值差异不隐藏，光学Z跨度不成为section thickness。验证、原始来源及下一门槛见[I32时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_32_BIL_IMAGE_METADATA.md)和QA。

I32当前代码完整research actual exit0：1,325/1,310/15 conditional skips/0 fail/0 cancel，build/strict/full lint/validators和1,256inputs通过。130来源receipts、offline原metadata数值重放、6 Node及9 Python专项通过；实际原JSON文本同合同、15换源清零、390px/Enter/close-reopen实测。1,229旧非owned与398科学inputs保留，79/243 exact completed不增。最终文档再生成/构建结果单独封存，完整Goal仍active。

## I33 当前实施：原始 GABA 类型标签和准确核注释

已从固定原提取物再生204 metadata标签／24原组／73,364原核，每行源身份、group、anatomy与原始source NA无差额。Types新增按需加载、搜索／筛选／标签和核分页、私有当前名单hash/membership核验及准确核JSON。原source／Sex列缺失保持null，P56只属dataset context；不增加387-profile、11/923 CHOL_IN或科学identity/geometry分母。7专项及全源行对账通过；生产 `.gz` 404发现并改为相同bytes的 `.jsonl.gzip` 后，最终代码完整research actual exit0：1,332／1,317 passed／15 conditional skips／0 fail／0 cancel，build／strict／全项目lint／当前validator与1,266input receipts通过。

桌面／390px／44px最低控件／Enter、原组和literal label搜索、核分页／ID／region、关闭卸载和同长度损坏文件拒绝／准确恢复Retry实测；两条DOM核JSON与三份label summary exact source equal。1,250旧非owned／398科学inputs保留。download落地、200%zoom、screen reader与native pending-cancel未确认；79／243 exact completed保持。

M2所需准确Run8 section／donor／outline frame／curated labels／rights仍未满足，M4准确鼠脊髓interneuron体数据证据链仍缺失。本轮新GEO/论文/官方Shiny调查的访问范围与未取得资料见[I33时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_33_GABA_SOURCE_LABELS.md)；未将网页／解剖图／文库ID转换为cell mapping，完整Goal继续active。

## I34 当前实施：准确核名单对应的 RNA counts

本轮准确公开CHOL RDS完整hash验证后读取RNA Assay5原counts层：32,285×3,199、18,787,611 stored entries。source cells/features LogMaps按counts列名称解析，3199原metadata row names／nCount_RNA／nFeature_RNA与原矩阵全部exact equal；原923准入CHOL_IN roster及11profile顺序无差额。新派生物覆盖全部32,285源features、4,610,528 positive entries／22,637,377 counts，按127个小块请求。Types的原核名单接源feature搜索／当前核counts／11profile统计／JSON预览与CSV；0 undetected不成为生物缺失，不存在gene不填0，filter不改变完整profile分母。

RNA counts→同源metadata named mapping本轮成立，RNA/ATAC pairing、cross-source same physical cell、marker／差异表达、donor／section、geometry／internal／atlas均未成立。原387 profiles、11/923与243/79分母及原GABA/GLUT输入保持。最终压缩移动布局代码完整research exit0：1,338／1,323 passed／15 conditional skips／0 fail／0 cancel。实际桌面/390px、44px新控件、Enter、两个gene receipts、分页/空搜索/换profile/close清除与真实served checksum failure／准确Retry通过。最终压缩布局在准确source profile重载后重新验收，390px无溢出，准确核Pitx2=2与原metadata row/counts column=32不变；15原生检查全部通过。最终图与DOM独立保留。全部32,285features/923核对账及source-byte确定性重放通过，当前1,403inputs和原固定科学输入保全封存。CSV action后5s未确认文件落地，native pending-cancel、实际200%zoom、screen reader仍未验。

V1检查没有取得corrected public object；M2与M4的原准确来源门槛保持，完整Goal active。完整输入、独立源重放与回滚见[I34时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_34_CHOL_RNA_COUNTS.md)。

## I35 当前实施：一个准确 NWB 的完整通道与原始时间

补齐既有固定SpinalCordNET资产，完整文件SHA与已公布值一致；全部32×5,543,424原采样、native0–31电极身份、准确time/series/table/group/subject保留。608个lossless block与全矩阵native time×channel C-order SHA逐byte重放，旧I09范围合同与样本不变；最后0.1s窗口仅2,424实际samples。当前浏览器只核验所请求block，完整原NWB证明是独立build来源范围，不冒充浏览器已下载355MB。

任一channel/time、全部window原值、cursor、JSON/CSV及fresh byte-based restore落实，单位/标定声明仍受限于未核验的source conversion。原analysis/processing为空、无isolated units/channel_conversion；session_id和坐标单位仍unknown。电极不是exact interneuron，同细胞physiology-to-morphology或M2/M4未新增。全量工程、原生恢复与损坏清零、窄屏及原始sample对账见[I35时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_35_FULL_RECORDING.md)与其独立QA。UPG154仍partial，79/243 exact completed保持，完整Goal继续active。

## I36 当前实施：准确 Svara 补充图册

三个exact official ZIP均实际取得并与公布bytes／MD5／ZIP CRC吻合，独立archive/member SHA256保留；内容是三原PDF catalogues，共139 MN／39 CiD／34 CoBL出版条目、212原页、914原source table fields。全页原label/header／native fields／missing strings原样核验与96dpi raster展示。许可依据为同一exact article的CC BY4.0、明确publisher supplementary-data policy与component归属；政策及metadata有当前HTTP/hash receipt，缺少独立ZIP license字段，不覆盖其他repository或Koh版本。

F02／F08增加准确原页引用和原数值浏览，保持publication-page单位，未新增分型、cell census或可编辑geometry。F13增加按catalogue／native entry／prev/next的源浏览与原入口按需卸载。F14保留完整ZIP/PDF build证明及当前PNG bytes证明的差别、citation／rights／modification与unknown physical parents。F16增加PNG/JSON source receipt和严格same-page fresh byte restore；它不是camera/clip/三维view恢复。F18有390px／Enter／主控件≥44px及no horizontal overflow的实际验收；native保存路径、pending-cancel、200%zoom和screen reader未计完成。

9专项和deterministic source replay通过；最终代码完整research actual exit0：1,354 tests／1,339 passed／15 conditional skips／0 failed。13native checks通过，四个实际DOM receipts与三原PDF的14源字段和full text/identity/loader范围0差异；只在临时generated file做真实checksum错误，旧图片/下载清除、准确恢复wire与Enter Retry通过。398固定科学输入、2,014旧非owned authoritative inputs及冻结2.34/2.90保全；本轮11旧preimages中一份测试因原清单外baseline lookup失败，经精确patch逆向/重应用核验恢复，异常记录保留。当前manifest2,253 paths、UPG240/250/260仍partial，79/243 exact completed保持。

本轮PDF没有独立SWC/mesh/raw volume/annotation.xml/endpoints；physical specimen/section/raw-cell linkage、frame、segment/hemisegment、trace completeness和Koh exact annotation仍unknown。源图像不是editable三维重建或鼠same-cell内部结构，M2/M4原Goal未由此完成。完整目标继续active，见[I36时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_36_SVARA_CATALOGUES.md)与[当前验收](qa/2026-10-02-implementation-36/verification-summary.json)。

## I37 当前实施：原出版条目的链接复现

F15／F16增加Svara独立工作区exact source／release／entry URL、refresh／Back／Forward及选页／有效JSON restore一致性。任何不完整／重复／错误版本／未知entry URL均先清图像／receipt／download／share link，未默认替换；原atlas嵌入选择不接管其地址。当前proof与同一request对象绑定，链接只选择二维完整原页，需fresh no-store bytes才能显示和导出，没有3D view恢复或physical cell identity声明。

6新location测试覆盖全部212条目，原9source/byte专项保持；完整research actual exit0：1,360 tests／1,345 pass／15 conditional skips／0 fail／0 cancel，build／strict／lint与全部validators通过。31native observations、DOM canonical/source/rights/image/URL对账0差异；exact-link点击、刷新、返回前进、JSON错误、MN末页／Previous Enter、390px／44px／no overflow及原atlas完整URL保持通过。两条12s真实delayed PNG请求的pending switch／Back均取消旧client，deadline后仍保持新页；actual served checksum错误清零与exact wire恢复／Enter Retry通过。native download落盘、200%zoom／screen reader仍未验收，其他viewers／URL和科学Goal继续待整体验证。

本轮9旧owned preimages均在编辑前捕获；source ZIP/PDF六原文件与212PNG／914fields／所有canonical科学分母不改，当前2,255manifest inputs及2,245旧非owned inputs最后同步独立核验。79/243 exact completed、M2／M4及Svara/Koh未取得源geometry/frame/parent链仍开放，完整Goal active保持。见[I37时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_37_SVARA_LINKS.md)与[本轮QA](qa/2026-10-02-implementation-37/verification-summary.json)。


## I38 当前实施：原始突触接触数表

F11增加734条源contact／516不同publication native pairs及4,964矩阵位置，CiD/CoBL、contact count/area/matrix token各自保留。四exact MPG v7 XLSX与FreiDok wrapper成员逐字节一致；article license＋明确supplement policy只应用四准确components，whole wrapper/mmc9/Koh版本不覆盖。matrix unit未显式声明，contact C1 µm²；逐格面积求和核对通过，数量另由行数derived。原OOXML数值token与literal zeros、同pair多contacts完整保留。

F13–F16增加独立/connectivity/svara选择／source locators／URL／CSV／JSON和fresh source pair restore，private bytes/current request隔离，失败不保留旧export。表内publication标签对不代替physical parent链或XYZ endpoint edges，不建立功能传输或鼠same-cell。7专项覆盖完整pair URL/原tokens/zero/private proof/cancel/receipt/CSV。完整research actual exit0：1367tests／1352pass／15conditional skips／0fail／0cancel，build/strict/full lint/全部configured validators通过；33native flow observations及源行/矩阵/当前SHA对账、六contact/zero、exact URL/refresh/Back/Forward、篡改或缺项拒绝清零、390px/44px/Enter/末列、catalogue双向导航、真实bad wire/fresh Retry、两12s native pending-cancel及deadline后的准确新pair均核验。CSV实际点击但保存路径未观察，200%zoom/screen reader仍开放；最后准确native sheet unitLocator与input/compiled/doc封存见[I38时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_38_SYNAPTIC_CONTACTS.md)和[最终QA](qa/2026-10-02-implementation-38/verification-summary.json)。79/243 exact completed与canonical科学分母保持，M2／M4及完整Goal active。

## I39 当前实施：准确出版端点在图册与数表间互通

F01／F13–F15新增same-publication-label导航，图册保留当前pre或post，starting pair另一端明确命名；表分别到两exact原页，各目标fresh no-store核验，导航不授权源图形／数据。全部212页中141条匹配，71原MN条目不在两表列中仍保留原页并明确无pair代选；209 endpoint引用不合并为物理细胞数。四native MN subtype suffix有准确header／full text证明，不任意修补ID，不建立raw physical cell、3D frame或功能传输。

5新专项＋原13actual18／18，完整212页和4964pairs重放、来源版本／歧义／不可用／metadata authority拒绝通过；17实际native observations覆盖末位CoBL／CiD、MN001／068／069／139、Enter／refresh／Back／Forward、390px／44px／无overflow与错误版本清旧links/receipt/exports。完整工程终态和compiled/旧输入核对由[本轮QA](qa/2026-10-02-implementation-39/verification-summary.json)独立给出。downloadMedia尝试约5s无保存路径，native落盘／200%zoom／screen reader仍开放。

I38实际source relation指向的新FreiDok271638论文record已核files=0；明确Heidelberg PDF请求得到Anubis HTML，不是原PDF，未新增source geometry／Koh版本或mouse exact IN数据。4491B原响应与API/hash receipts非public保留，未执行外部脚本、降低TLS或读访问凭据。新索引仅59540B，不把403985B全图册text作为接触页导航依赖；没有缩小原可用页／表／科学记录。79／243、M2／M4与完整Goal不核销，实际范围与下一source重启条件见[I39时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_39_PUBLICATION_NAVIGATION.md)。


## I40 当前实施：全应用键盘入口与证据面板引用

F01／F14／F17增加五路线首个keyboard skip入口，客户端只移动焦点和滚动；当前查询、来源fragment、准确对象与scientific receipt不改写。六个原失效aria-controls现在有七个稳定tabpanel目标，非当前panel保留hidden空wrapper、内容仍卸载。顶部七个primary actions原35px实测已补至少44px，最终构建尺寸由QA单独给出。

33项实际观察覆盖desktop／390px五路线10个skip、八主研究入口12次Home／End／左右箭头／wrap、七证据页签11次切换及一处准确pair source receipt逐字保持。已挂载内容的IDs／可访问引用／表单名称核对通过；未展开内容不计入全App检查。source fragment初始化focus的body Tab超时及getByLabel未命中不算通过，稳定DOM下重定位的实际通过单独保留。工程终态和input bytes保全见[I40](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_40_KEYBOARD_ENTRY.md)与[QA](qa/2026-10-02-implementation-40/verification-summary.json)。

实际200%zoom、screen reader、文件保存路径及全App预算仍未验证。BIL准确section/donor/frame/curated labels/rights及mouse same-cell内部结构证据链未新增。79/243与完整Goal active保持。


## I41 当前实施 · 小鼠 V2a 群体源影片

完成 UPG-170 原限定范围：实际原 Video_2.MP4、准确 XML/PMC version inventory与CC BY4.0归属核验，11,361,776B／官方MD5相同／原MP4 SHA256保存。400帧全decode通过；Sources独立页及主应用Types附加证据的按需入口接native播放、秒数定位、paused source JSON与fresh byte restore。它仍是C1–L1 Chx10:tdTomato群体渲染参考；exact movie age/sex/specimen/per-cell IDs、raw voxel calibration/segmentation/atlas frame均unknown或未准入，不新建canonical type/cell。

7专项覆盖exact/same-size坏bytes/private proof/input mutation/cancel/no-store/完整receipt claims与时间边界。desktop/390px／44px／Enter、播放暂停及exact seek、fresh restore、rights篡改拒绝、close/reopen、真实same-size bad wire/retry与两10s native pending cancel已实际通过，deadline后source不复活；一个getByLabel定位错误保留为未通过尝试，fresh DOM的textbox定位通过。完整工程终态、source/compiled/input对账、截图与精确count见[I41时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_41_MCCREEDY_MOVIE.md)及[QA](qa/2026-10-02-implementation-41/verification-summary.json)。本轮record只核销该已实现movie范围，当前80/243 exact completed；其余F01–F20、M2/M4与完整Goal保持active。

200%zoom／screen reader／native文件落盘及全App性能预算未计为通过。既有source mapping与mouse same-cell内部结构缺口保持；不能把电影播放时间当作depth/距离/生物时间。


## I42: Complete exact-file original DAT verification

Seven existing mouse DAT files now retain 234 complete top-level source objects, 89 original contours and independently equal JS/Python structured audits. The unchanged 72 admitted loops / 5,149 vertices, anomalies, source frame and No Diameter declarations remain separate. Exact marker size discrepancies are per-file and per-offset; unsupported blocks, truncation, duplicate identity, ambiguous semantics or audit mismatch fail that file closed. UPG-193 is completed within this explicit seven-file contract; current exact completed count is 81/243. No additional canonical source/profile, physical cell, surface, volume, intracellular object or REG is admitted.

Browser authority now requires original DAT bytes, complete audit and exact admitted ordered coordinates as well as derived geometry bytes. Source views and PNGs retain actual original authority; API context remains declared-only. Seven actual source captures, changed-hash replay rejection and bad served source clearing were checked. Final required checks, source/compiled/input preservation and rollback are recorded in RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_42_NATIVE_DAT.md and docs/qa/2026-10-02-implementation-42/verification-summary.json. Existing catalogs and source science are preserved. BIL section/donor/outline frame/curated type/rights, exact mouse spinal IN volume/segmentation/parent/raw-slice evidence, complete App performance budgets, 200% zoom and screen-reader goals remain unmet. F01-F20, M2/M4 and the whole Goal remain active.


## I43: Selected-file complete DAT audit loading

The unchanged complete canonical DAT audit now has seven lossless per-file transports and a compact pinned eager index. Selected manifest bytes/SHA and complete metadata must pass before original DAT / complete parser audit / ordered admitted geometry can acquire private authority. Current view receipts separately retain manifest authority; fresh restoration verifies every selected input. Complete source syntax remains accessible by verified local audit links. Scope stays seven source files, 72 admitted loops / 5,149 vertices and no new science admission. Required checks and same-route before/after resource body evidence are recorded in RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_43_DAT_LOADING.md and docs/qa/2026-10-03-implementation-43/verification-summary.json. UPG-230 remains partial because browser wire transfer, full JS parse/execute, interaction latency and regression budgets remain unverified; actual 200% zoom / screen reader / M2 / M4 and all F01-F20 goals remain open. The exact completed count remains 81/243.


## I44: Complete admitted-source framing and native keyboard control

Actual individual-view re-entry revealed a hidden authorized radius group that the initial passing suite did not catch. The initialized mode and view-dependent visibility effect are repaired; actual radius/hidden-type re-entry, planar and No Diameter source gates, fresh cross-viewport restoration and later saved-pose resize now pass. Fourteen native and nine individual captured cameras independently replay against final renderer/source receipts with no source vertex or renderer-bound corner outside; both real PNG exports pass container/embedded-receipt and pixel inspection. Browser32 passed checks and six unpassed attempts remain separate. The full post-repair research entry passes1393/1378/15 existing skips/0 failures in the original Python3.9.6 replay runtime; the Python3.12.14 generated-float byte mismatch is retained as an unpassed environment attempt without rewriting scientific outputs.

Both seven-record native DAT and 142-record frozen individual default views now use the existing aspect-aware sphere fit instead of fixed offsets. Source-backed projection checks cover exact native coordinates, the existing separate DER shell and actual individual renderer bounds; planar/No Diameter gates and science counts remain unchanged. Native keyboard pan/rotate and Fit all source traces preserve selection/layers, with user/restored poses preserved on resize. Native controls/shared source-view disclosures and buttons gain44px targets and small tables/receipts12px text. Final live browser, required checks and byte preservation are recorded in RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_44_CAMERA_FIT.md and docs/qa/2026-10-03-implementation-44/verification-summary.json. These changes address source-lane framing and interaction; UPG-053 remains in progress, strict completed count81/243 remains unchanged, and full accessibility/200%zoom/screen-reader/performance/F01-F20/M2/M4 goals remain open.

## I45: Initial saved-view readiness and interaction boundary

The entire SSR research workspace is inert and aria-busy until its existing initial URL-state restoration completes, with a separate polite preparation status. This addresses initial control exposure rather than changing source admission or replacing child-loader verification. Actual delayed-client readiness, source selection after readiness, history and narrow-screen evidence are separated in RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_45_INITIAL_VIEW.md and its QA. UPG053, UPG230, all F01-F20/243 requirements and M2/M4 remain open; strict completed count81 is unchanged.

I45 actual desktop delayed-client testing proves the initial inert/busy and keyboard boundary. Ready390px source switching, empty filtering, frozen-record Enter, deep-link and Back/Forward state transitions preserve exact source context; actual final native captures match108978/45718. The footer now shares the preparation state. The initial full1393/1378/15-existing-skips/0fail entry passes; final-build390px preparation, compiled/input reconciliation and all three unpassed observations are separately recorded in QA. This is not a full route/200%zoom/screen-reader/performance acceptance result.


## I46 · 运行校验信息的完整性与加载

七个source-view／auxiliary模块改读137项精确runtime input pins；完整当前manifest仍用于工程审计。查看器scope／path order/count、源bytes/SHA和科学缺失边界保持，manifest写入同步派生compact transport，完整回验拒绝缺失／重复／invalid／altered pins。编译identity bytes、原始输入保全、旧build拒绝、实际fresh restore及完整工程终态独立见[I46时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_46_RUNTIME_PINS.md)和[QA](qa/2026-10-03-implementation-46/verification-summary.json)。该范围不替代真实wire／parse／execute／interaction性能预算、全App辅助技术或M2／M4证据；81/243与完整Goal继续active。


## I47 · 来源轮廓的数值比较与科学门槛

新增on-demand numerical diagnostics，以actual private DAT／selected full audit／ordered source geometry为入口；七records的八source-name groups保留72loops／5149vertices，五unique-z组提供47 numeric neighbour intervals，其余重复z／跨z理由保留。三参数／27组合只表示软件敏感性，未提供物理section correspondence或独立biological tolerance，不新增surface／内部结构／same-cell／REG。JSON／CSV保留current18 diagnostic inputs、源proof与原参数；source trace定位、source switch与fresh recheck和旧17条Todd计算及最终工程范围见[I47时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_47_CONTOUR_DIAGNOSTICS.md)、[QA](qa/2026-10-03-implementation-47/verification-summary.json)。UPG231的数值探索为partial，独立科学校准任务仍planned；81/243、全F和M2／M4及完整Goal继续active。

I47最终代码完整research实际exit0：1402／1387 passed／15既有conditional skips／0 fail／0 cancel；build／strict types／全项目lint／必需validators通过。10 actual diagnostic receipts、五actual native captures及原始source／current18 analysis pins／current34 native pins独立重放无差异。七source逐一浏览、源trace定位、参数只改诊断、重新核验卸载旧panel、fresh native restore相机差0、390px／44px／12px和表格方向键滚动已实测。下载落盘与select方向键数值变化未验证，不声称全App辅助技术／200%zoom／性能预算或完整科学Goal已完成。


## I48 当前断点：准确 DAT↔SWC 候选和上游处理历史

六个准确原DAT的私有源证据、完整SWC／geometry节点及层级bytes/hash重放完成；NMO249676的12个胞体landmarks只有唯一+36µm numeric z匹配。预先声明的算术均值／area centroid和proper／reflected两模型、两disjoint分割共8组XY留出检查全部失败；原SWC0.01µm打印网格不是生物精度或通用阈值。五个其他候选保留各自数量／header／重复z的HOLD。未新增叠加层；UPG261 planned与81/243 exact completed不变。

两份官方exact-record-linked日志实际200下载并byte/hash保存；原stage42次短段删除与16未处理警告保持上游历史，CNG13条警告的准确节点坐标与固定SWC一致，10条radius和root8daughters/type核验。源编号、重复radius和原rounding规则不建立跨stage／DAT身份；日志不给明确matrix或平均规则。11专项覆盖source-byte篡改、伪造private proof、fit/held隔离、预定alternatives、HTML/错名/漏坐标/错summary/错node拒绝。当前完整工程终态与input preservation以[I48时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_48_DAT_SWC_CANDIDATES.md)和QA为准；浏览器不新增scope。

后续若有实际原ASC转换文件或源deposited matrix/averaging规则，可另行预先声明独立tree／soma correspondence审计，不把当前failed screen改为pass。BIL准确section／donor／共同outline frame／curated labels／file rights和exact mouse-spinal interneuron raw volume／internalsegmentation／parent／frame／original slice仍是M2／M4缺口。200%zoom、screen reader和完整App性能预算也未由source分析完成，全部Goal继续active。


## I49 当前断点：准确七轮廓显示说明

NMO45718路由卡片和main warning共用当前project-derived display scope，明确七Soma1／252mapped vertices、八native traces／275original vertices和legacy exclusion。source-deposited transform／vertex-to-node identity、membrane／volume／internal／measurement／REG仍未建立或未准入。实测的相关8px／9px边界文字已改为12px换行说明，main标题与列表上下排列；这是相关route context／conflict与main boundary／warning的局部改进，UPG053仍in progress。旧源文件和科学合同保留；UPG192既有完成范围与81/243不变。当前代码／manifest／private renderer fingerprint与正式浏览器结果见I49时间轴和QA，各证据范围独立。

实际200%zoom未验证：浏览器不公开zoom capability、原生App操控被工具拒绝；唯一控件shortcut输入后DOM width／DPR／font／CSS zoom均未变化。保留实际失败，不以viewport替代，也不以ARIA存在宣布screen-reader通过。全App可访问性、性能budget和M2／M4真实source缺口继续未完成；后续改进须保留完整目标及所有已准入能力。

## I50 当前断点：准确两条来源平面入口

UPG140达到其明确的两份repository morphology source-plane增量：NMO194468／194469沿用冻结census、原几何和当前2D rendering gate，准确metadata/SWC/geometry和逐node/edge一致性核验；两份对象不承担论文组统计／电生理／因果／parent identity／internal。Desktop和390px入口、Enter切换、失效／新capture以及跨尺寸same-source fresh restore各自有真实结果。Named routes43，selectable179，census142，supplementary37；精确completed82/243。初次unknown representation route已修复；全局科学JSON下载等待超时不计通过。完整Goal、M2／M4、独立生物校准及whole-App可达性／性能保持open，下一轮继续可实施的研究缺项。


## I51 当前断点：两条独立 PV 形态

UPG138完成其两准确来源对象增量，NMO170034为No Diameter中心线，NMO118824为来源Diameter授权的DER表面。两份冻结8.6.124 API对象及原SWC／新确定性几何逐bytes／SHA／node／edge／type／parent／radius／frame独立重放，主场景当前private proof、档案resolver／source scope／rendering policy及运行许可对齐。45 named／181 selectable／142 census／39 supplementary、673共享研究记录分别保留；原SWC复制0，originalUniverse1097与冻结representation0.7不改写。实际两入口、旧回执失效、390px／Enter、fresh同源恢复及不同source拒绝已验证，工程最终证据另见I51时间轴及QA。

精确completed83/243只是逐条已验收范围。PV论文引用不能填补exact physiology／circuit／allodynia／population denominator／animal pairing／physical parents／axon／membrane／internals；numeric age和individual sex不补造。I51不完成M2／M4或全Goal，继续从已记录未满足条件选择可实施增量；没有准确新来源时不得重复同一负面搜索并升格为完成。

I51最终工程封存：最终完整npm run test:research实际退出0：1,432 tests／1,417 passed／15既有conditional skips／0 failed／0 cancelled；包含生产build、严格typecheck、全项目lint、全部必需validators及当前测试入口。Node v26.0.0、Python3.9.6；临时精确positional read预加载只读取实际当前字节，逐size／mtime校验，保留原校验器和source hash要求，代码随QA保存。前五次未完成／失败尝试单独记录：历史MD、SpinalJ intake、RIGHTS_LEDGER.csv及三份R／parser验证输入的暂存遗漏已按原bytes／SHA补齐；比较PNG旧31-input断言改为当前32并显式检查academic-interface.css，额外原测试预镜像先存入ZIP。相关复验36 tests／34 pass／2既有skip／0 fail。原39/39 PV／集成专项独立保留，不能代替完整入口。
四actual receipts／132 main pins／4geometry／8辅助文件／两fresh恢复比对0差异；当前2401权威输入逐byte封存。原source与25预镜像、同期界面工作保留，完整科学Goal保持active。

### I52 · 主场景完整来源相机（完整入口、actual views与新布局收尾通过）

I52以准确已核验来源renderer范围适配主场景181对象的合法OBS／DER模式；显式Fit whole source／Home及默认resize保留用户／inspection／restore authority。原I51 NMO118824固定相机裁切109／540节点已被算法回归复现；完整research1447／1432通过／15既有conditional skips／0失败／0取消；23 actual JSON的920指定build pins／1998输入对账0差异，15默认／Fit／Home来源投影视锥通过。用户视角、inspection、恢复及尺寸变化的authority保持，两组fresh no-store恢复通过。全程采用2026-10-04新首页／分级导航／独立页面；41 SSR及12来源／静态工作台检查通过，light-theme入口文字修正经实际重建浏览及72相关测试通过；当前2419输入及29原像审计通过。该工作推进F02／F16／F17及partial UPG053／091，不改变83／243、来源计数、M2／M4准入或完整Goal状态。

### I53 · Russ群体来源信息（工程和局部浏览验证完成，下载仍未验证）

新分级布局的细胞类型及研究检索页保留；补入准确69群体的414捕获测序计数、Table1原始上下文及10成人验证panel。19,353捕获cells/nuclei与成人prevalence未知数值分母、2,371/2,894未解释差异分别保留。四固定输入原byte、原taxonomy不变及16 Python专项通过；最终完整research exit0：1458／1443通过／15既有conditional skips／0失败／0取消，含build／types／lint／必需validators。Actual desktop来源切换／比较／Explorer tabs与准确handoff、同尺寸decoded错误字节拒绝及恢复通过；既有实际390px来源换行保留，后续viewport未生效另记未通过。实际JSON下载未落盘验证，producer JSON／CSV测试不替代native export。2511输入／完整依赖／25原像独立核对，最终doc seal另回验。UPG132 in progress，F03/F08/F16推进但没有新增roster／geometry／same-cell／internal／REG／lineage准入，completed83/243及完整Goal保持active。


### I54 · 准确位置视图（工程与局部实际浏览验证通过）

新版独立Positions保留；40mounted renderer/build pins与23来源byte证明接入actual view/camera/row/layers/fresh restore。来源rows两frame保持独立且parent/animal/experiment/lab/method不补造。Compact198和canonical新增30路径并非新科学来源。根完整入口1468/1453pass/15既有skip/0fail/0cancel，actual exit0。15native desktop captures/7完整适配/4pairs与600build/345source pins离线回验通过；实际row/URL/键盘、raw/norm、manual orbit/wheel与保留方向Fit、两fresh no-store restores、stale build失败清零/恢复通过。原生JSON落盘、当前窄屏/resize、held-network cancel/context-loss、200%zoom/screen reader及whole-App预算仍未验证；UPG114 partial、83/243及全部Goal保持active。


### I55 · 来源记录集合准确入口（完整工程与局部实际desktop通过）

现有Source Registry沿新版独立页面布局提供source-owned导航、准确bookmark、分页/过滤/键盘与fail-closed请求。274actions不成为来源census；219profiles/40morphology actions/10source objects/5collection-download actions均为既有入口，navigation metadata不授权source byte、geometry或registration。Candidate111tests/types/lint通过，Positions mounted40build+23source和runtime198不扩张；修复后完整research1490/1475pass/15既有conditional skips/0fail/0cancel、实际exit0。Actual desktop书签/分页/准确ID筛选/roving keys/nativeEnter/committed目的档案与返回恢复、unknown/ambiguous/foreign失败关闭、GLUT独立分母及normalized Positions current receipt回验通过。新搜索框44px/边框/背景/焦点可见；初始化inert/aria-busy在既有完整URL恢复内开放，失败输入与lint尝试原样保留并重建重验。Native下载5s未落盘、当前窄屏/200%zoom/screenreader/整站预算仍未验证。2549canonical及8原像/7absences/10candidate的独立封存回验随后执行。31sources/41sets/387profiles/83of243保持，UPG108/110/113与完整Goal不据此全部核销。


### I56 · 成人脊髓来源汇总（完整工程与局部实际浏览通过）

UPG173准确687234B DOCX/228780B XML与CC BY4.0来源metadata/独立source字段提取通过；新面板沿用新版独立Additional studies布局。四alternative partitions不是684cells或16canonicaltypes；171recorded observations、51/6animals及60recordings/28of51mouse reuse保持分母范围。信息来源32/sets42；387profiles/13rosters/4objects/15navsets/274actions/83of243/identity0/REG0不变。28候选路径应用、15原像/19新路径absence及I55accepted epoch保存；root仅补显示原始公式片段。最终完整research1506/1491pass/15既有skip/0fail/0cancel、actual exit0，源Python6/6。Actual desktop/390px新版layout、192source cells/48comparisons原值和locator、失败关闭/恢复/历史/committed close/Enter/Tab出口/局部表格方向键滚动通过。Current package Positions拒绝旧build清零、fresh reload/restore和3actual captures/120build+69source pins/1pair/2fits独立回验通过；40+23/198 membership保留。2570canonical/2573stage最终doc与独立保全随后核验。Native下载5s无落盘证据、200%zoom/screenreader/整站预算未通过；源缺口及全F01–F20/M0–M4/243+21Goal继续active。

### I57 · 研究检索来源组键盘焦点（完整工程与局部实际浏览通过）

新版Explorer沿现有来源组/来源档案布局接入原I26键盘hook；完整来源key限定可见namespace，方向键/Home/End不触发来源选择或URL，native Enter/Space保持既有准确record选择，Tab出口保留。展开/收起/过滤只改变focus fallback，不替代selected dossier。三候选路径准确应用，6原像/3absence及I56accepted62member checkpoint保留；新子组件/测试/时间轴增加3canonical pins至2573。最终完整research actual exit0：1511/1496pass/15既有skip/0fail/0cancel。Actual desktop/390px/768px/回desktop focus与native激活、157Roome/28namespace原顺序、筛选/空结果/重置、后置source刷新、Russ独立页handoff/历史与Delile/SCI/形态准确选择通过，原records与DOM逐key独立对账。历史差异只为六actual request timing字段，其他档案全文一致；不把这些数据请求timings当整站budget。真实同长度decoded坏索引拒绝清零及四stage文件原字节恢复通过；root源不改。静态挂载闭包111→115/私有并集198/Positions40+23另验；2573canonical/2576stage最终doc/独立保全随后执行。673/28namespaces/387profiles/181morphologies/32sources/42sets/83of243不变；F17局部推进不完成全App200%/screen reader/budgets、native pending-load取消或M2/M4与完整Goal。


### I58 · V1准确来源样本书签（完整工程与局部实际浏览通过）

F07/F13-F16通过既有sample-only审计和qualified URL推进，不扩大14article clusters或387profiles。29samples/四sheets/29barcodes/one matrix结构仍保留冲突和held rights。六产品paths准确应用，9原像/3absences与前I57checkpoint保存；两旧断言原像另ZIP保存并更新当前来源范围，首轮2fail保留，最终1519/1504pass/15skip/0fail/0cancel actual exit0。Actual六目的档案/nativeEnterSpace/refresh/filters/九无效请求/history/重复外参reset/committed关闭fresh恢复和desktop390局部scroll/focus通过；publication/PKD2L1原分母独立。2577canonical/2580stage与独立末尾保全随后执行，198runtime/Positions40+23及83/243不变。Native JSONlanding/hydration-disabled间隔/module-pending取消/200%zoom/screenreader/whole-App budgets仍未通过；完整Goal/M2/M4继续active。


### I59 · 同来源RNA双特征计数（完整工程与局部实际浏览/source/export通过）

沿用新版独立Cell types页面、分级侧栏、Breadcrumb和light layout；默认关闭的双特征子视图只输出同来源RNA列的raw>0四分区、准确选中核计数和11完整profile分母。Chat/Pitx2两个chunk与Xkr4/Gm1992一个chunk分别fresh校验，过滤/分页/无匹配查询不替换已选特征或改变完整分母。七候选路径准确应用，9原像/4新路径absence及I58accepted51member checkpoint保存。完整research actual exit0：1526/1511pass/15既有skip/0fail/0cancel，含build/types/lint/必需validator。Actual来源切换、关闭/feature replacement、404与wrongchunk拒绝和fresh retry、独立single继续、53/74分母及390/1280新版layout通过；strict时间归属另附log/DOM receipt。独立原chunk/923metadata重放核对11profiles及两个准确Downloads文件JSON11358B/CSV20468B落盘；event API5s超时仍保留。I58后续[GSM8480605准确下载addendum](qa/2026-10-05-implementation-58/native-selected-json-file-landing-addendum.json)亦已核对，原sealed历史不追改。Package只扩requiredvalidator，private198和Positions40+23 membership不扩大，current Positions旧build清零拒绝/fresh reload/restore另验。2581canonical/2584stage及末尾独立保全随后封存。Native pending-route取消/200%zoom/screenreader/whole-App预算未通过；32sources/42sets/387/83of243、geometry/identity/REG/M2/M4不变，完整Goal继续active。 本轮推进F03/F13/F14/F16/F17的准确对象操作与导出，不能完成源数据缺口、跨来源identity、内部结构或完整Goal。


### I60 · 准确分子比较书签（完整工程与局部实际浏览/source/export通过）

新版独立Profile comparison页面保留分级侧栏、Breadcrumb和light reading layout。准确0–4完整source keys、anchor、query、namespace及page由七个URL字段恢复，版本和当前private decoded-index receipt限定权限；11种实际无效请求清空basket/report/exports，不替代对象。跨namespace/空筛选保持basket，第五项disabled；0/1项不生成报告；nativeEnter/Space、anchor移除、Roome157末页14/一项、refresh/link、重复外参/fragment及history/reset、route卸载/fresh恢复通过。完整research实际exit0：1534/1519pass/15既有conditional skips/0fail/0cancel，含build/types/lint/必需validators。误选Node24的gzip重压失败原样保留，源字节/解码正确；使用原Node26重跑通过，不重建gzip或放宽gate。49actual DOM captures的52pairs/208来源维度/52完整receipt由原387profile index及五taxonomy scopes独立复算；21receipt实际展开，两个准确JSON49648B/CSV18219B落盘并独立内容核对，event API两5s timeout保留。canonical请求75延迟12s后304/cached恢复仅supplemental；80的304/代理502不算checksum proof。实际84完整原gzip200后同长度decoded错误字节使页面校验失败并保持结果关闭，87完整原gzip200准确恢复同书签；临时部署副本metadata/重启使ETag换epoch，四份副本原timestamps已恢复，root源码/源字节不改。CmdShiftR无新请求证据、API measurement native0、network initiator/body consumption不冒称。Actual390/1280无整页overflow，原生ArrowRight后续capture局部scroll0→40，2px表格焦点/Tab出口及新版截图通过；错误heading locator原attempt保留。四产品afterimages不变，Compare static closure40→41仅bookmark JS；runtime198/Positions40+23 membership与字节保持。2585canonical/2588stage最终doc epoch另封存。32sources/42sets/387/181morphologies/83of243不变；200%zoom/screenreader/whole-App budgets/M2/M4及完整Goal仍未完成。 本轮推进F08/F13/F15/F16/F17；逐来源比较及其书签不核销核心mouse-spinal内部结构或完整Goal。


### I61 · NaV抑制来源信息（完整工程与局部实际浏览/source/export通过）

沿用新版 Source audits／Source Registry 独立页面、分级 SiteNavigation、Breadcrumb 和浅色阅读布局。现有 Crozat 层级新增默认收起的 NaV 来源子面板，局部筛选／12 行分页／显式源行选择／JSON 与 CSV 导出；关闭子面板、父级、workspace 或离开页面后重新进入均恢复默认，旧选择及导出提示清除。没有新增 NaV URL 书签或 Registry 个体导航。

两份准确 XLSX 保留新增84 measurement rows：56 current-density 与28 published-percentage，各自来源 row／cell locator／numeric lexical／hash 可追溯。28 percentage rows只有27 unique native labels，重复 Cerv Cell11、缺失 Lomb4和93–143.1%均保留；不跨表配对、补 Cell12、clamp percentage或推断physical-cell/animal identity。26 retained originals 与25 selected information workbooks分开，唯一未选 INa.xlsx 的原因unknown。原23tables／2115rows／220within-table groups以及PKD2L1 one profile／65firing／654passive rows不变；article12/6/10与Fig5D12/8/6、100vs50ms／0vs+10mV、0.5µM及study-levelN10保持准确归属而不映射到源行。

19个候选afterimages在I60 accepted64-member checkpoint、2585canonical和9个预像／16个absences保护后应用；15新路径加本时间轴共16准确CORE输入，当前2601canonical。完整research实际exit0：1550tests／1535pass／15既有conditional skips／0fail／0cancel，含build／strict types／全项目lint／required validators；Python来源重放6/6通过。原实际错误label locator、两lazy transient captures与六个5s download-event timeouts保留；六准确文件均原生落盘，独立内容验收通过（42 stable captures、两保留 transient 和一份独立 Registry dossier；六导出全字段逐行一致）。selected density row4 JSON与full percentage28 JSON分别保留，未冒称第二份selected percentage JSON。

Actual desktop／390px、新版导航／来源层级、native Enter／Space显式选择、Tab focus-only及退出、局部Scroll right200px、空筛选清零／关闭重开／跨页选择清除通过；页面无整页横向溢出。Positions旧package凭据实际拒绝清零，fresh no-store校验23files后17394normalized rows、改变Transverse后fresh restore保存相机／row／layers通过，独立重放通过（3 acceptance captures 加1 Transverse precondition、两 exact producer strings、40build与23source pins；17394 source centers及8 bounds corners无裁切）。runtime198 ordered membership只有package row重固定，Positions37mounted／40build／23source及22原XLSX不扩张。最终doc epoch、stage2604 replay entries／2603unique physical paths和2577prior protected inputs独立保全分别以本轮最终 QA 的独立实际执行为准；阶段报告不替代末尾保全。

当前32sources／42sets／387profiles／45named routes／181selectable／142census／39supplementary／83of243保持；0新profile、physical roster、observed geometry、same-cell join、internal或REG。F03／F08／F13–F17局部推进，200%zoom／screen reader／whole-App budgets及M2／M4仍缺完整验收，完整Goal继续active。


本轮不核销完整F01–F20／243+21／M0–M4；准确范围见[I61时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_61_CROZAT_NAV_INHIBITION.md)。

### I62 · 准确来源汇总入口（完整工程与实际来源／导出通过）

沿用新版独立Source Registry／Additional studies页面、分级侧栏、Breadcrumb与light reading layout。仅Garcia准确owned source／set／declaration／四assetpins提供一个来源汇总信息action；Crozat不新增action，metadata navigation不升级为individual identity或source-byte/render authority。原四产品afterimages保留，三个新代码／声明／测试与时间轴增加4CORE至2605；I61 accepted83-member checkpoint、真实intake和六原像完整保留。

390px实测新链接继承11px／38px，单一Link增加12px／min44后实际56.390625px、2px focus、无页面overflow；原finding／原patch／apply receipt及纠正前像保留，既有CSS与新版布局保持。最终完整research实际exit0：1559／1544pass／15既有skip／0fail／0cancel。两metadata读取拒绝和一次新只读reader误拦4个OS-temp故意改写tests保留；17边界peer通过的first-epoch reader仅用于只读manifest，完整tests恢复原per-read方式、原validators和断言后通过。

Actual34raw／32stable与真实navigation／TH+TD table companions通过；两lazy瞬间不计稳定。准确keyboard／目的页／history／refresh／零筛选保留／Crozat切换／unknown-conflicting-foreign拒绝／panel生命周期／Delile既有分页／390及1280布局通过。独立第二actual replay exit0、124unique end epochs稳定，87重复property rows只有唯一12ST1＋1ST3，不算新观察；首次other-source QA把navigation receipt混计dossier的拒绝及修正41守卫／独立peer保留。两source dossiers各一次原生落盘，Garcia24649B／Crozat20782B的完整7fields逐字面重放通过；event API5s timeout保留。来源dossier不代替Additional完整Study facts导出，UPG173仍in progress。

171共享观察pool、51／6动物及60／28复用subset／未知mapping／null units／source statement冲突保留；Crozat25selected／26retained、原23／2115／220与新增84分开。32／42／387／13rosters／4objects／83of243、whole runtime198／private8／Positions40+23与package保持，canonical2605／stage2608 finalepoch及2596protected末尾保全由最终QA实际执行确认。200%／AT／整站预算／M2／M4及完整Goal保持active。见[I62时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_62_SOURCE_INFORMATION_NAVIGATION.md)与[QA](qa/2026-10-05-implementation-62/verification-summary.json)。

本轮推进F03／F13–F17的来源准确操作；既有有限信息scope、来源dossier或阶段工程成功不核销完整Goal。完整Study facts下载、200%／辅助技术／整站budget及M2／M4仍按各自原要求保留。

### I63 · Russ GEO原始对象schema范围及本地工程核对

六个非公开源／审计路径与CORE7已真实整合；实际V7 intake的2605旧输入／87 accepted成员、完整SHA与首次epoch结束核对通过，0拒绝。初始ROOT／Stage全2612字节对等通过，新清单已采用。完整research实际exit0：1559／1544pass／15既有conditional skips／0fail／0cancel，含build、types、lint及必需validators；Python原始schema审计通过。

24,927个不透明ID条目与31,040个原生feature string仅为源对象schema事实。论文9周28,584个核、旧harmonized 19,353个核、原始ID条目与in situ 2,371／2,894各自保留来源和分母。E2/E5/E6/E9不映射动物或实验身份；矩阵访问403且字节未取得，不推导表达计数、类型、profile、physical roster、geometry、internal、REG或same-cell关联。UPG132继续进行中，科学admission=0，83/243与完整F／M目标仍active。

新版UI layout及路由全程保持。末尾保护范围为2612当前输入、2602旧canonical保护对象、87完整旧archive成员和83当前checkpoint保护成员，另含runtime198、8私有scope及Positions40＋23；最终实际结果见[QA封存](qa/2026-10-05-implementation-63/verification-summary.json)。初始清单采用与完整工程通过不自动替代末尾保护，不关闭外部科学证据hold。

### I64 · 来源标签选择与loaded-child归属（有限页面核验）

两个来源标签浏览器现在按准确完整ID保留明确选择。搜索、source group、排序和分页只改变列表；原选标签离开可见结果时，资料及标签导出仍属于该标签，并显示保留提示。只有明确激活另一标签才替换选择。GABA的原始细胞核child、loader和导出保持原有边界，未知／空／foreign／stale ID不代选首行。

真正accepted I63保留原始accepted时钟，实际只读intake核对2612旧canonical、94完整archive及90当前受保护成员；额外GLUT gzip仅为原声明的非canonical运输上下文，不准入新CORE。前两次intake拒绝、云文件请求失败及最终intake的一次未接受epoch metadata拒绝完整保留；停止的默认环境清单比对与本机文件服务重跑分别保留，下载请求不作为内容验证。实际整合只改两个浏览器、新测试、builder准确CORE2和本轮时间轴。

完整research实际exit0：1571项测试、1556通过、15既有条件skip、0fail、0cancel，包含生产build、strict types、完整lint及必需validators。51条实际页面操作记录验证默认标签、明确选择、筛选／分组／分页／排序、Enter／Space、390px键盘检索、保留提示及加载中的取消。已加载child的内层Cervical检索、第2／34页、source row1308的准确compound key及完整导出在外层变化后逐字段一致。真实15秒延迟请求在外层筛选后仍归原标签；明确切换时实际取消，迟到的准确原始响应不恢复旧rows／proof／export。

两份所选标签JSON均实际落盘并与原来源完整内容一致：GLUT Col13a1为2826核、4506bytes；GABA Col18a1为2068核、3471bytes且runtimeNucleusRowsIncluded:false。事件API timeout及原始action／文件landing时钟保留。390px没有整页横向溢出；真实200%缩放快捷键没有改变当前浏览器缩放，仍待验证，screen-reader announcement亦未实测。不新增标签URL解析器；错误label ID仅由test-local state injection验证，不冒称原生URL／bookmark／Back恢复。

全程沿用当前新版首页、分级SiteNavigation／sidebar、Breadcrumb、独立研究页面及light reading layout。CSS、原始数据、source loaders、package、runtime198／private8／Positions40＋23和科学分母不变：GLUT277／92782／28、GABA204／73364／24、confirmed CHOL_IN11／923、32sources／42sets／387profiles、45named／181selectable／142census／39supplementary、exact completed83／243。科学admission全部0，完整F01–F20／243＋21／M0–M4继续active。

末尾范围为2614当前canonical、2607旧canonical保护输入、94完整旧archive及90当前受保护archive成员；最终文档／清单／Stage对等与来源保全以[本轮QA](qa/2026-10-07-implementation-64/verification-summary.json)的真实结果为准。阶段工程与有限native成功不替代末尾保全、200%／AT／整站预算或M2／M4来源证据。


### I65 · 无效类型请求与重复链接迁移（有限页面核验）

沿用当前新版首页、分级 SiteNavigation／侧栏、Breadcrumb、独立研究页面及浅色阅读布局。类型页面明确请求未知、空、重复、其他对象种类或过期编号时，现在显示不可用状态，不以 DE-1／首条记录替代，不选择来源行并禁用 dossier 导出；真实激活有效来源记录后恢复准确档案。没有明确请求时，原 DE-1 默认行为保留。

修改现有 InterneuronTypeAtlas 与外层 ResearchCollectionPage，完整保留重复 URL 参数，拒绝格式不完整的 canonical 请求，并阻止重复 legacy type 自动升级成有效 canonical 链接。有效 dossier 内容与导出生产器、现有来源标签浏览器、CSS、导航、原始来源数据、加载器及 package 保持。查询／完整筛选的 URL 历史恢复未在本轮完成。

真实浏览先发现 canonical 空编号仍显示 DE-1，修复后又发现重复 legacy 编号会自动取得有效 focus；两个原始失败均保留，再修复并重验。最终完整 research 实际 exit0：1582 项测试、1567 通过、15 既有条件 skip、0 fail、0 cancel，包含生产 build、strict types、完整 lint 与必需 validators；新增11项实际组件／外层路由测试全部通过。前两次完整检查各自真实通过但对应中间源码，不能代替最终检查。工作区直接检查的未完成／终止结果亦保留，不改成通过。

最终11条原生页面记录通过：重复链接原 URL 及刷新后仍不可用，canonical 空／重复／错误种类没有替代档案，未指定编号仍为 DE-1；390px 的零匹配、来源筛选不替换请求，native Enter 准确恢复 DE-2／80 sampled nuclei，后续零匹配仍保留该档案。新版侧栏及 Breadcrumb 始终存在，没有整页横向溢出。输入工具一次 target-token 拒绝及上一轮记录 helper 失败原样保留，未补造 action 时钟；最终稳定逐条原始记录与真实键盘动作单独保存。

同轮 UPG-173 的 ST4／rheobase 两次不同输入方式导出未在预期 Downloads 文件集合出现新文件；旧文件全内容及元数据保持。页面提示不算落盘，旧文件不代替新导出；UPG-173 继续 in progress，没有 ACTUAL_READY 或科学 completion。

当前 runtime ordered membership 198、private scopes 8、Positions40＋23保持；ResearchCollectionPage 属于原198成员，因此 whole-runtime SHA合法更新为990fd1ffd752aef551db386c123f9af30e0519ea036d96c0e62e62557ee4f8b0，不能声称整个runtime字节不变。新增测试及独立时间轴为准确 CORE2，canonical输入2614→2616。真正 accepted I64 保留2026-10-08T01:16:54.057749+00:00原时钟；原98-member archive全内容另核对，原文及每次局部修复前态独立保存。本轮工程完整检查与Stage当前清单检查、Root本轮变动文件对等应分别说明；不把继承的I64全部Root来源检查改写成一次新的2616输入Root物理重放。

32sources／42sets／387profiles、45named／181selectable／142census／39supplementary、13rosters／4objects、exact completed83／243以及身份／内部结构／REG准入不变。F13／F15／F17仅有限推进；200%实际缩放、screen reader、完整浏览历史、整站性能预算及M2／M4仍按原目标待验，完整F01–F20／243＋21／M0–M4保持active。

见[I65时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_65_INVALID_PROFILE_REQUEST.md)与[实际QA](qa/2026-10-07-implementation-65/verification-summary.json)。


### I66 · 来源信息页面的按需索引加载（有限请求与页面核验）

沿用当前新版首页、分级SiteNavigation／侧栏、Breadcrumb、独立研究页面和浅色阅读布局。现有Sources与Additional study evidence页面没有对象请求时，不再下载未使用的Research Explorer索引；明确canonical／legacy／空／错误请求仍要求验证，其余11种collection及旧workspace默认加载行为保留。移入idle时立即隐藏旧index／record／delta，原AbortController与generation继续丢弃迟到响应。I65完整请求参数、无效profile和重复legacy拒绝修复保留。

实际整合Provider与当前I65 Collection，在完整前态核对后仅合并三个明确片段，未以过期候选覆盖I65。新测试及本时间轴增加准确CORE2，2616→2618。首次应用因引用的候选hash不准确而停止、零产品写入；与原候选handoff完整核对后第二次应用通过，原拒绝保留。CSS、导航、source loaders、原始数据及package不改。

本轮24项实际组件／hook／collection回调测试通过，覆盖两metadata页opt-out、默认与准确对象仍加载、同步隐藏旧数据、取消／迟到index及supplement、A→B→A、失败关闭、重复key及live-address历史需求。最终完整research实际exit0：1595项测试、1580pass、15既有conditional skips、0fail、0cancel，含生产build、strict types、完整lint和必需validators。候选13项通过不是当前集成证明，最终实际检查单独保存。

真实页面共24条观察，其中2条I65前态、22条当前观察。默认Source registry及Additional页面的完整可见文字与前态逐字一致，desktop与390px均没有整页横向溢出，新版sidebar／Breadcrumb始终存在。Sources准确Garcia来源的native Enter、真实Back／Forward保留来源档案；明确对象与Sources／Additional空请求均仍请求索引。Explorer仍显示673records／28namespaces及准确DE-2／80sampled nuclei；Compare仍显示387profiles／10namespaces，原生键盘加入准确I1／I2并生成原完整来源字符串报告。类型页面重复链接继续不可用，focus仍为none，没有恢复DE-1。

只在owned本机3028→3004的受控no-store运输中观察请求，正文与encoding保持；18个实际manifest／index请求完成200，完整body hash与原bundled transport一致。每个前态metadata页各读5622B manifest与628095B encoded gzip index；当前两个默认页及来源选择／无请求Back没有此类请求。原gzip完整解码为12327624B／c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085，与原plain index全文一致。628095B是encoded运输量，不能写成decoded JSON大小。两次lazy-shell瞬间保留并另等待当前heading后记录ready；不是删除内容或以未加载页面计算成果。这是有限请求准入与页面行为，不声称whole-App预算、完整network initiator／body consumption、private byte权限、native export、200%实际缩放或screen reader通过。UPG-230继续in progress。

runtime198 ordered membership、private8及Positions40＋23 membership保持，只有原Provider／Collection两成员byte pins合法更新，whole runtime为36638B／d749f7a9e957a3add94d179fff5678dd49689bd88ecf5b8c3ab1a732628ce86a。继承I65有限整合scope与原15-member checkpoint全内容核对，真正accepted I64原时钟及98-member archive保留；本轮Stage当前完整清单、Root本轮变动文件对等与原归档应分别说明，不冒称新的一次全部Root2618输入物理重放。

32sources／42sets／387profiles／13rosters／4objects、45named／181selectable／142census／39supplementary、exact completed83／243及same-cell／internal／REG准入不变。UPG-173 fresh Study facts导出落盘、完整类型筛选／历史恢复、200%／AT／whole-App预算及M2／M4来源证据仍待验；完整F01–F20／243＋21／M0–M4Goal保持active。

见[I66时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_66_INDEX_DEMAND.md)与[实际QA](qa/2026-10-07-implementation-66/verification-summary.json)。

### I67 · 类型页完整地址状态与历史恢复

全程保留当前新版首页、分级SiteNavigation／侧栏、Breadcrumb、独立 `/explore/cell-types` 路由及浅色阅读布局。类型页的准确对象ID、literal query、source／region／transmitter三项筛选、0–4个比较和不同对象baseline由同一严格解析器恢复；当前387个profile／10个namespace的轻量请求成员清单从原public index准确生成，并与实际组件387条记录及生成器逐项核对。该清单仅限定公开metadata请求，不授权private roster bytes、跨研究身份、同一细胞、geometry或REG。

父级active-record请求与子级dossier／export同时拒绝重复、空、不完整、未知、旧或异类ID，以及错误／重复筛选、超过160字符或重复query、未知／重复／超过4项的比较及无效／同对象baseline。编辑控件仅修正用户改动的字段；无效比较保留至明确清除，筛选不替代对象。有效对象在零匹配结果中继续显示原准确档案和比较。搜索更新当前历史条目，对象／筛选／比较建立条目；真正Back／Forward恢复原baseline，不把历史恢复伪装成一次新选择。保留无关重复参数和fragment。

本轮51项针对性检查通过，执行真实编译后的组件／父级回调、全部实际profile adapters和严格source-record delta helper；测试内受控历史不冒称原生浏览器证据。最终完整research实际exit0：1622项测试、1607pass、15既有conditional skips、0fail／0cancel，包括生产build、strict types、完整lint及必需validators。初次完整候选1621／1606／15通过后，真实页面发现重复ID提示被错误显示成empty；已显示原始重复值并区分missing／empty，增加实际检查后重新完成整条工程检查。

39条真实页面观察保留，37条ready；包括原生AX Return准确选择DE-2／80与DE-3／37、加入比较，真实refresh／Back／Forward、完整书签、两档案比较、零匹配保留、重复外参／fragment、父级focus关闭、错误参数明确修复。最终构建9条观察中8条ready，1条lazy-shell另等ready后验证。390px及默认1135px没有整页横向溢出，临时viewport已恢复。一次控件locator未命中及原AX字段选择器更正保留，不以空壳算成果。修正前、refresh／Back／Forward及最终构建的同一DE-2档案／controls／comparison文字逐字相同。截图实际返回JPEG，已按真实格式复制保存，原文件与像素保留。没有native file export、完整AT／200%真实缩放、whole-App预算或private byte权限结论。

代码应用前态与I66原15-member归档全文核对；消息修正两次因Root source／QA读取期间metadata变化而被原5-field before／after guard拒绝、零产品写入，完整预读后新独立尝试通过，guard没有放宽。Native记录核验的一次metadata拒绝及一次错误PNG格式假设也保留；根据真实JPEG完整字节与SOF尺寸核验后通过。当前canonical增加准确6项输入，2618→2624，原runtime198与private8／Positions40＋23成员保留，仅Collection原成员pin更新。最终Stage完整清单、Root本轮15个整合文件全文相等和I66原15-member归档重放分别核验；真正I64完整Root来源时钟2026-10-08T01:16:54.057749+00:00仍为继承前态，不冒称本轮新全部Root2624输入物理重放。

32sources／42sets／387profiles／13rosters／4objects、45named／181selectable／142census／39supplementary、exact completed83／243及身份／内部结构／REG准入不变。仅有限推进F13／F15／F17；其他Cano／SCI等完整状态恢复、UPG-173 fresh原生Study facts落盘、整站性能／AT／200%及M2／M4来源证据仍待完成，完整F01–F20／243＋21／M0–M4Goal继续active。

见[I67时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_67_TYPE_VIEW_STATE.md)与[实际QA](qa/2026-10-07-implementation-67/verification-summary.json)。


### I68 · 原生研究事实附件与暂停交接

短生命周期Blob下载改为准确GET附件，并沿用新版独立页面、分级侧栏、Breadcrumb和浅色阅读布局。文件必须明确命名一个ST1–ST4；缺失／未知／重复table或重复query退出400，无附件／来源事实。显式改一个字段保留其他重复外参和fragment，不修复另一字段。页面只声明Download requested。四原表／48属性／192mean±SD／48比较、同一个171观察池、未知单位／动物映射及13顶层导出语义保持。

26项专项通过。最终产品完整research实际exit0：1630tests／1615pass／15既有conditional skips／0fail／0cancel，含build／strict／lint和全部必需validators，UTC2026-10-08T03:42:04.108877–03:45:52.789133。六个有限产品／timeline输入已整合，原I67的29成员archive全内容重放；runtime198与来源facts／derivation不变。

真实新版页面仅核对ST1十二行及ST4／rheobase一行。原生Enter在UTC03:51:28.141–03:51:28.280触发准确GET，request1303返回200；浏览器报告paused download response is no longer available，后续DOMSnapshot超时。恢复保留原action时钟，不重建操作／下载事件。Downloads无新匹配文件，旧文件保留检查先通过。HTTP200不算落盘；没有实际新文件13字段／本版窄屏／后续DOM验收。UPG-173仍in progress，83／243不变。

2026-10-08用户明确要求本session本轮收尾后暂停升级、推送全部更新并设Repo为Public。完整Goal未完成；后续事项见[待更新项目](PENDING_UPDATES_2026-10-08.md)。其他Cano／SCI完整状态、200%／AT、整站预算和M2／M4全部保留。推送／Public以实际Git／GitHub检查为准，未发生成果不预先登记。

见[I68时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_68_STUDY_FACTS_DOWNLOAD.md)和[实际完整工程执行](qa/2026-10-07-implementation-68/actual-candidate-full-research.execution.json)。
