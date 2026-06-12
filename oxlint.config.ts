import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    pedantic: 'warn',
    perf: 'warn',
  },
  rules: {
    'sort-keys': 'off',
    'no-ternary': 'off',
    'typescript/prefer-readonly-parameter-types': 'off',
    'typescript/strict-boolean-expressions': 'off',
  },
});
