import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const CONFIG_FILE = 'mcp-vue.config.json' as const
const PACKAGE_JSON_FILE = 'package.json' as const
const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml' as const
const LERNA_CONFIG_FILE = 'lerna.json' as const
const GIT_DIR = '.git' as const

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const LOG_LEVEL_MAPPING = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR
} as const

interface LoggerConfig {
  level?: LogLevel | string
  logFile?: string | null
  enableConsole?: boolean
  enableFile?: boolean
}

interface MCPConfig {
  cwd?: string
  logging?: LoggerConfig
}

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

function loadConfig(): MCPConfig | null {
  const projectRoot = findProjectRoot()
  const configPath = resolve(projectRoot, CONFIG_FILE)

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8')
      return JSON.parse(content) as MCPConfig
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error)
    }
  }

  return null
}

function parseLogLevel(level: LogLevel | string): LogLevel {
  if (typeof level === 'number') {
    return level
  }

  const upperLevel = level.toUpperCase()
  return (
    LOG_LEVEL_MAPPING[upperLevel as keyof typeof LOG_LEVEL_MAPPING] ??
    LogLevel.INFO
  )
}

class ConfigManager {
  #config: MCPConfig | null
  #projectRoot: string

  constructor() {
    this.#config = loadConfig()
    this.#projectRoot = findProjectRoot()
  }

  get cwd(): string {
    const configuredCwd = this.#config?.cwd
    if (configuredCwd) {
      const resolvedCwd = resolve(this.#projectRoot, configuredCwd)
      if (existsSync(resolvedCwd)) {
        return resolvedCwd
      }
      console.warn(
        `Configured cwd does not exist: ${configuredCwd}, using project root`
      )
    }
    return this.#projectRoot
  }

  get projectRoot(): string {
    return this.#projectRoot
  }

  get logging(): LoggerConfig | null {
    return this.#config?.logging || null
  }

  get logLevel(): LogLevel {
    return parseLogLevel(this.logging?.level ?? 'INFO')
  }

  get logFile(): string {
    return this.logging?.logFile || 'logs/mcp-vue.log'
  }

  get enableConsole(): boolean {
    return this.logging?.enableConsole ?? true
  }

  get enableFile(): boolean {
    return this.logging?.enableFile ?? true
  }

  reload(): void {
    this.#config = loadConfig()
    this.#projectRoot = findProjectRoot()
  }
}

let configManagerInstance: ConfigManager | null = null

export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager()
  }
  return configManagerInstance
}

export type { LoggerConfig, MCPConfig }
export { LogLevel, LOG_LEVEL_MAPPING, parseLogLevel }
