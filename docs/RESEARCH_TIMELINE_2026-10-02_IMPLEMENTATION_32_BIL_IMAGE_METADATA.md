# I32：准确 Run8 的原始影像元数据与数值一致性

日期：2026-10-02（America/Toronto）。完整 Goal 保持 active；该增量推进 M2 的准确来源证据，不以元数据或工程测试代替切片 pilot 或 M4。

## 原位输入与恢复

接手时逐字节核验 1,238 authoritative inputs；10 个既有 owned 文件备份于 `qa/2026-10-02-implementation-32/owned-files-before.zip`。原始科学文件、历史 I21/I30、冻结 2.34/2.90、原 File Provider dependencies 及其他既有修改保留。新增范围仅含该准确来源的有界元数据、离线读取/对账、来源页面/导出和本时间轴，无 Git/push/publication。

## 新原始证据

准确来源为 `BIL:ace-pie-cot / Run8_Slide2_Mus_M7_F7`，manifest 的 `images.morphology_filepath` 指向 [morphology.ome.tif](https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/morphology.ome.tif)。原目录及每次 HTTP206 Content-Range 同时限定 25,611,493,268B 源文件。只取得五段 first-IFD/OME/SubIFD-pointer metadata，共 1,606B，硬上限 2MB；每段 URL/status/range/size/ETag/Last-Modified/SHA 和原 bytes 独立保留。五段 ETag 一致，不能把服务器 ETag 当作整文件 checksum。无整文件下载或 SHA，无 image tile/strip pixels，也未读取后续 IFD 或 pyramid pixels。

原 BigTIFF first IFD 和 OME XML 同时声明 54,030 × 112,160，uint16 DAPI，SizeZ=16、SizeC=SizeT=1、XYZCT。OME PhysicalSizeX/Y=0.2125µm、Z=3.0µm，与准确 `experiment.xenium` 的 pixel_size/z_step_size 完全一致。TIFF X/YResolution=1/1、ResolutionUnit=1，是无物理单位的 TIFF tag，不作为 1µm/pixel；物理标定来自原 OME/manifest。[OME 格式说明](https://docs.openmicroscopy.org/ome-model/6.2.2/ome-tiff/specification.html)仅帮助解释通用元数据格式，具体数值均来自取得的准确原始 bytes。16 光学层对应索引 0–15 中心间距跨度 45µm，不声明生物切片厚度或已观察三维核。

## 全量数值对账

全部 182,698 个 original cells.parquet 质心，使用 I21 留存的 source float32 physical-to-image matrix，不替换精度、不 round/clamp，均处于 `0 ≤ X < 54030, 0 ≤ Y < 112160`。源像素坐标范围 X=146.9907336415872–53979.51424580533，Y=918.7653835415404–112094.39589218237。与使用精确 0.2125 标定除法相比，最大差异 X=0.003217429963115137px，Y=0.006681347047560848px；它是保留原矩阵精度的数值差异，不是图像配准误差或生物学阈值。未取得 mask/image pixels，不能宣称逐像素 segmentation alignment。

`coordinates.csv` 的 29 个原始命名轮廓均闭合，其 native double CSV 坐标 shoelace area 在原 header 一位小数精度复现全部 `µm^2` 数值。计算以首点平移后 math.fsum 求和减少数值损失；没有变换坐标、改写原顶点、拟合原面积或按阈值重新定义生物对象。这支持尺寸一致性，不能证明共用原点/方向，也不能从轮廓名称解析 section/donor。未作 point-in-polygon biological assignment。源膜/核多边形仍是处理结果，未新增 viewer geometry、IN label、REG、same-cell SWC 或真实内部对象。

## 页面与导出

准确 run 的原 table-audit 中新增可展开的 DAPI 元数据与数值范围说明；selected-run JSON 包含独立 `sourceImageMetadataAudit`，其他全部 15 run 为 null，换源同步清除旧 export preview。历史省略该新增可选参数的调用仍保持 null。分割/坐标/原影像元数据分别保留各自日期及范围；不将新检查改写为历史 I21 的全面像素验证。页面不加载 25.6GB 影像或展示推断切片。

## 验证与科学余差

新增 Node 六项（含原始文件 hash、异源清除和 overclaim negative），Python 九项（真实 first-IFD/XML、未取得像素、错误 header/pointer/dimensions、XML entity、不 clamp 越界质心、原面积 header 及非支持 homogeneous divide）均通过。130 个 original source/dependency file receipts 逐字节通过。完整当前 research、生产页面及最终文档清单验收在 QA 中封存；未执行项保持未验证，不由专项通过计完成。

section/donor 原始 crosswalk、outline origin/orientation、curated cell label 和适用权利差异仍未取得；新 OME 没有提供这些字段。UPG244 继续 partial、UPG255 section pilot 继续 planned；243 任务的 79 exact completed 不增加。M2/M4 及全部 F01–F20 仍未全部满足。

## 当前代码完整与实际页面验收

完整 `npm run test:research` actual exit0：1,325 tests／1,310 passed／15 conditional skips／0 failed／0 cancelled；build、strict typecheck、全项目lint及全部research validators通过。18新authoritative inputs将清单从1,238推进至1,256，1,229原非owned inputs、398固定科学inputs及10owned backups保留；15条件跳过如实保留。最终文档更新后的再生成/构建/manifest与定向检查独立记录，不将旧日志充作后来构建。

Actual DOM导出的sourceImageMetadataAudit原JSON文本数值逐字段等于离线来源合同，准确key= BIL:ace-pie-cot、admitted=false；其余全部15run先清旧preview/image panel，再导出的image/polygon/coordinate均null。原始页面JSON文本单独保留；检查工具以parsed object转写少数浮点末位的观察文件也保留，但不作为数值相等证据。关闭workspace后0source组件/0image panel/0preview；重开默认 BIL:ace-pie-bin且无旧preview。390px document.scrollWidth=390，Enter打开新增说明，focus在summary、目标高72px，无alert；恢复1280桌面截图。两张实页JPEG完整decode与SHA保留于native-reconciliation.json。没有加载image geometry或canvas；导出preview不证明自动文件落盘。本轮没有覆盖全部route、真实200%zoom或screen reader，也未取得原像素来验证segmentation alignment。
