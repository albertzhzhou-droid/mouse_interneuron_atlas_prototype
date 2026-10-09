# I41 · 小鼠 V2a 群体源影片

2026-10-02，执行原 UPG-170 的完整、限于准确补充影片的增量，服务 F02/F08/F13/F14/F16/F18。不得将该增量代替 M2、M4 或所有 F01–F20 Goal。

## 原始来源

PMC8366232.1 当前公开元数据及论文 XML、官方 Frontiers 文章和唯一 Video_2.MP4 已实际取得，正常 TLS，无凭据或外部脚本执行。原影片 11,361,776B，MD5 52819657cc5afc44d9150c1c6a36490a 与官方 versioned media inventory 相同；SHA256 79e6aad7f4881228cdd1f3a46d908918bd276ca93b0e98d477a9f4f4f77b2f2e。XML原 MD5与metadata一致，SM2准确指向该影片，CC BY 4.0明确。保留十四位原作者、citation、权利范围和未改影片说明；不是整个其他dataset的许可审查。

ffprobe 完整读取400帧，H264/1600×1200/20fps/20秒，只有一条video stream、无audio。ffmpeg完整decode actual exit0，错误log空；它是build来源检查，不冒充native browser全帧解码。MP4内部title/creation comment仅源渲染元数据，不推断physical specimen或采集时间。原XML中成年动物/Chx10-Cre×Ai14研究语境成立，准确影片年龄/sex/specimen/per-cell ID unknown；损伤组3–5个月不能移给Movie2。

XML和supplement说明显示C1–L1 V2a群体荧光。原方法以Imaris生成3D动画；它是压缩渲染影片，不是raw stack或editable geometry。没有准入voxel scale/frame/transform/segmentation/per-cell parent，0新增canonical profiles、physical cells或内结构。原31来源/387profiles与其他科学分母保持；这个population movie独立于canonical molecular census。

## 实施与验证

Sources独立页和主应用原Additional source evidence新增按需折叠入口，fragment可复现面板。展开仅加载组件；原11.36MB影片需explicit Load。完整no-store请求经过byte length/SHA校验产生私有proof后才创建Blob URL。当前request隔离、abort、clear/close/unmount及metadata/error failure清除源与snapshot；不接受声明状态或clone作为byte authority。native元数据必须是准确duration/尺寸。

native controls、显式Play/Pause、秒数定位、paused snapshot JSON及fresh-byte restore接入；restore必须保留全部source/rights/unknown与checksum声明，重新请求原bytes并实际seek。恢复范围仅movie time/rate和paused状态，不是相机/clip/三维复现。描述track与可见原caption辅助无音轨内容。

7专项与source完整字节/权利验证通过，desktop/390px/44px/Enter、native metadata/播放/暂停/准确seek、paused snapshot/fresh restore、rights篡改拒绝、close/reopen与真实bad wire/retry/两10s pending cancel已通过。deadline后的稳定状态单独复核。getByLabel一次第二次restore定位错误保留为未通过尝试，fresh DOM后textbox角色定位成功。完整工程最终结果与所有input封存单独写入docs/qa/2026-10-02-implementation-41/verification-summary.json；若任何required check失败，UPG-170不能保持completed。

## 保存与回滚

本轮10个原文件编辑前preimage及2294既有authoritative pins已保存。只按preimages名单逐项恢复、删除本轮明确新增文件，然后重建当前manifest；不使用Git reset、不删除其他dirty work。原影片与XML等source files非临时副本，public MP4保持逐byte相同。

## 完整 Goal 未闭合

BIL准确section/donor/outline frame/curated labels/rights、mouse exact IN raw volume/segmentation/stable parent/raw-slice、全App预算/200%zoom/screen-reader等原目标仍开放。无需从影片推断或生成缺失的单细胞/内部结构。
