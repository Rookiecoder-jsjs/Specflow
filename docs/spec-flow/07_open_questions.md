# Open Questions

## Open (5)

### q-001: 目标用户的具体使用场景是什么？
**Category:** 产品/用户

**Context:** 当前仅列出开发者和项目经理，未描述他们如何使用PCB解决实际问题，这影响功能优先级和交互设计。

**Suggested Answers:**
- 开发者用于自动生成项目文档
- 项目经理用于需求缺口分析

### q-002: 系统是否需要数据库？如果需要，选择哪种数据库？
**Category:** 技术/选型

**Context:** 数据模型中包含多个实体，但架构中仅提到文件系统存储，对于增量处理和状态管理可能不足。

**Suggested Answers:**
- SQLite（轻量级，适合CLI工具）
- 无数据库，仅用JSON文件

### q-003: 状态管理模块（State）存储哪些具体数据？
**Category:** 数据/模型

**Context:** 架构中提到State管理项目元数据、bundles、输入追踪，但未定义其数据结构，影响实现。

**Suggested Answers:**
- 项目配置文件（JSON）
- 已处理输入哈希列表

### q-004: 如何处理LLM API调用失败？
**Category:** 流程/异常

**Context:** 边缘案例提到LLM API failure，但未定义重试策略或降级方案，这对系统可靠性至关重要。

**Suggested Answers:**
- 指数退避重试
- 返回错误并中止处理

### q-005: 输入到PCB编译的确切工作流是什么？
**Category:** 决策/共识

**Context:** 开放问题中已记录，但未解决，影响模块编排和CLI命令设计。

**Suggested Answers:**
- 线性管道：输入 -> 提取 -> 聚合 -> 编译
- 迭代流程：输入 -> 提取 -> 聚合 -> 缺口检测 -> 编译

