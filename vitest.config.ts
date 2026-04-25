import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/test-setup.ts'],
    include: ['test/unit/**/*.unit.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/test-setup.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.decorator.ts',
        'src/**/*.strategy.ts',
        'src/prisma/**',
      ],
      thresholds: { lines: 90, branches: 85 },
      reporter: ['text', 'lcov'],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
      },
    }),
  ],
});
