# BIL Xenium W01：当前元数据实施与真实二维 pilot 的阻断表

检查日期：2026-09-29（America/Toronto）。范围：UPG-163、029／029A、100、244／255 的合并最小输入核验；不是 cell+nucleus pilot 完成声明。

当前已实现一个按精确 BIL object key 选择、查看和导出 run／slide 元数据的可复用组件。已取得并校验原始小输入，保留 source-local 身份、分割方法、命名 outline 候选和权利声明。真实 cell／nucleus 多边形没有准入：当前 acquired inputs 没有可用于证明每个 cell 的 section／sample 身份链，也没有已声明的 outline-to-cell 坐标变换。

## 原始输入与当前可复核凭据

先搜索了项目和 `/private/tmp` 中的历史 BIL receipt／原始文件，没有找到 UPG-163 所述 34 个原始小输入。普通浏览工具不能读取 download/API，普通本地网络出现 DNS 失败；经环境自动批准的网络读取随后成功。该成功意味着本轮已能实际取得元数据，不应继续把访问失败当作数据缺失。

输入仅获取一次，现保存在 `data/source-candidates/bil-xenium-20260929/`，脚本重跑复用已有文件。没有全量镜像、下载大影像或转录本，没有联系作者、发布或上传文件。

| 当前输入范围 | 文件数 | 原始字节 |
| --- | ---: | ---: |
| 16 `experiment.xenium`、16 `metrics_summary.csv`、一个 representative `gene_panel.json`、一个 workbook | 34 | 1,187,125 |
| 另含 collection／16 run目录、group DOI API、16 dataset API、14小 outline CSV候选 | 48 | 1,133,461 |
| 全部保存并校验的本轮输入 | 82 | 2,320,586 |

总计是本轮有界输入范围，不是全量 deposit inventory。34核心文件的字节数与 UPG-163 历史队列一致，但只有本轮实际读取的内容才被提升为当前核验。没有重新证明历史全树的 1,887 文件／约650 GiB总量，也没有重新下载16 panel以重证全部 byte-identical。

| 派生凭据 | 字节 | SHA-256 |
| --- | ---: | --- |
| `data/source-candidates/bil-xenium-20260929/receipt.json` | 29,448 | `3030ae18b40616477bacbae62cec8b89140203b33f06ae0ba0e9d171c19e8f9e` |
| `data/bil-xenium-source-metadata-0.1.json` | 116,531 | `9b932a755af6b90c9d20b44a6a13a4b2044f942753f1b0c12e0f3e3d322bf404` |

receipt 中每个原始文件都有 URL、相对路径、字节数和 inspection-computed SHA-256。它们证明本地取得的字节，不冒充 publisher 提供的 checksum。旧 `bil-xenium-spinal-audit-0.1.json` 保持原检查日期和较窄范围；本轮建立独立 superseding adapter，不改写历史零下载记录。

## 与历史范围相比的实际新证据

