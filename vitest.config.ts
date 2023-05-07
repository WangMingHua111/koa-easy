import { configDefaults, defineConfig } from 'vitest/config'
import esbuildPluginTsc from 'esbuild-plugin-tsc'
export default defineConfig({
  // esbuild: {
  //   target: 'es2020',
  //   plugins: [esbuildPluginTsc()],
  // },
  optimizeDeps:{
    esbuildOptions:{
      plugins: [esbuildPluginTsc()]
    }
  },
  test: {
    include: ['./vitest/**/*.test.ts'],
    exclude: [...configDefaults.exclude],
    watch: false,
    cache: false,
    singleThread: true
  },
})