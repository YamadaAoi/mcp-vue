import { spawn, ChildProcess } from 'child_process'

export class MCPServerTestClient {
  #server: ChildProcess
  #requestId = 1
  #pendingRequests = new Map<
    number,
    {
      resolve: (value: unknown) => void
      reject: (error: Error) => void
    }
  >()
  #buffer = ''

  constructor() {
    this.#server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    })

    this.#server.stdout?.on('data', (data: Buffer) => {
      this.#buffer += data.toString()
      const lines = this.#buffer.split('\n')
      this.#buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const response = JSON.parse(line)
          const pending = this.#pendingRequests.get(response.id as number)
          if (pending) {
            this.#pendingRequests.delete(response.id as number)
            if (response.error) {
              pending.reject(
                new Error(response.error.message || 'Unknown error')
              )
            } else {
              pending.resolve(response)
            }
          }
        } catch (error) {
          console.error('Error parsing response:', error)
        }
      }
    })
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.#requestId++
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id
      }

      this.#server.stdin?.write(JSON.stringify(request) + '\n')

      const timeout = setTimeout(() => {
        this.#pendingRequests.delete(id)
        reject(new Error(`Request ${id} timeout`))
      }, 30000)

      this.#pendingRequests.set(id, {
        resolve: (response: unknown) => {
          clearTimeout(timeout)
          resolve(response)
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    })

    await this.sendRequest('initialized')
  }

  async shutdown(): Promise<void> {
    await this.sendRequest('shutdown')
  }

  async close(): Promise<void> {
    this.#server.kill()
  }
}
