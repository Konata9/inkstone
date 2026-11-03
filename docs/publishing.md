# 发布配置

仓库有两条独立的发布线，分别由两个 workflow 处理：

| 发布线 | tag | workflow | 发布目标 |
| --- | --- | --- | --- |
| 主题 / 项目 | `v0.4.0` | `.github/workflows/release.yml` | GitHub Release；附带当前 VSIX，但不发布市场 |
| VS Code 扩展 | `vscode-v0.3.6` | `.github/workflows/release-vscode.yml` | VS Code Marketplace、Open VSX、GitHub Release |

版本源分别是根目录 `package.json` 和 `packages/vscode/package.json`，两者互不覆盖。扩展的变更日志在 `packages/vscode/CHANGELOG.md`。

## VS Code Marketplace

在仓库 Settings → Secrets and variables → Actions 中添加 `VSCE_PAT`。

- PAT 需要 Marketplace 的 **Manage** 权限，并且绑定到发布者 `Konata9`。
- 建议使用组织范围的 PAT；全局 PAT 将于 2026-12-01 退役。
- 创建 PAT 的账号必须是 `Konata9` 发布者的所有者。

workflow 使用 `vsce publish --packagePath ... --skip-duplicate`，重复版本不会让发布失败。

## Open VSX

Open VSX 使用 GitHub Actions 的 OIDC trusted publishing，无需 `OVSX_PAT`：

1. 登录 [open-vsx.org](https://open-vsx.org/) 并进入发布者 `Konata9` 的设置。
2. 在 Trusted Publishers 中登记仓库 `Konata9/inkstone`、workflow 文件 `release-vscode.yml`。
3. 首次发布（bootstrap）如果还没有任何版本，需要先用 PAT 手动发布一次，之后 OIDC 才能接替。

如果修改了 workflow 文件名，必须同步更新 Open VSX 的登记，否则 OIDC 校验会失败。

## 预发布

版本号带后缀的 tag 只创建 GitHub prerelease，不发布市场：

- `v0.4.0-beta.1`（主题）
- `vscode-v0.3.6-beta.1`（扩展）

workflow 判断的是去掉 `vscode-v` 前缀后的版本号，因此 `vscode-v` 里的连字符不会把稳定版误判为预发布。

## 重试

两个 workflow 都是幂等的：

- GitHub Release 已存在时使用 `gh release upload --clobber` 更新附件。
- Marketplace / Open VSX 使用 `--skip-duplicate`，重复发布同一版本会被忽略。

如果只失败在市场发布步骤，重新运行 workflow 即可；不需要重新打 tag。
