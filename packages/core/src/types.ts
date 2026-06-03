import { z } from 'zod';

// ── LLM Layer ──────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  timeout?: number;
}

export interface ChatResponse {
  content: string;
  usage: TokenUsage;
  model: string;
}

export interface ChatChunk {
  delta: string;
  finishReason?: 'stop' | 'length';
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMClient {
  readonly modelId: string;
  readonly maxTokens: number;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
  countTokens(messages: ChatMessage[]): Promise<number>;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  duration: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

// ── Input Pipeline ─────────────────────────────────────────

export type InputType = 'audio' | 'text' | 'chat' | 'project';

export interface InputFile {
  path: string;
  type: InputType;
  mime: string;
  hash: string;
  size: number;
}

export interface ParsedInput {
  source: InputFile;
  transcript: string;
  metadata: Record<string, unknown>;
}

// ── Context Agent ──────────────────────────────────────────

export type FactType =
  | 'stakeholder'
  | 'goal'
  | 'requirement'
  | 'constraint'
  | 'assumption'
  | 'decision'
  | 'risk'
  | 'task'
  | 'entity'
  | 'user_flow'
  | 'technical_choice'
  | 'open_question';

export type FactCategory =
  | 'product'
  | 'technical'
  | 'data'
  | 'process'
  | 'decision';

export interface Fact {
  type: FactType;
  content: string;
  confidence: number;
  evidence: string;
  category: FactCategory;
}

export interface SourceRef {
  sourcePath: string;
  segmentIndex: number;
  excerpt: string;
}

export interface ExtractionResult {
  segmentIndex: number;
  facts: Fact[];
  confidence: number;
  sourceRefs: SourceRef[];
}

export interface GapCategory {
  name: string;
  score: number;
  missingItems: string[];
}

export interface OpenQuestion {
  id: string;
  category: string;
  question: string;
  context: string;
  suggestedAnswers?: string[];
  status: 'open' | 'resolved';
  resolution?: string;
}

export interface GapDetectionResult {
  categories: GapCategory[];
  questions: OpenQuestion[];
  coverageScore: number;
}

// ── Aggregated Bundle ──────────────────────────────────────

export interface ProjectOverview {
  name: string;
  description: string;
  stage: string;
  goals: string[];
  stakeholders: string[];
}

export interface ProductSpec {
  targetUsers: string[];
  valueProposition: string;
  features: { name: string; priority: string; description: string }[];
  scope: { included: string[]; excluded: string[] };
}

export interface UserFlow {
  name: string;
  steps: { actor: string; action: string; expectedOutcome: string }[];
  edgeCases: string[];
}

export interface TechnicalConstraint {
  category: string;
  description: string;
  rationale: string;
  alternatives?: string[];
}

export interface DataModelEntity {
  name: string;
  fields: { name: string; type: string; description: string; nullable: boolean }[];
  relationships: { target: string; type: string; description: string }[];
}

export interface DataModel {
  entities: DataModelEntity[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  estimatedHours: number;
  dependencies: string[];
  acceptanceCriteria: string[];
}

export interface AgentInstruction {
  category: string;
  content: string;
  priority: 'critical' | 'important' | 'advisory';
}

export interface Decision {
  id: string;
  topic: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  date: string;
  status: 'proposed' | 'decided' | 'superseded';
}

export interface TechStackItem {
  category: string;
  name: string;
  version?: string;
  purpose: string;
  alternatives?: string[];
}

export interface ArchitectureComponent {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'storage' | 'external' | 'pipeline';
  description: string;
  technologies: string[];
  dependsOn: string[];
}

export interface Architecture {
  style: string;
  description: string;
  components: ArchitectureComponent[];
  dataFlow: { from: string; to: string; what: string }[];
  deployment: { platform: string; strategy: string; details: string };
  keyDecisions: { topic: string; decision: string; rationale: string }[];
}

export interface AggregatedBundle {
  overview: ProjectOverview;
  productSpec: ProductSpec;
  userFlows: UserFlow[];
  technicalConstraints: TechnicalConstraint[];
  dataModel: DataModel;
  tasks: Task[];
  agentInstructions: AgentInstruction[];
  openQuestions: OpenQuestion[];
  decisions: Decision[];
  techStack: TechStackItem[];
  architecture: Architecture | null;
}

// ── Output Engine ──────────────────────────────────────────

export interface CompileOptions {
  projectRoot: string;
  inputs: string[];
  outputDir?: string;
  version?: string;
  dryRun?: boolean;
  incremental?: boolean;
}

export interface ModelCallCost {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costCNY: number;
}

export interface CostBreakdown {
  modelCalls: ModelCallCost[];
  totalTokens: number;
  estimatedCostCNY: number;
}

export interface CompileStats {
  inputCount: number;
  totalTranscriptLength: number;
  segmentCount: number;
  extractedFactCount: number;
  compilationDurationMs: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  changed: boolean;
}

export interface CompileResult {
  version: string;
  files: GeneratedFile[];
  openQuestions: OpenQuestion[];
  stats: CompileStats;
  cost: CostBreakdown;
}

export interface DiffItem {
  file: string;
  section: string;
  changeType: 'added' | 'modified' | 'removed';
  oldValue?: string;
  newValue?: string;
  confidence: number;
}

export interface DiffResult {
  version: { from: string; to: string };
  added: DiffItem[];
  modified: DiffItem[];
  removed: DiffItem[];
  unchanged: number;
  summary: string;
}

// ── State Store ────────────────────────────────────────────

export interface SpecFlowConfig {
  version: string;
  projectName: string;
  activePlugins: string[];
  llm: {
    deepseekModel: 'deepseek-v4-pro' | 'deepseek-v4-flash';
    deepseekBaseUrl: string;
    asrModel: 'qwen3-asr-flash';
  };
  budget: {
    monthlyLimitCNY: number;
    warnThresholdCNY: number;
  };
  compile: {
    segmentMaxLength: number;
    segmentOverlap: number;
    autoUpdateClaudeMd: boolean;
  };
}

export interface ProjectMeta {
  id: string;
  name: string;
  stage: 'discovery' | 'planning' | 'development' | 'maintenance';
  activePlugins: string[];
  createdAt: string;
  updatedAt: string;
  currentVersion: string;
}

export interface BundleMetadata {
  totalFacts: number;
  avgConfidence: number;
  openQuestionCount: number;
  uncertainFactCount: number;
  modelCalls: ModelCallCost[];
  durationMs: number;
  compiledBy: string;
}

export interface Bundle {
  version: string;
  sourceInputs: string[];
  createdAt: string;
  metadata: BundleMetadata;
  data: AggregatedBundle;
}

// ── Zod Schemas ────────────────────────────────────────────

export const FactTypeSchema = z.enum([
  'stakeholder', 'goal', 'requirement', 'constraint', 'assumption',
  'decision', 'risk', 'task', 'entity', 'user_flow', 'technical_choice', 'open_question',
]);

export const OpenQuestionSchema = z.object({
  id: z.string().default(''),
  category: z.string().default('uncategorized'),
  question: z.string().default(''),
  context: z.string().default(''),
  suggestedAnswers: z.array(z.string()).optional(),
  status: z.enum(['open', 'resolved']).default('open'),
  resolution: z.string().optional(),
});

export const ProjectOverviewSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  stage: z.string().default('discovery'),
  goals: z.array(z.string()).default([]),
  stakeholders: z.array(z.string()).default([]),
});

export const ProductSpecSchema = z.object({
  targetUsers: z.array(z.string()).default([]),
  valueProposition: z.string().default(''),
  features: z.array(z.object({
    name: z.string(),
    priority: z.string(),
    description: z.string(),
  })).default([]),
  scope: z.object({
    included: z.array(z.string()).default([]),
    excluded: z.array(z.string()).default([]),
  }).default({ included: [], excluded: [] }),
});

export const UserFlowSchema = z.object({
  name: z.string(),
  steps: z.array(z.object({
    actor: z.string(),
    action: z.string(),
    expectedOutcome: z.string(),
  })).default([]),
  edgeCases: z.array(z.string()).default([]),
});

export const TechnicalConstraintSchema = z.object({
  category: z.string(),
  description: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()).optional(),
});

