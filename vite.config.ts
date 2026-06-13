import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import dprintMd from '@dprint/markdown';
import { defineConfig, loadEnv, type Plugin, type UserConfig } from 'vite';

function bundleFilePlugin(filePath: string, outputFileName?: string): Plugin {
  return {
    name: 'bundle-file',
    buildStart() {
      this.addWatchFile(filePath);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: outputFileName ?? path.basename(filePath),
        source: fs.readFileSync(filePath),
      });
    },
  };
}

function copyToVaultPlugin(): Plugin {
  return {
    name: 'copy-to-vault',
    async writeBundle(_, bundle) {
      const VAULT = process.env.VAULT;
      if (!VAULT) return;

      const outDir = path.resolve(this.environment.config.build.outDir);

      const obsidianPluginsDir = path.join(VAULT, '.obsidian/plugins');
      if (!(await fs.promises.stat(obsidianPluginsDir)).isDirectory)
        throw new Error("VAULT is invalid or missing '.obsidian/plugins' directory");

      const manifest = `${outDir}/manifest.json`;
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion typescript/no-unsafe-member-access
      const pluginId = JSON.parse(await fs.promises.readFile(manifest, 'utf8')).id as string;
      const pluginDir = `${obsidianPluginsDir}/${pluginId}`;

      await fs.promises.mkdir(pluginDir, { recursive: true });

      const copyFilePromises: Promise<any>[] = [];
      for (const [fileName] of Object.entries(bundle)) {
        const src = `${outDir}/${fileName}`;
        const dest = `${pluginDir}/${fileName}`;
        copyFilePromises.push(fs.promises.copyFile(src, dest));
      }
      await Promise.all(copyFilePromises);

      console.log(`Copied ${copyFilePromises.length} files to ${pluginDir}`);
    },
  };
}

// oxlint-disable-next-line max-lines-per-function
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  const PLUGIN = process.env.PLUGIN;
  if (!PLUGIN) throw new Error('PLUGIN is required');

  const pluginDir = `plugins/${PLUGIN}`;

  const prod = mode === 'production';

  const config: UserConfig = {
    build: {
      lib: {
        entry: `${pluginDir}/src/main.ts`,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      outDir: pluginDir,
      emptyOutDir: false,
      minify: prod ? 'oxc' : false,
      sourcemap: prod ? false : 'inline',
      cssCodeSplit: false,
      reportCompressedSize: false,
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
    plugins: [bundleFilePlugin(`${pluginDir}/manifest.json`), copyToVaultPlugin()],
  };

  // plugin-specific configuration
  switch (PLUGIN) {
    case 'autopair': {
      // bundle patched dependency
      const external = config.build?.rolldownOptions?.external;
      if (Array.isArray(external)) external.splice(external.indexOf('@codemirror/autocomplete'), 1);
      break;
    }
    case 'plumb': {
      // copy WASM file
      config.plugins = config.plugins ?? [];
      config.plugins.push(bundleFilePlugin(dprintMd.getPath(), 'dprint_plugin_markdown.wasm'));
      break;
    }
  }

  return config;
});
