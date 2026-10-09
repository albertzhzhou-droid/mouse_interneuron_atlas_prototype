# BIL Xenium：一个运行的原始三表核验

日期：2026-09-30。准确范围：`BIL:ace-pie-cot`／`Run8_Slide2_Mus_M7_F7`／ROI `075490e7-4e87-42ee-a488-bdc975443129`／analysis `97bd35fe-159d-472d-872f-a7949a4d6209`。这是 source-local schema、ID、方法与缺失值核验，**不是已完成二维切片 pilot**。

## 取得的原始文件

对现有16份原始目录列表逐项比较三份 Parquet 的实际列示大小，最小组合是本运行，合计 **37,282,469 B**。下载仅限这三份，不取得 transcripts、OME-TIFF、分割mask或其他15运行的几何表。原始文件保存在 `data/source-candidates/bil-xenium-geometry-20260930/`；不复制到 public、不接几何 API、不嵌入浏览器 geometry payload。

| 来源文件 | 原始字节 | inspection-computed SHA-256 |
| --- | ---: | --- |
| [cells.parquet](https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/cells.parquet) | 3,763,859 | `14e4d07383d1ec2c33d124c48a3c71fb5f502721e875bfc3379b0ecfc8623dec` |
| [cell_boundaries.parquet](https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/cell_boundaries.parquet) | 17,485,669 | `3a36dac7a0e5bc11ca6acdbe5550a22a1df2f0c3bfdb6cf68c62693dd8052425` |
| [nucleus_boundaries.parquet](https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/nucleus_boundaries.parquet) | 16,032,941 | `9a746dd2846835614e0bc207b4869691517e6cdf20105e7cf5fd9ad9f6d4ad44` |

这些hash证明本地字节，不冒充publisher checksum。取得时核对固定目录列示大小及Parquet首尾 `PAR1`；重跑复用原始文件并核对首次receipt，不改写首次下载记录。原始metadata-only快照及其82文件receipt保留。这里的37.28 MB不是整个deposit或完整pilot预算；主规划43.66 MB历史表对应Run1三份Parquet加已取得的workbook。本运行三份gz CSV会达103,484,815 B，因此采用更小的Parquet。

## 实际全表结果

| 项目 | 全表结果 |
| --- | --- |
| cells原始行／唯一完整字符串cell_id | 182,698／182,698；重复cell ID及额外重复cell行均0 |
| cell boundary原始vertices／唯一cell_id／polygon groups | 4,564,211／182,698／182,698 |
| nucleus boundary原始vertices／唯一cell_id／polygon groups | 4,468,434／180,436／180,502 |
| 无cell边界ID／孤立cell边界ID／孤立nucleus边界ID | 0／0／0 |
| source nucleus_count | 0核：2,262；1核：180,374；2核：58；3核：4 |
| 没有核边界的cell IDs | 2,262，逐ID均匹配source nucleus_count=0；正核数量但无边界及0核却有边界均0 |
| 多核cell IDs | 62；逐cell nucleus_count与对应polygon group数量全部一致 |
| 核面积NaN／source null | nucleus_area有2,262个NaN，与无核记录一致；全部14列source null均0 |
| 边界非finite坐标、未闭合、少于3不同点、非连续重复group、无效label、多cell共享同文件label | 两份边界这些检查均0 |
| 两文件共同的数字label_id／对应不同cell_id | 180,502／180,502；**不能用label_id跨这两个文件连接** |

闭合／几何结构检查只证实来源导出轮廓可解析，不是分割准确率、细胞膜观测或真实3D验证。一个polygon多行vertices是正常结构；多核cell有多个nucleus polygon也是来源实际结果，不能误记为重复cell。

## 新的方法与参数证据

逐行 `segmentation_method` 的三个原始字符串与既有run metrics逐项一致：

| 原始值 | 行数 | 既有metrics字段 |
| --- | ---: | --- |
| `Segmented by boundary stain (ATP1A1+CD45+E-Cadherin)` | 3,008 | boundary |
| `Segmented by interior stain (18S)` | 169,374 | interior |
| `Segmented by nucleus expansion of 5.0µm` | 10,316 | nuc_expansion |

因此 **5.0 µm已由这10,316来源行明确声明**；不是由chemistry、平台默认值或其他run推定。原始manifest/metrics自身没有distance字段仍是事实，2026-09-29快照保持该范围的null。本轮独立增量解除这一个run的cell schema、稳定cell↔边界ID、逐cell方法及该原始字符串范围的distance缺失；其他15run没有取得cell table，不向其传播参数。

## 未解除的准入条件

[当前10x输出定义](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/latest/tutorials/outputs/xoa-output-understanding-outputs)将这些标准字段描述为µm、边界为分割mask的简化显示；本轮读到的页面版本是v4.1，实际source manifest为XOA3.3.0.1。已取得Parquet没有物理unit元数据。不能把较新平台定义伪装为该文件的单位声明、outline transform或具体section证据。

- section：仍无source-supported cell_id→section表或明确outline-to-cell frame transform。29命名outline只是来源候选标签。
- specimen：dataset API只给run级记录，目录M7/F7、cassette M1/F3及API女性字段不能自动赋给各cell。section/donor/tissue crosswalk保持未知。
- cell type：14列没有curated type字段。分割方法、480-gene panel、自动cluster或文章总数均不能变成exact interneuron标签。
- rights：该run API/workbook的CC-BY-4.0与站点CC-BY-SA-4.0分别保留，政策差异没有publisher解释。本轮仅本地原始输入检查，不准入viewer geometry或derived polygon asset。

几何viewer准入、section-linked cell+nucleus、interneuron、3D cell、atlas registration和same-cell SWC join均为0；M2/M4、完整Goal均未完成。

## 可复现与界面范围

`tools/bil-xenium-fetch-geometry-candidate.py`只认固定三路径与固定预算；`tools/audit_bil_xenium_geometry_candidate.py`使用临时环境的pyarrow21.0.0解析所有行，生成 `data/bil-xenium-geometry-schema-audit-0.1.json`。`--check`重放全部原表并逐字节比较派生JSON，不覆盖输出。pyarrow未加入项目runtime或package依赖；本机临时reader位于 `/private/tmp/ohri-bil-parquet-20260930/bin/python`。

`/source-audits`的BIL run选择器展示当前准确schema增量；切换到其他run不残留这份表。四个固定例行（0、1、2、20）逐字段给source值／NaN、精确row/column locator及共享source identity hierarchy。它们是例行，不是全量cell roster。cell稳定ID已知，specimen/section保持null与原因。当前selected-run JSON导出包含原metadata快照、当前三表audit及仍阻断的四门；原快照不被改称当前全部pilot状态。

专项14项已通过；完整工程及正式浏览验收记录见[I04时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_04_BIL_SCHEMA.md)。UPG100、163、244维持partial；UPG255依旧缺真实可追溯section与分类条件。
