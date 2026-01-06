import { type Node } from 'web-tree-sitter'
import type { ParseResult, ASTNode } from '../types'
import {
  extractFunctions,
  extractClasses,
  extractVariables,
  extractImports,
  extractExports,
  extractTypes
} from '../extractors'
import { getParserPool } from '../pool/parserPool'

function convertTreeSitterNode(node: Node): ASTNode {
  const children: ASTNode[] = []

  if (node.children) {
    for (const child of node.children) {
      if (child) {
        children.push(convertTreeSitterNode(child))
      }
    }
  }

  return {
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
    children
  }
}

export async function parseTypeScript(
  code: string,
  _filename: string
): Promise<ParseResult> {
  const pool = getParserPool()
  const parserInstance = await pool.acquire('typescript')

  try {
    const tree = parserInstance.parser.parse(code)

    if (!tree) {
      throw new Error('Failed to parse TypeScript code')
    }

    const rootNode = tree.rootNode
    const astNode = convertTreeSitterNode(rootNode)

    const functions = extractFunctions(astNode)
    const classes = extractClasses(astNode)
    const variables = extractVariables(astNode)
    const imports = extractImports(astNode)
    const exports = extractExports(astNode)
    const types = extractTypes(astNode)

    tree.delete()

    return {
      language: 'typescript',
      ast: astNode,
      functions,
      classes,
      variables,
      imports,
      exports,
      types
    }
  } finally {
    pool.release('typescript', parserInstance)
  }
}

export async function parseTSX(
  code: string,
  _filename: string
): Promise<ParseResult> {
  const pool = getParserPool()
  const parserInstance = await pool.acquire('tsx')

  try {
    const tree = parserInstance.parser.parse(code)

    if (!tree) {
      throw new Error('Failed to parse TSX code')
    }

    const rootNode = tree.rootNode
    const astNode = convertTreeSitterNode(rootNode)

    const functions = extractFunctions(astNode)
    const classes = extractClasses(astNode)
    const variables = extractVariables(astNode)
    const imports = extractImports(astNode)
    const exports = extractExports(astNode)
    const types = extractTypes(astNode)

    tree.delete()

    return {
      language: 'tsx',
      ast: astNode,
      functions,
      classes,
      variables,
      imports,
      exports,
      types
    }
  } finally {
    pool.release('tsx', parserInstance)
  }
}
