# Lerna Project Setup

## Overview

Lerna 是针对 JavaScript/TypeScript 仓库的原创 monorepo 工具。它已存在多年，被数以万计的项目所使用，例如 React 和 Jest。

它解决了 JavaScript/TypeScript 单一源码仓库（monorepos）的两大问题：

* Lerna 可以针对任意数量的项目运行命令，并以最高效的方式、正确的顺序运行，还可以在分布到多台机器上。
* Lerna 可以管理发布流程，从版本管理到发布到 NPM，它提供了多种选项，确保任何工作流程都能得到满足。

> **关于 Nx 的说明**
>
> Nx（同名开源构建系统背后的公司）接管了 Lerna 的管理工作。Nx 是由前谷歌员工开发的构建系统，采用了许多谷歌内部工具所使用的技术。Lerna v5 版本是新管理团队接手后的第一个版本，更新了一些过时的软件包，并开始对源码仓库本身进行一些清理。
>
> 从 v6+ 版本开始，Lerna 将任务调度工作委托给 **经过实战检验、业界领先的 Nx 任务运行程序**，这意味着 `lerna run` 可以免费获得缓存和命令分布式运行所带来的好处！

### 核心痛点与解决方案

如果不使用 Lerna（或类似工具），在 Monorepo 中管理多个包会极其痛苦：

* **依赖地狱**
    * **痛点**：如果 `package-a` 和 `package-b` 都依赖 `lodash`，你需要在两个目录下分别 `npm install`，浪费磁盘空间和安装时间。
    * **Lerna 的解法**：它可以将公共依赖提取（Hoisting）到根目录，整个项目只安装一次。

* **开发调试繁琐**
    * **痛点**：当你在开发 `package-b` 时，想在 `package-a` 中测试它。你需要手动 `npm link` 或者每次改完代码都发一个 beta 版本到 npm，效率极低。
    * **Lerna 的解法**：自动建立软链接，本地修改实时生效，像在一个目录写代码一样流畅。

* **版本发布混乱**
    * **痛点**：假如你修改了底层库 `package-c`，而 `a` 和 `b` 都依赖它。你需要手动更新 `c` 的版本，然后去 `a` 和 `b` 更新对 `c` 的依赖版本，再分别发布三个包。
    * **Lerna 的解法**：一键命令 `lerna publish`。它会自动计算依赖拓扑，更新所有相关包的版本号，并统一发布。

* **指令执行重复**
    * **痛点**：想对所有包运行测试？你需要进入每个目录敲一遍 `npm test`。
    * **Lerna 的解法**：`lerna run test` 可以并行在所有包中执行测试脚本。

---

## File Structure

```text
packages/
├── package-a/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── package-b/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── package-c/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── README.md
├── lerna.json
├── nx.json
├── tsconfig.json
├── .gitignore
└── package.json
```

---

## Getting Started

1.  **安装 Lerna**：运行以下命令来安装 Lerna：

    ```bash
    mkdir lerna-monorepo-example
    cd lerna-monorepo-example
    npx lerna@latest init
    mkdir packages
    ```

2.  **配置 Lerna**：在 `lerna.json` 文件中，配置 Lerna 以使用固定版本模式和 hoist 依赖：

    ```json
    {
      "packages": ["packages/*"],
      "version": "0.0.0",
      "npmClient": "pnpm"
    }
    ```

    根目录下创建 `pnpm-workspace.yaml` 文件，内容如下：

    ```yaml
    packages:
      - 'packages/*'
    ```

3.  **添加包**：在 `packages` 目录下创建子目录（如 `package-a`、`package-b`），并在每个子目录中添加 `package.json` 文件。

    ```bash
    cd packages
    mkdir admin
    cd admin
    npm init -y
    ```

    在 `admin/index.js` 中添加一些代码：

    ```javascript
    module.exports = function() {
      console.log("Hello from admin package");
    };
    ```

4.  **添加依赖**： 在根目录下运行以下命令来安装引用依赖：

    ```bash
    pnpm add package-b@workspace:^ --filter package-a
    ```

    执行成功后发现 `package-a` 的 `node_modules` 目录下会有 `package-b` 的软链接。

    ```diff
     + "dependencies": {
     +  "@packages/common": "workspace:*"  <-- 注意这里
     + }
    ```

5.  **后续的依赖安装** ：

    以后每次添加或修改依赖后，只需在根目录运行以下命令即可：
    ```bash
    pnpm install
    ```

    安装根目录依赖时（通常是开发依赖），在根目录下运行即可：
    ```bash
    pnpm add <package-name> -wD
    ```

    安装某个包的依赖时，进入该包目录运行即可：
    ```bash
    pnpm add <package-name> --filter <package-name>
    ```

---

## NX Important

Lerna v6+ 使用 Nx 任务运行程序来处理命令执行。Nx 提供了强大的功能，如任务缓存和分布式执行，这些功能可以显著提高构建和测试的效率。

