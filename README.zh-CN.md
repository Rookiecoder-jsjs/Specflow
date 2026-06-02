# SpecFlow AI

> English version: [README.md](./README.md)

[![npm version](https://img.shields.io/npm/v/@specflow/claude-code)](https://www.npmjs.com/package/@specflow/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-green.svg)](https://nodejs.org)

**AI 驱动的项目上下文编译器 —— Claude Code 原生插件。**

将会议录音、产品文档和聊天讨论直接转化为 AI 可执行的项目上下文包（PCB），无缝集成在 Claude Code 中。无需切换上下文，无需重复解释，数据不出本机。

---

## 快速演示

```bash
# 1. 全局安装
npm i -g @specflow/claude-code

# 2. 在项目中初始化
cd my-saas-app
specflow init --name "我的 SaaS 应用"

# 3. 编译会议录音、文档和源码
specflow compile --audio kickoff.m4a --text prd.md --project src/

# 4. 查看生成状态
specflow status

# 输出：
#   Project: 我的 SaaS 应用 [discovery]
#   Version: v0.1.0
#   ● 00_overview.md
#   ● 01_product_spec.md
#   ● 02_user_flows.md
#   ... (共 12 份文件)
#   无未决问题。
```

---

## 什么是 SpecFlow AI？

**解决的问题：** 每次启动 Claude Code 会话，你都要花 10-20 分钟重复解释项目上下文 —— 用户是谁、技术约束有哪些、已经做过哪些决策、数据模型长什么样。这些信息散落在会议录音、PRD 文档、聊天记录和源代码中。AI 编程助手无法看到全貌，除非你反复手动输入。

**SpecFlow AI 做什么：** 它能将所有面向人类的协作信息编译为结构化、带版本控制的 AI 可读项目上下文包（PCB）—— 12 份 Markdown 文件，存放在 `docs/spec-flow/` 目录下。配套的 Claude Code 插件在每次会话启动时自动加载这些上下文，让你的 AI 助手从一开始就掌握全部信息。喂一次，处处可用。

本质上，SpecFlow AI 填补了人类协作信息与 AI 执行之间缺失的基础设施层：

```
会议录音、PRD、聊天记录  →  [SpecFlow AI：语义编译层]  →  AI 可执行上下文
```

**为什么现在做？**

1. Claude Code、Codex、Cursor、Windsurf 等 AI 编程助手已从"玩具"变为生产力工具
2. 独立开发者群体爆发，他们没有传统团队的文档流程，但更依赖 AI
3. 大模型在结构化抽取与长文本理解上已具备生产级能力
4. AI Native 协作模式正在形成，这正是基础设施空白期

---

## 安装

### 环境要求

| 依赖 | 说明 |
|---|---|
| Node.js >= 18 | 运行时环境 |
| DeepSeek API 密钥 | LLM 抽取与推理（deepseek-v4-pro / deepseek-v4-flash） |
| DashScope API 密钥 | 阿里云 DashScope 音频转写（qwen3-asr-flash） |
| ffmpeg（可选） | 非标准格式音频预处理 |

### 全局安装

```bash
npm i -g @specflow/claude-code
```

此命令会全局安装 `specflow` CLI 并注册 Claude Code 的 slash 命令和 hooks。

### API 配置

在项目根目录创建 `specflow.config.json`：

```json
{
  "deepseekApiKey": "sk-...",
  "dashscopeApiKey": "sk-...",
  "deepseekBaseUrl": "https://api.deepseek.com/v1",
  "monthlyBudgetCNY": 100
}
```

立即将其加入 `.gitignore` —— 此文件包含密钥：

```bash
echo "specflow.config.json" >> .gitignore
```

配置文件支持沿目录树向上查找（最多 10 层），你可以将其放在跨项目共享的上级目录中。

---

## 快速开始

### 第一步：安装

```bash
npm i -g @specflow/claude-code
```

### 第二步：配置

创建 `specflow.config.json` 填入 API 密钥（参见上方[配置](#配置参考)章节）。确认文件已加入 `.gitignore`。

### 第三步：初始化

```bash
cd your-project
specflow init --name "项目名称"
```

此命令在项目根目录创建 `.specflow/`（内部状态目录）和 `docs/spec-flow/`（输出目录）。

### 第四步：编译

支持任意组合输入：

```bash
# 从会议录音
specflow compile --audio meeting.m4a

# 从产品文档
specflow compile --text prd.md --text architecture.pdf

# 从聊天导出
specflow compile --chat feishu-export.json

# 从已有源码
specflow compile --project src/

# 组合使用
specflow compile --audio kickoff.m4a --text notes.md --project ./
```

### 第五步：查看状态

```bash
specflow status
```

显示哪些 PCB 文件已生成、当前版本、项目阶段，以及任何需要解决的未决问题。

---

## 命令参考

### `specflow init`

在当前项目目录初始化 SpecFlow AI。

```
specflow init [--name <名称>]
```

| 选项 | 说明 |
|---|---|
| `--name <名称>` | 项目名称（默认使用当前目录名） |

创建 `.specflow/` 状态目录和 `docs/spec-flow/` 输出目录。记录项目元数据，包括唯一 ID、创建时间戳和初始版本号（`v0.1.0`）。

### `specflow compile`

将输入编译为带版本的 Project Context Bundle。

```
specflow compile --audio <路径> --text <路径> --chat <路径> --project <路径>
                 [--dry-run] [--force] [--version <版本号>]
```

| 选项 | 说明 |
|---|---|
| `--audio <路径>` | 音频文件路径（m4a, mp3, wav, aac, flac, ogg, webm） |
| `--text <路径>` | 文本或文档路径（md, txt, pdf, docx） |
| `--chat <路径>` | 聊天导出文件路径（JSON：飞书、Slack、微信） |
| `--project <路径>` | 项目源码目录路径 |
| `--dry-run` | 仅估算 token 消耗，不调用 API |
| `--force` | 忽略缓存，强制全量重新编译 |
| `--version <版本号>` | 指定自定义版本标签（如 `v1.2.0`） |

至少需要一个输入参数。同类型输入可多次指定（如 `--text file1.md --text file2.md`）。

编译成功后输出统计信息：版本号、文件数量、未决问题数、耗时、抽取事实数。

### `specflow status`

显示项目状态和 PCB 文件清单。

```
specflow status [--json]
```

| 选项 | 说明 |
|---|---|
| `--json` | 以 JSON 格式输出（用于脚本和 CI 集成） |

显示项目名称、阶段、当前版本、版本历史，以及 12 份 PCB 文件的生成状态（实心圆 = 已生成，空心圆 = 缺失）。报告未解决的未决问题数量。

### `specflow diff`

显示两个版本之间的语义差异。

```
specflow diff [--from <版本>] [--to <版本>]
```

| 选项 | 说明 |
|---|---|
| `--from <v>` | 源版本（默认为倒数第二个版本） |
| `--to <v>` | 目标版本（默认为当前最新版本） |

需要至少两次编译的版本。显示所有 PCB 文件中新增、修改（含相似度评分）和删除的内容。适用于在更新 Claude Code 上下文前审查版本间变化。

---

## 输入类型

| 类型 | 命令参数 | 支持格式 | 说明 |
|---|---|---|---|
| 音频 | `--audio` | m4a, mp3, wav, aac, flac, ogg, webm | 通过 DashScope qwen3-asr-flash 转写。m4a 录音质量最佳。 |
| 文本 | `--text` | md, txt, pdf, docx | 直接解析或通过文档提取。支持一次编译混合多种格式。 |
| 聊天 | `--chat` | JSON（飞书、Slack、微信导出） | 解析结构化聊天导出，提取讨论中的决策、需求和上下文。 |
| 项目 | `--project` | 源码目录 | 分析已有代码库：检测语言、框架、依赖、架构模式和数据模型。自动识别 manifest 文件（package.json, go.mod, Cargo.toml 等）。 |

---

## PCB 输出文件

编译后在 `docs/spec-flow/` 目录下生成 12 份文档：

| # | 文件 | 内容说明 |
|---|---|---|
| 00 | `00_overview.md` | 项目概览 —— 名称、描述、目标、利益相关者、当前阶段 |
| 01 | `01_product_spec.md` | 产品规格 —— 目标用户、价值主张、功能列表（含优先级）、范围定义 |
| 02 | `02_user_flows.md` | 用户流程 —— 分步角色行为、预期结果、边界情况 |
| 03 | `03_technical_constraints.md` | 技术约束 —— 类别、描述、理由、曾考虑的替代方案 |
| 04 | `04_data_model.md` | 数据模型 —— 实体、字段、类型、关联关系、是否可空 |
| 05 | `05_task_breakdown.md` | 任务拆解 —— 优先级排序的任务，含工时估算、依赖关系、验收标准 |
| 06 | `06_agent_instructions.md` | Agent 执行指令 —— 面向 AI 编程助手的关键/重要/建议级指令 |
| 07 | `07_open_questions.md` | 未决问题 —— 按类别分组的待解决问题，含建议答案和状态 |
| 08 | `08_decision_log.md` | 决策日志 —— 决策记录，含理由、备选方案、状态追踪 |
| 09 | `09_codebase_analysis.md` | 源码分析报告 —— `--project` 输入的分析结果：检测到的模式、结构、问题 |
| 10 | `10_tech_stack.md` | 技术栈文档 —— 分类的技术选型，含版本号、用途说明、备选方案 |
| 11 | `11_architecture.md` | 产品架构 —— 系统风格、组件拓扑、数据流、部署策略、关键架构决策 |

00-08 号文件在任何输入类型下均会生成。09-11 号文件在使用 `--project` 源码分析时填充。

---

## 工作原理

SpecFlow AI 执行五阶段编译流水线：

```
                        ┌────────────────┐
  音频 / 文本 / 聊天    │  1. 输入       │  解析与转写
  项目源码 ────────────►│                │  (ASR、文档解析、manifest 检测)
                        └───────┬────────┘
                                │ 转写文本
                        ┌───────▼────────┐
                        │  2. 抽取       │  DeepSeek V4 PRO 提取事实：
                        │                │  利益相关者、目标、需求、实体、
                        │                │  用户流程、决策、风险
                        └───────┬────────┘
                                │ 事实（按分段）
                        ┌───────▼────────┐
                        │  3. 聚合       │  DeepSeek V4 Flash 去重合并
                        │                │  所有分段的结果
                        └───────┬────────┘
                                │ 聚合结果
                        ┌───────▼────────┐
                        │  4. 检测       │  缺失信息检测器从 7 个维度
                        │                │  扫描信息盲点
                        └───────┬────────┘
                                │ 完整结果 + 缺口 + 问题
                        ┌───────▼────────┐
                        │  5. 编译       │  Handlebars 模板渲染
                        │                │  生成 12 份结构化 PCB 文档
                        └────────────────┘
```

**第一阶段 —— 输入：** 按文件类型路由。音频通过 DashScope ASR（qwen3-asr-flash）进行带说话人标注的转写。文本文档解析（PDF 提取、DOCX 解析、MD/TXT 直接读取）。聊天导出解析为结构化消息线程。项目目录扫描 manifest 文件和源码模式。

**第二阶段 —— 抽取：** 将转写文本切分为带重叠的分段。每个分段由 DeepSeek V4 PRO（temperature 0.1, max 8192 tokens）处理，提取结构化事实，附带置信度评分和来源引用。

**第三阶段 —— 聚合：** DeepSeek V4 Flash（temperature 0.1, max 8192 tokens）对所有分段的事实进行去重合并，生成统一的聚合结果。此处使用 Flash 模型以获得模板化任务的高吞吐速度。

**第四阶段 —— 检测：** DeepSeek V4 PRO（temperature 0.3, max 4096 tokens）从 7 个维度扫描聚合结果 —— 产品、技术、数据、流程、利益相关者、风险、决策 —— 识别信息盲点，生成带建议答案的未决问题。

**第五阶段 —— 编译：** 聚合结果通过 12 个 Handlebars 模板渲染为 Markdown 文件。增量编译层通过文件哈希对比避免重复处理未变更的输入。文件写入 `docs/spec-flow/` 目录。

Claude Code 插件通过 `SessionStart` hook 自动加载 PCB 上下文，并提供 slash 命令（`/specflow:compile`、`/specflow:status`、`/specflow:diff`）供会话内使用。

---

## 架构

SpecFlow AI 采用 pnpm monorepo 结构，包含两个包：

```
@specflow/core           核心引擎 —— 零外部运行时依赖
│                        （仅 SDK 包：commander, handlebars, js-yaml, zod, chokidar）
│
└─ @specflow/claude-code Claude Code 插件 —— slash 命令、hooks、CLAUDE.md 生成器
                         依赖 @specflow/core
```

### @specflow/core

引擎包。负责完整的编译流水线、LLM 抽象层、状态管理和 CLI。

- **`input/`** —— 文件路由与解析：音频（ASR 转写）、文本（PDF/MD/DOCX/TXT）、聊天（飞书/Slack/微信 JSON）、项目（manifest + 源码分析）
- **`agent/`** —— AI Agent：信息抽取器（DeepSeek V4 PRO）、缺失检测器、结果聚合器，以及 prompt 模板
- **`output/`** —— PCB 编译器、基于 Handlebars 的 Markdown 生成器、语义 Diff 引擎
- **`llm/`** —— 统一 LLM 抽象层，含 DeepSeek 和 DashScope 适配器
- **`state/`** —— 文件系统状态管理：bundle 存储、项目元数据、基于哈希的输入变更检测
- **`pipeline/`** —— 主编译编排器、增量编译、dry-run 成本估算
- **`utils/`** —— 文件哈希、文本分段、token 成本计算、终端输出格式化

### @specflow/claude-code

Claude Code 插件包。提供面向开发者的交互界面。

- **`commands/`** —— Slash 命令处理器：`/specflow:init`、`/specflow:compile`、`/specflow:status`、`/specflow:diff`
- **`hooks/`** —— `SessionStart` hook（自动加载 PCB 上下文）、`PostToolUse` hook（编译后动作）
- **`claude-md.ts`** —— 从 PCB 数据生成项目专属的 `CLAUDE.md`
- **`commands-md.ts`** —— 生成 `.claude/commands/*.md` 用于 Claude Code 命令注册

---

## 配置参考

`specflow.config.json` 文件支持的字段：

| 字段 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `deepseekApiKey` | 是 | -- | DeepSeek API 密钥，用于 LLM 抽取与推理 |
| `dashscopeApiKey` | 是（音频输入时） | -- | 阿里云 DashScope API 密钥，用于音频转写（qwen3-asr-flash） |
| `deepseekBaseUrl` | 否 | `https://api.deepseek.com/v1` | 自定义 DeepSeek 兼容 API 端点 |
| `monthlyBudgetCNY` | 否 | `100` | 月度费用上限（人民币），用于费用预警和 dry-run 估算 |

> 配置文件通过从当前工作目录沿目录树向上查找 `specflow.config.json` 来定位，最多向上查找 10 层。

### 模型选择策略

| 任务 | 模型 | Temperature | Max Tokens |
|---|---|---|---|
| 事实抽取 | deepseek-v4-pro | 0.1 | 8192 |
| 缺失检测 | deepseek-v4-pro | 0.3 | 4096 |
| 结果聚合 | deepseek-v4-flash | 0.1 | 8192 |
| 文档摘要 | deepseek-v4-flash | 0.1 | 4096 |
| 语音转文本 | qwen3-asr-flash | N/A | N/A |

两个 DeepSeek 模型均支持 1M token 上下文窗口和 384K 最大输出。Flash 用于高吞吐的模板化任务；Pro 用于需要推理质量的场景。

---

## 项目结构

```
specflow/
├── package.json                    # 工作区根配置（pnpm workspaces）
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml                  # lint -> test -> build
│
├── packages/
│   ├── core/                       # @specflow/core
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts            # 公共 API 导出
│   │   │   ├── types.ts            # 全部类型定义 + Zod 校验
│   │   │   ├── config.ts           # 配置加载器（向上查找）
│   │   │   ├── cli.ts              # CLI 入口（基于 commander）
│   │   │   ├── pipeline/           # 编译、增量、dry-run
│   │   │   ├── input/              # 音频、文本、聊天、项目解析器
│   │   │   ├── agent/              # 抽取器、缺失检测器、聚合器 + prompt
│   │   │   ├── output/             # PCB 编译器、Markdown 生成、diff 引擎 + 模板
│   │   │   ├── llm/                # DeepSeek + DashScope 适配器
│   │   │   ├── state/              # Bundle 存储、输入追踪、项目元数据
│   │   │   └── utils/              # 哈希、分段、成本、格式化
│   │   └── test/
│   │
│   └── claude-code/                # @specflow/claude-code
│       ├── package.json
│       ├── src/
│       │   ├── index.ts            # 插件入口
│       │   ├── commands/           # init, compile, status, diff 处理器
│       │   ├── hooks/              # SessionStart, PostCompile hooks
│       │   ├── claude-md.ts        # CLAUDE.md 生成器
│       │   └── commands-md.ts      # .claude/commands/*.md 生成器
│       └── test/
│
├── specs/                          # 测试 fixtures
│   └── fixtures/
│       ├── meeting.mp3
│       ├── notes.md
│       └── chat-export.txt
│
└── docs/
    └── spec-flow/                  # 编译输出的 PCB 文件目录
```

---

## 开发

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行所有测试
pnpm test

# 带覆盖率运行测试
pnpm test -- --coverage

# 类型检查
pnpm typecheck
```

### 按包单独操作

```bash
# 构建特定包
cd packages/core && pnpm build
cd packages/claude-code && pnpm build

# 运行特定包的测试
cd packages/core && pnpm test
```

### 参与贡献

完整的开发环境搭建、Pull Request 流程和提交规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 许可证

MIT

Copyright (c) 2025 SpecFlow AI Contributors
