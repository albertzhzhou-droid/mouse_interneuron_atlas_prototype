# I40 · 应用键盘入口

2026-10-02，延续原 MD 的 F01／F14／F17 目标。当前实施增加所有五个应用页面的 Skip to research content。客户端跳转只移动焦点并滚动到当前工作区；不修改查询、来源片段、对象选择或源加载凭据。

## 本轮证据范围

I39生产构建的八个主研究入口已逐一实际打开。对当时已挂载可见内容检查重复 IDs、aria-labelledby／aria-describedby 的缺失目标和无标签表单控件，未发现异常。检查不包含未展开内容，也不是辅助技术朗读验收。

改变前，主应用首次键盘研究路径经过七个顶部操作按钮。新共享链接为首个可聚焦入口，目标为主应用研究区以及四个独立页面导航下的内容区。focus 时可见，实际48px高度；普通浏览保持原布局。七个顶部操作按钮原实测35px高，已通过共享样式设置至少44px；最终构建尺寸复核独立保留在QA。

原主证据rail的六个未选中tab指向不存在的tabpanel。现保留七个稳定面板元素，准确连接aria-controls／aria-labelledby，只有当前面板挂载内容，其余hidden且没有子元素。选中、数据加载和各来源门槛保持原逻辑。

本轮已完成33项实际浏览观察：五路线desktop／390px的10个skip流程、八研究入口的12个Home／End／左右箭头／wrap转换，以及七证据面板的11个转换与挂载核对。Enter移动到准确内容区；后续Tab继续其内部控件。BIL:ace-pie-cot的Run8选择和来源片段、CiD039原页、CiD039→MN068原接触对均保持；一个实际pair source receipt前后逐字相同。当前已挂载范围无重复ID、失效引用或无标签控件；这些检查不证明所有未展开视图或辅助技术朗读。

来源片段会在自身初始化时focus到准确workspace summary：一次在该过程中的body Tab超时保留为未通过尝试，稳定后通过首个导航链接Shift+Tab到skip link验收。另一次getByLabel定位未命中，经新DOM确认后使用可访问combobox名称完成；不把这些尝试计入33通过观察。

完整工程退出状态、最终构建复核、逐byte输入保全和图片见 `docs/qa/2026-10-02-implementation-40/verification-summary.json`。十一份原有文件的preimages均在对应编辑前取得，zip及各文件hash保留；原科学输入和来源门槛不变。没有为这项低风险导航／引用修补添加复述实现的单元测试，使用实际浏览和既有全项目research入口验收。

## 仍未完成

实际200%浏览器缩放、screen reader朗读、浏览器下载落地、全App性能预算及未展开内部视图不由此计为完成。BIL准确section/donor/outline frame/curated labels/rights与mouse exact IN内部对象链仍缺失。79/243精确completed保持；完整Goal继续active。
