# MCP Vue/TypeScript 代码解析服务器

一个基于 Tree-sitter 的本地 MCP (Model Context Protocol) 服务器，用于解析和分析 TypeScript、JavaScript 和 Vue 代码。

## 功能特性

- 🌳 基于 Tree-sitter 的强大代码解析能力
- 📝 支持 TypeScript、JavaScript 和 Vue 单文件组件 (SFC)
- 🔍 提取函数、类、变量、导入、导出和类型定义
- 🎯 支持 Vue 模板分析（指令、绑定、事件、组件）
- ⚡ 高性能并发请求处理
- 📊 内置日志系统，支持控制台和文件输出
- 🔧 灵活的环境变量配置

## 安装

```bash
# 使用 npm
npm install mcp-vue

# 使用 pnpm
pnpm add mcp-vue

# 使用 yarn
yarn add mcp-vue
```

## 使用方法

### 作为 MCP 服务器使用

MCP 服务器通过标准输入/输出进行通信，支持 JSON-RPC 2.0 协议。

```bash
# 启动服务器
npx mcp-vue
```

### 配置日志

## MCP 工具列表

服务器提供以下工具用于代码分析：

### 1. parse_code

完整解析代码并提取所有 AST 信息。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名（用于确定语言和 Vue SFC 解析）

**返回：**

```json
{
  "success": true,
  "language": "typescript",
  "functions": [...],
  "classes": [...],
  "variables": [...],
  "imports": [...],
  "exports": [...],
  "types": [...],
  "vueTemplate": {...}
}
```

### 2. find_functions

查找代码中的所有函数。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 5,
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
  ]
}
```

### 3. find_classes

查找代码中的所有类及其成员。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 2,
  "classes": [
    {
      "name": "MyClass",
      "extends": "BaseClass",
      "implements": ["Interface1", "Interface2"],
      "methods": [...],
      "properties": [...],
      "position": {
        "start": {"row": 0, "column": 0},
        "end": {"row": 20, "column": 1}
      }
    }
  ]
}
```

### 4. find_imports

查找代码中的所有导入语句。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 3,
  "imports": [
    {
      "source": "vue",
      "imports": ["ref", "computed"],
      "isDefault": false,
      "isNamespace": false,
      "position": { "row": 0, "column": 0 }
    }
  ]
}
```

### 5. find_exports

查找代码中的所有导出语句。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 2,
  "exports": [
    {
      "name": "myFunction",
      "type": "function",
      "isDefault": false,
      "position": { "row": 10, "column": 0 }
    }
  ]
}
```

### 6. find_types

