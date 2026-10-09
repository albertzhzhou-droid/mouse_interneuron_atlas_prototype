# I37：Svara 原始图谱条目的链接与返回恢复

本轮推进原升级计划的 F15 查询／深链接恢复、F16 选择和导出一致性。I36 已接全部212原始出版条目，本轮保留原 ZIP／PDF／PNG／914报告字段／共享来源身份与许可依据，仅扩展页面选择。

## 实际修改

独立 `/catalogues/svara` 工作区通过 `svaraSource`、`svaraRelease`、`svaraEntry` 保存准确来源／版本／component-qualified publication entry。未带任何本工作区字段的地址默认 CiD 001；只要带任何一项，就必须三项各出现一次、source/release准确且entry存在。缺项、重复项、空值、错误版本或不存在条目显示 Link refused，未自动替换为默认条目。无效地址先清除图像、导出链接和实际loader receipt，需用户明确选源或打开默认页。

选择器、Previous／Next与有效JSON恢复写入浏览器history；不重复写入相同地址。Back／Forward与刷新读取准确地址，每次请求新的no-store PNG并核对大小／SHA256／原生尺寸。URL和receipt metadata均不提供byte authority。当前图像和导出必须同时绑定同一实际request对象；同key重新请求也不能沿用旧proof。嵌入原source card的gallery不接管atlas地址，只提供指向独立工作区的准确条目链接。独立地址更新保留其他query与fragment，分享链接仅包括准确本源选择。

## 来源与边界

这些地址恢复二维完整原页选择。没有3D camera／clip／geometry／跨源配准或physical-cell parent声明；JSON原schema0.1保持。不新增来源、测量、细胞数或canonical completed状态，source无数据仍保留unknown。完整M2／M4、Svara editable源几何、Koh原workbook／Knossos门槛继续开放。

## 验证记录

最终代码完整research actual exit0：1,360 tests／1,345 passed／15 conditional skips／0 failed／0 cancelled，production build／strict typecheck／full lint／全部配置validators通过。15专项包括原9项source/byte/restore测试与新6项location测试；全部212准确链接及缺项／重复／wrong source/release／unknown entry／邻接query／fragment／URL无byte权限通过。完整日志为 `qa/2026-10-02-implementation-37/full-research-validation.log`，没有通过修改旧科学输入获得通过。

31项原生流程观测与真实DOM receipt经canonical source values／identity／rights／entry／image dimensions／当前URL一致性对账，0差异：默认页、Next、刷新、新receipt timestamp、跨catalogue的Back／Forward、JSON恢复、篡改清零、wrong version／unknown entry／重复及缺失地址拒绝、明确默认重试、MN139末页及Enter Previous、390px Enter与准确链接点击、原卡片完整atlas URL逐字保持和独立workspace落点。这里只在实际浏览的条目范围作原生验收，全部212 URL的覆盖由独立自动测试提供。

补齐native pending-cancel：仅本机临时3004代理对CiD002的真实81,679B response延迟12s，实际切换到CiD003及连续Back到CiD001两次都立即清除旧图片／exports；服务器记录client closed，延迟到期仍closed，当前DOM保持新条目。代理正常停止，未改源文件。另仅临时dist生成PNG做同长度checksum错误，实际HTTP wire hash核实；准确URLfresh打开显示拒绝、0image／0download／0share link／0receipt，恢复exact original byte与actual wire后Enter Retry通过，未使用旧cache回退。

390px实际page width390、13px正文、selectors／Previous／Next／两个download links及page link均44px，无horizontal overflow；截图已目检。31条实际观测及原生对账见 `native-checks.json`／`native-verification.json`，延迟服务日志见 `delayed-transport.jsonl`，故障与恢复见 `served-fault*.json`。自动Blob文件落盘、200%真实zoom与screen reader本轮未观测，不计完成；图像是完整出版页raster，不是editable模型。三原ZIP／三原PDF全bytes与SHA256再次核对不变。

## 保全与回滚

9项现有文件在任何编辑前保存到 `qa/2026-10-02-implementation-37/owned-before.zip`，各自SHA256／字节数见 `before-owned-inputs.json`。该轮仅上述owned files、新location test及本时间轴；保留2253旧manifest输入快照。回滚先核查现有变更、只恢复本轮owned preimages，移除本轮新增文件后重新生成当前manifest；不得回滚或覆盖其他轮与用户变更。大型原始源不复制到验证环境。

当前manifest增加2路径至2,255：本时间轴与location test。最终文档同步采用独立manifest重建、所有root／临时inputs和212 compiled PNG逐bytes／SHA核对、最后production build与相关测试；实际结果见同轮 `final-input-replay.json`／`final-document-sync-build.log`／`final-document-sync-checks.log`／`verification-summary.json`。该最终同步不冒称第二次全量测试。2,245旧非owned输入、原科学数据和冻结2.34／2.90必须保持；79／243 exact completed及完整Goal active不变。
