# 开发说明

返回 [项目首页](../README.md)。完整交互演示见 [演示脚本](DEMO.md)。

## 小程序
使用微信开发者工具导入 `miniapp/` 目录。已提供原生 WXML/WXSS/JS，无需另外编译或安装 npm 依赖。

- 默认 `touristappid` 用于本地开发导入；真机预览或发布需要配置你自己的 AppID。
- 开发工具中允许「不校验合法域名」，运行本地演示接口。
- 开发工具可用 `http://127.0.0.1:3000`；真机需在页面底部填写电脑局域网地址，例如 `http://192.168.1.8:3000`。
- 支持导诊流程、搜索、楼层 Canvas 地图、路线、模拟到达、模拟叫号、扫码和手选定位、关怀模式。
- 小程序与 Web 共用同一个 API 的地图、流程和状态。WebMCP 仅属于浏览器增强功能。
- 当前环境没有微信开发者工具及真实 AppID，源码已提供，尚未进行微信编译器及真机验收。

## 项目结构
```text
app/                  患者端与管理后台路由
components/           地图与界面组件
shared/hospital.mjs    地图数据、Dijkstra 算法、就诊状态机
server/api.mjs        Node HTTP 模拟接口与二维码生成
lib/use-hospital.ts   客户端同步和操作
miniapp/              原生微信小程序
scripts/dev.mjs       一次启动网页和接口
tests/               路线、流程及 HTTP 集成测试
data/                 本地运行数据
```

## 地图与科室替换
`shared/hospital.mjs` 中的 `specs` 定义建筑、楼层和科室，`nodes` 是通行点，`edges` 是无向通行边。地图组件和路线引擎读取同一坐标，距离单位是演示米数（坐标 × 0.22，楼层连接为等效通行距离）。

`components/hospital-map.tsx` 渲染楼层与院区底图。替换真实地图时，必须同时校准底图坐标、房间入口、节点与边；不能只更换图片而沿用虚构路网。后台目前可编辑名称/时间和通行状态，暂不提供拖拽绘制路网的编辑器。

## 接口
| 请求                                  | 用途                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| GET /api/health                       | 服务状态                                                                       |
| GET /api/state                        | 当前导诊与通行状态                                                             |
| GET /api/hospital                     | 地图、科室、楼层、流程定义                                                     |
| GET /api/route?from=service&to=cardio | 当前通行条件下的路线                                                           |
| GET /api/qr?id=cardio                 | 定位二维码 SVG                                                                 |
| POST /api/action                      | advance / call / locate / arrive / accessible / elevator / block / poi / reset |

所有写操作必须提交当前 `version`，过期版本返回 409；患者端自动读取新状态并提示重试。未到达任务地点、未叫到当前患者或无可通行路线时，后端拒绝违规推进。

## 验证与构建
```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

HTTP 集成测试使用独立临时数据目录和测试端口，不改变用户当前演示。涵盖完整就诊、二维码、冲突保护与接口重启后数据保留。

Docker 可选启动：

```bash
docker compose up --build
```

容器使用开发演示服务，数据持久化到命名卷。当前机器没有 Docker，因此 Docker 配置尚未实际运行验证。

## 三维实现

`lib/scene/campus.ts`、`lib/scene/interior.ts` 与全程导航模块负责三维展示；路网和就诊状态机位于 `shared/`。三维、二维回退与小程序共享路网数据。替换医院模型时必须同步校准房间门口、走廊、建筑入口和通行边。当前路线是模拟数据，不可用于真实医院导航。

## 手机局域网演示

电脑与手机连接可信的同一 Wi-Fi，手机访问 `http://电脑局域网IP:5173`；需要允许 5173 和 3000 端口。接口默认使用同一主机的 3000 端口。后台缺少鉴权，不应开放到公网。
