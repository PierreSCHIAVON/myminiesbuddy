import { defineConfig } from 'vitest/config'
import path from 'path'

const mocks = path.resolve(__dirname, './src/__tests__/__mocks__')

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@warforge/db': path.resolve(__dirname, '../../packages/db/src'),
      // Redirect Next.js server-only modules to static mocks so route handlers
      // can be imported in the Node test environment without errors.
      'next/server': path.join(mocks, 'next-server.ts'),
      'next/headers': path.join(mocks, 'next-headers.ts'),
      'next/navigation': path.join(mocks, 'next-navigation.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://warforge:warforge_dev@localhost:5435/warforge_dev',
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    // Run test files sequentially — avoids DB race conditions (Vitest 4 API)
    fileParallelism: false,
  },
})
