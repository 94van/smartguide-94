# 安全说明

本项目目前维护 0.1.x 演示分支，不承诺生产级安全或服务等级。已知设计边界包括：无用户认证、共享演示状态、开放跨域接口、本地 JSON 数据存储。仅适用于本机或可信隔离网络。

## 报告问题

仓库发布后，请优先使用 GitHub 的 **Security → Report a vulnerability** 私密报告功能（维护者须先启用 Private vulnerability reporting）。如果该功能未启用，可发一个不含利用细节和敏感数据的 Issue 请求私密联系方式。不要在公开 Issue 中发布密钥、真实患者资料、可直接利用的生产目标或私密医院数据。

## 发布者和部署者

- 将 `.env`、本地数据、日志、AppID 私有配置、证书和密钥留在 Git 之外；`.gitignore` 不会删除已经提交的历史。
- 凭据一旦泄露，先吊销或轮换，再清理历史；仅删除当前文件不够。
- CI 只使用只读仓库权限，不运行来自 PR 的 `pull_request_target` 特权工作流。
- 公网部署前必须增加认证授权、严格跨域白名单、速率限制、TLS、审计、备份及数据治理，重新评估地图正确性。
- 项目没有植入访问追踪。静态“94”标记不记录 IP、设备指纹或使用者行为。

参考：[GitHub 敏感数据清理](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)。

## 已知依赖问题

见 [依赖安全检查记录](docs/DEPENDENCY_SECURITY.md)。当前仍有 image-size 的两条高危解析公告未修复，不应将本演示标为可安全公开部署。
