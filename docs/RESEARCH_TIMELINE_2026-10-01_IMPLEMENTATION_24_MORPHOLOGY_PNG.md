# I24 · Source-backed morphology PNG export

Date: 2026-10-01 America/Toronto. Status: implemented and verified within this increment. Whole upgrade goal remains incomplete.

[I24 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_24_MORPHOLOGY_PNG.md) 将实际 canvas PNG 接到 1,097 exact-universe、149 comparator 和冻结 142 individual 的现有准确来源渲染器；三个范围有重叠，不能相加为细胞总数。页脚标明来源、实际／请求模式、图层、节点／dim、源坐标限制和完整 geometry SHA；PNG 内保留完整 source-view 与 export receipt，29 个指定 renderer／inspection／style／PNG／dependency 输入按实际 bytes/hash 固定。Universe 使用实际 raw-SWC proof；比较器与个体仅证明 standardized geometry bytes，原始 SWC hash 保持 declared-only。PNG 不增加膜、内部对象、same-cell join 或 REG，恢复仍使用独立 JSON 和同一指定构建。

同步复制实际 frame，编码、metadata 和 preview 每个异步边界核当前 view／source／instance／context；只有重新生成的 capture time 可变化。换视角／类型／来源、resize 或 fresh rebuild 使旧 capture／PNG 失效。相同视角再次 capture 也立即清除旧图片、撤销 URL 并取消旧编码发布，保证新时间记录不沿用旧 preview。

当前代码完整 research 检查退出0：**1,267 tests／1,252 passed／15 conditional skips／0 failed／0 cancelled**，真实 build／strict typecheck／全项目 lint／全部 validators 通过，830 authoritative inputs。原依赖保留，在实际安装原 package-lock 的临时环境重放全部原输入实 bytes/hash 后验证；此前修正前证据保留其独立范围。

实际 browser 取得 11 对形态 PNG／DOM receipt（8 个来源 ID、3 个视图家族），逐一完成全 PNG chunk CRC、像素 decode、IHDR／raster／source／layers／inspection／29 pins 对账，无差异；原生轮廓50394回归另核21 pins。三维 radius／二维／No Diameter、补充来源、个体 node62／dim／type1隐藏、390px／Enter 和同视角 recapture 已实测；Universe45677与individual108974的两组 fresh no-store 恢复 camera position／target／up／quaternion 差异为0，layers／inspection一致。图像如实记录所选视角，不承诺所有源分支都在frustum内。自动下载落地仍未观测，不计完成。

398 固定科学输入、冻结2.34／2.90与11项回滚前文件保持各自原始范围。UPG091／053仍为in progress，243队列中的79项exact completed未增加；其他来源 viewer／export 与完整M2／M4科学Goal继续推进。

Evidence: [current QA](qa/2026-10-01-implementation-24/verification-summary.json), [PNG reconciliation](qa/2026-10-01-implementation-24/morphology-png-reconciliation.json), [fresh restoration](qa/2026-10-01-implementation-24/restoration-reconciliation.json), [recapture clearing](qa/2026-10-01-implementation-24/recapture-fix.json). Before-recapture-fix evidence and its research log are preserved separately; they are not relabelled as the final build.

Source-backed contract tests use actual private admitted source bytes and deterministic THREE scene fixtures. They cover comparison3D/2D/supplementary/NoDiameter, individual hidden source types and raw-universe3D/nonzero-z2D/NoDiameter/reused raw data. They are not native WebGL evidence. Native WebGL/PNG checks are the separately retained actual browser records. No raw source bytes, physical identity, registration or source denominators are changed.
