# I31 — 来源工作区按需加载

日期：2026-10-02。目标：推进UPG-230／F17，真实修复源证据默认入口的eager mount，不改变来源准入。完整Goal继续active。

## 输入与回滚

接手前逐个验证1,228 authoritative inputs的实际bytes／SHA。10个已有owned files封存在`qa/2026-10-02-implementation-31/owned-files-before.zip`，其中9个属于before manifest，1个是current manifest本身。其他1,219个已有受控输入及398固定科学输入保持原范围，冻结2.34／2.90与原依赖不改。10个新增authoritative code／test／tool／timeline文件将清单推进至1,238，最终数字由实际清单验证确认。未Git／push／publication。

## 实施

`SourceAuditWorkspaces`使用四个lazy模块，原生details负责交互，仅open时挂载内容；close使原viewer cleanup取消source load并销毁receipt／PNG／private ownership。描述明确说明关闭后临时状态清除、保存文件可恢复。原主页面Sources tab复用该组件；source route的Atlas／Objects导航关闭prefetch但保留链接。Additional三个入口保持按需加载且支持其原fragment；新workspaces支持准确canonical及旧样本／比较fragment，未知source IDs与坏编码不选择任何来源。原生pre-hydration toggle同步，native Enter与focus样式保留。

## 当前验证与边界

第一代码构建、strict typecheck及focused lint退出0；production SSR／source workspace／comparison回归52/52，WT完整source-view契约8/8。全部来源原始文件保持before hash。当前native已实测四个工作区、三Additional锚点、Back/Forward、两来源绘制、BIL准确run／另一个run切换、sample筛选／空结果与两个export action，WT及SWC saved view在close清零后重开fresh restore。view-replay-comparison.json保留准确比较，fresh验证序列和timings不被误称整个JSON相等。PNG实际preview，不声明download landing。原source aborted cleanup已保留；本次native动作没有证明慢网络下每种cancel竞态。

独立前基线页面4canvas、8个原始数据文件；独立后初始页面0canvas、0mounted source workspaces、0data requests。`baseline-browser-assets.json`／`after-browser-assets.json`是当前观测资源；`baseline-http-resources.json`／`after-http-resources.json`固定本机identity响应体。改动前document80,029、script7,910,335／30成功、stylesheet360,472／8本机成功、other3,335,229／10；初步改动后document13,646、script433,193／18、stylesheet309,414／2、other0。四个remote字体／CSS或未观察到的字体不进入本机分母。前清单另有一个404 preload（exact-source-audit-workbench-ze4fMxnz.js），错误响应9bytes，单独保留，不算成功脚本。最初复用旧tab的preliminary inventory被保留，最终前基线改用独立new tab。数字不表示cache-cold网络、browser wire bytes、解析／执行或任何latency速度提升。

修复后完整代码research actual exit0：1,319 tests／1,304 passed／15 conditional skips／0 failed／0 cancelled，build／strict typecheck／full lint／全部validator通过。最终文档和manifest再生成后的构建、定向验证及native reload分别封存，不将早期failed run写成通过。UPG230 partial，UPG053 in progress，79 exact completed／243总数不变；M2／M4与全部F仍active。

## 由实际完整检查发现并修复的构建缺口

首轮完整research返回1：1,314 tests／1,298 passed／15 conditional skips／1 failed／0 cancelled。新增production SSR实际文件存在性检查抓住`source-audit-workspaces-CrzQKbs-.js`被两个RSC/SSR入口预加载但不在最终client输出的问题；早期旧版本基线另有同类已消除辅助chunk的404。保留首轮日志和实际失败manifest，不删掉失败断言。

检查本次实际安装的@vitejs/plugin-rsc0.5.34与Vite8.2.1构建代码，RSC metadata在client最终chunk消除前收集依赖。新增构建后处理仅移除最终没有输出、也不被任何实际runtime chunk引用的辅助JS preload；必需entry、stylesheet或真实runtime引用缺失继续失败。两份RSC／SSR manifest均保留实际存在的module、样式、顺序及其他字段，原依赖不修改。修复后9项focused实际build／negative checks全通过；每份manifest恰移除两处同一个已合并辅助chunk。原始JSON源数据／viewer准入完全不受影响。后续版本若改变manifest格式，处理器明确失败，不执行或猜测module代码。

## 最终代码复验

`full-research-validation-291.log`保留修复后完整实际exit0，1,319／1,304／15 conditional skips／0 fail／0 cancel。代码build／strict／全项目lint／全部研究validator通过，1,238实际source receipts。10已有owned备份、10新code／test／tool／timeline输入；其余1,219旧输入、398固定科学inputs及冻结2.34／2.90、原依赖保留。

最终代码独立页面仍0canvas／0source-view mount／0源数据请求，18成功JS本机响应体433,328 bytes、2本机CSS309,608、document13,683；最终代码当前URL全部200，无缺失preload。此前source全部原文件相同；current default source-byte数量为零不表示删除这些来源。记录使用accept-encoding identity的普通HTTP GET，包含观察URL的重取正文；prefetch RSC URL重取GET使用其普通响应headers，与浏览器原RSC请求headers不同。这些响应不等同原browser-transfer。远程字体不进入本机分母，不声明cache-cold网络、parse／execute或interaction latency改善幅度。

最终代码390px的BIL、exact sample及两份comparative布局均document.scrollWidth=390；WT独立390px／Enter／focus实测也保留，desktop1280恢复。七summary的最小目标44px。主页面Sources按需BIL切入后离开清零，返回四summary均closed；两个导航目的地实际完成后分别记录。未知BIL source ID fragment未打开任一workspace。WT原pixels／slice映射／renderer／layers／layout exact equal，SWC camera／layers／clipping／transform／renderer exact equal；fresh运行revision、source verification sequence和timings允许变化。这些不建立新的科学joins或完成UPG230全App预算。
