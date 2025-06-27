#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import fg from 'fast-glob';

import { renderPipeline, getFileExtension } from './renderer.js';

const [, , ...inputPaths] = process.argv;

if (!inputPaths || inputPaths.length === 0) {
  console.error('Usage: npx pipeline-components <input1.tsx> ... <inputN.tsx>');
  process.exit(1);
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
      const outputPath = path.join(path.dirname(absPath), `${path.basename(absPath, path.extname(absPath))}.${ext}`);
      await fs.writeFile(outputPath, output);
      console.log(`Rendered pipeline to ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${absPath}:`, error);
    }
  }
})();
