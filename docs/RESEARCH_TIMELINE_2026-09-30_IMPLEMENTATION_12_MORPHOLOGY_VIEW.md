# I12：准确形态比较观察的来源视图捕获与恢复

2026-09-30，继续用户授权的全部MD目标，当前增量限定为149准确comparison observations。复用实际source-local renderer、OrbitControls和源SWC分支检查器；其他legacy viewers与M2／M4仍需继续。

## 已接入的实现

每卡增加折叠的source-view入口，可捕获实际camera pose／projection、requested与actual mode、当前viewport／drawing buffer／pixel ratio、THREE revision／颜色空间／tone mapping／context attributes、clipping、topology／centerline／radius／source axes图层、准确node选择与dim、actual source scene bounds与display transform。receipt另含固定schema／application version、native observation ID／API locator／原source context与scientific use、共享identity／unknown parents、准确source frame与实际immutable geometry byte proof。科学comparison JSON0.5与单卡完整view receipt分别保存，互不替代。

当前mutable研究版本继续原位更新，application version相同不等于代码相同。source-view另固定14份渲染／inspection／source-byte／frame／identity／replay代码与package-lock的实际长度／SHA-256 inputs；Node独立核对文件字节，browser receipt读取本次正式构建中固定的同组inputs。改变build hash／缺input／不同scope均拒绝，docs-only清单更新不改变这些renderer inputs。未声明完整应用所有代码或跨GPU pixel-identical。

恢复先检查saved source与当前private byte proof，拒绝错来源或字段／版本／配置变化。之后清除旧scene和scale／binding，使用no-store重新读取源文件并核实际bytes／SHA／frame；换source／关闭／新恢复使旧异步操作失效。新场景由当前源geometry与模式重建，不能用saved bounds创建模型。对照新source-derived bounds，再应用camera／topology／node／dim；将实际应用后的pose／layer／inspection重新捕获并与saved逐项核对，成功后才报告恢复。当前layout决定aspect与buffer，不宣称跨屏幕pixel-identical。失败无旧scene替代；可重新粘贴同源记录重试。

重新核验时同步清除当前comparison geometry proof，source disclosure显示pending；源读取失败显示Geometry unavailable，不能沿用hook曾缓存的verified提示。已核source bytes与scene／pose应用失败分别处理。视图变化另用单调capture revision，返回旧pose也不会使旧prepared document复活；source／actual mode／layout generation仍由实际viewport binding和private proof分别约束。

二维源继续正面source XY锁定；native diameter仍在原profile中，但radius请求actual skeleton，无新增深度、表面或膜分割。renderer现有未开放custom clip故只接受actual empty global planes与local clipping false。source transform只用于显示，REG=0／same physical identity未知／internal primitive=0等科学边界必须精确保留。原raw-SWC hash仍只是该loader中的来源声明，不能冒充raw文件运行核验。

## 验证状态

最终**44／44专项通过**，其中新source-view模块9项测试使用实际108974／194468／45674／242822源bytes、private producer与现有geometry functions：同源fresh round-trip、不可伪造private proof、版本／scope／identity／rights／units篡改、camera／viewport／renderer／clip／node／layer负例、2D与No Diameter门槛、新source-derived bounds、当前layout允许变化但实际pose／layers必须匹配、14代码input实字节与同版本异构建拒绝。测试camera fixture属于scene／contract验证，不等于真实WebGL浏览。

最终完整research入口退出0：**1,179 tests／1,164 passed／15 conditional skips／0 failed**，build／strict typecheck／lint与全部validators通过，619当前input byte receipts；见[完整日志](qa/2026-09-30-implementation-12/full-research-validation-291.log)与[专项](qa/2026-09-30-implementation-12/targeted-tests.log)。两次早期1,177／1,162／15／0完整通过日志分别属于permanent invalidation及build receipts之前；一个build-identity run被停止以补当前source-status同步，保存为interrupted日志，均不冒充最终通过。

## 最终正式页面与文件验收

正式构建仅监听127.0.0.1:3003。108974实际drag改变默认3D pose，radius场景选node62／dim、隐藏topology并缩放；切centerline／清selection／改变layer／Reset后，same-build source-view restore重新读184,927B源文件，重建radius场景并恢复实际pose／node／dim／hidden topology，position最大差0。actual no-store新sequence与核验时间出现，source disclosure与科学comparison0.5同时记录最新proof。

故意临时移走**一个generated dist asset**，未移动或改变原public source；恢复读取失败后canvas=0／prepared=0／capture禁用／comparison禁用／Geometry unavailable，源metadata／hash保持。generated asset恢复后与public original分别核184,927B及准确SHA，retry重新读取并应用正确pose，不用旧scene替代。故意wrong source与same-version wrong renderer build均在读取前拒绝，保留仍正确的当前来源画面。

补充集合45674（844,047B）native frame／rights context／namespace单独保留，source-authorized radius切换与fresh restore实际通过。No Diameter 242822（474,672B）源3D、radius requested、actual skeleton、plane lock=false、radius button disabled，未把placeholder半径当测量输入。

194469二维源（111,972B）实际radius request／skeleton、node24／dim／hidden topology／缩放记录在517×340 viewport保存；source请求改为明确centerline后旧capture清除，390px／Enter restore重新核source并恢复requested radius及actual skeleton，camera position最大差0、sourcePlaneLocked=true／z仍未补造。新viewport336×300／aspect1.12，source frame和pose不改。document／scroll=390；3卡338／scroll336，textarea约313.203px／scroll311，无页面横向溢出；窗口override已reset。未改相机返回原位置仍需重捕获的规则，实际Zoom＋Reset后prepared=0／Export disabled已验证。切换其他卡片来源也保留未变卡片的capture。

最终科学comparison source proof sequences分别194469=8、45674=7、108974=6，均no-store；原canonical科学counts、REG=0及unknown physical identity不变。见[最终DOM记录](qa/2026-09-30-implementation-12/browser-final-receipts.json)、[桌面截图](qa/2026-09-30-implementation-12/source-view-wide.png)、[390px截图](qa/2026-09-30-implementation-12/source-view-390.png)，截图已目视核对。JSON export click已实际操作且未改变当前capture；浏览器Blob落盘未验证。另从实际readonly UI保存[同源视图JSON示例](qa/2026-09-30-implementation-12/neuromorpho-194469-source-view.json)，它是审计及同build重放记录，不能充当新runtime byte permit。中间browser JSON／截图另存，明确不兼容最终build。一个CDP点击报告超时，但DOM确认details已打开；按实际状态继续，最终receipt准备成功，未盲目重复toggle。

## 剩余范围与回滚

UPG091、F16仍部分完成，完整MD所有Goal保持active；本轮不改科学source／cell／registration计数、不改frozen2.90、不发布。恢复只涉及/private/tmp/ohri-i12-before内本轮明确修改的文件和新模块／测试／时间轴，重新生成当前2.91清单，不覆盖其他dirty工作。
