# 2026-09-29 W01：BIL source metadata 实施凭据

这是本轮实际元数据实施记录，尚无release／版本提升声明。用户已授权实施 `UPGRADE_PLAN_2026-09-24.md` 的更新。worker范围是W01／UPG-163、244、255以及合并调度的029／029A、100，整合者独占共享入口／queue／registry／package／manifest。

## Baseline与本轮差额

按runbook第6.3节先恢复历史：UPG-163保存了34小文件路线和section／标签／rights缺口；2026-09-23的较窄audit则仍为listing-only。项目和`/private/tmp`没有发现历史原始receipt，因此本轮有界重取34核心输入，不镜像全deposit。既有dirty内容未覆写。

普通浏览／网络失败经可用网络通路复核后解除。当前取得82原始小文件2320586 B；34核心输入1187125 B。每个file记录源URL、bytes和computed SHA-256，JSON及workbook格式先核验再atomic保存；candidate outline文件只作为metadata解析，不作为viewer几何。

## 新增可验收行为

`BilXeniumMetadataExplorer`提供16精确source object选择、run／cassette／slide／ROI／analysis信息、来源分割方法分母、source specimen字段、named-outline搜索、所选metadata JSON导出和具体pilot missing-input表。unknown source selection返回null；source specimen key重复也不会合并ROI。所有source metadata始终保留dataset-level scope。

当前methods由实际XOA3.3.0.1及Multi-Tissue Stain manifest／metrics确认；具体距离未声明。实际API提供CC-BY-4.0，保留站点CC-BY-SA差异。329是source named-outline标签；无frame／cell_id crosswalk不能认定为329sections。真实二维cell+nucleus pilot因section／frame／specimen身份链等缺口仍未实现。

## 文件所有权

- `app/bil-xenium-source-metadata.js`
- `app/bil-xenium-metadata-explorer.tsx`
- `app/bil-xenium-metadata-explorer.module.css`
- `data/bil-xenium-source-metadata-0.1.json`
- `data/source-candidates/bil-xenium-20260929/`
- `tools/bil-xenium-fetch-metadata.py`
- `tools/bil-xenium-normalize-metadata.py`
- `scripts/validate-bil-xenium-source-metadata-0.1.mjs`
- `tests/bil-xenium-source-metadata.test.mjs`
- `docs/BIL_XENIUM_SOURCE_GATE_2026-09-29.md`
- 本时间轴。

worker没有修改任何先前已有的BIL历史audit、主计划、队列、注册表或shared app入口。所有主App整合与browser证据应另由整合者记录。

## 验证与剩余依赖

5项Node测试通过，source validator通过（82files／2320586B／16runs／3387300raw cells／329named labels／0geometry），本模块ESLint通过。全项目typecheck仍38错误；本模块没有TypeScript诊断。尚未运行整合后的真实浏览器，未声称全suite或release通过。

详细当前／历史证据、原始receipt hash、source链接和可重启条件见 `BIL_XENIUM_SOURCE_GATE_2026-09-29.md`。下一动作由整合者接入metadata explorer并验证；真实cell+nucleus pilot仅在exact section/frame、specimen及适用rights条件可成立后获取小geometry payload并做稳定ID audit。curated labels缺失时仍需source-only lane，不能以interneuron身份准入。