export const DataModelEntitySchema = z.object({
  name: z.string(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    nullable: z.boolean(),
  })).default([]),
  relationships: z.array(z.object({
    target: z.string(),
    type: z.string(),
    description: z.string(),
  })).default([]),
});

export const DataModelSchema = z.object({
  entities: z.array(DataModelEntitySchema).default([]),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
  estimatedHours: z.number(),
  dependencies: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export const AgentInstructionSchema = z.object({
  category: z.string(),
  content: z.string(),
  priority: z.enum(['critical', 'important', 'advisory']),
});

export const DecisionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  decision: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()).default([]),
  date: z.string(),
  status: z.enum(['proposed', 'decided', 'superseded']),
});

export const TechStackItemSchema = z.object({
  category: z.string(),
  name: z.string(),
  version: z.string().optional(),
  purpose: z.string(),
  alternatives: z.array(z.string()).optional(),
});

export const ArchitectureComponentSchema = z.object({
  name: z.string(),
  type: z.enum(['frontend', 'backend', 'database', 'service', 'storage', 'external', 'pipeline']),
  description: z.string(),
  technologies: z.array(z.string()).default([]),
  dependsOn: z.array(z.string()).default([]),
});

export const ArchitectureSchema = z.object({
  style: z.string(),
  description: z.string(),
  components: z.array(ArchitectureComponentSchema).default([]),
  dataFlow: z.array(z.object({
    from: z.string(),
    to: z.string(),
    what: z.string(),
  })).default([]),
  deployment: z.object({
    platform: z.string(),
    strategy: z.string(),
    details: z.string(),
  }),
  keyDecisions: z.array(z.object({
    topic: z.string(),
    decision: z.string(),
    rationale: z.string(),
  })).default([]),
});

