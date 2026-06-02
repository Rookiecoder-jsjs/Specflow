# SpecFlow AI — 技术规格文档

> 基于 PRD v3.0，本文档定义 V1.0 的完整技术实现规格。

**版本**：v1.0
**关联文档**：`PRD.md`
**目标**：定义所有模块的接口、数据结构、流程与验收标准，作为开发的唯一事实来源。

---

## 一、项目结构

### 1.1 Monorepo 布局

```
specflow/
├── package.json                    # workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml                  # lint → test → build
│
├── packages/
│   ├── core/                       # @specflow/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts            # 公共 API 导出
│   │   │   ├── types.ts            # 全部类型定义
│   │   │   ├── config.ts           # 配置读取（env / .specflow/config.json）
│   │   │   ├── pipeline/
│   │   │   │   ├── compile.ts      # 主编译流水线
│   │   │   │   ├── incremental.ts  # 增量编译
│   │   │   │   └── dry-run.ts      # 预估成本
│   │   │   ├── input/
│   │   │   │   ├── router.ts       # 根据文件类型路由到解析器
│   │   │   │   ├── audio.ts        # 音频 ASR（DashScope qwen3-asr-flash）
│   │   │   │   ├── text.ts         # 文本/文档解析（PDF/MD/DOCX/TXT）
│   │   │   │   ├── chat.ts         # 聊天记录解析（飞书/Slack/微信导出）
│   │   │   │   └── project.ts      # 项目源码分析（技术栈/架构/特性/数据模型）
│   │   │   ├── agent/
│   │   │   │   ├── extractor.ts    # 信息抽取（DeepSeek V4 PRO）
│   │   │   │   ├── gap-detector.ts # 缺失信息检测
│   │   │   │   ├── aggregator.ts   # 多段结果聚合
│   │   │   │   └── prompts/        # Prompt 模板目录
│   │   │   │       ├── extract.txt
│   │   │   │       ├── gap-detect.txt
│   │   │   │       ├── aggregate.txt
│   │   │   │       └── project-analyze.txt
│   │   │   ├── output/
│   │   │   │   ├── pcb-compiler.ts # PCB 编译器
│   │   │   │   ├── markdown.ts     # Markdown 生成器（Handlebars 模板）
│   │   │   │   ├── diff.ts         # 语义 Diff 引擎
│   │   │   │   └── templates/      # Handlebars 模板
│   │   │   │       ├── overview.md.hbs
│   │   │   │       ├── product-spec.md.hbs
│   │   │   │       ├── user-flows.md.hbs
│   │   │   │       ├── tech-constraints.md.hbs
│   │   │   │       ├── data-model.md.hbs
│   │   │   │       ├── task-breakdown.md.hbs
│   │   │   │       ├── agent-instructions.md.hbs
│   │   │   │       ├── open-questions.md.hbs
│   │   │   │       ├── decision-log.md.hbs
│   │   │   │       ├── codebase-analysis.md.hbs
│   │   │   │       ├── tech-stack.md.hbs
│   │   │   │       └── architecture.md.hbs
│   │   │   ├── llm/
│   │   │   │   ├── client.ts       # 统一 LLM 抽象层
│   │   │   │   ├── deepseek.ts     # DeepSeek adapter（V4 PRO / V4 flash）
│   │   │   │   └── dashscope.ts    # DashScope adapter（ASR + embedding）
│   │   │   ├── state/
│   │   │   │   ├── store.ts        # 文件系统状态读写
│   │   │   │   ├── bundle.ts       # Bundle 管理
│   │   │   │   └── input-tracker.ts # 输入去重与变更检测
│   │   │   └── utils/
│   │   │       ├── hash.ts         # 文件 hash
│   │   │       ├── segment.ts      # 文本分段
│   │   │       ├── cost.ts         # Token 成本计算
│   │   │       └── format.ts       # 终端输出格式化
│   │   └── test/
│   │       ├── pipeline/
│   │       ├── input/
│   │       ├── agent/
│   │       └── output/
│   │
│   └── claude-code/                # @specflow/claude-code
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts            # 入口
│       │   ├── commands/
│       │   │   ├── init.ts         # /specflow:init 处理
│       │   │   ├── compile.ts      # /specflow:compile 处理
│       │   │   ├── status.ts       # /specflow:status 处理
│       │   │   └── diff.ts         # /specflow:diff 处理
│       │   ├── hooks/
│       │   │   ├── session-start.ts # SessionStart hook
│       │   │   └── post-compile.ts  # PostToolUse hook
│       │   ├── claude-md.ts        # CLAUDE.md 生成器
│       │   └── commands-md.ts      # .claude/commands/*.md 生成
│       └── test/
│
├── specs/                          # 测试 fixture
│   └── fixtures/
│       ├── meeting.mp3
│       ├── notes.md
│       └── chat-export.txt
│
└── docs/
    └── spec-flow/                  # PCB 文档模板
```