查找代码中的所有类型定义（接口、类型别名、枚举）。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 3,
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
  ]
}
```

### 7. find_variables

查找代码中的所有变量声明。

**参数：**

- `code` (string, 必需): 要解析的源代码
- `filename` (string, 必需): 文件名

**返回：**

```json
{
  "success": true,
  "count": 5,
  "variables": [
    {
      "name": "myVariable",
      "type": "string",
      "value": "\"hello\"",
      "isConst": true,
      "position": { "row": 0, "column": 0 }
    }
  ]
}
```

### 8. analyze_vue_template

分析 Vue 模板的指令、绑定、事件和组件。

**参数：**

- `code` (string, 必需): Vue SFC 源代码
- `filename` (string, 必需): 文件名（必须以 .vue 结尾）

**返回：**

```json
{
  "success": true,
  "template": {
    "directives": [
      {
        "name": "v-if",
        "value": "isVisible",
        "position": { "row": 5, "column": 4 }
      }
    ],
    "bindings": [
      {
        "name": "class",
        "value": "{ active: isActive }",
        "position": { "row": 6, "column": 4 }
      }
    ],
    "events": [
      {
        "name": "click",
        "handler": "handleClick",
        "position": { "row": 7, "column": 4 }
      }
    ],
    "components": [
      {
        "name": "MyComponent",
        "position": { "row": 8, "column": 4 }
      }
    ]
  }
}
```

## 配置选项

### 配置文件

MCP 服务器支持通过配置文件来设置日志选项。配置文件名为 `mcp-vue.config.json`，应放在项目根目录。

配置文件优先级高于默认值，如果不存在配置文件，则使用默认配置。

```json
{
  "logging": {
    "level": "DEBUG",
    "logFile": "./logs/mcp-server.log",
    "enableConsole": true,
    "enableFile": true
  }
}
```

### 配置项说明

| 配置项          | 类型           | 描述                                                     | 默认值               |
| --------------- | -------------- | -------------------------------------------------------- | -------------------- |
| `level`         | string         | 日志级别 (DEBUG, INFO, WARN, ERROR)                      | `"INFO"`             |
| `logFile`       | string \| null | 日志文件路径（相对于项目根目录），设为 null 禁用文件日志 | `"logs/mcp-vue.log"` |
| `enableConsole` | boolean        | 是否启用控制台输出                                       | `true`               |
| `enableFile`    | boolean        | 是否启用文件输出                                         | `true`               |

**路径说明**：

- 配置文件 `mcp-vue.config.json` 必须放在项目根目录
- 日志文件路径相对于项目根目录解析，无论从哪个目录启动程序
- 系统会自动识别项目根目录，支持以下场景：
  - **普通项目**：查找包含 `package.json` 且包含 `.git` 的目录
  - **Monorepo 项目**：查找包含 `workspaces` 配置、`pnpm-workspace.yaml` 或 `lerna.json` 的根目录
  - **从子目录启动**：即使从子包或子目录启动，也能正确找到项目根目录

### 配置示例

**示例 1：仅使用控制台输出（开发环境）**

```json
{
  "logging": {
    "level": "DEBUG",
    "enableConsole": true,
    "enableFile": false
  }
}
```

**示例 2：仅使用文件输出（生产环境）**

```json
{
  "logging": {
    "level": "INFO",
    "enableConsole": false,
    "enableFile": true,
    "logFile": "./logs/production.log"
  }
}
```

**示例 3：同时使用控制台和文件输出**

```json
{
  "logging": {
    "level": "WARN",
    "enableConsole": true,
    "enableFile": true,
    "logFile": "./logs/mcp-vue.log"
  }
}
```

### 日志级别说明

- **DEBUG**: 详细的调试信息，包括所有请求和响应
- **INFO**: 一般信息，包括工具调用和解析结果
- **WARN**: 警告信息
- **ERROR**: 错误信息

## 开发

### 克隆仓库

```bash
git clone https://github.com/YamadaAoi/mcp.git
cd mcp
```

### 安装依赖

```bash
pnpm install
```

### 构建项目

```bash
pnpm build
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test:basic        # 基础功能测试
pnpm test:typescript   # TypeScript 解析测试
pnpm test:vue          # Vue 解析测试
pnpm test:concurrency  # 并发处理测试
```

### 代码检查

```bash
# 运行 ESLint
pnpm lint

# 自动修复 ESLint 问题
pnpm lint:fix

# 运行 Prettier 格式化
pnpm format

# 检查代码格式
pnpm format:check

# TypeScript 类型检查
pnpm typecheck
```

## 项目结构

```
mcp/
├── src/
│   ├── services/
│   │   └── ast/              # AST 解析服务
│   │       ├── types.ts      # 类型定义
│   │       ├── index.ts      # 主入口和工具注册
│   │       ├── typescript/   # TypeScript 解析器
│   │       ├── vue/          # Vue 解析器
│   │       ├── pool/         # 解析器池（并发处理）
│   │       └── extractors/   # AST 提取器
│   ├── utils/
│   │   ├── mcpServer.ts      # MCP 服务器实现
│   │   ├── logger.ts         # 日志系统
│   │   └── mutex.ts          # 互斥锁实现
│   ├── tests/                # 测试文件
│   └── index.ts               # 项目入口
├── dist/                      # 构建输出
├── logs/                      # 日志文件（运行时生成）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 技术栈

- **TypeScript**: 主要开发语言
- **Vite**: 构建工具
- **Tree-sitter**: 代码解析库
- **@vue/compiler-sfc**: Vue SFC 编译器
- **web-tree-sitter**: Tree-sitter 的 WebAssembly 绑定

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
