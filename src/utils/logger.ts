import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const PACKAGE_JSON_FILE = 'package.json' as const
const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml' as const
const LERNA_CONFIG_FILE = 'lerna.json' as const
const GIT_DIR = '.git' as const
const CONFIG_FILE = 'mcp-vue.config.json' as const
const LOG_FILE_EXTENSION = '.log' as const
const DATE_SEPARATOR = '-' as const

function findProjectRoot(): string {
  let currentDir = process.cwd()

  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = resolve(currentDir, PACKAGE_JSON_FILE)

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          readFileSync(packageJsonPath, 'utf-8')
        ) as { workspaces?: unknown }

        const hasWorkspaces = Boolean(packageJson.workspaces)
        const hasMonorepoConfig =
          existsSync(resolve(currentDir, PNPM_WORKSPACE_FILE)) ||
          existsSync(resolve(currentDir, LERNA_CONFIG_FILE))
        const hasGit = existsSync(resolve(currentDir, GIT_DIR))

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

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const CONSOLE_COLORS = {
  [LogLevel.DEBUG]: '90',
  [LogLevel.INFO]: '36',
  [LogLevel.WARN]: '33',
  [LogLevel.ERROR]: '31'
} as const

const LOG_LEVEL_MAPPING = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR
} as const

interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: unknown
}

interface LoggerConfig {
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
  #logFileBase: string
  #currentDate: string
  #enableConsole: boolean
  #enableFile: boolean

  constructor(options?: LoggerConfig) {
    const config = this.#loadConfig()

    this.#level = this.#parseLogLevel(options?.level ?? config?.level ?? 'INFO')
    this.#logFileBase =
      options?.logFile ?? config?.logFile ?? 'logs/mcp-vue.log'
    this.#currentDate = this.#getCurrentDate()
    this.#logFile = this.#generateLogFilePath()
    this.#enableConsole =
      options?.enableConsole ?? config?.enableConsole ?? true
    this.#enableFile = options?.enableFile ?? config?.enableFile ?? true

    if (this.#enableFile && this.#logFile) {
      this.#ensureLogDirectory()
    }
  }

  #loadConfig(): LoggerConfig | null {
    const configPath = resolve(PROJECT_ROOT, CONFIG_FILE)

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

    const upperLevel = level.toUpperCase()
    return (
      LOG_LEVEL_MAPPING[upperLevel as keyof typeof LOG_LEVEL_MAPPING] ??
      LogLevel.INFO
    )
  }

  #ensureLogDirectory(): void {
    if (this.#logFile) {
      const dir = dirname(this.#logFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }

  #getCurrentDate(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  #generateLogFilePath(): string {
    const baseName = this.#logFileBase.replace(
      new RegExp(`${LOG_FILE_EXTENSION}$`),
      ''
    )
    return resolve(
      PROJECT_ROOT,
      `${baseName}${DATE_SEPARATOR}${this.#currentDate}${LOG_FILE_EXTENSION}`
    )
  }

  #checkDateChange(): void {
    const newDate = this.#getCurrentDate()
    if (newDate !== this.#currentDate) {
      this.#currentDate = newDate
      this.#logFile = this.#generateLogFilePath()
      this.#ensureLogDirectory()
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
      this.#checkDateChange()
      try {
        appendFileSync(this.#logFile, formatted + '\n')
      } catch (error) {
        console.error('Failed to write to log file:', error)
      }
    }
  }

  #getConsoleColor(level: LogLevel): string {
    return CONSOLE_COLORS[level] ?? '0'
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