1.  **启用缓存**：

    在根目录下运行 `lerna add-caching`, 创建 `nx.json` 文件，内容如下：

    ```json
    {
      "targetDefaults": {
        "test": {
          "dependsOn": []
        },
        "build": {
          "dependsOn": [],
          "cache": true
        }
      }
    }
    ```

2.  **并行运行任务**：

    Lerna 现在可以并行运行任务。使用 `lerna run <script>` 命令时，任务将自动并行执行，充分利用多核处理器的优势。

    ```bash
    lerna run test
    lerna run build
    ```

    > **注意**：会在根目录下生成 `.nx` 缓存文件夹，记得加入 `.gitignore`。

---

## Versioning

Lerna 支持两种版本管理模式：固定版本和独立版本。

1.  **固定版本模式**：所有包共享相同的版本号。适用于紧密耦合的包。
    ```bash
    lerna version
    ```

2.  **独立版本模式**：每个包可以有自己的版本号。适用于相对独立的包。
    ```bash
    lerna version --independent
    ```

Lerna 的版本管理机制是基于 Git 的。 它会根据提交信息自动生成变更日志，并更新版本号。

### 发生了什么？

1.  **检测变更**
    Lerna 会对比上一次 Tag（如果你上次没打 Tag，就是从起点开始）和当前 Commit。它发现 `packages/web` 是新增的/变更的，而 `admin` 和 `common` 如果没动过，它们的代码就不会被标记为变更（取决于你的 Lerna 模式，默认 Fixed 模式下，版本号是统一管理的）。

2.  **选择版本**
    Lerna 会问你：`? Select a new version (currently 0.0.1)` (假设上次是 0.0.1)。
    你可以选择 Patch (0.0.2) 或 Minor (0.1.0)。

3.  **自动更新**
    * 它会把 `lerna.json` 的版本号改了。
    * 它会把 `packages/web/package.json` 的版本号改了。
    * (如果你改了 `common`，它也会同时更新 `common` 的版本，并自动更新 `web` 对 `common` 的依赖版本号)。

4.  **打标签**
    * 它会自动生成一个新的 Git Tag（例如 `v0.0.2`）。
    * 它会自动生成 `CHANGELOG.md`（如果配置了 conventional commits）。
    * 它会自动 Push 到远程仓库（如果你没加 `--no-push`）。
    * 发布新版本时，Lerna 会将更改推送到远程仓库，并发布到 NPM。

---

## Publishing

Lerna 提供了简化的发布流程，可以一键发布所有包。

```bash
npm login

# 根据提交记录发布新版本
lerna publish from-git

# 忽略 lerna version ,重新选择版本号发布
lerna publish
```

### lerna publish 发生了什么？

```text
lerna publish
│
├─ 校验 Git & 环境
├─ 识别变更包
├─ 计算新版本号
├─ 修改 package.json
├─ 生成 changelog（可选）
├─ git commit
├─ git tag
├─ lerna version 到达此结束
├─ npm publish
└─ git push + tags
```

---

## CI/CD 集成

设置 CI 流水线，可以使用 Lerna 的命令来自动化测试、构建和发布流程。

### CI Check

例如，在 GitHub Actions 中，可以创建一个工作流文件 `.github/workflows/ci.yml`，内容如下：

```yaml
name: CI Check

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # 必须拉取完整历史，Lerna 才能分析 diff

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Build All
        run: npx lerna run build
```

### Release Library

设置 Release 流水线，可以使用 Lerna 的发布命令来自动化发布流程。例如，在 GitHub Actions 中，可以创建一个工作流文件 `.github/workflows/release.yml`，内容如下：

```yaml
name: Release Library

on:
  push:
    branches: [ main ]
    # 忽略掉由机器人自动生成的 commit，防止死循环
    paths-ignore:
      - '**/CHANGELOG.md'
      - '**/package.json'

jobs:
  publish-npm:
    # 只有当 commit 信息不包含 release 关键词时才运行
    if: "!contains(github.event.head_commit.message, 'chore(release):')"
    runs-on: ubuntu-latest
    permissions:
      contents: write # 需要权限回写 git tag

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
          registry-url: '[https://registry.npmjs.org](https://registry.npmjs.org)'

      - run: pnpm install --frozen-lockfile

      - name: Configure Git User
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

      # === 核心步骤 ===
      # 1. lerna version: 改版本号，打 Tag，推送到 Git
      # 2. lerna publish: 把更新后的 common 包发布到 NPM
      # 此处会根据 conventional-commits 自动生成版本号，并创建 Release 提交记录
      - name: Version and Publish
        run: |
          npx lerna version --yes --no-private --conventional-commits --create-release github --message "chore(release): publish %s"
          npx lerna publish from-git --yes
        env:
          # 用于 NPM 身份验证
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          # 用于 Git 推送
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

后续还可以设置部署相关，打包 Docker 镜像并推送到容器仓库等。
