import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  {
    files: ['packages/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint,
    },
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          ts: 'never',
        },
      ],
    },
    ignores: [
      'dist/**',
      'build/**',
      'out/**',
      'packages/*/dist/**',
      'packages/*/build/**',
      'packages/*/out/**',
    ],
  },
]);
