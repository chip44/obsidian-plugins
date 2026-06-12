import { builtinModules } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import { defineConfig, type UserConfig } from 'vite';

const plugin = process.env.PLUGIN;

export default defineConfig(({ mode }) => {
  if (!plugin) throw new Error('PLUGIN is required');

  const prod = mode === 'production';

  const config: UserConfig = {
    build: {
      lib: {
        entry: `plugins/${plugin}/src/main.ts`,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      outDir: `plugins/${plugin}`,
      emptyOutDir: false,
      minify: prod ? 'oxc' : false,
      sourcemap: prod ? false : 'inline',
      cssCodeSplit: false,
      rolldownOptions: {
        external: [
          'obsidian',
          'electron',
          '@codemirror/autocomplete',
          '@codemirror/collab',
          '@codemirror/commands',
          '@codemirror/language',
          '@codemirror/lint',
          '@codemirror/search',
          '@codemirror/state',
          '@codemirror/view',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/lr',
          ...builtinModules,
        ],
      },
    },
    resolve: {
      alias: {
        '@shared': path.resolve(import.meta.dirname, 'shared/src'),
      },
    },
  };
  return config;
});
