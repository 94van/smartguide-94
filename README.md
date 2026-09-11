<div align="center">

# 🏥 SmartGuide · 玖肆智慧医院

**把一张导诊单，变成看得懂的三维就诊路线。**

三维院区 · 跨楼导航 · 适老界面 · 模拟就诊流程

[![Source checks](https://github.com/94van/smartguide-94/actions/workflows/ci.yml/badge.svg)](https://github.com/94van/smartguide-94/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-1B6B7A.svg)](LICENSE)

[观看导览](#-24-秒界面导览) · [本地启动](#-本地启动) · [开发文档](docs/DEVELOPMENT.md) · [反馈问题](https://github.com/94van/smartguide-94/issues)

</div>

![三维院区总览：门诊综合楼、医技中心与住院楼，以及纸质风格导诊单](docs/media/campus-overview.png)

> **仅供模拟演示。** 玖肆智慧医院、医生钟国、患者万穗均为演示标签；不提供真实医疗服务，请勿输入真实患者信息。截图来自实际运行界面，建筑与路线为虚构示意。

## 🎬 24 秒界面导览

**视频已提供，无需另行制作即可查看项目外观。** 依次展示三维院区、单屏导诊、跨楼路线和完成提示。

[▶ 观看 / 下载 MP4 导览视频](https://github.com/94van/smartguide-94/raw/refs/heads/main/docs/media/screenshot-tour.mp4)

这是实际界面的**截图导览视频**，无音频，不是连续操作录屏，也不展示完整就诊操作。GitHub 若未内嵌播放，可点击链接下载观看；想实际体验旋转建筑、选层和导航，请按下方步骤本地启动。

| 时间 | 展示内容 |
| --- | --- |
| 00:00–00:06 | 院区总览：三栋建筑与空间关系 |
| 00:06–00:12 | 导诊工作区：楼层、科室与纸质导诊单 |
| 00:12–00:18 | 全程三维导航：跨楼步道与路线说明 |
| 00:18–00:24 | 就诊结束：明确的完成提示 |

[查看演示脚本与素材说明](docs/DEMO.md)

## 🧭 从院区到诊室，一条路线看清楚

| 能力 | 实际交互 |
| --- | --- |
| 三维院区与整栋选层 | 旋转、缩放建筑；选中楼层实体高亮，其他楼层透明显示 |
| 一次规划跨楼路线 | 连接走廊、电梯 / 楼梯、建筑入口与院区步道 |
| 按通行路网行走 | 科室入口、门洞与转角共享路线数据，避免轨迹穿房间或斜切拐角 |
| 减少导航眩晕 | 全程导航默认固定镜头，位置标记移动；支持暂停、重看与速度切换 |
| 模拟完整就诊 | 签到 → 候诊 → 接诊 → 缴费 → 检查 → 报告 → 复诊 → 取药 |
| 通行变化反馈 | 电梯停运、封路、无障碍模式参与路线计算；不可达时明确提示 |

![单屏三维导诊工作区：建筑选层、纸质导诊单和目的地操作](docs/media/medical-workspace.png)

主工作区把建筑、导诊单与下一步操作放在同一屏；完整步骤在面板内展开。小屏采用响应式布局。

![全程三维路线：从西药房跨楼前往 CT 检查室](docs/media/journey.png)

全程导航只演示路线，不自动修改患者位置或完成任务；结束后需要明确确认“模拟到达”。

## ♿ 熟悉、清楚、有反馈

- **医院蓝绿**：默认医疗色主按钮，配暖米白导诊单；操作靠文字和形状辨认。
- **高对比大字**：白底深字、大按钮；另提供空间展示主题。
- **完成有提示**：每一步完成显示确认卡和下一步，最后显示庆祝卡与彩带。
- **错误不含糊**：红字、红边框持续警示；普通提醒使用琥珀色。
- **动态可克制**：尊重减少动态效果偏好；庆祝无声音、无频闪，可关闭。

![本次模拟就诊完成提示](docs/media/completed.png)

## 🚀 本地启动

需要 **Node.js 22.13+、pnpm 11**。

```bash
git clone https://github.com/94van/smartguide-94.git
cd smartguide-94
pnpm install --frozen-lockfile
pnpm dev
```

| 入口 | 地址 |
| --- | --- |
| 患者端 | http://localhost:5173 |
| 管理后台 | http://localhost:5173/admin |
| 模拟接口健康检查 | http://localhost:3000/api/health |

按 `Ctrl+C` 一起停止网页和接口。模拟数据保存在本地 `data/demo.json`，重启后保留。首次体验建议先浏览院区，再按导诊单推进流程。

**技术栈**：React 19 · TypeScript · Three.js · Vinext / Vite · Node.js 模拟 API · 原生微信小程序源码。

## 🛠️ 开发与验证

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm release:check
```

- [开发说明：目录、接口、路网替换、小程序与 Docker](docs/DEVELOPMENT.md)
- [3–5 分钟完整演示脚本](docs/DEMO.md)
- [安全边界](SECURITY.md) · [已知依赖风险](docs/DEPENDENCY_SECURITY.md)
- [贡献说明](CONTRIBUTING.md) · [发布检查](docs/OPEN_SOURCE.md)

**当前边界**：这是本地模拟器，不是可直接上线的医院系统。后台无登录鉴权，未接入真实 HIS、支付或定位；不要直接暴露到公网。建筑不是 BIM 或实测地图。小程序真机、Docker 和全面无障碍验收尚未完成。截图证明对应界面可呈现，不代表所有设备和流程均已验收。

## 📄 许可与来源

当前版本使用 **[AGPL-3.0-only](LICENSE)**，允许商业使用，但须遵守适用的源码提供、再分发和声明保留义务。**AGPL 不是“禁止商用”协议。** [查看商业使用与后续许可说明](docs/COMMERCIAL_USE.md)。

署名 **94**。源码、页面与场景包含静态来源标记 `94-smartguide-jiusi-2026`；无访客追踪或隐蔽回传，不能阻止复制，也不构成版权权属证明。

[来源声明](NOTICE) · [免责声明](DISCLAIMER.md) · [第三方许可](THIRD_PARTY_NOTICES.md)
