# GitHub 发布说明

## 当前许可

0.2.0 起采用 [SmartGuide 非商业使用许可 1.0](../LICENSE)：非商业使用免费，商用需事先书面许可，禁止未经授权商用。当前项目应称为“源码可见”，不是 OSI 意义的开源。详细适用范围、授权入口和历史 AGPL 版本边界见 [商业授权说明](COMMERCIAL_USE.md)。

新许可只覆盖有权如此许可的内容，第三方许可与此前已经授予的 AGPL 权利继续有效。来源标记不是权属证明；商业授权前应确认实际权利人和外部贡献授权记录。

## 94 来源标记

标记 `94-smartguide-jiusi-2026` 存在于源码常量、HTML 元信息和 body 属性、Three.js 场景数据、公开 provenance.json 和 API 响应头中。无访客编号、定位采集、回传、埋点或追踪请求；它只能辅助识别未移除标记的副本，不能发现所有复制行为。不要加入隐蔽追踪脚本或破坏性代码。保留提交历史、发布包 SHA-256、带日期的版本与设计记录，比单独隐藏字符串更有助于说明来源；校验和只证明文件一致性。

## 发布与后续更新

当前仓库为 [94van/smartguide-94](https://github.com/94van/smartguide-94)，已经发布。以下为检查步骤，不表示列出的所有设置均已启用。后续许可调整另见 [商业使用说明](COMMERCIAL_USE.md)。

1. 解压 `release/smartguide-94-source.tar.gz` 到新目录，从这份白名单源码开始创建仓库。不要把工作目录整包上传：本地 data、缓存、聊天配置、环境变量和编译产物不在发布包内。
2. 在 GitHub 创建空仓库，建议名称 `smartguide-94`；不要另选一个冲突的许可证模板。上传解压目录里的内容，包括隐藏的 .github、.openai 与 .gitignore。
3. 先用私有仓库检查 Actions 结果和文件内容，再按意愿改为公开。当前仓库已上传，后续更新应继续核对 CI。
4. 在 package.json 增加真实 repository / bugs / homepage 地址，在 README 顶部增加真实仓库链接；不要填占位链接冒充可用源码入口。
5. 在 GitHub 设置中启用 Private vulnerability reporting、Dependabot alerts 和 Secret scanning / Push protection（以账号及仓库支持情况为准），保护默认分支，合并前要求 CI 通过。工作流仅授予读取仓库权限。
6. 发布对应版本 Release，附源码包和校验和；截图只使用模拟信息，不要混入患者信息、登录凭证、私人路径或桌面聊天。
7. 如分享修改版本，应提供对应源码、许可与来源声明；商业部署须先取得书面许可。当前 Node API 与前端是两个进程，单独上传静态网页不会提供完整后台功能。

## 验证与更新

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm release:check
pnpm release:pack
```

`release:check` 使用白名单并扫描常见密钥格式和个人主目录路径，不保证识别所有秘密或真实患者数据。发布前仍需人工看一遍所含文件。源码清单在包内 SOURCE_MANIFEST.json；包外 .sha256 可用 `shasum -a 256` 校验。更新依赖后运行 `pnpm licenses:inventory` 并复核许可和安全公告。不要把依赖清单当成完整法律或安全审计。

仓库泄露密钥时先吊销/轮换，再清理历史；只删除当前文件不能保证已发布副本消失。当前无登录鉴权的管理接口只能用于可信本地演示，不能直接暴露到公网。

## 官方参考

- [GNU AGPL-3.0 完整条款](https://www.gnu.org/licenses/agpl-3.0.html)
- [OSI 开源定义](https://opensource.org/osd)
- [GitHub 为仓库添加许可证](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository)
- [GitHub 清除敏感数据](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
