import obsidianmd from 'eslint-plugin-obsidianmd';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'node_modules',
    'plugins/**/main.js',
    'eslint.config.mjs',
    'vite.config.ts',
    'oxfmt.config.ts',
    'oxlint.config.ts',
    'package.json',
    'manifest.json',
  ]),
  // this must be set for some reason
  { languageOptions: { parserOptions: { projectService: {} } } },
  ...obsidianmd.configs.recommended,
  {
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'eslint-comments/no-restricted-disable': 'off',
      'obsidianmd/ui/sentence-case': [
        'warn',
        {
          brands: ['Keystone', 'Latex Suite'],
        },
      ],
    },
  },
]);
