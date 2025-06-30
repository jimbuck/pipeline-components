#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';
import { Command } from 'commander';

import { renderPipeline, getFileExtension } from './renderer.js';

const program = new Command();

program
  .name('pipeline-components')
  .description('Render pipeline components from TSX files to YAML/JSON')
  .argument('<inputs...>', 'Input TSX files or globs')
  .option('--out <dir>', 'Specify output directory for generated files')
  .version('1.0.0')
  .helpOption('-h, --help', 'Show this help message');

program.parse(process.argv);

const inputPaths = program.args;
const outDir = program.opts().out;

if (!inputPaths || inputPaths.length === 0) {
  program.help({ error: true });
}

(async () => {
  // Expand globs to file paths
  const matchedFiles = await fg(inputPaths, { absolute: true });
  if (!matchedFiles || matchedFiles.length === 0) {
    console.error('No files matched the provided globs.');
    process.exit(1);
  }

  for (const absPath of matchedFiles) {
    try {
      const module = await import(pathToFileURL(absPath).href);
      if (typeof module.default !== 'function') continue;
      const tree = module.default();

      const output = renderPipeline(tree);
      if (!output) {
        console.error(`Failed to render pipeline from ${absPath}`);
        process.exit(1);
      }

      const ext = getFileExtension(tree);
      const outputBase = `${path.basename(absPath, path.extname(absPath))}.generated.${ext}`;
      const outputPath = outDir
        ? path.join(outDir, outputBase)
        : path.join(path.dirname(absPath), outputBase);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, output);
      console.log(`Rendered pipeline to ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${absPath}:`, error);
    }
  }
})();
