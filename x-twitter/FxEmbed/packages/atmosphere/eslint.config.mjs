import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  eslintPluginPrettierRecommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', 'src/relay/generated/**'],
    plugins: { js },
    extends: ['js/recommended'],
    rules: {
      'prefer-arrow-callback': 1,
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
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  tseslint.configs.recommended,
  {
    // Ambient vendor typings (twitter.d.ts, bluesky.d.ts) are loaded via `///` refs.
    files: ['src/helpers/link-fixer.ts', 'src/helpers/palette.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off'
    }
  }
]);
