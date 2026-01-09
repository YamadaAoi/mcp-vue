import { type Node, type Tree } from 'web-tree-sitter'
import type { ParseResult, ASTNode } from '../types'
import {
  extractFunctions,
  extractFunctionCalls,
  extractClasses,
  extractVariables,
  extractImports,
  extractExports,
  extractTypes
} from '../extractors'
import { getParserPool } from '../pool/parserPool'
import { getLogger } from '../../../utils/logger'

const SUPPORTED_EXTENSIONS = ['ts', 'js', 'tsx', 'jsx'] as const

const LANGUAGE_MAP = {
  ts: 'typescript',
  js: 'javascript',
  tsx: 'tsx',
  jsx: 'jsx'
} as const

const logger = getLogger()

function isSupportedExtension(
  ext: string
): ext is (typeof SUPPORTED_EXTENSIONS)[number] {
  return SUPPORTED_EXTENSIONS.includes(
    ext as (typeof SUPPORTED_EXTENSIONS)[number]
  )
}

function validateInput(code: string, filename: string): void {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code: code must be a non-empty string')
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: filename must be a non-empty string')
  }
}

function getLanguageType(
  filename: string
): 'typescript' | 'tsx' | 'javascript' | 'jsx' {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (!ext || !isSupportedExtension(ext)) {
    logger.warn(`Unsupported file extension: ${ext}, defaulting to typescript`)
    return 'typescript'
  }

  return LANGUAGE_MAP[ext]
}

function getLanguageFromExtension(ext: string): string {
  if (ext === 'js') {
    return 'javascript'
  }
  if (ext === 'jsx') {
    return 'jsx'
  }
  if (ext === 'ts') {
    return 'typescript'
  }
  if (ext === 'tsx') {
    return 'tsx'
  }
  return ext
}

function convertTreeSitterNode(node: Node): ASTNode {
  const stack: { node: Node; astNode: ASTNode }[] = []

  const astNode: ASTNode = {
    type: node.type,
    text: node.text,
    startPosition: {
      row: node.startPosition.row,
      column: node.startPosition.column
    },
    endPosition: {
      row: node.endPosition.row,
      column: node.endPosition.column
    },
    children: []
  }

  stack.push({ node, astNode })

  while (stack.length > 0) {
    const { node: currentNode, astNode: currentAST } = stack.pop()!

    if (currentNode.children) {
      for (const child of currentNode.children) {
        if (child) {
          const childAST: ASTNode = {
            type: child.type,
            text: child.text,
            startPosition: {
              row: child.startPosition.row,
              column: child.startPosition.column
            },
            endPosition: {
              row: child.endPosition.row,
              column: child.endPosition.column
            },
            children: []
          }
          currentAST.children.push(childAST)
          stack.push({ node: child, astNode: childAST })
        }
      }
    }
  }

  return astNode
}

async function parseCode(
  code: string,
  filename: string,
  languageTypeOverride?: 'typescript' | 'tsx' | 'javascript' | 'jsx'
): Promise<ParseResult> {
  validateInput(code, filename)

  const ext = filename.split('.').pop()?.toLowerCase()
  const languageType = languageTypeOverride || getLanguageType(filename)
  const pool = getParserPool()

  logger.debug(`Parsing ${languageType} file: ${filename}`)

  const parserInstance = await pool.acquire(languageType)
  let tree: Tree | null = null

  try {
    const startTime = performance.now()
    tree = parserInstance.parser.parse(code)

    if (!tree) {
      throw new Error(`Failed to parse ${languageType} code: ${filename}`)
    }

    const rootNode = tree.rootNode

    if (rootNode.hasError) {
      logger.warn(`Syntax errors detected in ${filename}`)
    }

    const astNode = convertTreeSitterNode(rootNode)

    const functions = extractFunctions(astNode)
    const functionCalls = extractFunctionCalls(astNode)
    const classes = extractClasses(astNode)
    const variables = extractVariables(astNode)
    const imports = extractImports(astNode)
    const exports = extractExports(astNode)
    const types = extractTypes(astNode)

    const duration = performance.now() - startTime
    logger.debug(`Parsed ${filename} in ${duration.toFixed(2)}ms`, {
      functions: functions.length,
      functionCalls: functionCalls.length,
      classes: classes.length,
      variables: variables.length,
      imports: imports.length,
      exports: exports.length,
      types: types.length
    })

    return {
      language: ext ? getLanguageFromExtension(ext) : languageType,
      ast: astNode,
      functions,
      functionCalls,
      classes,
      variables,
      imports,
      exports,
      types
    }
  } catch (error) {
    logger.error(
      `Error parsing ${filename}:`,
      error instanceof Error ? error : String(error)
    )
    throw error
  } finally {
    if (tree) {
      try {
        tree.delete()
      } catch (error) {
        logger.warn(
          'Failed to delete tree:',
          error instanceof Error ? error : String(error)
        )
      }
    }
    pool.release(languageType, parserInstance)
  }
}

export async function parseTypeScript(
  code: string,
  filename: string,
  languageType?: 'typescript' | 'javascript'
): Promise<ParseResult> {
  return parseCode(code, filename, languageType)
}

export async function parseTSX(
  code: string,
  filename: string,
  languageType?: 'tsx' | 'jsx'
): Promise<ParseResult> {
  return parseCode(code, filename, languageType)
}
