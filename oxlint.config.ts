import obsidianmd from 'eslint-plugin-obsidianmd';
import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
    reportUnusedDisableDirectives: 'warn',
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    pedantic: 'warn',
    perf: 'warn',
  },
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'import'],
  jsPlugins: ['eslint-plugin-obsidianmd'],
  rules: {
    ...obsidianmd.ruleConfigs.recommended,
    'sort-keys': 'off',
    'no-ternary': 'off',
    'no-warning-comments': 'off',
    'no-new': 'off',
    'typescript/prefer-readonly-parameter-types': 'off',
    'typescript/strict-boolean-expressions': 'off',
    'obsidianmd/ui/sentence-case': ['warn', { brands: ['Keystone', 'Latex Suite'] }],
  },
  ignorePatterns: ['dist/**', 'scripts/**'],
});
