import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    build: {
      target: 'node18',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: 'index',
        formats: ['es']
      },
      outDir: 'dist',
      emptyOutDir: true,
      minify: isProduction,
      sourcemap: !isProduction,
      rollupOptions: {
        external: [
          '@vue/compiler-sfc',
          '@vue/compiler-sfc-v2',
          'web-tree-sitter',
          'tree-sitter-typescript',
          /^node:.*/
        ],
        output: {
          preserveModules: false,
          inlineDynamicImports: true
        }
      }
    }
  }
})