### 1.2 包依赖关系

```
@specflow/core      ← 零外部运行时依赖（仅 SDK + Handlebars + js-yaml + zod + chokidar）
@specflow/claude-code  ← depends on @specflow/core
```

---

## 二、LLM 抽象层规格

### 2.1 统一接口

```typescript
// packages/core/src/llm/client.ts

interface LLMClient {
  readonly modelId: string;
  readonly maxTokens: number;

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
  countTokens(messages: ChatMessage[]): Promise<number>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  timeout?: number;
}

interface ChatResponse {
  content: string;
  usage: TokenUsage;
  model: string;
}

interface ChatChunk {
  delta: string;
  finishReason?: 'stop' | 'length';
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### 2.2 模型路由表

| 任务 | 模型 | temperature | maxTokens | 说明 |
|------|------|-------------|-----------|------|
| 信息抽取 | deepseek-v4-pro | 0.1 | 8192 | 需要高准确率结构化输出 |
| 缺失检测 | deepseek-v4-pro | 0.3 | 4096 | 需要推理能力 |
| 结果聚合 | deepseek-v4-flash | 0.1 | 8192 | 模板化任务，速度快 |
| 文档摘要 | deepseek-v4-flash | 0.1 | 4096 | 轻量任务 |
| 语音转文本 | qwen3-asr-flash | N/A | N/A | DashScope API |

### 2.2.1 模型能力参数

| 参数 | deepseek-v4-flash | deepseek-v4-pro |
|------|-------------------|-----------------|
| 上下文长度 | 1M (1,000,000 tokens) | 1M (1,000,000 tokens) |
| 最大输出长度 | 384K | 384K |
| 思考模式 | 支持（默认）+ 非思考模式 | 支持 + 非思考模式 |
| JSON Output | 支持 | 支持 |
| Tool Calls | 支持 | 支持 |
| FIM 补全 (Beta) | 仅非思考模式 | 仅非思考模式 |
| 并发限额 | 2,000 | 500 |

> **思考模式说明**：deepseek-v4-flash 默认开启思考模式（对应旧模型名 `deepseek-reasoner`），非思考模式对应旧 `deepseek-chat`。两个旧模型名将于 2026/07/24 弃用。本项目统一使用新模型名，通过 API 参数控制思考开关。

### 2.2.2 定价明细（人民币 / 百万 tokens）

| 费用项 | deepseek-v4-flash | deepseek-v4-pro |
|--------|-------------------|-----------------|
| 输入（缓存命中） | ¥0.02 | ¥0.025 |
| 输入（缓存未命中） | ¥1.00 | ¥3.00 |
| 输出 | ¥2.00 | ¥6.00 |

**成本估算示例**（60 分钟会议，转写后约 1.5 万字 ≈ 30K tokens）：

| 阶段 | 模型 | 估算 tokens (in/out) | 估算费用 |
|------|------|---------------------|----------|
| ASR 转写 | qwen3-asr-flash | 按音频时长计费 | ~¥0.00022/秒 |
| 信息抽取（10 段） | deepseek-v4-pro | ~50K in / ~20K out | ~¥0.27 |
| 缺失检测 | deepseek-v4-pro | ~20K in / ~5K out | ~¥0.09 |
| 结果聚合 | deepseek-v4-flash | ~30K in / ~15K out | ~¥0.06 |
| **单次全量编译合计** | | | **≈ ¥0.92** |

> 60 分钟会议全量编译约 1 元人民币。月度预算 100 元约可支撑 100 次编译。

### 2.3 DeepSeek Adapter

```typescript
// packages/core/src/llm/deepseek.ts

class DeepSeekClient implements LLMClient {
  constructor(config: {
    apiKey: string;
    model: 'deepseek-v4-pro' | 'deepseek-v4-flash';
    baseUrl?: string;    // 默认 https://api.deepseek.com/v1 (OpenAI 兼容)
    thinking?: boolean;  // 默认 true（思考模式）；false = 非思考模式
  });

