# Prompt 1

I want to build a tool that allows me to write TSX (or JSX) and compile it to a YAML pipeline file. Create a basic custom react render that will allow for this. Tasks are executed in order and may insert tasks before or after child components.

# Response 1

You can build a custom React renderer to compile JSX/TSX into Azure Pipelines YAML. This is a powerful approach, allowing you to compose pipelines programmatically, insert tasks before/after children, and leverage React component reusability.

Below is a **basic custom React renderer** (using `react-reconciler`) that:

- Compiles a JSX tree into a structured YAML pipeline object.
- Supports injecting steps before and after children via component logic.
- Serializes to YAML using `js-yaml`.

---

## 🛠️ Project Overview

- Input: TSX components like `<Pipeline>`, `<Job>`, `<Task>`, etc.
- Output: Azure Pipelines-compliant YAML string.
- Feature: Components can inject logic, such as steps before/after children.

---

## 🧱 1. Define Component DSL (TSX usage)

```tsx
<Pipeline>
  <Job displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
    <Task displayName="Install" script="npm install" />
    <CustomTask />
    <Task displayName="Test" type="DotNetBuild@2" />
  </Job>
</Pipeline>
```

Let’s say `<CustomTask />` injects a task before and after its “main” content.

---

## ⚙️ 2. Core React Renderer

```ts
// pipelineRenderer.ts
import Reconciler from "react-reconciler";
import yaml from "js-yaml";

type TaskNode = {
  task: string;
  inputs?: Record<string, string>;
  script?: string;
};
type JobNode = { job: string; steps: TaskNode[] };
type PipelineNode = { jobs: JobNode[] };

// Types for internal tree
type Node = PipelineNode | JobNode | TaskNode;

const createInstance = (type: string, props: any): Node => {
  switch (type) {
    case "Pipeline":
      return { jobs: [] };
    case "Job":
      return { job: props.displayName, steps: [] };
    case "Task":
      return props.script
        ? { task: "CmdLine", inputs: { script: props.script } }
        : { task: props.displayName };
    default:
      throw new Error(`Unknown element type: ${type}`);
  }
};

const appendChild = (parent: Node, child: Node) => {
  if ("jobs" in parent && "job" in child) {
    parent.jobs.push(child);
  } else if ("steps" in parent && "task" in child) {
    parent.steps.push(child);
  }
};

const PipelineRenderer = Reconciler({
  createInstance,
  appendChild,
  createTextInstance: () => null,
  finalizeInitialChildren: () => false,
  getPublicInstance: (inst) => inst,
  prepareForCommit: () => null,
  prepareUpdate: () => null,
  resetAfterCommit: () => {},
  shouldSetTextContent: () => false,
  supportsMutation: true,
  clearContainer: () => {},
  appendInitialChild: appendChild,
  appendChildToContainer: appendChild,
  removeChild: () => {},
  removeChildFromContainer: () => {},
  insertBefore: () => {},
  insertInContainerBefore: () => {},
} as any);
```

---

## 🧾 3. Render & Serialize to YAML

```ts
// renderPipeline.ts
import React from "react";
import PipelineRenderer from "./pipelineRenderer";

export function renderPipeline(element: React.ReactElement): string {
  const container: any = { jobs: [] };
  const node = PipelineRenderer.createContainer(container, 0, false, null);
  PipelineRenderer.updateContainer(element, node, null, () => {});
  return yaml.dump(container);
}
```

---

## 🧩 4. Custom Component with Injection

```tsx
// components/CustomTask.tsx
import React from "react";

export const CustomTask: React.FC = () => {
  return (
    <>
      <Task displayName="PreHook" script="echo Pre-task" />
      <Task displayName="Main" script="echo Main task" />
      <Task displayName="PostHook" script="echo Post-task" />
    </>
  );
};
```

---

## 🧪 5. Example Usage

```tsx
import React from "react";
import { renderPipeline } from "./renderPipeline";
import { Pipeline, Job, Task } from "./dsl";

const pipelineYaml = renderPipeline(
  <Pipeline>
    <Job displayName="build">
      <Task displayName="Install" script="npm install" />
      <CustomTask />
      <Task displayName="Test" script="npm test" />
    </Job>
  </Pipeline>
);

console.log(pipelineYaml);
```

Output YAML:

```yaml
jobs:
  - job: build
    steps:
      - task: CmdLine
        inputs:
          script: npm install
      - task: CmdLine
        inputs:
          script: echo Pre-task
      - task: CmdLine
        inputs:
          script: echo Main task
      - task: CmdLine
        inputs:
          script: echo Post-task
      - task: CmdLine
        inputs:
          script: npm test
```

---

## 🧠 Next Steps

- Type-check props for validation.
- Add file output and CLI interface.
- Build a component library for common reusable blocks.

---

# Prompt 2

Add the CLI interface as well.

# Response 2

Here’s how to add a **CLI interface** to your custom React-to-YAML pipeline compiler. This allows you to render your JSX pipeline and output the resulting Azure Pipelines YAML via a simple CLI command like:

```bash
npx tsx cli/render.ts src/pipeline.tsx --out pipeline.yml
```

---

## 📦 Project Structure Overview

```
my-pipeline-tool/
├── cli/
│   └── render.ts         # CLI entry point
├── components/
│   └── CustomTask.tsx
├── dsl/
│   └── index.tsx         # React components like <Pipeline />, <Job />
├── renderPipeline.ts
├── pipelineRenderer.ts
├── src/
│   └── pipeline.tsx      # Your user-defined pipeline
├── package.json
```

---

## ⚙️ 1. Install Required Packages

You’ll need:

```bash
npm install react react-reconciler js-yaml
npm install --save-dev tsx typescript
```

Ensure `tsx` is available for running TypeScript files directly.

---

## 🧩 2. CLI File: `cli/render.ts`

```ts
#!/usr/bin/env tsx

import { renderPipeline } from "../renderPipeline";
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
    fs.writeFileSync(outputPath, yaml);
    console.log(`✔ YAML written to ${outputPath}`);
  } else {
    console.log(yaml);
  }
})();
```

Make it executable:

```bash
chmod +x cli/render.ts
```

---

## 🧱 3. DSL Exports: `dsl/index.tsx`

```tsx
import React from "react";

export const Pipeline = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
export const Job = ({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) => <job name={name}>{children}</job>;
export const Task = ({ name, script }: { name: string; script: string }) => (
  <task name={name} script={script} />
);
```

---

## 🧪 4. Example `pipeline.tsx`

```tsx
import React from "react";
import { Pipeline, Job, Task } from "../dsl";
import { CustomTask } from "../components/CustomTask";

export default (
  <Pipeline>
    <Job displayName="Build">
      <Task displayName="Install" script="npm install" />
      <CustomTask />
      <Task displayName="Test" script="npm test" />
    </Job>
  </Pipeline>
);
```

---

## 🚀 5. Run It

Print to console:

```bash
npx tsx cli/render.ts src/pipeline.tsx
```

Write to file:

```bash
npx tsx cli/render.ts src/pipeline.tsx --out azure-pipelines.yml
```

---

## ✅ Optional Enhancements

- Add `yargs` or `commander` for more advanced CLI parsing.
- Bundle as a `bin` script in `package.json` for global CLI use.
- Support watching files or validating output against Azure DevOps schema.
