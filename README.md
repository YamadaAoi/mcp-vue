# MCP Vue/TypeScript 代码解析服务器

一个基于 Tree-sitter 的高性能本地 MCP (Model Context Protocol) 服务器，用于解析和分析 TypeScript、JavaScript 和 Vue 代码。

## 功能特性

- 🌳 基于 Tree-sitter 的强大代码解析能力
- 📝 支持 TypeScript、JavaScript 和 Vue 单文件组件 (SFC)
- 🔍 提取函数、类、变量、导入、导出和类型定义
- 🎯 支持 Vue 模板分析（指令、绑定、事件、组件）
- ⚡ 高性能并发请求处理
- � 智能缓存机制，减少重复解析开销
- 🔄 解析器池管理，优化资源利用
- � 内置日志系统，支持控制台和文件输出
- 🔧 灵活的环境变量配置
- ✨ 完整的类型安全保证
- 🧪 全面的测试覆盖（基础、复杂场景、边界情况、性能测试）
- 🛡️ 标准化的错误处理和日志记录

## 使用方法

### 作为 MCP 服务器使用

MCP 服务器通过标准输入/输出进行通信，支持 JSON-RPC 2.0 协议。

```bash
# 启动服务器
npx mcp-vue
```

## 配置选项

### 配置文件

MCP 服务器支持通过配置文件来设置工作目录和日志选项。配置文件名为 `mcp-vue.config.json`，应放在项目根目录。

配置文件优先级高于默认值，如果不存在配置文件，则使用默认配置。

```json
{
  "cwd": ".",
  "logging": {
    "level": "INFO",
    "logFile": "logs/mcp-vue.log",
    "enableConsole": true,
    "enableFile": true
  }
}
```

### 配置项说明

| 配置项          | 类型           | 描述                                                     | 默认值               |
| --------------- | -------------- | -------------------------------------------------------- | -------------------- |
| `cwd`           | string         | 当前工作目录（相对于项目根目录）                         | `"."`                |
| `level`         | string         | 日志级别 (DEBUG, INFO, WARN, ERROR)                      | `"INFO"`             |
| `logFile`       | string \| null | 日志文件路径（相对于项目根目录），设为 null 禁用文件日志 | `"logs/mcp-vue.log"` |
| `enableConsole` | boolean        | 是否启用控制台输出                                       | `true`               |
| `enableFile`    | boolean        | 是否启用文件输出                                         | `true`               |

**路径说明**：

- 配置文件 `mcp-vue.config.json` 必须放在项目根目录
- `cwd` 配置项用于指定当前工作目录，文件路径将相对于此目录解析
- 日志文件路径相对于项目根目录解析，无论从哪个目录启动程序
- 系统会自动识别项目根目录，支持以下场景：
  - **普通项目**：查找包含 `package.json` 且包含 `.git` 的目录
  - **Monorepo 项目**：查找包含 `workspaces` 配置、`pnpm-workspace.yaml` 或 `lerna.json` 的根目录
  - **从子目录启动**：即使从子包或子目录启动，也能正确找到项目根目录

**cwd 配置示例**：

```json
{
  "cwd": "."
}
```

- `"."`：使用项目根目录作为当前工作目录
- `"packages/app"`：使用项目根目录下的 `packages/app` 目录
- `"src"`：使用项目根目录下的 `src` 目录
- `"D:/projects/my-project/src"`：使用绝对路径（注意路径分隔符使用 `/` 或 `\\`）

**注意事项**：

- 如果配置的 cwd 不存在，系统会回退到项目根目录
- 文件路径解析会尝试多个可能的路径，包括：
  - 直接使用提供的路径
  - 相对于 cwd 的路径
  - 相对于当前工作目录的路径（绝对路径解析）
- 绝对路径可以用于指定项目外的目录，例如：
  ```json
  {
    "cwd": "D:/shared-code/common-utils"
  }
  ```

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

- 所有工具现在都使用 `filepath` 参数而不是 `code` 和 `filename` 参数
- 文件路径是相对于配置文件中的 `cwd` 或项目根目录的
- 服务器会自动检测文件类型并使用相应的解析器
- 相同文件的重复解析会使用缓存，提高性能

### 配置说明

- **name**: MCP 服务器的显示名称
- **command**: 启动 MCP 服务器的命令（使用 `npx -y` 自动确认安装）
- **args**: 传递给命令的参数
- **type**: 传输类型，本服务器使用 `stdio`（标准输入/输出）

## MCP 工具列表

服务器提供以下工具用于代码分析：

### parse_code

完整解析代码文件并提取所有 AST 信息。这是**主要且推荐**的代码分析工具。

**参数：**

- `filepath` (string, 必需): 要解析的文件路径（相对于配置的 cwd 或项目根目录）

**返回：**

```json
{
  "success": true,
  "language": "typescript",
  "functions": [
    {
      "name": "myFunction",
      "type": "function_declaration",
      "parameters": ["param1", "param2"],
      "returnType": "string",
      "position": {
        "start": { "row": 0, "column": 0 },
        "end": { "row": 5, "column": 1 }
      }
    }
  ],
  "classes": [
    {
      "name": "MyClass",
      "extends": "BaseClass",
      "implements": ["Interface1", "Interface2"],
      "methods": [...],
      "properties": [...],
      "position": {
        "start": {"row": 10, "column": 0},
        "end": {"row": 30, "column": 1}
      }
    }
  ],
  "variables": [
    {
      "name": "myVariable",
      "type": "string",
      "value": "\"hello\"",
      "isConst": true,
      "position": { "row": 0, "column": 0 }
    }
  ],
  "imports": [
    {
      "source": "vue",
      "imports": ["ref", "computed"],
      "isDefault": false,
      "isNamespace": false,
      "position": { "row": 0, "column": 0 }
    }
  ],
  "exports": [
    {
      "name": "myFunction",
      "type": "function",
      "isDefault": false,
      "position": { "row": 10, "column": 0 }
    }
  ],
  "types": [
    {
      "name": "MyInterface",
      "kind": "interface",
      "properties": [...],
      "methods": [...],
      "position": {
        "start": {"row": 0, "column": 0},
        "end": {"row": 5, "column": 1}
      }
    }
  ],
  "hasVueTemplate": true,
  "cacheSize": 1
}
```

**说明：**

- 服务器会从文件系统读取文件内容，而不是接收代码字符串
- 文件路径支持相对路径和绝对路径
- 支持智能缓存机制，相同文件的重复解析会使用缓存
- 自动检测文件类型（TypeScript、JavaScript、Vue）
- 一次性返回所有 AST 信息，包括：
  - 函数定义（函数声明、箭头函数、方法等）
  - 类定义（包括继承、实现接口、方法和属性）
  - 变量声明（const、let、var）
  - 导入语句
  - 导出语句
  - 类型定义（接口、类型别名、枚举）
  - Vue 模板信息（指令、绑定、事件、组件）

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

zhouyinkui

## 相关链接

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Tree-sitter 文档](https://tree-sitter.github.io/tree-sitter/)
- [Vue 官方文档](https://vuejs.org/)
