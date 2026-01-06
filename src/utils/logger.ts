import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

function findProjectRoot(): string {
  let currentDir = process.cwd()

  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = resolve(currentDir, 'package.json')

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          readFileSync(packageJsonPath, 'utf-8')
        ) as { workspaces?: unknown }

        const hasWorkspaces = Boolean(packageJson.workspaces)
        const hasMonorepoConfig =
          existsSync(resolve(currentDir, 'pnpm-workspace.yaml')) ||
          existsSync(resolve(currentDir, 'lerna.json'))
        const hasGit = existsSync(resolve(currentDir, '.git'))

        if (hasWorkspaces || hasMonorepoConfig || hasGit) {
          return currentDir
        }
      } catch {
        continue
      }
    }
    currentDir = dirname(currentDir)
  }

  return process.cwd()
}

const PROJECT_ROOT = findProjectRoot()

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: unknown
}

export interface LoggerConfig {
  level?: LogLevel | string
  logFile?: string | null
  enableConsole?: boolean
  enableFile?: boolean
}

interface MCPConfig {
  logging?: LoggerConfig
}

export class Logger {
  #level: LogLevel
  #logFile: string | null
  #enableConsole: boolean
  #enableFile: boolean

  constructor(options?: LoggerConfig) {
    const config = this.#loadConfig()

    this.#level = this.#parseLogLevel(options?.level ?? config?.level ?? 'INFO')
    const logFile = options?.logFile ?? config?.logFile ?? 'logs/mcp-vue.log'
    this.#logFile = resolve(PROJECT_ROOT, logFile)
    this.#enableConsole =
      options?.enableConsole ?? config?.enableConsole ?? true
    this.#enableFile = options?.enableFile ?? config?.enableFile ?? true

    if (this.#enableFile && this.#logFile) {
      this.#ensureLogDirectory()
    }
  }

  #loadConfig(): LoggerConfig | null {
    const configPath = resolve(PROJECT_ROOT, 'mcp-vue.config.json')

    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8')
        const config: MCPConfig = JSON.parse(content) as MCPConfig
        return config.logging || null
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error)
      }
    }

    return null
  }

  #parseLogLevel(level: LogLevel | string): LogLevel {
    if (typeof level === 'number') {
      return level
    }

    switch (level.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      default:
        return LogLevel.INFO
    }
  }

  #ensureLogDirectory(): void {
    if (this.#logFile) {
      const dir = dirname(this.#logFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }

  #formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.padEnd(5)
    const message = entry.message

    if (entry.data) {
      return `[${timestamp}] [${level}] ${message}\n${JSON.stringify(entry.data, null, 2)}`
    }

    return `[${timestamp}] [${level}] ${message}`
  }

  #log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.#level) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data
    }

    const formatted = this.#formatLogEntry(entry)

    if (this.#enableConsole) {
      const color = this.#getConsoleColor(level)
      console.error(`\x1b[${color}m${formatted}\x1b[0m`)
    }

    if (this.#enableFile && this.#logFile) {
      try {
        appendFileSync(this.#logFile, formatted + '\n')
      } catch (error) {
        console.error('Failed to write to log file:', error)
      }
    }
  }

  #getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '90'
      case LogLevel.INFO:
        return '36'
      case LogLevel.WARN:
        return '33'
      case LogLevel.ERROR:
        return '31'
      default:
        return '0'
    }
  }

  debug(message: string, data?: unknown): void {
    this.#log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: unknown): void {
    this.#log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: unknown): void {
    this.#log(LogLevel.WARN, message, data)
  }

  error(message: string, data?: unknown): void {
    this.#log(LogLevel.ERROR, message, data)
  }

  setLevel(level: LogLevel | string): void {
    this.#level = this.#parseLogLevel(level)
  }

  getLevel(): LogLevel {
    return this.#level
  }
}

let globalLogger: Logger | null = null

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger()
  }
  return globalLogger
}

export function setLogger(logger: Logger): void {
  globalLogger = logger
}
