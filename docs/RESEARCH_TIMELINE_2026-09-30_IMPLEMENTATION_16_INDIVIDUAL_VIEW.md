# I16：142 条个体形态的完整来源视图恢复

2026-09-30开始，最后验收于2026-10-01（America/Toronto；保留本轮文件名），继续完整MD Goal，同一dirty工作树、2.91.0-research.1，未发布。复用I14 private byte producer和I12/I13校验核心，补独立个体renderer的实际视图保存与恢复；主场景179的完整view仍待整合。

## 实现与科学范围

142 frozen census有独立 `individual_morphology_view_receipt` 0.1。实际相机位置/target/up/quaternion与投影、WebGL/context与drawing buffer、clipping、centerline/radius/topology/axes、启用原SWC types与可见centerline groups、exact node/dim、source bounds/frame/display transform、private geometry verification与unknown physical parents，均来自当前renderer。保留FOV38和pixel ratio上限1.5，不能由比较器profile、Universe frame或公开clone代替。共享build固定25个代码、样式与依赖inputs；同应用版本下代码或样式不同也拒绝旧保存。

准确source/build先校验，错source/build或伪造receipt在fresh recheck前拒绝，当前正确scene保留。有效同源restore清current capture/scene/proof，再以no-store读取并验证源bytes，建立新renderer/bounds，恢复camera、source types、topology、node/dim并核对actual applied pose才完成。换源/关闭/取消/new restore/晚到、failed fresh和WebGL context lost不回写旧view；failed fresh不回退旧cache。真实变化用单调revision永久使旧capture失效，开关切回旧值也须重新capture。context lost撤canvas并清capture；未声称native强制context-loss实验通过。

142真实source bytes/frame分别专项核验：94 native diameter仅92个3D准许明确DER；194468/194469两条2D保留源diameter及平面，禁止surface/depth/oblique pose；48 No Diameter保留centerline。0 REG/0同细胞internal primitives。raw-SWC hash仍为declared，没有重新读取raw SWC；repository neuron ID不冒充physical specimen/cell identity。

## 验证与最后布局修正

6项新增source-backed CPU测试覆盖全部142真实geometry输入、fresh immutable payload、hidden type/topology、错source/frame/renderer、public clone、伪造type/camera/clip/build/proof、2D/No Diameter和applied pose；这不是全部142的native WebGL试验。与原source-view/producer专项23项通过。首次完整入口因真实UI修正而主动中止，exit130仅保留中断证据。之后修正前完整入口曾退出0，1,207 tests／1,192 passed／15 conditional skips／0 failed，其历史日志另存[修正前完整入口](qa/2026-09-30-implementation-16/pre-layout-full-research-validation-291.log)。

native检查修正了keyed imperative host在换源时留下第二canvas、浅色proof panel继承白字和失败时旧DER badge。最后截图又发现既有四行grid把说明段落当作可伸展画布行，1280px页面该段占1,756.35px，实际416px画布被推离操作区。仅把 `.morphology-canvas-card` 改为内容自身高度及顶部对齐。实测说明段落68.5px，桌面canvas416px；390px页面canvas364×360，document width390。未修改科学来源或画布尺寸规则。修正前native JSON及25-input hash保持历史范围，不代替新样式证明。

包括最后样式修改的完整research入口终态退出0：1,207 tests／1,192 passed／15 conditional skips／0 failed，build、strict typecheck、全项目lint与全部validators通过，654 current authoritative input receipts。[当前完整日志](qa/2026-09-30-implementation-16/full-research-validation-291.log)。之后仅同步文档/任务描述/current manifest，最终build及39项individual/source-view/producer/queue/manifest检查单独验收，不冒充又一次全量入口。

## 修正后实际页面验收

108974在桌面实际node62/dim、隐藏type1、topology关闭保存，同源fresh restore后camera最大差0，layers/inspection一致，proof seq3→5、no-store。真实type开关切回旧值后旧capture仍清零、export disabled。旧样式的25-input保存明确报code-build changed，当前正确scene保留，没有将非法保存当作fresh请求。另一次无Inspector遮挡的真实canvas拖动实际改变camera（最大坐标差6.476752921503235 viewer units），旧capture清零；capture新pose后fresh restore又差0，seq16。差值只用于确认操作，不是生物尺度。

仅临时移动generated dist的108974 geometry测试missing source，原public文件保持。预览日志为static stream ENOENT，页面报Failed to fetch；未声称这是实际HTTP404响应。失败canvas0／current view receipt0／source proof textarea0／DER badge0，capture/export disabled。generated即时恢复并核对184,927 bytes及原SHA后，fresh retry seq6、canvas1/DER badge1、camera差0。390×844／Enter恢复桌面视图seq7，camera差0、layers/inspection一致，canvas364×360、document390。

切194469时只有1 host/1 canvas，旧capture与saved input清零。390px/Enter exact node24/dim的二维fresh restore seq10、no-store，camera差0，layers/inspection一致、sourcePlaneLockedtrue、radius disabled，原diameter保留。242822 fresh restore seq11→13、no-store、camera差0、skeleton、radius disabled、canvas1。修正后native保存JSON由实际当前控件生成，逐一按25个固定文件的byte/SHA独立比对；[当前native build核验](qa/2026-09-30-implementation-16/native-current-build-verification.json)。证据目录保留全部修正前后的准确文件。

[最后桌面截图](qa/2026-09-30-implementation-16/layout-final-desktop.png)已视觉检查，1280×1200展示源记录、实际canvas及保存控件连续排列；恢复专项的桌面是1280×720，窄屏390×844。截图尺寸是临时取景，结束前重置。曾点击JSON export，未等待下载事件，Blob落盘未观察，不把点击等同文件落盘。预览重启时一次误用未支持的host参数被工具忽略；已立即停止，改为hostname并实核仅监听127.0.0.1:3003。3000/3001的其他服务未动。

388个本轮前manifest里的固定data/public scientific inputs逐项byte/SHA均0变化，task registry描述另计。2.34/2.90 frozen manifests字节/SHA不变；三次generated missing实验均即时恢复。最后完整入口之后若只更新文档/current manifest，则最终build与局部39项检查另记，功能代码hash保持最后全量通过状态。

## 下一断点与回滚

下一增量复用I14 main-scene private producer，按142 census／7 supplementary8.6.124／30 Todd supplementary8.6.126独立context/frame接主场景actual camera、所有requested/effective layers、global/local clipping、inspection及code-build。不能让Todd使用149 roster未覆盖的frame；M2/M4真实same-cell链、其他legacy views/export及全部MD条件仍active。243任务、79 exact completed保持，UPG091仍in progress。

回滚仅限 `/private/tmp/ohri-i16-before/owned-inputs.json` 中13份本轮前态、本轮新individual专项与本时间轴及当前manifest重建。保留其他dirty工作、固定scientific index/geometry/SWC及2.34/2.90 frozen manifests，不追溯重写旧验收。
