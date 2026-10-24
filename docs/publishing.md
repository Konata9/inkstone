# 发布与 Marketplace

发布只发生在 **版本升级产生的稳定 tag** 上，不会在每次 push 到 `main` 时执行。

```text
pnpm release patch|minor|major
  → bump package.json + CHANGELOG
  → pnpm build
  → commit + tag v<version>
  → push main + tag
  → GitHub Actions: .github/workflows/release.yml
  → 校验 → 打包 VSIX → 发布 Marketplace / Open VSX → GitHub Release
```

`.github/workflows/build.yml` 只构建和校验，**不发布**。

## 触发规则

- 只响应 `v*` tag。
- `release.yml` 先运行 `pnpm release:check --tag "$GITHUB_REF_NAME"`，确保 tag 与 `package.json`、`CHANGELOG.md` 的版本一致。
- **稳定 tag**（如 `v0.4.0`）发布到两个 registry。
- **预发布 tag**（如 `v0.4.0-beta.1`）只创建 GitHub prerelease，不推送到 Marketplace / Open VSX。
- 重复运行使用 `--skip-duplicate`，已存在的版本不会让 workflow 失败。

## 发布到哪里

| Registry | 扩展 ID | 认证方式 | 状态 |
| --- | --- | --- | --- |
| VS Code Marketplace | `Konata9.inkstone` | `VSCE_PAT`（组织范围） | 已上线 |
| Open VSX | `Konata9/inkstone` | Trusted Publishing（GitHub OIDC） | 已上线，待注册 |

两个 registry 都使用 `packages/vscode/package.json` 里的 `publisher` 字段：`Konata9`。
Open VSX 的 namespace 大小写必须完全一致，必须是 `Konata9`。

## VS Code Marketplace

### 当前方案：组织范围 PAT

1. 在 Azure DevOps 创建 PAT：
   - Organization：选择**具体的 Azure DevOps organization**，不要选 `All accessible organizations`
   - Scope：Custom defined → **Marketplace → Manage**
2. 在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 添加：
   - Name：`VSCE_PAT`
   - Value：上一步的 PAT
3. 该 PAT 是长期凭证，定期轮换。`release.yml` 会在发布前检查它是否存在，缺失时会给出明确错误。

> Azure DevOps 在 **2026-12-01** 停用的是 **global PAT**（勾选
> `All accessible organizations` 的 PAT）。组织范围 PAT 仍然可用，所以上面选择
> 具体 organization 的 PAT 是当前可用的方案。

发布命令（workflow 内已包含）：

```bash
pnpm dlx @vscode/vsce publish \
  --packagePath "dist/Konata9.inkstone-<version>.vsix" \
  --skip-duplicate
```

### 迁移：Marketplace Trusted Publishing

`@vscode/vsce` 已支持 `publish --oidc`，不需要 PAT。等 Marketplace 端的
trusted publishing policy / 后端正式可用后：

1. 在 Marketplace 为仓库和工作流配置 trusted publishing policy。
2. 把 `release.yml` 的 Marketplace 步骤换成：

   ```bash
   pnpm dlx @vscode/vsce publish \
     --packagePath "$vsix" \
     --oidc \
     --skip-duplicate
   ```

3. 删除 `VSCE_PAT` secret。

workflow 已经有 `id-token: write`，迁移时只需要替换命令。参考
[`vsce` Trusted publishing](https://github.com/microsoft/vscode-vsce#trusted-publishing)。

如果现在就必须完全去掉 PAT，而 `--oidc` 尚未可用，可以使用 **Microsoft Entra ID
managed identity + workload identity federation + `vsce publish --azure-credential`**。
这条路径需要 Azure 订阅、federated credential，以及把 managed identity 加为
Marketplace publisher 的 member，配置成本明显更高；参考
[vsmarketplace#1422](https://github.com/microsoft/vsmarketplace/issues/1422)
中整理的 managed identity 步骤。

## Open VSX（Trusted Publishing）

Open VSX 使用 GitHub OIDC 换取短期的发布 token，workflow 里**不需要** `OVSX_PAT`。

### 已完成：首次发布

扩展已经以 `Konata9/inkstone` 上线（当前 `0.3.4`），namespace 与 Publisher
Agreement 都已就绪。这一步只能用 access token 完成，因为 Trusted Publishing
要求扩展至少有一个 active version。

### 待完成：注册 Trusted Publisher

打开 open-vsx.org 的 **Settings → Trusted Publishers**，添加 GitHub：

| 字段 | 值 |
| --- | --- |
| Organization or User name | `Konata9` |
| Repository name | `inkstone` |
| Workflow filename | `release.yml` |
| Environment name | 留空 |

Workflow filename 只填文件名，不是完整路径。`release.yml` 指的就是
`.github/workflows/release.yml`。

完成后，后续稳定 tag 会自动使用 OIDC 发布，不再需要 `OVSX_PAT`。

### 说明

- 每个扩展只能有一个 trusted publisher。要改配置，先删除旧 registration，再重新创建。
- registration 绑定的是 **workflow 文件**，不是 tag。`release.yml` 被重命名或移动后，需要同步更新 registration。
- 任何能修改 `release.yml` 或运行它的人都能发布扩展。保护 `main` 分支和 workflow 文件。
- 如果删除了扩展的所有版本，registration 会失效，直到重新发布一个 active version。
- 如果希望发布前需要人工批准，可以在 GitHub 创建 `publish` Environment，并在 workflow 里加 `environment: publish`；同时把 Open VSX registration 的 Environment 也设为 `publish`。当前配置不启用 Environment，保持自动发布。

## 手动重试

在 GitHub Actions 里重新运行 `release` workflow 即可。`--skip-duplicate` 会跳过已经成功发布的版本，只补发失败或缺失的那一端。

如果 tag 已经存在但版本不对，不要复用旧 tag；按发布流程 bump 一个新版本并推送新 tag。

## 相关文件

- `.github/workflows/release.yml` — tag 发布、VSIX 打包、两个 registry 的发布、GitHub Release。
- `.github/workflows/build.yml` — main / PR 上的构建与校验，不发布。
- `scripts/package-vscode.ts` — 生成带版本号的 VSIX。
- `scripts/package-release.ts` — 生成 GitHub Release 资产与校验和。

## 链接

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Konata9.inkstone)
- [Open VSX](https://open-vsx.org/extension/Konata9/inkstone)
- [Open VSX Trusted Publishing](https://github.com/eclipse-openvsx/openvsx/wiki/Trusted-Publishing)
- [Open VSX Publishing Extensions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)
