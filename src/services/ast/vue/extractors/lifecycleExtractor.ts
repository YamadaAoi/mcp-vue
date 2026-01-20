import type {
  Statement,
  ObjectExpression,
  ObjectMethod,
  ObjectProperty,
  CallExpression,
  Expression,
  BlockStatement,
  RestElement,
  Identifier,
  ObjectPattern,
  ArrayPattern,
  AssignmentPattern,
  VoidPattern
} from '@babel/types'
import type { LifecycleHookInfo } from '../types'
import { getPositionFromNode, getEndPositionFromNode } from './extractUtil'

const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'beforeUnmount',
  'unmounted',
  'activated',
  'deactivated',
  'errorCaptured',
  'renderTracked',
  'renderTriggered',
  'serverPrefetch'
]

const COMPOSITION_LIFECYCLE_HOOKS = [
  'onBeforeMount',
  'onMounted',
  'onBeforeUpdate',
  'onUpdated',
  'onBeforeUnmount',
  'onUnmounted',
  'onActivated',
  'onDeactivated',
  'onErrorCaptured',
  'onRenderTracked',
  'onRenderTriggered',
  'onServerPrefetch'
]

function parseParameters(node: Expression | null | undefined): string[] {
  if (!node) return []

  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    return node.params.map(param => parseParameter(param))
  }

  return []
}

function parseParameter(
  param:
    | Identifier
    | ObjectPattern
    | ArrayPattern
    | RestElement
    | AssignmentPattern
    | VoidPattern
): string {
  if (param.type === 'Identifier') {
    return param.name
  } else if (param.type === 'ObjectPattern') {
    return '{ ... }'
  } else if (param.type === 'ArrayPattern') {
    return '[ ... ]'
  } else if (param.type === 'RestElement') {
    const argument = param.argument
    if (argument.type === 'Identifier') {
      return `...${argument.name || 'args'}`
    }
    return '...args'
  } else if (param.type === 'AssignmentPattern') {
    const left = param.left
    if (left.type === 'Identifier') {
      return `${left.name} = ...`
    } else if (left.type === 'ObjectPattern') {
      return '{ ... } = ...'
    } else if (left.type === 'ArrayPattern') {
      return '[ ... ] = ...'
    }
    return 'unknown'
  } else if (param.type === 'VoidPattern') {
    return 'void'
  }
  return 'unknown'
}

function createLifecycleHookInfo(
  name: string,
  callExpr: CallExpression
): LifecycleHookInfo {
  const firstArg = callExpr.arguments[0]
  const parameters =
    firstArg &&
    firstArg.type !== 'SpreadElement' &&
    firstArg.type !== 'ArgumentPlaceholder'
      ? parseParameters(firstArg)
      : []

  return {
    name,
    parameters,
    startPosition: getPositionFromNode(callExpr),
    endPosition: getEndPositionFromNode(callExpr)
  }
}

function extractLifecycleHooksFromObjectExpression(
  objExpr: ObjectExpression
): LifecycleHookInfo[] {
  const hooks: LifecycleHookInfo[] = []

  for (const prop of objExpr.properties) {
    if (prop.type === 'ObjectMethod') {
      const method = prop
      if (
        method.key.type === 'Identifier' &&
        LIFECYCLE_HOOKS.includes(method.key.name)
      ) {
        hooks.push({
          name: method.key.name,
          parameters: method.params.map(param => parseParameter(param)),
          startPosition: getPositionFromNode(method),
          endPosition: getEndPositionFromNode(method)
        })
      }
    } else if (prop.type === 'ObjectProperty') {
      const objProp = prop
      if (
        objProp.key.type === 'Identifier' &&
        LIFECYCLE_HOOKS.includes(objProp.key.name)
      ) {
        const parameters =
          objProp.value.type === 'ArrowFunctionExpression' ||
          objProp.value.type === 'FunctionExpression'
            ? parseParameters(objProp.value)
            : []

        hooks.push({
          name: objProp.key.name,
          parameters,
          startPosition: getPositionFromNode(objProp),
          endPosition: getEndPositionFromNode(objProp)
        })
      }
    }
  }

  return hooks
}

function isLifecycleHookCall(callExpr: CallExpression): string | null {
  const callee = callExpr.callee

  if (
    callee.type === 'Identifier' &&
    COMPOSITION_LIFECYCLE_HOOKS.includes(callee.name)
  ) {
    return callee.name
  }

  if (
    callee.type === 'MemberExpression' &&
    callee.property.type === 'Identifier' &&
    COMPOSITION_LIFECYCLE_HOOKS.includes(callee.property.name)
  ) {
    return callee.property.name
  }

  return null
}

