import type { TsParseResult } from './typescript/types'

export type ParseResult = TsParseResult

export interface MappedParseResult {
  success: boolean
  language: string
  functions: Array<{
    name: string
    type: string
    parameters: string[]
    returnType?: string
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  functionCalls: Array<{
    name: string
    arguments: string[]
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  classes: Array<{
    name: string
    extends?: string
    implements?: string[]
    methods: Array<{
      name: string
      parameters: string[]
      returnType?: string
    }>
    properties: Array<{
      name: string
      type?: string
      isReadonly: boolean
      visibility?: 'public' | 'private' | 'protected'
    }>
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  variables: Array<{
    name: string
    type?: string
    value?: string
    isConst: boolean
    position: { row: number; column: number }
  }>
  imports: Array<{
    source: string
    imports: string[]
    isDefault: boolean
    isNamespace: boolean
    position: { row: number; column: number }
  }>
  exports: Array<{
    name: string
    type: 'function' | 'class' | 'variable' | 'type'
    isDefault: boolean
    position: { row: number; column: number }
  }>
  types: Array<{
    name: string
    kind: 'interface' | 'type' | 'enum' | 'class'
    properties: Array<{
      name: string
      type?: string
      isOptional: boolean
      isReadonly: boolean
    }>
    methods: Array<{
      name: string
      parameters: string[]
      returnType?: string
    }>
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
}
