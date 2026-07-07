import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@Contexts': resolve(__dirname, 'src/Contexts'),
      '@Apps': resolve(__dirname, 'src/apps'),
      '@Test': resolve(__dirname, 'test'),
    },
  },
  test: {
    // Optional: replicate global Jest API availability (describe, it, expect, etc.)
    globals: true,
    allowOnly: false,

    // Files to run before each test suite for global setup
    setupFiles: [],

    // Test environment ('node' for backend, 'jsdom' for frontend)
    environment: 'node',

    env: {
      NODE_ENV: 'test',
      LOG_TYPES: 'console'
    },

    // Clear mocks before each test to avoid contamination
    clearMocks: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './reports/coverage',
      exclude: [
        // Common exclusions without testable logic
        'src/apps/**/config/**'
      ]
    },

    // Unit and integration tests run as projects of the same Vitest run, so v8
    // coverage is aggregated natively across both — no external merge step needed.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['**/*.unit.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['**/*.integration.test.ts'],
          testTimeout: 30000,
          // Integration tests share real MongoDB/RabbitMQ connections and must not
          // run concurrently within this project.
          fileParallelism: false
        }
      }
    ]
  }
});
