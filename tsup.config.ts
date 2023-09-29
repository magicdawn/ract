import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    target: 'node16',
    clean: true,
    esbuildOptions(options, context) {
      options.charset = 'utf8'
    },
  }
})