- 当前官方 [group DOI API](https://api.brainimagelibrary.org/retrieve/groupdoi?bildid=g.1196) 给出了16 run／slide 到各自 `bildid` 的明确目录 crosswalk。`BIL:<bildid>` 为本适配器选择 key，ROI UUID另行保留。
- 所有16 acquired manifests 明确 `analysis_sw_version=xenium-3.3.0.1`、`segmentation_stain=Xenium Multi-Tissue Stain`，不能从 `chemistry_version=v1` 推定全部使用核扩张。
- Run1／Slide1 (`BIL:ace-pie-bin`) 的实际 metrics 为1121 boundary-stain、194741 interior-stain、12937 nuclear-expansion，合计208799 raw segmentations。全16运行相应合计23677／3130515／233108，合计3387300。方法证据是run级，不是每个cell的方法表；实际核扩张距离未在已取得manifest／metrics中声明。
- 34核心输入实际读到的 raw XOA 总数3387300 与历史一致；616599 neurons／2081760 non-neuronal仍标明为旧primary-article上下文，未从本轮inputs重算，也不是interneuron分母。
- 一个 representative panel实际解析到480 unique gene targets；其来源computed SHA-256与UPG-163历史 `b6261a46b6c6f1288e0913466353bcd822510cad1141a7723202827a38fe8311` 一致。其余15 panel本轮未重查。
- 当前官方16 [dataset metadata API](https://api.brainimagelibrary.org/retrieve?bildid=ace-pie-bin) 都明确 `CC-BY-4.0`，与workbook16 Dataset rows一致。因此“具体dataset权利元数据未取得”已解除；[BIL站点政策](https://www.brainimagelibrary.org/download.html) 仍为CC-BY-SA-4.0，差异未解释，不能静默删除某一声明或声称publisher完成澄清。
- 原始outline CSV需要跳过source comment rows才可读 `Selection,X,Y`。本轮实际取得的 named outline labels共329；Runs5–7的6个目录未列此类outline候选。329是命名标签数量，不能直接称为已识别sections，或以523−329宣布缺失194个sections。
- 个别outline comments声明area unit `µm^2`，没有明确声明每个X/Y坐标的单位、原点、轴向或其到cell table的transform。不能把area unit自动升级为坐标frame证据。
- API specimen的donor／tissue key在若干run／slide间重复；目录token、cassette token、API sample ID和outline中M/F token也不能按名字自动统一。API的14个distinct donor strings只是源字段去重结果，不是已验证14动物crosswalk。workbook `SpatialTX` row7 的transform和cell ID列为空；模板example row6已排除。

## 精确准入／阻断表

| 能力／条件 | 本轮证据 | 当前结论 | 可重启的确切输入 |
| --- | --- | --- | --- |
| run／slide metadata选择与导出 | 16 dataset API crosswalk、唯一ROI、原始hash | 已实现；metadata-only | 已有；组件可由主入口整合 |
| 文件具体使用声明 | 16 API及workbook CC-BY-4.0；站点BY-SA | 具体声明已取得，适用政策差异保留 | copied／derived boundary files的一致适用声明或明确解释；保留两项声明和attribution |
| section身份与坐标 | 329 named labels；`Selection,X,Y`；无cell_id及明确transform | 真实切片pilot阻断 | source-supported cell_id→section表；或明确outline frame／units／transform及section crosswalk |
| 每section／cell的specimen | 目录／cassette／API字段全部保留；存在重复和命名差额 | 不从dataset-level specimen赋值每cell | source-supported per-section donor／tissue mapping |
| cells↔cell／nucleus边界稳定ID | Payload仍未取得 | 不声称schema／ID成功 | 前置门通过后固定小table／boundary原始文件；重复、孤立、缺失／未匹配ID与schema audit |
| interneuron分类 | 没有取得exact curated cell_id标签表 | interneuron lane阻断；可保留source-only unresolved分类 | exact deposited labels及provenance；不能用panel或automatic clusters替代 |
| 分割实际方法 | manifest／metrics的3.3.0.1及三方法分母 | run级方法已核实；参数partial | 若宣称具体distance／per-cell method，还需exact processing parameter／cell-method evidence |

当前零准入计数：cell boundary、nucleus boundary、interneuron、3D cell、atlas registration、same-cell morphology join均为0。未取得或不明确的fields用null／explicit gate表示，没有proxy或合成cell几何。

[10x官方分割说明](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/2.0/algorithms-overview/segmentation) 和[输出格式说明](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/latest/tutorials/outputs/xoa-output-understanding-outputs) 区分flattened 2D masks与simplified polygons。这些平台定义用于解释边界；本数据的方法结论来自actual manifest／metrics，不来自默认算法距离或chemistry推断。

## 实现、验证和可回滚范围

实施文件：`app/bil-xenium-metadata-explorer.tsx`、其CSS module、`app/bil-xenium-source-metadata.js`、当前normalized JSON、两个 `tools/bil-xenium-*`脚本、独立validator／tests及本文件／专属时间轴。worker没有修改主App路由、package、queue、source registry或manifest。

独立核验 `node --test tests/bil-xenium-source-metadata.test.mjs`：5通过。包括82源文件字节／hash、raw／method分母、确切selected object、重复specimen key不造成ROI合并、missing selection不残留旧对象，以及identity／rights／outline／distance／geometry伪造拒绝。独立ESLint通过。全项目typecheck返回38项错误，本轮bil模块没有匹配错误；不能以此声称全项目typecheck通过。真实browser交互应由整合者在接入后验证。

离线重建只需当前raw inputs和已有Python/openpyxl；validator不需联网。撤回只移除本次新建路径及整合者另行记录的入口改动。保留本轮original source inputs／receipts可继续复查；不使用整库reset或覆盖旧dirty files。
