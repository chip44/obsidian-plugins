import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

const pluginsDir = path.resolve('plugins');

const plugins = (await fs.readdir(pluginsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const mode = process.env.MODE ?? 'development';
const prod = mode === 'production';

for (const plugin of plugins) {
  console.log(`Building ${plugin}...`);

  process.env.PLUGIN = plugin;

  await build({
    configFile: path.resolve('vite.config.ts'),
    mode,
    build: {
      watch: prod ? null : {},
    },
  });
}
