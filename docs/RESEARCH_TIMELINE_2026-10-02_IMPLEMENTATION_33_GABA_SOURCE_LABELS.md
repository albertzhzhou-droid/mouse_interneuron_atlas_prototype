# I33：GABA 原始类型标签与准确核注释浏览

日期：2026-10-02（America/Toronto）。本轮推进主规划 C/F06 的实际来源注释浏览；完整 F01–F20、243 任务及 M2/M4 Goal 保持 active。

## 来源与新增范围

从已封存的 `GSE318731_P56_gabaergic_multiome.rds` 提取结果，无损再生 204 个 `meta.data$neuron_types` 标签、24 原组、73,364 原核注释。逐行保持完整 nucleus ID、源顺序、group、anatomy；准确 compound key 包含 GSE318731、原 RDS filename、原 metadata row.name。源 RDS hash 为 `700361c804806b521bb01aa58c263cd01b189fe03d3299aeef5806839a4f5f31`，1,646,402,816 B；本轮未重新获取 RDS。原 metadata gzip/audit bytes 保留，builder 与独立 CSV reader 对全部源行、类型分组和 membership hash 重放。

原 inventory 没有 `source`／`Sex` 列，全部原 NA 继续作为 null；不填写动物、文库或性别。P56 为 dataset context。原类型拼写、包括 `CHOL-GABA-Crnde` 组，均不正则改写。来源 label 不推导 marker 测量、local interneuron、projection 或跨资料同一类型；387 source profiles 与11个 CHOL_IN profiles／923 nuclei 的已准入分母不变。没有新 geometry／internal object／registration／same-cell。

## 页面与运行验证

Types 页面新增按需挂载的 GABA 浏览器，搜索、24原组筛选、排序及18标签分页，保留完整标签的区域计数。用户主动加载核名单后核验 gzip／decoded hash、73,364 原核顺序及204份 membership，再提供20核分页和原 ID／region 搜索。准确核行的导出要求私有已核验名单和当前label成员，拒绝公开 receipt 仿造、错label、clone row。切换label卸载旧核名单／请求／导出；query/page隐藏旧selected核；关闭工作区卸载全部临时状态。JSON预览可直接核对当前对象。

最终代码完整 `npm run test:research` 实际退出0：1,332 tests／1,317 passed／15 conditional skips／0 failed／0 cancelled；生产build、strict typecheck、全项目lint与配置的全部validator通过。7项新专项随完整入口实际运行；独立CSV reader核对73,364原行、204label及24group，零差额，builder无写入重放exact bytes。当前manifest覆盖1,266输入；文档收尾的再次manifest核验／构建单独存证，不把旧快照当作当前验收。

第一版工程检查通过后，native页面主动加载发现404：vinext生产StaticFileCache把`.gz`视为网页precompressed variant而跳过独立压缩载荷。已将本轮派生名单改为`.jsonl.gzip`，同一1,945,750B gzip与SHA不变，builder／runtime／manifest同步；旧GLUT和原科学文件保持。修复前DOM及完整日志仍在QA，不计为最终加载成功。最终窄屏还将新主展开及provenance入口补齐44px高度，随后完整回归实际重跑。

Native桌面1280×900／390×844验证：默认closed无GABA组件，Enter展开；Pkd2l1原组为3labels／611nuclei；literal Pkd2l1搜索保留独立Gaba_Mix1标签，共4／805；CHOL-GABA-Crnde保留准确连字符，共8／1,020。Cervical标签summary搜索186／70,376是完整匹配label计数，不是Cervical核数；核内Sacral搜索另显示Cartpt的127／331。18label、20nucleus分页及空搜索清旧selected nucleus；换label重新卸载名单，close后组件0/reopen默认筛选与未加载名单。最终390px documentWidth=390，测得新互动controls最低44px，无横向溢出。最终桌面及mobile截图解码并逐幅查看。

DOM JSON准确row1,704（Cartpt/Cervical）及row357（Nr2f2/Cervical）与源派生名单完全一致；Cacng5／CHOL-GABA／Nr2f2三份label summaries与原JSON完全一致，summary明确runtimeNucleusRowsIncluded=false。每条核JSON记录raw-gzip、compressed+decoded runtime SHAverified。仅临时served build中的byte1000 xor1保持同长度，nativeReload准确拒绝checksum并清旧核详情／export；原workspace artifact未改。恢复准确bytes后Enter Retry核验全73,364并提供当前ID搜索；没有旧名单fallback。故障前／故障／恢复文件hash和DOM另封存。

原生下载按钮已点击，但10,000ms内download event未确认，不宣称文件落地；JSON预览已实际核对。Native pending-cancel、真实200%zoom与screen reader未由本轮确认，取消行为只有专项代码测试证据。科学geometry／classification／same-cell／registration增加0，完整Goal继续active。

## 本轮公开来源调查的准确边界

读取准确论文 PMC13308138 v1 的 Europe PMC JATS XML，浏览官方 Shiny v1.00（2026-06-16）Cell-Type Anatomy 中CHOL_IN与CHOL_IN_Pitx2_Skor2的实际页面：这些已检查页面提供类型表达及聚合解剖图，没有原cell ID下载控件。范围不扩大到所有未检查来源。论文链接 `PoolLab/cano-gomez` 当前官方 GitHub API 返回404；I25固定另一仓库的已存证据独立保留。

GEO网页响应是验证页，不能作为目录；官方 FTP目录实际列三份multiome RDS和970B的NHASH映射。新取得的 NHASH表是72条sample-to-BICAN-library ID，不含cell、section或donor crosswalk，不与Xenium建立连接。PMC原文章页面实际可读，补充CSV的准确`articles/instance`链接经过原页面核对；普通HTTP返回download准备HTML，native download超时、点击后到reCAPTCHA，均未自动解决／绕过；Europe PMC supplementary ZIP实际超时。无有效supplementary CSV取得，无来源marker资料接入。访问失败不证明文件普遍不可用。

原始访问记录／有效XML与970B表、未达成的下载和HTML响应另保留在QA；不将HTML命名或状态提升为CSV验证。本轮没有联系作者、传出私有资料、发布或更改Git状态。

## 保留与回滚

七项明确owned旧文件在`docs/qa/2026-10-02-implementation-33/owned-before.zip`留存，实施前1,256输入全hash重放。新文件与派生名单单独列于manifest；回滚仅恢复七项备份并撤下本轮明确新增路径，不整库reset、覆盖其他dirty work或重写历史。398原科学inputs与冻结2.34/2.90另核对；原依赖不替换。

最终保留核验：1,250旧authoritative inputs在七项owned范围之外全部原bytes／hash不变，398固定原科学inputs和冻结2.34／2.90精确不变；七项备份ZIP每个entry与实施前bytes／hash一致。243规范任务、79 exact completed不变。本轮真正更改的旧权威路径仅Types入口、当前manifest generator及两份当前规划／Goal文档，规范queue／registry虽然纳入备份但没有更改。最终结果见`qa/2026-10-02-implementation-33/verification-summary.json`和`final-preservation-check.json`。全F01–F20、M2／M4仍active，不把原始标签浏览当成最终科学目标完成。
