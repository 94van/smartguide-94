# 依赖安全检查

检查日期：2026-09-10。使用 npm 公告库 / pnpm audit；这不是完整渗透测试或生产安全认证。

已将 React / React DOM / RSC 更新到 19.2.8，Vite 更新到 8.0.16；锁定 ws、undici、esbuild、sharp 的修复版本。更新后测试、类型检查和构建通过。

剩余公告：

- **high · image-size**：image-size: ICNS parser allows denial of service through an infinite loop。公告：https://github.com/advisories/GHSA-w3rx-r6r6-pgpr。
- **high · image-size**：image-size: JXL and HEIF parsers allow denial of service through infinite loops。公告：https://github.com/advisories/GHSA-5p2g-fcmc-qvqq。

image-size 由 vinext 间接引入；本次 npm 实际可用最新版仍为 2.0.2，公告标注的 2.0.3 尚不可安装，不能谎称已修复。当前页面无图片上传入口，但框架有图片处理能力，因此不能仅据此判定漏洞不可触发。保持本地可信演示，不处理不可信图片；公开服务前升级并复核图片处理端点。

后续运行 `pnpm audit` 复查。pnpm-workspace.yaml 中的安全覆盖项随上游修复更新，尤其 sharp/esbuild 跨 0.x 次版本覆盖需要复核兼容性；目前未验证所有可选图像功能。