function extractLifecycleHooksFromBlock(
  block: BlockStatement
): LifecycleHookInfo[] {
  const hooks: LifecycleHookInfo[] = []

  function processCallExpression(callExpr: CallExpression): void {
    const hookName = isLifecycleHookCall(callExpr)
    if (hookName) {
      hooks.push(createLifecycleHookInfo(hookName, callExpr))
    }
  }

  for (const stmt of block.body) {
    if (stmt.type === 'ExpressionStatement') {
      const exprStmt = stmt
      if (exprStmt.expression.type === 'CallExpression') {
        processCallExpression(exprStmt.expression)
      }
    } else if (stmt.type === 'VariableDeclaration') {
      for (const declarator of stmt.declarations) {
        if (declarator.init && declarator.init.type === 'CallExpression') {
          processCallExpression(declarator.init)
        }
      }
    } else if (stmt.type === 'ReturnStatement') {
      const returnStmt = stmt
      if (returnStmt.argument) {
        if (returnStmt.argument.type === 'ObjectExpression') {
          const objExpr = returnStmt.argument
          for (const prop of objExpr.properties) {
            if (prop.type === 'ObjectProperty') {
              const objProp = prop
              if (
                objProp.value.type === 'CallExpression' ||
                objProp.value.type === 'ArrowFunctionExpression' ||
                objProp.value.type === 'FunctionExpression'
              ) {
                if (objProp.value.type === 'CallExpression') {
                  processCallExpression(objProp.value)
                }
              }
            }
          }
        }
      }
    }
  }

  return hooks
}

function extractLifecycleHooksFromCompositionAPI(
  ast: Statement[]
): LifecycleHookInfo[] {
  const hooks: LifecycleHookInfo[] = []

  function processSetupProperty(prop: ObjectMethod | ObjectProperty): void {
    if (prop.type === 'ObjectMethod') {
      const objMethod = prop
      if (
        objMethod.key.type === 'Identifier' &&
        objMethod.key.name === 'setup'
      ) {
        if (objMethod.body.type === 'BlockStatement') {
          hooks.push(...extractLifecycleHooksFromBlock(objMethod.body))
        }
      }
    } else if (prop.type === 'ObjectProperty') {
      const objProp = prop
      if (
        objProp.key.type === 'Identifier' &&
        objProp.key.name === 'setup' &&
        objProp.value.type === 'FunctionExpression'
      ) {
        const setupFunc = objProp.value
        if (setupFunc.body.type === 'BlockStatement') {
          hooks.push(...extractLifecycleHooksFromBlock(setupFunc.body))
        }
      }
    }
  }

  function processNodeForLifecycleHooks(node: Statement): void {
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (declarator.init && declarator.init.type === 'CallExpression') {
          const hookName = isLifecycleHookCall(declarator.init)
          if (hookName) {
            hooks.push(createLifecycleHookInfo(hookName, declarator.init))
          }
        }
      }
    } else if (node.type === 'ExpressionStatement') {
      const exprStmt = node
      if (exprStmt.expression.type === 'CallExpression') {
        const hookName = isLifecycleHookCall(exprStmt.expression)
        if (hookName) {
          hooks.push(createLifecycleHookInfo(hookName, exprStmt.expression))
        }
      }
    }
  }

  for (const node of ast) {
    processNodeForLifecycleHooks(node)

    if (node.type === 'ExportDefaultDeclaration') {
      const exportDecl = node
      if (exportDecl.declaration.type === 'ObjectExpression') {
        const objExpr = exportDecl.declaration
        for (const prop of objExpr.properties) {
          if (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') {
            processSetupProperty(prop)
          }
        }
      } else if (exportDecl.declaration.type === 'CallExpression') {
        const callExpr = exportDecl.declaration
        if (
          callExpr.callee.type === 'Identifier' &&
          callExpr.callee.name === 'defineComponent' &&
          callExpr.arguments.length > 0 &&
          callExpr.arguments[0].type === 'ObjectExpression'
        ) {
          const objExpr = callExpr.arguments[0]
          for (const prop of objExpr.properties) {
            if (
              prop.type === 'ObjectMethod' ||
              prop.type === 'ObjectProperty'
            ) {
              processSetupProperty(prop)
            }
          }
        }
      }
    }
  }

  return hooks
}

export function extractLifecycleHooks(ast: Statement[]): LifecycleHookInfo[] {
  const hooks: LifecycleHookInfo[] = []

  for (const node of ast) {
    if (node.type === 'ExportDefaultDeclaration') {
      const exportDecl = node
      if (exportDecl.declaration.type === 'ObjectExpression') {
        hooks.push(
          ...extractLifecycleHooksFromObjectExpression(exportDecl.declaration)
        )
      } else if (exportDecl.declaration.type === 'CallExpression') {
        const callExpr = exportDecl.declaration
        if (
          callExpr.arguments.length > 0 &&
          callExpr.arguments[0].type === 'ObjectExpression'
        ) {
          hooks.push(
            ...extractLifecycleHooksFromObjectExpression(callExpr.arguments[0])
          )
        }
      }
    }
  }

  const compositionHooks = extractLifecycleHooksFromCompositionAPI(ast)
  hooks.push(...compositionHooks)

  return hooks
}
