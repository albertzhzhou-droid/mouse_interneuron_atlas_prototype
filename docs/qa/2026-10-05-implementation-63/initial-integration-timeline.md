# I63 · Russ GEO 两个原始对象的 schema 审计

2026-10-05（America/Toronto）。继续使用当前新版首页、分级 SiteNavigation／侧栏、独立研究页面、Breadcrumb 和浅色阅读布局。本轮仅接入来源审计文件与复现工具，UI、CSS、来源注册表、package 及私有查看器均不属于修改范围。

## 实施范围

准确候选包含六条新路径：两个原始 gzip、取得记录、原 UPG132 队列上下文、schema 审计 JSON 和 Python 复现工具。本时间轴是第七条 CORE 新输入；拟从真实 accepted I62 的 2605 条输入增至 2612。最终是否接入及验收结果以本轮 QA 为准，准备记录不代替实际 intake 或工程检查。

## 科学与来源边界

两个对象合计 225706 compressed bytes，分别记录 24927 个 opaque cell IDs 和 31040 条 features。E2／E5／E6／E9 前缀的 7212／2509／7009／8197 个 ID 不是四只动物，也不能补出细胞类型、动物身份或 marker 注释。论文 28584 nuclei／四只 adult mice／9 weeks 与既有项目的 19353／69／414／2371 及 2894 等计数保留各自出处，不能用 CSV ID 数量消除口径差异。

矩阵尚未取得；旧 112984417 B 记录只属历史元数据。当前目录 GET 与矩阵 HEAD 的 403 原证据保留，本轮不重复访问，也不宣称矩阵长度、内容、CRC 或哈希已核实。文件级权利、完整 annotation 与 cell-to-animal 映射仍未成立；不新增 public IDs、roster、profile、observed geometry、same-cell join、internal 或 REG。

## 验收状态

初始时间轴：候选独立来源复核与有界负例已经存在；真实 accepted I62 rebind、完整只读 intake、六路径应用、CORE 七行原像不变式、完整工程检查和末尾来源保全尚待本轮实际执行。

UPG132 继续 in progress，exact completed 保持 83／243。M2／M4、F01–F20、243＋21 及 M0–M4 完整 Goal 继续 active。本时间轴的最终版本会记录实际 exit 与 QA 指纹，不将准备或局部通过记为全部完成。