  // 使用 OpenAI 兼容 SDK 调用
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
  async countTokens(messages: ChatMessage[]): Promise<number>;
}
```

**API 格式**：
- OpenAI 兼容格式：BASE URL = `https://api.deepseek.com/v1`（默认）
- Anthropic 兼容格式：BASE URL = `https://api.deepseek.com/anthropic`（备选，本项目不直接使用）

**思考模式控制**：
- `deepseek-v4-flash`：默认开启思考模式；通过 `thinking: false` 切换为非思考模式
- `deepseek-v4-pro`：支持思考模式，通过 `thinking` 参数控制
- 信息抽取 / 缺失检测任务使用非思考模式（`thinking: false`）以降低延迟和输出 token 消耗

### 2.4 DashScope Adapter

```typescript
// packages/core/src/llm/dashscope.ts

class DashScopeClient {
  constructor(config: {
    apiKey: string;
  });

  // ASR：音频 → 文本（调用 MultiModalConversation API，model: qwen3-asr-flash）
  async transcribe(audioUrl: string): Promise<TranscriptionResult>;

  // Embedding：文本 → 向量（用于语义分段，model: text-embedding-v3）
  async embedding(texts: string[]): Promise<number[][]>;

  // 文本生成（qwen3-flash，轻量任务备选）
  async chat(messages: ChatMessage[]): Promise<ChatResponse>;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  duration: number;  // 秒
}

interface TranscriptionSegment {
  start: number;     // 秒
  end: number;
  text: string;
  speaker?: string;  // 说话人识别（若 API 支持）
}
```

**ASR 调用要点**（对齐 Python SDK `dashscope.MultiModalConversation.call`）：
- 模型：`qwen3-asr-flash`
- API：`MultiModalConversation`（非 Chat Completion）
- 输入格式：`messages[].content[]` 含 `{"audio": "<url>"}` 或 `{"audio": "<base64>"}`
- 支持参数：`enable_lid`（语种自动检测，默认 true）、`enable_itn`（逆文本正则化，默认 false）
- **注意**：API 接受音频 URL 或 Base64，本地文件需先上传至 OSS 或转 Base64 后传入
  - Python SDK 内置 OSS 上传能力，TypeScript 需自行实现或使用 Base64 模式
  - Base64 模式限制：音频文件 < 10MB

---

## 三、输入管道规格

### 3.1 输入路由器

```typescript
// packages/core/src/input/router.ts

type InputType = 'audio' | 'text' | 'chat' | 'project';

interface InputFile {
  path: string;           // 绝对路径
  type: InputType;
  mime: string;
  hash: string;           // SHA-256
  size: number;           // bytes
}

interface ParsedInput {
  source: InputFile;
  transcript: string;     // 统一转为纯文本
  metadata: Record<string, unknown>;
}

async function routeInput(files: string[]): Promise<ParsedInput[]>;
```

### 3.2 音频处理流程

```
audio file (.m4a/.mp3/.wav/.aac)
  → ffmpeg 预处理（转码为 16kHz mono，控制文件大小 < 10MB）
  → 编码为 Base64（小文件）或上传 OSS 获取 URL
  → DashScope MultiModalConversation API (qwen3-asr-flash)
  → TranscriptionResult
  → 按语义边界分段（基于 embedding 相似度变化）
  → ParsedInput[]
```

Spec：
- 支持格式：m4a, mp3, wav, aac, flac, ogg, webm
- 最大时长：180 分钟（分段处理）
- 预处理：使用 `fluent-ffmpeg`（系统需安装 ffmpeg），重采样 16kHz mono
- **传输方式**：
  - 文件 ≤ 10MB：Base64 编码直接传（免 OSS 依赖）
  - 文件 > 10MB：需先上传至阿里云 OSS 获取 URL（V1 暂不支持超大文件直传，提示用户手动提供 URL 或压缩音频）
- 分段策略：计算相邻段落 cosine similarity，低于阈值（0.65）则切分

### 3.3 文本处理流程

```
document (.md/.pdf/.docx/.txt)
  → 格式检测（扩展名 + magic bytes）
  → 解析器
  → 纯文本
  → 按标题/空行/语义分段
  → ParsedInput[]
```

Spec：
- PDF：使用 `pdf-parse`，提取文本（不处理扫描件图片）
- DOCX：使用 `mammoth`，提取文本
- MD/TXT：直接读取，按 `##` 标题分段
- 最大单段长度：4000 字符

