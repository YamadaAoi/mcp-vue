export interface Position {
  row: number
  column: number
}

export function formatPosition(position: Position | undefined | null): string {
  if (!position) return ''
  return `[L${position.row}:C${position.column}]`
}

export function formatParameters(
  parameters: string[] | undefined | null
): string {
  if (!parameters || parameters.length === 0) return 'none'
  return parameters.join(', ')
}

export function formatVariableValue(value: string | undefined | null): string {
  if (!value) return 'undefined'
  if (value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return value
}

export function formatImport(
  importedNames: string[],
  source: string,
  isDefaultImport: boolean,
  isNamespaceImport: boolean
): string {
  const parts: string[] = []

  if (isDefaultImport) {
    parts.push(`default ${importedNames[0]}`)
  } else if (isNamespaceImport) {
    parts.push(`* as ${importedNames[0]}`)
  } else {
    parts.push(importedNames.join(', '))
  }

  parts.push(`from ${source}`)
  return parts.join(' ')
}
