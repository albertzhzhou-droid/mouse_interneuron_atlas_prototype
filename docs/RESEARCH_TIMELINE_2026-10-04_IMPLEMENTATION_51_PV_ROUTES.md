# I51 · 两条独立 PV 形态路线

实施日期：2026-10-04（America/Toronto）。目标：UPG-138 的两条准确独立路线。用户授权为完成总 MD 内升级，原位实施；保留既有未提交工作及 frozen 科学资产。

本轮复用冻结 8.6.124 全集内 NMO 170034／118824 的原 API page-0 和原 SWC，不重新下载、不重写 originals。API 对象分别位于 /_embedded/neuronResources/115 和 /92，原 page 为 769,605 bytes、SHA-256 eff7d79bb42041df9af55d9bdc745d969df50a387bbe0a9196da00909da14f91。官方现行条款经浏览核验，当前站点 8.6.128 不改变这两份冻结来源的版本。

170034：PV-positive／Excitatory／Pax2-negative，Pvcre，No Diameter／3D，Dendrites Moderate；1,681 nodes／1,680 edges，12 type-1／1,669 type-3。原 SWC 56,859 bytes、0fee884130c82d3c140b471d62c09274e83cb9a4ce05254c3639e174e9aaf186。118824：PV-positive／Inhibitory／tonic firing，TrkB-CreER，Diameter／3D，Dendrites Incomplete；540／539，7 type-1／533 type-3。原 SWC 19,206 bytes、efb19783b7f472b7b2aded955eecd00731294c500c8b2d995be6a1b7fd89dc6d。两者均 young adult、mouse lumbar dorsal horn lamina II–III、60 µm sagittal、Control、soma and dendrites/no axon。

记录层 citation 分别为 PMID 34326298／DOI 10.1097/j.pain.0000000000002422 与 PMID 31291586／DOI 10.1016/j.celrep.2019.06.040。官方 PubMed核实前者题名及文献身份；后者直接打开未返回正文，随后官方检索核实题名／PMID／DOI。正文实验事实均不从失败读取补齐。论文仅 attribution/context，未建立 exact paper-cell／physiology／circuit／allodynia／group-statistic crosswalk。两记录来自不同研究，非 paired experiment；numeric age、individual sex、animal/specimen/section parent 均不补值。

新增独立 pack、builder、validator 和两份确定性 geometry derivative，原 SWC 复制数 0。主场景独立加入二对象及当前 private byte proof，档案／selection resolver／source scope／rendering policy 对齐。新 representation permission 为独立 runtime 增量，原 0.7 contract 不改写。No Diameter 全程 centerline-only；Diameter 的表面为 DER，不是观测 membrane、volume 或 internals。

规范 census 保持 142；当前 named 45／main selectable 181／supplementary 39，1097 universe 原 roster 不改写。243 条需求仍逐项验收。完整 Goal、M2／M4、生物学标定、全应用性能及辅助技术仍未完成。

当前两条实际生产入口通过：170034 OBS中心线、surface disabled；118824 OBS与DER可切换；换源／换mode清旧capture，390px／Enter无页面横向溢出；两同源fresh恢复更新verifiedAt／no-store／verificationSequence并保持原hash。wrong-source恢复拒绝，保留准确对象。UPG138按两准确独立路线范围completed，83/243；最终完整回归及独立实际视图重放见下方封存结果，科学来源准入与工程检查范围仍分开。

根目录初次manifest async读取academic-interface.css失败，strict typecheck扫描QA旧preimages源码，根production start缺少RSC运行清单。保留全部原始／备份／unowned修改；tsconfig排除docs/qa/**/preimages/**，本轮新的年龄缺失union按字段范围安全检查。独立/tmp只暂存明确当前输入及已准入public验证资产，source-only未暂存文件继续引用原始目录；最初node_modules只读引用原运行时。其ESLint配置加载停滞，复制相关依赖的两次尝试也停滞并中止；保留原node_modules和不完整临时副本。随后在独立/tmp按原package.json／package-lock执行npm ci --ignore-scripts --no-audit --no-fund --prefer-offline，467 packages／exit0；两文件与根目录逐bytes／SHA相同，临时验证目录改用此独立依赖环境。根目录依赖及锁文件未覆盖。实际production使用127.0.0.1:3003，--hostname限定本机。一次--host误写导致0.0.0.0 EPERM，无公网listener建立；正确限定后自动审核批准运行。下载事件等待超时导致CUA内核重置，仅计导出点击，不计文件落盘。

回滚范围见 docs/qa/2026-10-04-implementation-51/owned-preimages.json 与 preimages.zip。临时旧验证目录不存在，当前根目录可正常读取；前轮 session 88605 已不存在。I50 最后刷新／getState 超时仅为 post-seal UI limitation，不覆盖此前已留存的 actual receipts，也不当作本轮 live preview。


最终完整npm run test:research实际退出0：1,432 tests／1,417 passed／15既有conditional skips／0 failed／0 cancelled；包含生产build、严格typecheck、全项目lint、全部必需validators及当前测试入口。Node v26.0.0、Python3.9.6；临时精确positional read预加载只读取实际当前字节，逐size／mtime校验，保留原校验器和source hash要求，代码随QA保存。前五次未完成／失败尝试单独记录：历史MD、SpinalJ intake、RIGHTS_LEDGER.csv及三份R／parser验证输入的暂存遗漏已按原bytes／SHA补齐；比较PNG旧31-input断言改为当前32并显式检查academic-interface.css，额外原测试预镜像先存入ZIP。相关复验36 tests／34 pass／2既有skip／0 fail。原39/39 PV／集成专项独立保留，不能代替完整入口。

最终四份实际DOM view receipts独立重取当前原geometry并重放private producer：132个main build-pin比对、4 geometry／8 auxiliary文件比对、两同源恢复对照，0差异；当前每份main receipt为33 inputs，renderer transport146，authoritative manifest2401。原2388输入的保全和最终stage逐字节对账另见preservation-final.json；25份预镜像的CRC／receipt校验通过。AtlasPrototype.tsx虽提前保留预镜像，本轮未编辑，当前布局变更属于已保留的同期界面工作；不将这些变化归入PV科学成果。冻结2.34／2.90及representation0.7保持。

照片只证明所示source／mode／viewport；当前主场景固定相机裁切部分上方分支，未声称全部源分支入frustum。后续可实施缺项包含准确源bounds的主场景视图适配；真实200%zoom、screen-reader、完整性能预算、独立生物学校准、M2／M4及全F01–F20／243 Goal仍未完成。精确对象路线范围验收不取消这些条件。
