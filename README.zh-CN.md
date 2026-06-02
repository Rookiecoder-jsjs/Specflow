# 🧠 SpecFlow AI

> English version: [README.md](./README.md)

[![npm version](https://img.shields.io/npm/v/@specflow/claude-code)](https://www.npmjs.com/package/@specflow/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-green.svg)](https://nodejs.org)

> **喂给 AI 一次，处处可用。**

**SpecFlow AI** 是一个 Claude Code 原生插件，也是 AI 时代的「项目上下文编译器」。它把散落在会议录音、产品文档、聊天记录和项目源码中的信息，编译成 AI 可直接执行的结构化上下文包（PCB），让 AI 助手从第一句对话就完全理解你的项目。

---

## 📸 30 秒看懂

```bash
npm i -g @specflow/claude-code              # 1️⃣ 全局安装
cd my-saas-app && specflow init             # 2️⃣ 项目中初始化
specflow compile \                          # 3️⃣ 一键编译
  --audio kickoff.m4a \
  --text prd.md \
  --project src/
specflow status                             # 4️⃣ 查看结果

# ✨ 输出：
#   Project: 我的 SaaS 应用 [discovery]
#   Version: v0.1.0
#   ● 00_overview.md  ● 01_product_spec.md  ... (共12份)
#   ✓ CLAUDE.md written to project root.
#   无未决问题。
```

---

## 🤔 解决的问题

每次打开 Claude Code，你都要花上十来分钟重新解释项目背景：用户是谁、有哪些约束、之前做过什么决策、数据模型长什么样……这些信息散落在会议录音、PRD 文档、聊天记录和源代码里。AI 看不到全貌，除非你一遍又一遍地手动输入。

**SpecFlow AI 做了一件事：** 把所有人类协作中产生的信息，编译成结构化、带版本、AI 可读的 Project Context Bundle（PCB）—— 12 份 Markdown 文件存放在 `docs/spec-flow/` 下。配套插件在每次会话启动时自动加载，从此 AI 开箱即懂你的项目。

```
🔊 会议录音 + 📄 产品文档 + 💬 聊天记录 + 💻 项目源码
              ↓
      [SpecFlow AI 语义编译层]
              ↓
   📦 AI 可执行上下文（PCB）
```

**为什么现在做？**

1. Claude Code、Codex、Cursor、Windsurf —— AI 编程助手已从「玩具」变为生产力工具
2. 独立开发者群体爆发，没有传统文档流程，但更依赖 AI
3. 大模型在结构化抽取与长文本理解上已具备生产级能力
4. AI Native 协作模式正在形成，这正是基础设施空白期

---

## 📦 安装

### 环境要求

| 依赖 | 说明 |
|---|---|
| Node.js >= 18 | 运行时环境 |
| DeepSeek API 密钥 | LLM 抽取与推理（deepseek-v4-pro / deepseek-v4-flash） |
| DashScope API 密钥 | 阿里云 DashScope 音频转写（qwen3-asr-flash） |
| ffmpeg（可选） | 非标准格式音频预处理 |

### 一行安装

```bash
npm i -g @specflow/claude-code
```

全局安装 `specflow` CLI，并自动注册 Claude Code 的 slash 命令和 hooks。

### 🔑 API 配置

在项目根目录创建 `specflow.config.json`：

```json
{
  "deepseekApiKey": "sk-...",
  "dashscopeApiKey": "sk-...",
  "deepseekBaseUrl": "https://api.deepseek.com/v1",
  "monthlyBudgetCNY": 100
}
```

⚠️ **立刻加入 .gitignore —— 此文件含密钥：**

```bash
echo "specflow.config.json" >> .gitignore
```

配置文件支持沿目录树向上查找（最多 10 层），可放在跨项目共享的上级目录。

---

## 🚀 快速上手

### 第一步：安装

```bash
npm i -g @specflow/claude-code
```

### 第二步：配置

创建 `specflow.config.json` 填入 API 密钥，确认已在 `.gitignore` 中。

### 第三步：初始化

```bash
cd your-project
specflow init --name "我的项目"
```

创建 `.specflow/`（状态目录）和 `docs/spec-flow/`（输出目录）。

### 第四步：编译 —— 万物皆可喂

```bash
# 🎙️ 从会议录音
specflow compile --audio meeting.m4a

# 📝 从产品文档
specflow compile --text prd.md --text architecture.pdf

# 💬 从聊天导出
specflow compile --chat feishu-export.json

# 💻 从已有源码
specflow compile --project src/

# ⚡ 全家桶
specflow compile --audio kickoff.m4a --text notes.md --project ./
```

### 第五步：查看状态

```bash
specflow status
```

---

## 📋 命令全家桶

### `specflow init`

在当前目录初始化 SpecFlow。

```
specflow init [--name <名称>]
```

| 选项 | 说明 |
|---|---|
| `--name <name>` | 项目名称（默认取目录名） |

### `specflow compile` ✨ 核心命令

将输入编译为带版本的 PCB。

```
specflow compile --audio <路径> --text <路径> --chat <路径> --project <路径>
                 [--dry-run] [--force] [--version <版本号>]
```

| 选项 | 说明 |
|---|---|
| `--audio <路径>` | 音频（m4a / mp3 / wav / aac / flac / ogg / webm） |
| `--text <路径>` | 文本或文档（md / txt / pdf / docx） |
| `--chat <路径>` | 聊天导出（飞书 / Slack / 微信 JSON） |
| `--project <路径>` | 源码目录（自动识别语言/框架/架构） |
| `--dry-run` | 💰 仅估算 token 费用，不调 API |
| `--force` | 🔄 忽略缓存，全量重编译 |
| `--version <v>` | 🏷️ 自定义版本号 |

编译成功自动生成 `CLAUDE.md` 到项目根目录。

### `specflow status`

查看项目状态和 PCB 文件清单。

```
specflow status [--json]
```

### `specflow check` 🔍 新鲜度检测

检测 PCB 是否过期 —— 输入文件变更后及时发现上下文漂移。

```
specflow check [--json]
```

实现 Harness Engineering「熵管理」原则：在 AI 智能体因过期上下文犯错之前，先发现它。

### `specflow diff`

查看两个版本之间的语义差异。

```
specflow diff [--from <v1>] [--to <v2>]
```

---

## 📥 四种输入，一张表

| 类型 | 命令 | 支持格式 |
|---|---|---|
| 🎙️ 音频 | `--audio` | m4a / mp3 / wav / aac / flac / ogg / webm |
| 📝 文本 | `--text` | md / txt / pdf / docx |
| 💬 聊天 | `--chat` | 飞书 / Slack / 微信 JSON 导出 |
| 💻 源码 | `--project` | 自动识别 package.json / go.mod / Cargo.toml 等 |

---

## 📦 PCB 输出文件（12 份）

| # | 文件 | 内容 |
|---|---|---|
| 00 | `00_overview.md` | 🏠 项目概览：目标、干系人、当前阶段 |
| 01 | `01_product_spec.md` | 📋 产品规格：用户画像、功能列表、范围定义 |
| 02 | `02_user_flows.md` | 🔀 用户流程：角色行为、预期结果、边界情况 |
| 03 | `03_technical_constraints.md` | 🚧 技术约束：约束分类、理由、备选方案 |
| 04 | `04_data_model.md` | 🗃️ 数据模型：实体、字段、关系、可空性 |
| 05 | `05_task_breakdown.md` | ✅ 任务拆解：优先级、工时、依赖、验收标准 |
| 06 | `06_agent_instructions.md` | 🤖 AI 执行指令：Critical / Important / Advisory |
| 07 | `07_open_questions.md` | ❓ 未决问题：按分类、建议答案、状态 |
| 08 | `08_decision_log.md` | 📝 决策日志：决策、理由、备选方案、状态 |
| 09 | `09_codebase_analysis.md` | 🔬 源码分析：检测到的模式、结构、问题 |
| 10 | `10_tech_stack.md` | 🛠️ 技术栈：技术选型、版本、用途、备选 |
| 11 | `11_architecture.md` | 🏗️ 产品架构：组件、数据流、部署、关键决策 |

> 00-08 由任意输入生成；09-11 需要 `--project` 源码分析。

---

## ⚙️ 工作原理：五阶段编译流水线

```
                       ┌──────────────┐
 🔊📝💬💻               │ ① INPUT      │ 解析 + 转写
 多种输入 ────────────►│              │ ASR / 文档 / 源码扫描
                       └──────┬───────┘
                              │ transcript
                       ┌──────▼───────┐
                       │ ② EXTRACT    │ DeepSeek V4 PRO
                       │              │ 提取结构化事实
                       └──────┬───────┘
                              │ facts
                       ┌──────▼───────┐
                       │ ③ AGGREGATE  │ DeepSeek V4 Flash
                       │              │ 去重合并
                       └──────┬───────┘
                              │ aggregated
                       ┌──────▼───────┐
                       │ ④ DETECT     │ 7 维信息缺口扫描
                       │              │ 生成待解决问题
                       └──────┬───────┘
                              │ bundle + gaps
                       ┌──────▼───────┐
                       │ ⑤ COMPILE    │ 12 份 PCB Markdown
                       │              │ + CLAUDE.md 入口
                       └──────────────┘
```

---

## 🏗️ 项目架构

pnpm monorepo，两个包：

```
@specflow/core          核心引擎 —— 零外部运行时依赖
@specflow/claude-code   Claude Code 插件 —— slash 命令、hooks、CLAUDE.md 生成
```

### @specflow/core

| 模块 | 职责 |
|---|---|
| `input/` | 音频 ASR / PDF DOCX TXT 解析 / 飞书 Slack 微信 / 源码 manifest 扫描 |
| `agent/` | 事实抽取器 + 缺口检测器 + 结果聚合器 + prompt 模板 |
| `output/` | PCB 编译器 / Markdown 生成 / 语义 Diff / CLAUDE.md 生成 |
| `llm/` | DeepSeek + DashScope 适配器 |
| `state/` | Bundle 存储 / 项目元数据 / 基于 hash 的输入变更追踪 |
| `pipeline/` | 全量编译 / 增量编译 / dry-run 估算 / 漂移检测 |
| `utils/` | 文件 hash / 文本分段 / token 费用 / 终端格式化 |

### @specflow/claude-code

| 模块 | 职责 |
|---|---|
| `commands/` | `/specflow:init` `/specflow:compile` `/specflow:status` `/specflow:check` `/specflow:diff` |
| `hooks/` | `SessionStart`（上下文过期提醒 + 未决问题检测）/ `PostCompile`（CLAUDE.md 更新） |
| `claude-md.ts` | 从 PCB 数据生成 ~60 行渐进式披露入口文件 |

---

## ⚙️ 配置参考

| 字段 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `deepseekApiKey` | ✅ | — | DeepSeek API 密钥 |
| `dashscopeApiKey` | ✅（音频） | — | 阿里云 DashScope API 密钥 |
| `deepseekBaseUrl` | ❌ | `https://api.deepseek.com/v1` | 自定义 API 端点 |
| `monthlyBudgetCNY` | ❌ | `100` | 月度费用上限（¥） |

### 🎯 模型策略

| 任务 | 模型 | Temperature | Max Tokens |
|---|---|---|---|
| 事实抽取 | deepseek-v4-pro | 0.1 | 8192 |
| 缺口检测 | deepseek-v4-pro | 0.3 | 4096 |
| 结果聚合 | deepseek-v4-flash | 0.1 | 8192 |
| 文档摘要 | deepseek-v4-flash | 0.1 | 4096 |
| 语音转写 | qwen3-asr-flash | N/A | N/A |

两模型均支持 1M token 上下文窗口和 384K 最大输出。Flash 干快活，Pro 干细活。

---

## 🔧 开发

```bash
pnpm install          # 装依赖
pnpm build            # 构建全部
pnpm test             # 跑测试
pnpm test -- --coverage  # 覆盖率
pnpm typecheck        # 类型检查
```

---

## 📄 许可证

MIT · Copyright (c) 2025 SpecFlow AI Contributors
