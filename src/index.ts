#!/usr/bin/env node
import { MCPServer } from './utils/mcpServer'
import { createASTTools } from './services/ast'

function main() {
  const server = new MCPServer('local-mcp-vue-server', '1.0.0')

  const astTools = createASTTools()
  server.registerTools(astTools)

  server.start()
}

main()
