import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.js', '**/*.mjs', '**/*.cjs'],
    plugins: { js },
    extends: ['js/recommended'],
    rules: {
      'prefer-arrow-callback': 1,
      'jsdoc/require-jsdoc': 0,
      'jsdoc/require-param': 0,
      'jsdoc/require-returns': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    },
    // ignorePatterns: ['**/node_modules/**'],
    languageOptions: { globals: globals.browser }
  },
  tseslint.configs.recommended
]);
