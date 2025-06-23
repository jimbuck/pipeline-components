#!/usr/bin/env tsx
import { renderPipeline } from "./renderer";
import path from "path";
import fs from "fs";
import process from "process";

const [, , inputPath, ...args] = process.argv;

if (!inputPath) {
  console.error("Usage: tsx cli/render.ts <input.tsx> [--out output.yaml]");
  process.exit(1);
}

const outputPath = (() => {
  const idx = args.indexOf("--out");
  return idx >= 0 ? args[idx + 1] : null;
})();

(async () => {
  const absPath = path.resolve(process.cwd(), inputPath);
  const module = await import(absPath);
  const tree = module.default;

  const yaml = renderPipeline(tree);

  if (outputPath) {
    if (!yaml) {
      console.error("Failed to render pipeline to YAML.");
      process.exit(1);
    }
    fs.writeFileSync(outputPath, yaml);
    console.log(`✔ YAML written to ${outputPath}`);
  } else {
    console.log(yaml);
  }
})();
