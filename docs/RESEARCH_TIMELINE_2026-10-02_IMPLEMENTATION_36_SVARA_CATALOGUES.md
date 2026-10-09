# I36：准确 Svara 补充档案与原始发表图册

2026-10-02，`2.91.0-research.1` 原位增量。推进 UPG-240／250／260 和 F02／F08／F13／F16／F18；完整 F01–F20、243 规范任务与 M2/M4 原 Goal 保持。图册条目不是新增鼠细胞、分型、三维重建或 same-cell 内构。

## 准确源与许可依据

官方 MPG `item_3055210_7` 的实际 REST metadata 列出精确 DOI、article license 和三个 PUBLIC supplementary-material components。原 pubman ZIP 路由 HEAD403 保留；只使用同一官方 metadata 明确给出的 REST content 路由，三个完整请求 HTTP200。没有凭据、Knossos 配置或绕过拒绝。

| Component | Archive bytes / published MD5 | 唯一成员 | PDF bytes / pages |
|---|---|---|---|
| file_3055230 / mmc6 | 16,767,329 / fb2ab8c247e7456a484645bc89cd9833 | Catalog 1, MNs.pdf | 27,121,817 / 139 |
| file_3055231 / mmc7 | 6,605,080 / 48996b37c8d955eba414df64917053ec | Catalog 2, CiDs.pdf | 9,864,100 / 39 |
| file_3055232 / mmc8 | 6,607,695 / a6e5b39f312ba4657d98a2905731ba23 | Catalog 3, CoBLs.pdf | 9,426,610 / 34 |

共 29,980,104 archive bytes、46,412,527 PDF bytes；所有官方 size／MD5、ZIP member CRC、完整 archive/member SHA256 通过。无附件、interactive 3D annotations 或 form fields，三个 ZIP 均没有独立 SWC、mesh、annotation.xml 或原体积。全部 212 页由 pypdf 读取 native class／编号／header／原 fields。MN001–139、CiD001–039、CoBL001–034 各在其原 component namespace 内，不能把图册标签变成已验证 raw-volume physical cell ID。

许可依据为精确 article component `file_3055224` 的 CC BY 4.0，加 [Elsevier 官方 supplementary-data policy](https://www.elsevier.support/publishing/answer/which-license-should-i-select-when-posting-my-research-data)，该 policy 明确让 open-access article supplements 使用所选 article license。保存当前 policy HTML／HTTP200／hash／retrieval time，网页注明 2026-07-15 更新。精确三个 components 与 article DOI/version 的归属已核验，没有 separate ZIP license field；该依据是明确 publisher policy 的应用，不冒充 PDF 内嵌独立许可，也不覆盖 FreiDok 或 Koh 的其他版本。原 PDF page text／metadata 未发现 conflicting notice；按源 citation／CC link／rasterization 修改说明归属。政策并非取得了 2018 年历史 policy snapshot。

## 实际功能与证据边界

212 个完整原页以 Poppler 96 dpi PNG 展示，16,799,311 B 总派生物、单页最多 118,503 B。MN source table 保留 Soma Diameter、D-V Position、Dendritic Path Length、Axon Trajectory、Axon Myelinated；CiD／CoBL 保留 Soma Diameter、D-V Position、TSI 的原字符串与符号。均为 source-reported，零新计算形态测量，不从像素测量、追踪、重染色或推导骨架／突触 endpoints。

原 reference card 接按需 gallery，另有 `/catalogues/svara` 独立入口，默认 CiD001；catalogue／原条目／previous／next、原 table／完整源 text／JSON preview、PNG 与 source receipt links、exact page receipt fresh restore。当前浏览器只获取所选 PNG，no-store、字节数／SHA／尺寸核验后才产生 private immutable proof 与 Blob display/download。caller bytes／returned copy／proof clone 不产生或改写 authority；切换、卸载、失败与新 restore 清除原 page/download，latest generation 的 abort 检查拒绝晚到结果。

receipt 保留 source/version/component/page、原 published fields、完整原 archive/member receipts 与当前 PNG 范围区别、source identity／unknown physical parents／rights basis／attribution。恢复仅是准确 page/entry，不声称 camera/clip 或完整三维 viewport/build replay。原标签是 publication component entry，specimen／section／raw-cell／synapse parents unknown，population/genetic assignment 未建立，Koh exact annotation match 仍 false；0 editable skeleton／mesh／raw volume／endpoint table／same-cell join／registration。

## 验证与回滚

原始三个 ZIP/PDF、全部 212 页与914原字段的 deterministic source replay actual exit0；212 PNG逐byte／SHA／尺寸校验、private owner与caller/export复制隔离、同长度破坏／错页／HTTP／取消、source/version/field/rights/geometry claims篡改与fresh exact restore共9专项通过。12张contact sheets覆盖全部212页并逐页目检，另原分辨率检查CiD002和CoBL034；source缺失值、MN69以后的原布局与零值保持，不用统一模板补画。

最终代码完整 research actual exit0：1,354 tests／1,339 passed／15 conditional skips／0 failed／0 cancelled；production build、strict typecheck、full lint与全部原研究validators通过。首次尝试在新effect内直接清状态触发lint，已把清除动作移到明确selection/restore handlers；第二次发现旧rendered HTML测试仍要求未检查archive文案，保留精确filename并将断言更新为当前已核metadata/MD5/212页/publisher-policy scope。两个实际失败日志都保留，未降低原科学门槛或改写旧source合同。

Actual native有13项通过：默认CiD001与CiD002 native N / A、MN139／CoBL034末页与Next边界、Previous Enter、跨catalogue fresh恢复、篡改TSI清旧page/download、真实served同长度checksum失败清旧page/download、准确恢复后的Enter Retry、390px跨catalogue恢复与pageWidth390／primary controls≥44px、原structure reference关闭unmount／重开fresh default及独立入口。四个实际DOM receipts与三原PDF的14 field strings／full page text／source label/page/hash及unknown parents对账0差异；当前source image实际natural尺寸1123×794。错传输只写本轮临时generated dist/client文件，实际HTTP200 wire SHA已核，准确恢复wire SHA也吻合；原workspace及其public派生物完全不变。

PNG native download action已执行，但5s内没有观察到浏览器保存路径，不计下载落盘通过；JSON/PNG链接和其payload proof已核，native pending-cancel、200% actual zoom与screen reader仍未验收。原 frozen Svara/Koh source JSON、398固定科学inputs、2,014旧非owned authoritative inputs及冻结2.34／2.90保持。当前manifest控制2,253输入；其中新增纳入231 paths含两个原本不在清单的现有文件，原统计和生物学分母不变。规范 UPG-240／250／260 更新当前事实，exact completed 仍79／243，完整Goal继续active。

10个旧owned files在修改前保留byte/hash preimages；另一个旧HTML测试不在原2022-path manifest，其预备份baseline lookup失败，随后按本轮精确两行至五行patch逆向恢复，并要求重应用patch后完整文件byte equal。该异常及准确恢复receipt保留，不能称其在修改前已成功捕获。共11个旧file preimages在 `docs/qa/2026-10-02-implementation-36/owned-before.zip`，逐hash/bytes回验。其他新增源/派生/代码按准确新增路径登记。原 archive/PDF在public外各只留一份，排除browser manifest／临时构建，metadata、download/policy receipts与全部PNG纳入当前manifest；无全项目复制、Git/push、发表或第三方联系。回滚仅恢复本轮准确preimages、解除新入口并再生manifest，原始源与QA保留，不处理未知dirty工作。
