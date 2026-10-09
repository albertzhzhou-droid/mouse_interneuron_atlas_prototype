# I23：原生轮廓的准确 PNG 导出

日期：2026-10-01，America/Toronto。用户完整目标保持 active；本增量落实 UPG091／F16 的七条原生轮廓图片导出缺口，不改科学准入或整体完成状态。

## 当前实施与验收边界

图片复制实际当前 WebGL drawing buffer，并附可读来源／图层／派生／hash／科学范围页脚。PNG 内 `ohri-source-view` 保留实际相机、图层、trace inspection、原始 display transform、来源 bytes/SHA、私有 OBS／DER 校验及 21 项指定 build inputs；`ohri-png-export` 保留 IHDR 尺寸、准确 raster 区域、visible trace IDs、实际可见 DER 数及单独 JSON 的 fresh replay 规则。指定 inputs 不是递归全 App build identity。

来源、相机或图层在异步编码／预览读取期间变化时拒绝发布。换源、重验、view revision、context loss 与卸载使旧图片链接和预览失效。主入口原 overflow:hidden／固定面板实际裁掉预览底部：仅含 native viewer 的 viewport-panel 改为垂直可滚动，并保留稳定 scrollbar gutter，避免打开预览改变 canvas width／清除当前 capture。滚动修正后的最终完整入口再次 exit0（1,261／1,246／15／0fail／0cancel）；实际父面板 overflowY=auto、stable gutter、668px viewport 中完整 610.28px 图片已可见，打开预览及滚动后当前 receipt 仍为1。before-scroll-fix 证据保留独立范围。原生 PNG 不使用另一来源或示意图替代当前像素。raw DAT／source API hashes 保持 declared-only；图像不成为 biological measurement、observed membrane、volume、internal object、SWC overlay、same-cell join 或 REG。

最终代码完整 `npm run test:research` 退出 0：**1,261 tests／1,246 passed／15 conditional skips／0 failed／0 cancelled**；真实 build、strict typecheck、全项目 lint、全部 validators 及 823 authoritative byte receipts 通过。首版专项 20/20，窄屏修正后的最终专项与文档同步检查另记于 QA。首版完整 1,260／1,245／15／0 的日志保留为 before-word-wrap，不代替最终代码验收。

实际 UI 已导出七个准确来源的九份 PNG／对应 actual-view JSON，21 项指定 build inputs 全部逐 byte/SHA 对账通过；每个 PNG 的全 chunk CRC、完整像素 decode、IHDR／raster 尺寸、source/build/camera/layers 及科学零计数通过。50394 默认可见 DER 1，isolated trace 实际 DER 0；45718 独立 secondary group 保留准确 native ID。390px 无页面横向溢出，Enter 导出可用；resize、trace isolation、source recheck 与准确换源清除旧预览／链接／receipt。50394 由保存的实际视图 fresh restore 后 OBS 与 DER 都是 no-store，随后导出当前视图。

目检窄屏首版发现正文按字符断行，最终修正为普通词整体换行、长 checksum 分段保留全部字符。最终八种来源／图层图像已目检，fresh 与同视角窄屏图像的 encoded pixels 独立对账；像素是实际指定相机看到的区域，不声明每个已启用 source trace 都完整进入 camera frustum。图片不会重绘原生 points 或修补来源拓扑异常。

本机浏览器 download event 等待 4 秒未返回，因此只声明实际编码／预览和当前下载链接可见，**不声明自动下载已落盘**。首次读取大 DOM data URL 被单值长度上限截断；改以 50,000 字符分段读取完整原 encoding 后才执行 CRC／decode 验收。截断副本不作为交付文件或通过证据。

## 环境与保留

复用 I22 的原 package-lock 精确临时依赖环境 `/private/tmp/ohri-i22-local-verification`，逐 authoritative input 核 byte/SHA 后执行检查；原 File Provider dataless dependencies 不覆盖。有限回滚见 `qa/2026-10-01-implementation-23/rollback-before.zip`，398 固定科学输入与冻结 2.34／2.90 manifest 保留。自动下载落盘只有观察到真实结果才声明通过。

其他 viewer/export、全 F01–F20、243 任务及 M2／M4 真实同细胞源链仍未完成。


最后样式验收：七来源九份 current-code PNG／DOM view 已重新导出并对账，21 当前指定 pins 0 差异；六份与已经目检的原图 encoded pixel chunks 完全相同，三份 final50394 desktop／isolated390px／fresh390px 另行目检。没有把旧样式 build 的 PNG 当作当前证据。一次完整入口在输入同步返回前过早启动，已主动终止 exit130，日志单独保留且不算通过；同步完成后启动的最终完整入口 exit0。最终文档同步、专项检查、重建及重建后的主入口 fresh restore／PNG 另记于 QA finalDocumentSync。