export const AggregatedBundleSchema = z.object({
  overview: ProjectOverviewSchema,
  productSpec: ProductSpecSchema,
  userFlows: z.array(UserFlowSchema).default([]),
  technicalConstraints: z.array(TechnicalConstraintSchema).default([]),
  dataModel: DataModelSchema,
  tasks: z.array(TaskSchema).default([]),
  agentInstructions: z.array(AgentInstructionSchema).default([]),
  openQuestions: z.array(OpenQuestionSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
  techStack: z.array(TechStackItemSchema).default([]),
  architecture: ArchitectureSchema.nullable(),
});

export const FactSchema = z.object({
  type: FactTypeSchema,
  content: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  category: z.enum(['product', 'technical', 'data', 'process', 'decision']),
});

export const ExtractionResultSchema = z.object({
  segmentIndex: z.number().int().min(0),
  facts: z.array(FactSchema).max(30),
  confidence: z.number().min(0).max(1),
  sourceRefs: z.array(z.object({
    sourcePath: z.string(),
    segmentIndex: z.number().int().min(0),
    excerpt: z.string().max(200),
  })),
});

export const OpenQuestionSchemaRef = OpenQuestionSchema;

export const GapDetectionResultSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    missingItems: z.array(z.string()),
  })),
  questions: z.array(OpenQuestionSchema),
  coverageScore: z.number().min(0).max(100),
});

export const SpecFlowConfigSchema = z.object({
  version: z.string(),
  projectName: z.string(),
  activePlugins: z.array(z.string()),
  llm: z.object({
    deepseekModel: z.enum(['deepseek-v4-pro', 'deepseek-v4-flash']),
    deepseekBaseUrl: z.string(),
    asrModel: z.literal('qwen3-asr-flash'),
  }),
  budget: z.object({
    monthlyLimitCNY: z.number().min(0),
    warnThresholdCNY: z.number().min(0),
  }),
  compile: z.object({
    segmentMaxLength: z.number().int().min(100).max(8000),
    segmentOverlap: z.number().int().min(0).max(1000),
    autoUpdateClaudeMd: z.boolean(),
  }),
});

export const ProjectMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: z.enum(['discovery', 'planning', 'development', 'maintenance']),
  activePlugins: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  currentVersion: z.string(),
});

export const BundleSchema = z.object({
  version: z.string(),
  sourceInputs: z.array(z.string()),
  createdAt: z.string(),
  metadata: z.object({
    totalFacts: z.number().int().default(0),
    avgConfidence: z.number().default(0),
    openQuestionCount: z.number().int().default(0),
    uncertainFactCount: z.number().int().default(0),
    modelCalls: z.array(z.object({
      model: z.string(),
      promptTokens: z.number(),
      completionTokens: z.number(),
      costCNY: z.number(),
    })).default([]),
    durationMs: z.number().default(0),
    compiledBy: z.string().default('specflow'),
  }),
  data: AggregatedBundleSchema,
});
