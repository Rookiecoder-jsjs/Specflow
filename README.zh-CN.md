# SpecFlow AI

AI 驱动的项目上下文编译器 —— Claude Code 原生插件。

将会议录音、PRD 和聊天讨论直接转化为 AI 可执行的项目上下文包（PCB），无缝集成在 Claude Code 中。

## 快速开始

```bash
# 全局安装
npm i -g @specflow/claude-code

# 在项目中初始化
cd your-project
specflow init --name "My Project"

# 编译会议录音
specflow compile --audio meeting.m4a

# 编译文本文档
specflow compile --text prd.md --text notes.md

# 分析已有项目源码
specflow compile --project src/

# 查看项目状态
specflow status

# 查看版本差异
specflow diff --from v1.0.0 --to v1.0.1
```

## 工作原理

1. **输入**: 音频录音（DashScope ASR 转写）、文档（PDF/MD/DOCX）、聊天导出（飞书/Slack/微信）、项目源码
2. **抽取**: DeepSeek V4 PRO 提取事实、决策、需求、实体、技术栈与架构信息
3. **检测**: 缺失信息检测器从 7 个维度识别信息盲点
4. **编译**: 输出引擎生成 12 份结构化 PCB Markdown 文档
5. **同步**: Claude Code 插件在会话启动时自动加载上下文

## 架构

```
@specflow/core        — 核心引擎（输入管道、上下文 agent、输出引擎）
@specflow/claude-code — Claude Code 插件（slash 命令、hooks、CLAUDE.md 生成器）
```

## 环境要求

- Node.js >= 18
- DeepSeek API key
- DashScope API key（音频转写需要）
- ffmpeg（可选，用于音频预处理）

## 配置

在项目根目录创建 `specflow.config.json` 文件：

```json
{
  "deepseekApiKey": "sk-your-deepseek-key",
  "dashscopeApiKey": "sk-your-dashscope-key",
  "deepseekBaseUrl": "https://api.deepseek.com/v1",
  "monthlyBudgetCNY": 100
}
```

然后将其加入 `.gitignore`：

```bash
echo "specflow.config.json" >> .gitignore
```

| 字段 | 必需 | 默认值 | 说明 |
|-------|----------|---------|-------------|
| `deepseekApiKey` | 是 | — | DeepSeek API 密钥 |
| `dashscopeApiKey` | 是（音频输入） | — | 阿里云 DashScope API 密钥 |
| `deepseekBaseUrl` | 否 | `https://api.deepseek.com/v1` | DeepSeek API 基础 URL |
| `monthlyBudgetCNY` | 否 | `100` | 月度费用上限（人民币） |

## PCB 输出文件

编译后 `docs/spec-flow/` 目录下生成 12 份文档：

| 文件 | 内容 |
|------|------|
| `00_overview.md` | 项目概览 |
| `01_product_spec.md` | 产品规格说明 |
| `02_user_flows.md` | 用户流程 |
| `03_technical_constraints.md` | 技术约束 |
| `04_data_model.md` | 数据模型 |
| `05_task_breakdown.md` | 任务拆解 |
| `06_agent_instructions.md` | Agent 执行指令 |
| `07_open_questions.md` | 未决问题 |
| `08_decision_log.md` | 决策日志 |
| `09_codebase_analysis.md` | 源码分析报告 |
| `10_tech_stack.md` | 技术栈文档 |
| `11_architecture.md` | 产品架构文档 |

## 输入类型

| 类型 | 命令参数 | 说明 |
|------|----------|------|
| 音频 | `--audio <path>` | m4a/mp3/wav/aac/flac/ogg/webm |
| 文本 | `--text <path>` | md/txt/pdf/docx |
| 聊天 | `--chat <path>` | JSON 格式聊天导出 |
| 项目 | `--project <path>` | 源码目录，自动分析技术栈/架构/特性/数据模型 |

## 开发

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## 许可证

MIT
