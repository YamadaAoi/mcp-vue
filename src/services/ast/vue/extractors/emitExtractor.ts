import type {
  Statement,
  ObjectExpression,
  ArrayExpression,
  StringLiteral,
  ObjectProperty,
  CallExpression,
  Identifier,
  TSTypeLiteral,
  TSCallSignatureDeclaration
} from '@babel/types'
import type { EmitInfo } from '../types'
import { getPositionFromNode } from './importExtractor'

const EMITS_PROPERTY_NAME = 'emits'
const DEFINE_EMITS_NAME = 'defineEmits'

type LocatableNode = {
  loc?:
    | {
        start?: { line?: number; column?: number }
        end?: { line?: number; column?: number }
      }
    | null
    | undefined
}

function getEndPositionFromNode(node: LocatableNode): {
  row: number
  column: number
} {
  const position = node?.loc?.end
  return {
    row: position?.line || 0,
    column: position?.column || 0
  }
}

function parseEmitProperty(prop: ObjectProperty): EmitInfo | null {
  const key = prop.key
  let emitName: string | null = null

  if (key.type === 'Identifier' && key.name) {
    emitName = key.name
  } else if (key.type === 'StringLiteral' && key.value) {
    emitName = key.value
  }

  if (!emitName) {
    return null
  }

  return {
    name: emitName,
    startPosition: getPositionFromNode(prop),
    endPosition: getEndPositionFromNode(prop)
  }
}

function extractEmitsFromObjectExpression(
  objExpr: ObjectExpression
): EmitInfo[] {
  const emits: EmitInfo[] = []

  for (const prop of objExpr.properties) {
    if (prop.type === 'ObjectProperty') {
      const emitInfo = parseEmitProperty(prop)
      if (emitInfo) {
        emits.push(emitInfo)
      }
    }
  }

  return emits
}

function extractEmitsFromArrayExpression(arrExpr: ArrayExpression): EmitInfo[] {
  const emits: EmitInfo[] = []

  for (const element of arrExpr.elements) {
    if (!element) continue

    const emitName = extractEmitNameFromElement(element)
    if (emitName) {
      emits.push({
        name: emitName,
        startPosition: getPositionFromNode(element),
        endPosition: getEndPositionFromNode(element)
      })
    }
  }

  return emits
}

function extractEmitNameFromElement(element: unknown): string | null {
  if (typeof element !== 'object' || element === null || !('type' in element)) {
    return null
  }

  if (element.type === 'StringLiteral') {
    return (element as StringLiteral).value
  } else if (element.type === 'Identifier') {
    return (element as Identifier).name
  }
  return null
}

function isDefineEmitsCall(node: CallExpression | null | undefined): boolean {
  if (!node) {
    return false
  }
  const callee = node.callee
  if (!callee) {
    return false
  }
  if (callee.type === 'Identifier') {
    return callee.name === DEFINE_EMITS_NAME
  } else if (callee.type === 'MemberExpression') {
    return (
      callee.property.type === 'Identifier' &&
      callee.property.name === DEFINE_EMITS_NAME
    )
  }
  return false
}

function extractEmitsFromDefineEmits(callExpr: CallExpression): EmitInfo[] {
  const emits: EmitInfo[] = []

  if (callExpr.typeParameters && callExpr.typeParameters.params.length > 0) {
    const firstTypeParam = callExpr.typeParameters.params[0]
    if (firstTypeParam.type === 'TSTypeLiteral') {
      return extractEmitsFromTSTypeLiteral(firstTypeParam)
    }
  }

  if (callExpr.arguments.length > 0) {
    const firstArg = callExpr.arguments[0]

    if (firstArg.type === 'ArrayExpression') {
      return extractEmitsFromArrayExpression(firstArg)
    } else if (firstArg.type === 'ObjectExpression') {
      return extractEmitsFromObjectExpression(firstArg)
    }
  }

  return emits
}

function extractEmitNameFromTSCallSignature(
  member: TSCallSignatureDeclaration
): string | null {
  if (member.parameters.length === 0) {
    return null
  }

  const firstParam = member.parameters[0]
  if (
    firstParam.type !== 'Identifier' ||
    !firstParam.typeAnnotation ||
    firstParam.typeAnnotation.type === 'Noop' ||
    !firstParam.typeAnnotation.typeAnnotation
  ) {
    return null
  }

  const typeAnnotation = firstParam.typeAnnotation.typeAnnotation
  if (typeAnnotation.type !== 'TSLiteralType') {
    return null
  }

  const literal = typeAnnotation.literal
  if (literal.type !== 'StringLiteral') {
    return null
  }

  return literal.value
}

function extractEmitsFromTSTypeLiteral(typeLiteral: TSTypeLiteral): EmitInfo[] {
  const emits: EmitInfo[] = []

  for (const member of typeLiteral.members) {
    if (member.type === 'TSCallSignatureDeclaration') {
      const emitName = extractEmitNameFromTSCallSignature(member)
      if (emitName) {
        emits.push({
          name: emitName,
          startPosition: getPositionFromNode(member),
          endPosition: getEndPositionFromNode(member)
        })
      }
    }
  }

  return emits
}

function extractEmitsFromObjectProperties(
  objExpr: ObjectExpression
): EmitInfo[] {
  for (const prop of objExpr.properties) {
    if (prop.type === 'ObjectProperty') {
      const objProp = prop
      const isEmitsProperty =
        (objProp.key.type === 'Identifier' &&
          objProp.key.name === EMITS_PROPERTY_NAME) ||
        (objProp.key.type === 'StringLiteral' &&
          objProp.key.value === EMITS_PROPERTY_NAME)

      if (isEmitsProperty) {
        if (objProp.value.type === 'ArrayExpression') {
          return extractEmitsFromArrayExpression(objProp.value)
        } else if (objProp.value.type === 'ObjectExpression') {
          return extractEmitsFromObjectExpression(objProp.value)
        }
      }
    }
  }
  return []
}

export function extractEmits(ast: Statement[]): EmitInfo[] {
  const emits: EmitInfo[] = []

  for (const node of ast) {
    if (node.type === 'ExportDefaultDeclaration') {
      const exportDecl = node
      if (exportDecl.declaration.type === 'ObjectExpression') {
        emits.push(...extractEmitsFromObjectProperties(exportDecl.declaration))
      } else if (exportDecl.declaration.type === 'CallExpression') {
        const callExpr = exportDecl.declaration

        if (
          callExpr.arguments.length > 0 &&
          callExpr.arguments[0].type === 'ObjectExpression'
        ) {
          emits.push(...extractEmitsFromObjectProperties(callExpr.arguments[0]))
        }
      }
    }

    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (
          declarator.init &&
          declarator.init.type === 'CallExpression' &&
          isDefineEmitsCall(declarator.init)
        ) {
          emits.push(...extractEmitsFromDefineEmits(declarator.init))
        }
      }
    }
  }

  return emits
}
