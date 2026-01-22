# MCP Vue/TypeScript 代码解析服务器

一个基于 Tree-sitter 和 @vue/compiler-sfc 的高性能本地 MCP (Model Context Protocol) 服务器，用于解析和分析 TypeScript、JavaScript 和 Vue 代码。

## 功能特性

- 📝 支持 TypeScript、JavaScript 和 Vue 单文件组件 (SFC)
- 🔍 提取函数、类、变量、导入、导出和类型定义
- 🎯 支持 Vue 模板分析（指令、绑定、事件、组件）
- ⚡ 高性能并发请求处理
- 💾 智能缓存机制，减少重复解析开销
- 🔄 解析器池管理，优化资源利用
- 📝 内置日志系统，支持控制台和文件输出

## 安装

```bash
npm install -g mcp-vue
```

或使用 npx（推荐）：

```bash
npx mcp-vue
```

## 使用方法

### 作为 MCP 服务器使用

MCP 服务器通过标准输入/输出进行通信，支持 JSON-RPC 2.0 协议。

```bash
# 基本使用（使用当前目录作为 cwd）
npx mcp-vue

# 指定工作目录
npx mcp-vue --cwd=./packages/app

# 使用绝对路径
npx mcp-vue --cwd=D:/projects/my-project/src

# 设置日志级别为 DEBUG
npx mcp-vue --level=DEBUG

# 禁用文件日志
npx mcp-vue --no-file

# 禁用控制台输出
npx mcp-vue --no-console

# 组合使用
npx mcp-vue --cwd=./packages/app --level=DEBUG --log-file=custom.log
```

## 配置选项

MCP 服务器通过命令行参数进行配置，支持以下参数：

| 参数                | 类型           | 描述                                   | 默认值               |
| ------------------- | -------------- | -------------------------------------- | -------------------- |
| `--cwd=<path>`      | string         | 当前工作目录（支持相对路径和绝对路径） | 启动命令的目录       |
| `--level=<level>`   | string         | 日志级别 (DEBUG, INFO, WARN, ERROR)    | `"INFO"`             |
| `--log-file=<path>` | string \| null | 日志文件路径，设为 null 禁用文件日志   | `"logs/mcp-vue.log"` |
| `--no-console`      | flag           | 禁用控制台输出                         | `true`（启用）       |
| `--no-file`         | flag           | 禁用文件输出                           | `true`（启用）       |

## MCP 工具列表

服务器提供以下工具用于代码分析：

### parse_code

完整解析代码文件并提取所有 AST 信息，返回结构化的代码分析数据。这是**主要且推荐**的代码分析工具。

**参数：**

- `filepath` (string, 必需): 要解析的文件路径（相对于配置的 cwd 或项目根目录）

**返回：**

返回一个结构化的代码分析对象，根据文件类型返回不同的信息：

### TypeScript/JavaScript 文件返回信息

- **functions**: 函数定义（函数声明、箭头函数、方法等）
- **functionCalls**: 顶层函数调用（如 main、init、fetchData 等）
- **classes**: 类定义（包括继承、实现接口、方法和属性）
- **variables**: 变量声明（const、let、var）
- **imports**: 导入语句
- **exports**: 导出语句
- **types**: 类型定义（接口、类型别名、枚举）

### Vue 文件返回信息

- **language**: 文件语言类型
- **imports**: 导入语句
- **optionsAPI**: Options API 信息（当使用 Options API 时返回）
  - **methods**: 方法
  - **props**: 属性
  - **emits**: 事件
  - **lifecycleHooks**: 生命周期钩子
  - **dataProperties**: 数据属性
  - **computedProperties**: 计算属性
  - **watchProperties**: 监听属性
  - **mixins**: 混入
- **compositionAPI**: Composition API 信息（当使用 Composition API 时返回）
  - **methods**: 方法
  - **props**: 属性
  - **emits**: 事件
  - **lifecycleHooks**: 生命周期钩子
  - **variables**: 变量
  - **refs**: 响应式引用
  - **reactives**: 响应式对象
  - **computed**: 计算属性
  - **watch**: 监听
  - **watchEffects**: 监听效果
  - **expose**: 暴露
  - **provide**: 提供
  - **inject**: 注入

## 在 Continue 中配置使用

Continue 是一个强大的 AI 编程助手，支持通过 MCP 协议集成自定义工具。以下是如何在 Continue 中配置使用本 MCP 服务器的步骤：

### 1. 在 Continue 配置文件中添加

在 Continue 的配置文件中添加 MCP 服务器配置：

```yaml
mcpServers:
  - name: Vue/TypeScript Parser
    command: npx
    args:
      - '-y'
      - 'mcp-vue'
      - '--level=DEBUG'
    type: stdio
```

### 2. 重启 Continue

配置完成后，重启 Continue IDE 插件，MCP 服务器将自动启动并可用。

### 3. 使用示例

现在你可以在 Continue 中使用以下提示来分析代码：

```
分析 src/components/Header.vue 文件的函数结构，找出所有公共函数及其参数
```

```
检查 src/views/Home.vue 组件的模板，列出所有使用的指令和事件绑定
```

```
提取 src/types/index.ts 文件中的所有类型定义和接口
```

```
分析 src/utils/api.ts 文件的导入依赖关系，找出循环引用
```

**注意事项**：

- 工具使用 `filepath` 参数指定要分析的文件路径
- 文件路径是相对于配置的 `cwd` 或项目根目录的
- 服务器会自动检测文件类型并使用相应的解析器
- 相同文件的重复解析会使用缓存，提高性能
- 返回结果为结构化的代码分析对象，便于 AI 处理和理解

## 相关链接

- [MCP 协议规范](https://modelcontextprotocol.io/)

## AST 解析限制说明

由于 AST 解析器专注于**语法结构**分析，不进行**语义分析**和**类型推断**，因此存在以下限制：

### TypeScript 限制

- **泛型类型参数**：无法获取泛型类型参数的具体类型信息，例如 `defineProps<Props>()` 无法提取 Props 接口的属性信息
- **类型推断**：对于没有显式标注类型的变量和函数返回值，无法推断其类型
- **复杂类型定义**：对于复杂的类型别名、条件类型等，可能无法完全解析

### Vue 限制

- **编译时宏**：对于 `defineProps()`、`defineEmits()` 等 Vue 3 的编译时宏，只能获取基本信息，无法获取完整的类型和结构信息
- **模板编译**：对于 Vue 模板中的复杂表达式，可能无法完全解析其语义
- **SFC 特定语法**：对于 Vue 单文件组件中的某些特定语法，解析可能不完全

### 技术实现限制

- **Tree-sitter 解析器**：Tree-sitter 本身不提供类型检查功能，只进行语法分析
- **@vue/compiler-sfc**：虽然专门用于 Vue 组件解析，但对于某些高级用法可能存在限制
- **缓存机制**：为了性能考虑，使用了缓存机制，可能无法实时反映文件的最新变化

### 注意事项

- 解析结果是基于 AST 结构的静态分析，不包含运行时信息
- 对于复杂的代码结构，解析结果可能不够详细或准确
- 对于 TypeScript 的类型系统特性，解析能力有限
- 对于 Vue 的编译时特性，解析能力依赖于 @vue/compiler-sfc 的实现