### 3.4 聊天记录处理流程

```
export file (.txt/.json)
  → 格式检测（飞书 / Slack / 微信 / 通用时间戳格式）
  → 解析器
  → 统一格式："[时间] [说话人]: 内容"
  → 按时间窗口分段（30 分钟窗口，重叠 5 分钟）
  → ParsedInput[]
```

### 3.5 项目源码分析

```
project directory
  → 递归扫描目录（跳过 node_modules/.git/.venv/dist 等）
  → 检测技术栈（package.json/pyproject.toml/go.mod 等 manifest 文件）
  → 按模块目录分组，提取导出、行数统计
  → 检测数据模型目录（models/entities/schema/migrations/prisma）
  → 检测 API 路由（routes/controllers/endpoints/api/routers）
  → 检测配置文件（.env.example/config.*/Dockerfile/Makefile）
  → 生成结构化 markdown transcript
  → ParsedInput[]
```

---

## 四、上下文 Agent 规格

### 4.1 信息抽取

```typescript
// packages/core/src/agent/extractor.ts

interface ExtractionResult {
  segmentIndex: number;
  facts: Fact[];
  confidence: number;
  sourceRefs: SourceRef[];  // 原始文本片段引用
}

interface Fact {
  type: FactType;
  content: string;
  confidence: number;
  evidence: string;         // 支撑该事实的原始文本
  category: FactCategory;
}

type FactType =
  | 'stakeholder'        // 干系人
  | 'goal'               // 目标
  | 'requirement'        // 需求
  | 'constraint'         // 约束
  | 'assumption'         // 假设
  | 'decision'           // 决策
  | 'risk'               // 风险
  | 'task'               // 任务
  | 'entity'             // 数据实体
  | 'user_flow'          // 用户流程
  | 'technical_choice'   // 技术选型
  | 'open_question';     // 未决问题

type FactCategory =
  | 'product'            // 产品
  | 'technical'          // 技术
  | 'data'               // 数据
  | 'process'            // 流程
  | 'decision';          // 决策

interface SourceRef {
  sourcePath: string;
  segmentIndex: number;
  excerpt: string;       // 原始文本摘录（≤200 字符）
}
```

**DeepSeek V4 PRO Prompt 要点**：
- System: "你是一个项目上下文抽取专家。从对话/文档中抽取事实，按类型分类。不确定的内容标注低置信度。禁止编造。输出严格 JSON。"
- 输出格式：JSON Mode，schema 由 zod 定义
- 每段最多抽取 30 个 facts

### 4.2 缺失信息检测

```typescript
// packages/core/src/agent/gap-detector.ts

interface GapDetectionResult {
  categories: GapCategory[];
  questions: OpenQuestion[];
  coverageScore: number;  // 0-100，信息完整度
}

interface GapCategory {
  name: string;
  score: number;          // 0-100，该类别覆盖度
  missingItems: string[]; // 缺失项描述
}

interface OpenQuestion {
  id: string;
  category: GapCategory['name'];
  question: string;
  context: string;        // 为什么这很重要
  suggestedAnswers?: string[]; // AI 推测的答案（标注低置信度）
  status: 'open' | 'resolved';
  resolution?: string;
}
```

**检测维度与规则**：

| 维度 | 检测逻辑 |
|------|----------|
| 产品/用户 | 是否提到了目标用户？价值主张是否明确？ |
| 产品/功能 | 是否定义了功能列表？优先级是否标注？ |
| 技术/选型 | 是否提到语言/框架/数据库/部署？ |
| 技术/认证 | 是否定义了认证方式？（若无 user system 可跳过） |
| 数据/模型 | 是否定义了核心实体和关系？ |
| 流程/异常 | 是否讨论了异常路径和错误处理？ |
| 决策/共识 | 是否存在多个方案未做选择？ |

### 4.3 多段聚合

