# MCP Vue/TypeScript 代码解析服务器

一个基于 Tree-sitter 的高性能本地 MCP (Model Context Protocol) 服务器，用于解析和分析 TypeScript、JavaScript 和 Vue 代码。

## 功能特性

- 🌳 基于 Tree-sitter 的强大代码解析能力
- 📝 支持 TypeScript、JavaScript 和 Vue 单文件组件 (SFC)
- 🔍 提取函数、类、变量、导入、导出和类型定义
- 🎯 支持 Vue 模板分析（指令、绑定、事件、组件）
- 📊 生成人类可读的 Markdown 格式代码分析摘要
- ⚡ 高性能并发请求处理
- 💾 智能缓存机制，减少重复解析开销
- 🔄 解析器池管理，优化资源利用
- 📝 内置日志系统，支持控制台和文件输出
- 🔧 灵活的命令行参数配置
- ✨ 完整的类型安全保证
- 🧪 全面的测试覆盖（基础、复杂场景、边界情况、性能测试）
- 🛡️ 标准化的错误处理和日志记录

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

### 命令行参数

| 参数                | 类型           | 描述                                   | 默认值               |
| ------------------- | -------------- | -------------------------------------- | -------------------- |
| `--cwd=<path>`      | string         | 当前工作目录（支持相对路径和绝对路径） | 启动命令的目录       |
| `--level=<level>`   | string         | 日志级别 (DEBUG, INFO, WARN, ERROR)    | `"INFO"`             |
| `--log-file=<path>` | string \| null | 日志文件路径，设为 null 禁用文件日志   | `"logs/mcp-vue.log"` |
| `--no-console`      | flag           | 禁用控制台输出                         | `true`（启用）       |
| `--no-file`         | flag           | 禁用文件输出                           | `true`（启用）       |

### 路径说明

- **cwd（工作目录）**：用于解析文件路径的基础目录
  - 如果不指定 `--cwd`，默认使用启动命令时的当前目录
  - 支持相对路径（相对于启动目录）和绝对路径
  - 在 workspace 开发中，通常在子包目录启动，可以指定 `--cwd=..` 或 `--cwd=./` 来使用项目根目录

- **文件路径解析**：当调用 `parse_code` 工具时，系统会尝试以下路径：
  1. 直接使用提供的路径
  2. 相对于 cwd 的路径
  3. 绝对路径解析

### 日志级别说明

- **DEBUG**: 详细的调试信息，包括所有请求和响应
- **INFO**: 一般信息，包括工具调用和解析结果
- **WARN**: 警告信息
- **ERROR**: 错误信息

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
- 返回结果为 Markdown 格式的代码分析摘要，便于 AI 理解

### 配置说明

- **name**: MCP 服务器的显示名称
- **command**: 启动 MCP 服务器的命令（使用 `npx -y` 自动确认安装）
- **args**: 传递给命令的参数
- **type**: 传输类型，本服务器使用 `stdio`（标准输入/输出）

## MCP 工具列表

服务器提供以下工具用于代码分析：

### parse_code

完整解析代码文件并提取所有 AST 信息，并生成人类可读的 Markdown 格式摘要。这是**主要且推荐**的代码分析工具。

**参数：**

- `filepath` (string, 必需): 要解析的文件路径（相对于配置的 cwd 或项目根目录）

**返回：**

返回一个 Markdown 格式的代码分析摘要，包含以下信息：

````markdown
# Code Analysis: <filepath>

Language: <language>

## Functions (<count>)

- <function_name>(<parameters>) -> <return_type> [<function_type>][L<row>:C<column>]
  ...

## Function Calls (<count>)

- <function_name>(<arguments>)[L<row>:C<column>]
  ...

## Classes (<count>)

### <class_name>

**Extends:** <parent_class>
**Implements:** <interface1>, <interface2>

**Methods:**

- <method_name>(<parameters>) -> <return_type>

**Properties:**

- <property_name>: <type> (<visibility>, <readonly>)
  ...

## Variables (<count>)

- <variable_name>: <type> = <value> [<const|let|var>][L<row>:C<column>]
  ...

## Imports (<count>)

- <import_type> <imports> from <source>[L<row>:C<column>]
  ...

## Exports (<count>)

- <export_type> <export_name> (<export_type>)[L<row>:C<column>]
  ...

## Types (<count>)

### <type_name> (<kind>)

**Properties:**

- <property_name>: <type> (<optional>, <readonly>)

**Methods:**

- <method_name>(<parameters>) -> <return_type>
  ...

## Vue Template

**Directives:**

- <directive_name>="<value>" on <element> [L<row>:C<column>]

**Bindings:**

- <binding_name>: <expression> on <element> [L<row>:C<column>]

**Events:**

- @<event_name>="<handler>" on <element> [L<row>:C<column>]

**Components:**

- <component_name>
  ...

## Vue Options API

**Data Properties:**

- <property_name>
  ...

**Computed Properties:**

- <property_name>: <getter/setter>
  ...

**Watch Properties:**

- <property_name>
  ...

**Methods:**

- <method_name>(<parameters>) -> <return_type>
  ...

**Lifecycle Hooks:**

- <hook_name>
  ...

**说明：**

- 服务器会从文件系统读取文件内容，而不是接收代码字符串
- 文件路径支持相对路径和绝对路径
- 支持智能缓存机制，相同文件的重复解析会使用缓存
- 自动检测文件类型（TypeScript、JavaScript、Vue）
- 返回格式化的 Markdown 摘要，便于 AI 理解和处理
- 一次性返回所有 AST 信息，包括：
  - 函数定义（函数声明、箭头函数、方法等）
  - 顶层函数调用（如 onMounted、watch、main 等）
  - 类定义（包括继承、实现接口、方法和属性）
  - 变量声明（const、let、var）
  - 导入语句
  - 导出语句
  - 类型定义（接口、类型别名、枚举）
  - Vue 模板信息（指令、绑定、事件、组件）
  - Vue Options API（data、computed、watch、methods、生命周期钩子）

**示例输出：**

```markdown
# Code Analysis: src/components/Header.vue

Language: vue

## Functions (3)

- anonymous(none) -> void [method_definition][L10:C2]
- anonymous(none) -> void [method_definition][L15:C2]
- anonymous(none) -> void [method_definition][L20:C2]

## Function Calls (2)

- onMounted(() => {
  console.log('mounted')
  })[L25:C0]
- watch(() => {
  console.log('watch')
  }, () => {
  console.log('callback')
  })[L30:C0]

## Imports (2)

- default Button from ./Button.vue[L1:C0]
- named ref, computed from vue[L2:C0]

## Vue Template

**Directives:**

- v-if="isLoggedIn" on div[L5:C4]

**Bindings:**

- :class="{ active: isActive }" on button[L8:C6]

**Events:**

- @click="handleClick" on button[L8:C6]

**Components:**

- Button

## Vue Options API

**Data Properties:**

- count
- message

**Computed Properties:**

- doubledCount: getter

**Watch Properties:**

- count

**Methods:**

- increment(none) -> void

**Lifecycle Hooks:**

- mounted
- beforeUnmount
```

## 许可证

ISC License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

zhouyinkui

## 相关链接

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Tree-sitter 文档](https://tree-sitter.github.io/tree-sitter/)
- [Vue 官方文档](https://vuejs.org/)
- [Continue IDE](https://continue.dev/)
- [Cursor IDE](https://cursor.sh/)
````
