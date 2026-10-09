# I38 · Svara source-local synaptic contact tables

日期：2026-10-02，America/Toronto。用户授权仍是完成原MD全部升级；本轮不是单独把规划文字改成已完成。完整Goal active，原79/243 exact completed不变。

新source入口：FreiDok145135实际HTML声明publications/145135 API；API发布的aggregate filename／33959844B／SHA256／MD5全部与HTTP200实际下载一致。3 nested ZIP CRC及outer全部成员CRC通过，实际3 ZIP／2 PDF／4 XLSX，与旧landing“2 ZIP／.xls”文本不同。三nested ZIP与I36既有三包逐字节一致，新增四XLSX和两PDF原文保留在非public候选目录。临时public storage redirect query未保留；最终download receipt只保留URL query前部分。

四XLSX从MPG RELEASED item_3055210_7 file_3055226/27/28/29直接取得，与wrapper成员逐字节一致；原文件完整size／published MD5／SHA256检查通过，未修改或重导出。新表的权利依据为该准确article license＋明确publisher supplementary-data policy＋四个exact component成员证明；不宣称单独component license字段存在，不覆盖FreiDok whole wrapper/mmc9/Koh版本。I36旧scope保留。

只读workbook检查保留sheet/range/所有nonempty native cells/types/format；OOXML扫描未发现formula、macro、externalLink或embedding。矩阵CiD39×68、CoBL34×68；contact rows265／469。每一原数字保留OOXML数值token，而非openpyxl格式化浮点结果，例如`CiD to MN Contacts!C2`原token0.17030770554800001。合计734 contacts／516不同listed native pairs／4964矩阵格，其中4448 literal zeros、0missing格。矩阵是面积和值，不是counts：每格和contact row面积求和对账，最大Decimal差5.00005E−12／6.00011E−12，容差1E−9仅用于源小数重放。原matrix sheet无unit，contact C1有µm²；receipt的unitLocator逐class列出准确component／native sheet／C1，不使用不存在的泛称sheet。应用分别声明，源零与source报告缺失不推断生物学不存在。

mmc1.pdf八页已raster后逐页contact sheet目检，标题、图、文字与原布局可读。Poppler初次输出fontconfig cache/config警告，实际exit0并生成八页；没有编辑或再导出PDF。mmc9为22页source PDF，已做native文本/annotations/attachments/fields检查；本轮未作它的全页视觉验收，未公共准入该PDF。不存在新版Knossos／mouse/raw物理parent证据的全网结论未作。

应用增量：独立/connectivity/svara和原atlas/catalogues links；原native group/pre/post选择、逐pair所有contact source row/token/locator、原matrix值与derived counts/sums分别展示，按需68postsynaptic entries和完整source receipt。source/release/group/pre/post exact URL支持刷新/popstate、CSV/source JSON与same-pair fresh byte restore。每次只no-store加载一个class JSON40,880B／60,756B并核SHA；private WeakMap/immutable proof/current request隔离，错误或过期请求不能提供旧table/export。

Receipt复现范围是exact numeric pair和native listed rows，不含camera、geometry、XYZ endpoints或physical parent。同label对是出版namespace关系，不是稳定raw-cell/section mapping；没有genetic CiD→V2a、mouse转移或functional transmission声明。

编辑前8owned preimages及全部2255 prior authoritative inputs已完整核验并存owned-before.zip/before-owned-inputs.json/before-authoritative-inputs.json。现存dirty tree/旧canonical science contracts不覆盖；仅显式owned文件和新增路径。无需whole-copy repo，复用exact-lock临时验证环境。回滚仅按owned-before清单恢复8原路径，新增项按manifest增量清单逐一审查；不要Git reset或删除整个目录。

首专项原数字期望使用openpyxl短显示，导致1/7失败；已纠正测试为真实OOXML token，不改变原数据。部分root大块/implicit EOF读取停滞，已核实际进程/fd及独立positional/同步重读，终止状态与失败日志保留，不以超时判定通过。Root首次manifest builder停在既有node_modules/fast-uri读取，明确中断exit130，转用已核验exact-lock隔离环境；首次旧manifest同步因.gitignore已修改而正确拒绝，没有把旧pins当当前。初始full research build/type通过，但lint报告8项：表格region不需要tabIndex、外部Angular脚本原文不得当项目可执行代码。已移除tabIndex、原样保存脚本为lp.js.txt并保留URL/hash，未运行外部代码。随后完整入口actual exit0：1367tests／1352pass／15conditional skips／0fail／0cancel，build/strict/full lint/全部configured validators通过。精确native sheet unitLocator最终补齐后再核当前source与manifest/build。

33项native flow observations全部通过：两class源值/逐行与当前SHA对账、literal zero、六条重复endpoint contacts、exact-link/refresh/Back/Forward、fresh JSON恢复及篡改value/wrong-release拒绝、duplicate/partial/unavailable URL无默认代选、390px/Enter/44px/no overflow、68列与末列键盘选择、catalogue双向导航。真实generated CiD JSON单bit错误40880B：fault SHA91d4e7c34c66e66573fae1df31191d698e469035ea60c6e0e0ab6733750ebfb5，actual HTTP200 wire核验后，旧pair/receipt/exports清空；exact wire恢复SHAf515cf381d4ebbbf1c15baa4ea06a316e37e7a94ccdb0ab84b478b47d0b358e0与Enter Retry通过。Production server在启动时缓存static文件，第一仅改generated文件的请求仍传原bytes，不算故障验证；另试isolated public副本同样受缓存影响，已精确还原它，再重启只带generated fault的server后才观察真实bad wire。最后两副本均还原，root与四原XLSX未动。

临时3004proxy对CoBL传输延迟12s，实际60756B upstream-ready后，切换／Back两次均client close且writableFinished=false；两deadline均closed=true，实际DOM仍准确新CiD pair。proxy已终止，正式3003恢复。CSV download动作已实际点击，5000ms未观察download事件或保存路径，不算文件落盘验收。桌面1280×1343与mobile390×2484 JPEG均目检；200%zoom/screen reader仍未验证。本轮不声称全App navigation/export或M2/M4完成。

M2 section/donor/frame/curated label/rights，M4 exact mouse spinal IN raw volume+segmentation+parent+frame+slice，Svara raw editable geometry与Koh exact annotation/workbook仍未满足。完整F01–F20／243条Goal不由本轮比较来源数表代替。