```typescript
// packages/core/src/agent/aggregator.ts

async function aggregate(extractions: ExtractionResult[]): Promise<AggregatedBundle>;

interface AggregatedBundle {
  overview: ProjectOverview;
  productSpec: ProductSpec;
  userFlows: UserFlow[];
  technicalConstraints: TechnicalConstraint[];
  dataModel: DataModel;
  tasks: Task[];
  agentInstructions: AgentInstruction[];
  openQuestions: OpenQuestion[];
  techStack: TechStackItem[];
  architecture: Architecture | null;
  decisions: Decision[];
  metadata: BundleMetadata;
}

interface TechStackItem {
  category: string;
  name: string;
  version?: string;
  purpose: string;
  alternatives?: string[];
}

interface Architecture {
  style: string;
  description: string;
  components: ArchitectureComponent[];
  dataFlow: { from: string; to: string; what: string }[];
  deployment: { platform: string; strategy: string; details: string };
  keyDecisions: { topic: string; decision: string; rationale: string }[];
}

interface ArchitectureComponent {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'storage' | 'external' | 'pipeline';
  description: string;
  technologies: string[];
  dependsOn: string[];
}
```

聚合策略：
1. 同名实体合并（如两个段落都定义了"User"实体 → 合并字段）
2. 冲突检测（同一字段出现不同值时标注为冲突，降低置信度）
3. 去重（文本相似度 > 0.9 的事实合并为一个）

---

## 五、输出引擎规格

### 5.1 PCB 编译器

```typescript
// packages/core/src/output/pcb-compiler.ts

interface CompileOptions {
  projectRoot: string;
  inputs: string[];
  outputDir?: string;          // 默认 docs/spec-flow/
  version?: string;            // 默认自动递增
  dryRun?: boolean;
  incremental?: boolean;
}

interface CompileResult {
  version: string;
  files: GeneratedFile[];
  openQuestions: OpenQuestion[];
  stats: CompileStats;
  cost: CostBreakdown;
}

interface GeneratedFile {
  path: string;
  content: string;
  changed: boolean;            // 增量模式下是否为新增/变更
}

interface CompileStats {
  inputCount: number;
  totalTranscriptLength: number;
  segmentCount: number;
  extractedFactCount: number;
  compilationDurationMs: number;
}

interface CostBreakdown {
  modelCalls: ModelCallCost[];
  totalTokens: number;
  estimatedCostCNY: number;    // 人民币
}

interface ModelCallCost {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costCNY: number;
}
```

### 5.2 PCB 文件模板

生成 12 个 Markdown 文件，通过 Handlebars 模板渲染：

```
docs/spec-flow/
├── 00_overview.md               ← ProjectOverview
├── 01_product_spec.md           ← ProductSpec
├── 02_user_flows.md             ← UserFlow[]
├── 03_technical_constraints.md  ← TechnicalConstraint[]
├── 04_data_model.md             ← DataModel
├── 05_task_breakdown.md         ← Task[]
├── 06_agent_instructions.md     ← AgentInstruction[]
├── 07_open_questions.md         ← OpenQuestion[]
├── 08_decision_log.md           ← Decision[]
├── 09_codebase_analysis.md      ← 源码分析（技术栈/架构/特性/数据模型）
├── 10_tech_stack.md              ← 技术栈文档（分类/版本/用途/备选）
└── 11_architecture.md            ← 产品架构文档（组件/数据流/部署/架构决策）
```

### 5.3 语义 Diff 引擎

```typescript
// packages/core/src/output/diff.ts

interface DiffResult {
  version: { from: string; to: string };
  added: DiffItem[];
  modified: DiffItem[];
  removed: DiffItem[];
  unchanged: number;
  summary: string;
}

interface DiffItem {
  file: string;
  section: string;
  changeType: 'added' | 'modified' | 'removed';
  oldValue?: string;
  newValue?: string;
  confidence: number;
}
```

Diff 算法：
1. 加载新旧 `bundle.json`
2. 按文件 → 按 section 逐一比较
3. 文本相似度 > 0.95 → unchanged
4. 文本相似度 0.5-0.95 → modified
5. 新增/删除直接标记
6. 不依赖 git diff，基于结构化数据比较

---

## 六、状态存储规格

### 6.1 目录结构

```
<project-root>/
├── .specflow/                       ← 状态目录（提交到 Git）
│   ├── config.json                  ← SpecFlowConfig
│   ├── project.json                 ← ProjectMeta
│   ├── inputs/                      ← 输入文件 hash 记录
│   │   └── <hash>.json
│   └── versions/
│       └── v1.0.0/
│           ├── bundle.json          ← Bundle（结构化 PCB 数据）
│           └── diff.json            ← DiffResult
│
├── docs/spec-flow/                  ← PCB 输出（提交到 Git）
│   ├── 00_overview.md
│   ├── 01_product_spec.md
│   ├── 02_user_flows.md
│   ├── 03_technical_constraints.md
│   ├── 04_data_model.md
│   ├── 05_task_breakdown.md
│   ├── 06_agent_instructions.md
│   ├── 07_open_questions.md
│   ├── 08_decision_log.md
│   ├── 09_codebase_analysis.md
│   ├── 10_tech_stack.md
│   └── 11_architecture.md
│
├── CLAUDE.md                        ← 生成
├── .cursorrules                     ← 生成（P1）
└── CODEX.md                         ← 生成（P1）
```

