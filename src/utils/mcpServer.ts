import { createInterface } from 'node:readline'
import { getLogger } from './logger.js'

export interface InitializeRequest {
  jsonrpc: '2.0'
  method: 'initialize'
  params?: MCPInitializeParams
  id: number | string
}

export interface InitializedRequest {
  jsonrpc: '2.0'
  method: 'initialized'
  params?: unknown
  id?: number | string
}

export interface ToolsListRequest {
  jsonrpc: '2.0'
  method: 'tools/list'
  params?: unknown
  id: number | string
}

export interface ToolsCallRequest {
  jsonrpc: '2.0'
  method: 'tools/call'
  params: { name: string; arguments?: Record<string, unknown> }
  id: number | string
}

export interface ShutdownRequest {
  jsonrpc: '2.0'
  method: 'shutdown'
  params?: unknown
  id: number | string
}

export type JSONRPCRequest =
  | InitializeRequest
  | InitializedRequest
  | ToolsListRequest
  | ToolsCallRequest
  | ShutdownRequest

export interface JSONRPCResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
  id: number | string | null
}

export interface Tool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description: string
      }
    >
    required?: string[]
  }
}

export interface MCPInitializeParams {
  protocolVersion: string
  capabilities: {
    roots?: {
      listChanged?: boolean
    }
    sampling?: object
  }
  clientInfo: {
    name: string
    version: string
  }
}

export interface MCPInitializeResult {
  protocolVersion: string
  capabilities: {
    tools: object
    resources?: object
    prompts?: object
  }
  serverInfo: {
    name: string
    version: string
  }
}

export type ToolHandler = (args: Record<string, unknown>) => unknown

export interface ToolRegistration {
  tool: Tool
  handler: ToolHandler
}

export class MCPServer {
  #tools: Map<string, ToolRegistration> = new Map()
  #name: string
  #version: string
  #logger = getLogger()

  constructor(name: string, version: string) {
    this.#name = name
    this.#version = version
    this.#registerDefaultTools()
    this.#logger.info(`MCP Server initialized: ${name} v${version}`)
  }

  #registerDefaultTools(): void {
    this.#tools.set('echo', {
      tool: {
        name: 'echo',
        description: 'Echo back the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to echo back'
            }
          },
          required: ['text']
        }
      },
      handler: (args: Record<string, unknown>) => {
        const text = args?.text as string
        return `Echo: ${text}`
      }
    })
  }

  registerTools(registrations: ToolRegistration[]): void {
    for (const registration of registrations) {
      this.#tools.set(registration.tool.name, registration)
    }
  }

  async #handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const { method, id } = request

    this.#logger.debug(`Received request: ${method}`, { id })

    try {
      switch (method) {
        case 'initialize':
          return this.#handleInitialize(id)

        case 'initialized':
          this.#logger.debug('Client initialized')
          return { jsonrpc: '2.0', result: null, id: id ?? null }

        case 'tools/list':
          return this.#handleToolsList(id)

        case 'tools/call':
          return this.#handleToolsCall(request.params, id)

        case 'shutdown':
          this.#logger.info('Shutdown requested')
          return { jsonrpc: '2.0', result: null, id }

        default:
          this.#logger.warn(`Unknown method: ${method as string}`)
          return {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method as string}`
            },
            id: id ?? null
          }
      }
    } catch (error) {
      this.#logger.error(`Error handling request: ${method}`, error)
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        },
        id: id ?? null
      }
    }
  }

  #handleInitialize(id: number | string): JSONRPCResponse {
    const result: MCPInitializeResult = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: this.#name,
        version: this.#version
      }
    }

    return { jsonrpc: '2.0', result, id }
  }

  #handleToolsList(id: number | string): JSONRPCResponse {
    const tools = Array.from(this.#tools.values()).map(({ tool }) => tool)

    return {
      jsonrpc: '2.0',
      result: { tools },
      id
    }
  }

  async #handleToolsCall(
    params: { name: string; arguments?: Record<string, unknown> },
    id: number | string
  ): Promise<JSONRPCResponse> {
    const { name, arguments: args } = params

    this.#logger.debug(`Tool called: ${name}`, { args })

    const registration = this.#tools.get(name)
    if (registration) {
      try {
        const result = registration.handler(args || {})
        const resolvedResult = await Promise.resolve(result)
        this.#logger.info(`Tool executed successfully: ${name}`)
        return {
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resolvedResult, null, 2)
              }
            ]
          },
          id
        }
      } catch (error) {
        this.#logger.error(`Tool execution failed: ${name}`, error)
        return {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message:
              error instanceof Error ? error.message : 'Tool execution error'
          },
          id
        }
      }
    }

    this.#logger.warn(`Unknown tool requested: ${name}`)
    return {
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: `Unknown tool: ${name}`
      },
      id
    }
  }

  start(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })

    this.#logger.info('MCP Server started, waiting for requests...')

    rl.on('line', line => {
      if (!line.trim()) return

      try {
        const request: JSONRPCRequest = JSON.parse(line) as JSONRPCRequest

        this.#handleRequest(request)
          .then(response => {
            try {
              const json = JSON.stringify(response)
              process.stdout.write(json + '\n')
            } catch (error) {
              this.#logger.error('Error serializing response', error)
              console.error('Error serializing response:', error)
            }
          })
          .catch(error => {
            this.#logger.error('Error handling request', error)
            console.error('Error handling request:', error)
          })
      } catch (error) {
        this.#logger.error('Error parsing request', { line, error })
        console.error('Error parsing request:', error)
      }
    })
  }
}