### 6.2 config.json Schema

```typescript
interface SpecFlowConfig {
  version: string;               // SpecFlow 版本，如 "1.0.0"
  projectName: string;
  activePlugins: string[];       // 如 ["claude-code"]
  llm: {
    deepseekModel: 'deepseek-v4-pro' | 'deepseek-v4-flash';
    deepseekBaseUrl: string;     // 默认 "https://api.deepseek.com/v1"
    asrModel: 'qwen3-asr-flash';
  };
  budget: {
    monthlyLimitCNY: number;     // 默认 100
    warnThresholdCNY: number;    // 默认 50
  };
  compile: {
    segmentMaxLength: number;    // 默认 4000
    segmentOverlap: number;      // 默认 200
    autoUpdateClaudeMd: boolean; // 默认 true
  };
}
```

### 6.3 project.json Schema

```typescript
interface ProjectMeta {
  id: string;                    // UUID v4
  name: string;
  stage: 'discovery' | 'planning' | 'development' | 'maintenance';
  activePlugins: string[];
  createdAt: string;             // ISO 8601，如 "2026-06-02T10:30:00Z"
  updatedAt: string;
  currentVersion: string;        // 如 "v1.0.0"
}
```

### 6.4 bundle.json Schema

```typescript
interface Bundle {
  version: string;
  sourceInputs: string[];        // 输入文件 hash 列表
  createdAt: string;             // ISO 8601
  metadata: BundleMetadata;
  data: AggregatedBundle;        // 完整的结构化数据
}

interface BundleMetadata {
  totalFacts: number;
  avgConfidence: number;
  openQuestionCount: number;
  modelCalls: ModelCallCost[];
  durationMs: number;
  compiledBy: string;            // 如 "SpecFlow AI v1.0.0"
}
```

---

## 七、Claude Code 插件规格

### 7.1 Slash Commands

#### `/specflow:init`

```
输入：无参数（可选 --name "MyProject"）
处理：
  1. 检测 .specflow/project.json 是否存在
  2. 若否 → 创建 .specflow/ 目录结构 + 初始配置
  3. 注册 .claude/commands/specflow-*.md
  4. 创建 docs/spec-flow/ 空目录
输出：
  - 终端：初始化成功的彩色摘要
```

#### `/specflow:compile`

```
输入：--audio <path> / --text <path> / --chat <path> / --project <path>（可组合）
      --version <semver>
      --dry-run
      --force（忽略缓存）
处理：
  1. 环境校验（API Key、ffmpeg）
  2. dry-run：仅输出预估成本
  3. Input Pipeline → Context Agent → Output Engine
  4. 写入 PCB + .specflow/ 状态
  5. 更新 CLAUDE.md
输出：
  - 实时四阶段进度条
  - 彩色摘要（文件数 + Open Questions 数 + 耗时 + 费用）
```

#### `/specflow:status`

```
输入：无参数（可选 --json）
处理：
  1. 读取 .specflow/project.json
  2. 读取 bundle.json 统计
  3. 读取 07_open_questions.md
  4. 检测新输入文件
输出：
  - 项目名称、阶段、版本
  - 12 个 PCB 文件状态
  - Open Questions（红色计数）
  - 新输入文件提醒
```

#### `/specflow:diff`

```
输入：--from <v> --to <v>（默认：上一版本 → 当前）
处理：
  1. 加载两个版本的 bundle.json
  2. 执行语义 Diff
输出：
  - Δ 变更摘要：新增 / 修改 / 删除 / 未变更
```

#### `/specflow:check`

```
输入：无参数（可选 --json）
处理：
  1. 对比 .specflow/inputs/ 中记录的 hash 与当前文件 hash
  2. 检查已追踪输入文件的变更和缺失
  3. 检查 PCB 文件的存在和生成天数
  4. 读取 .specflow/project.json 的最后编译时间
输出：
  - PCB 新鲜度状态（fresh / stale / never compiled）
  - 变更和缺失的输入文件列表
  - 每个 PCB 文件的存在状态和天数
```

### 7.2 Hooks

#### SessionStart

```
触发：Claude Code 启动时
行为：
  - 项目含 .specflow/ → 检查新输入 / 未解决 Open Questions → 输出提醒
  - 检查上下文新鲜度：编译后 > 7 天 → 输出 stale 警告
  - 检查 CLAUDE.md 存在性
  - 项目不含 .specflow/ → 静默
```

#### PostCompile

```
触发：/specflow:compile 完成后
行为：
  - 编译流程自动生成 CLAUDE.md 至项目根目录
  - 输出更新确认
```

#### PostCompile

```
触发：/specflow:compile 完成后
行为：
  - 重新生成 CLAUDE.md
  - 输出更新确认
```

### 7.3 CLAUDE.md 生成

```typescript
function generateClaudeMd(bundle: Bundle, projectRoot: string): string;
```

生成内容：项目上下文引用表（指向 docs/spec-flow/）、关键规则、最后同步时间与版本号。

---

## 八、编译流水线

### 8.1 全量编译

```
Pre-flight（校验 API Key + ffmpeg）
  → Input Pipeline（并行：ASR | PDF | DOCX | Chat → 统一 transcript → 分段）
  → Context Agent（每段并行抽取 → 缺失检测 → 聚合）
  → Output Engine（PCB 编译 → 写入 docs/spec-flow/ → 写入 .specflow/ → 更新 CLAUDE.md）
  → Summary（终端彩色输出）
```

### 8.2 增量编译

关键差异：
1. hash 检测新输入 → 仅处理变更文件
2. 新 facts 与已有 facts 合并
3. 语义 Diff 生成变更报告
4. 用户确认后才覆盖（保护手动编辑）

### 8.3 错误处理

```
API Key 缺失    → 立即终止 + 设置说明
ffmpeg 不可用   → 跳过音频输入 + 警告
ASR 失败        → retry 3 次（指数退避）→ 最终失败则跳过
LLM 调用失败    → retry 2 次 → 最终失败则终止
磁盘写入失败    → 终止 + 不更新状态
部分成功        → 保存部分结果 + 标注失败项
```

---

## 九、CLI 接口

### 9.1 全局命令

```bash
specflow init [--name <name>]
specflow compile --audio <path> [--text <path>] [--chat <path>] [--project <path>] [--version <v>] [--dry-run] [--force]
specflow status [--json]
specflow diff [--from <v1>] [--to <v2>]
specflow check [--json]
specflow agent --list              # P1
specflow agent --init <agent>      # P1
```

### 9.2 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `DEEPSEEK_API_KEY` | 是 | - | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com/v1` | API 基础 URL |
| `DASHSCOPE_API_KEY` | 是 | - | 阿里云 DashScope API 密钥 |
| `SPECFLOW_MONTHLY_BUDGET` | 否 | `100` | 月度费用上限（CNY） |
| `SPECFLOW_LOG_LEVEL` | 否 | `info` | 日志级别 |

> **V1 实现变更**：API Key 现从项目根目录 `specflow.config.json` 文件读取（而非环境变量）。配置文件格式见 README.md。

---

## 十、测试规格

### 10.1 测试分层

```
E2E:        完整 /specflow:compile 流程          (3-5 个关键场景)
Integration:  pipeline 模块间集成                  (pipeline 集成测试)
Unit:        每个模块独立测试                      (覆盖率 > 80%)
```

### 10.2 核心测试用例

**Input Pipeline**
- [ ] 音频路由到 ASR、PDF/DOCX/MD 正确解析
- [ ] 飞书 / Slack 聊天记录解析
- [ ] 超大文件分段不截断句子
- [ ] 不支持的格式 → 明确错误

**Context Agent**
- [ ] 需求 / 技术约束 / 实体类型 fact 正确抽取
- [ ] 低置信度正确标注
- [ ] 缺失检测：未定义用户角色 / 未决策技术选型
- [ ] 聚合：同名实体合并 / 冲突字段检测
- [ ] 输入含特殊字符不崩溃

**Output Engine**
- [ ] 8 个 PCB 文件全部渲染成功
- [ ] 语义 Diff：新增 / 修改 / 删除
- [ ] 增量模式不覆盖未变更文件

**LLM Layer**
- [ ] DeepSeek 返回 JSON Mode 合法 JSON
- [ ] DashScope ASR 返回转录
- [ ] 假 API Key → 明确错误
- [ ] 超时重试生效

### 10.3 测试 Fixture

```
specs/fixtures/
├── audio/
│   ├── short-meeting.mp3       # 5 分钟
│   └── long-meeting.m4a        # 45 分钟
├── text/
│   ├── prd-sample.md
│   ├── tech-spec.pdf
│   └── notes.docx
├── chat/
│   ├── feishu-export.txt
│   └── slack-export.json
└── expected/
    ├── short-meeting.bundle.json
    └── prd-sample.bundle.json
```

---

## 十一、构建与分发

### 11.1 构建配置要点

```jsonc
{
  "name": "@specflow/core",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": { "specflow": "./dist/cli.js" },
  "files": ["dist/", "templates/"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "test": "vitest run",
    "lint": "eslint src/ --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### 11.2 CI 流程

```
push / PR → lint → typecheck → test (matrix: ubuntu/macos/windows × node 18/20/22)
  → [tag push v*] → build → npm publish
```

---

## 十二、安全清单

- [ ] API Key 仅从 `process.env` 读取，禁止硬编码
- [ ] 用户输入文件路径校验，防路径遍历
- [ ] `.specflow/config.json` 加入 `.gitignore`
- [ ] LLM prompt 不含绝对路径
- [ ] PCB 文件不含 API Key
- [ ] 文件写入限制在 `projectRoot` 内
- [ ] 错误信息不泄漏密钥/路径
- [ ] npm publish 不包含 `.env` / `*.pem`

---

## 十三、V1 验收检查表

### 功能

- [ ] `specflow init` 创建完整 `.specflow/` 结构
- [ ] `specflow compile --audio` 完成音频 → PCB
- [ ] `specflow compile --text` 完成文档 → PCB
- [ ] `specflow compile --dry-run` 输出预估成本
- [ ] `specflow status` 正确显示状态 + Open Questions
- [ ] `specflow diff` 正确显示版本差异
- [ ] `specflow check` 正确检测 PCB 漂移和过期状态
- [ ] SessionStart hook 检测新输入并提醒
- [ ] PostCompile hook 自动更新 CLAUDE.md
- [ ] 缺失检测覆盖 ≥ 5 个维度
- [ ] 增量编译仅处理变更输入
- [ ] `specflow compile --project` 完成源码 → PCB（含技术栈/架构/特性/数据模型/反向需求推断）
- [ ] 错误场景不崩溃，输出可理解信息

### 质量

- [ ] 单元测试覆盖率 > 80%
- [ ] 抽取准确率 > 85%（标注 fixture）
- [ ] 60 分钟音频全流程 < 10 分钟
- [ ] Windows / macOS / Linux 三平台通过
- [ ] 彩色输出正确（红/黄/绿）

### 文档

- [ ] README.md 含安装说明 + demo GIF
- [ ] CONTRIBUTING.md 贡献指南
- [ ] `specflow --help` 完整命令文档

---

## 十四、实现顺序

| Step | 模块 | 产出 | 预估 |
|------|------|------|------|
| 1 | 项目脚手架 | monorepo + tsconfig + vitest + CI | 0.5d |
| 2 | 类型系统 | types.ts + zod schemas | 0.5d |
| 3 | LLM 抽象层 | DeepSeek + DashScope adapter + 单测 | 1d |
| 4 | Input Pipeline | Audio/Text/Chat 解析器 + 单测 | 1.5d |
| 5 | Extractor | 信息抽取 + prompt + fixture 测试 | 2d |
| 6 | Gap Detector | 缺失检测 + fixture 测试 | 1d |
| 7 | Aggregator | 聚合/去重/冲突检测 + 单测 | 1d |
| 8 | Output Engine | PCB 编译器 + Handlebars + 单测 | 1.5d |
| 9 | State Store | 文件系统读写 + 集成测试 | 1d |
| 10 | 编译流水线 | compile + incremental + dry-run | 1d |
| 11 | CLI 入口 | commander.js + `specflow` 命令 | 0.5d |
| 12 | Claude Code 插件 | commands + hooks + CLAUDE.md 生成 | 1.5d |
| 13 | E2E 测试 | 完整流程 + fixture | 1d |
| 14 | 文档与发布 | README/CONTRIBUTING + npm publish | 0.5d |

**总计**：~14 个工作日（2 人并行可压缩至 10 天）

---

**文档结束**
