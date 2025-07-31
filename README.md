# 🚀 Pipeline Components

> _Because YAML pipelines deserve composability too_ 🧩

**Transform your CI/CD pipelines from YAML nightmares into beautiful, composable React components!**

Pipeline Components lets you write composable pipelines (currently GitHub Actions and Azure DevOps Pipelines) using familiar JSX/TSX syntax. Say goodbye to copy-pasta YAML chaos and hello to type-safe, reusable, and maintainable pipeline definitions.

```yaml
// Instead of this YAML chaos...
trigger:
  branches:
    include: ["main"]
jobs:
- job: Build
  displayName: Build
  # ... 50 more lines of YAML confusion
```

```tsx
// Write this beautiful JSX! ✨
<Pipeline trigger={{ branches: { include: ["main"] } }}>
  <Job job="Build" displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
    <Measure suffix="install-and-build">
      <Powershell displayName="Install">npm install</Powershell>
      <Bash displayName="Test">npm test</Bash>
    </Measure>
  </Job>
</Pipeline>
```

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![npm version](https://badge.fury.io/js/pipeline-components.svg)](https://badge.fury.io/js/pipeline-components)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Why Pipeline Components?

- **🎨 Familiar Syntax**: Write pipelines using React JSX/TSX that you already know and love
- **🔧 Type Safety**: Get IntelliSense, auto-completion, and compile-time error checking
- **🧩 Composable**: Create reusable components like `<TestSuite>` or `<DeploymentStage>`
- **📦 Platform Agnostic**: Support for Azure DevOps and GitHub Actions
- **🔄 DRY Principle**: No more copy-pasting similar pipeline configurations
- **⚡ Fast Iteration**: Leverage your existing TypeScript tooling and IDE features

---

## 🚀 Quick Start

### Installation

```bash
npm install -D pipeline-components
# or
yarn add pipeline-components
```

### Your First Pipeline

1. **Create a pipeline component** (`my-pipeline.tsx`):

```tsx
import React from 'react';
import { Pipeline, Job, Powershell, Bash } from 'pipeline-components/azure-devops';

export default function MyPipeline() {
  return (
    <Pipeline trigger={{ branches: { include: ["main"] } }}>
      <Job job="CI" displayName="Continuous Integration" pool={{ vmImage: "ubuntu-latest" }}>
        <Powershell displayName="Install Dependencies">
          npm install
        </Powershell>
        <Bash displayName="Run Tests">
          npm test
        </Bash>
        <Powershell displayName="Build Application">
          npm run build
        </Powershell>
      </Job>
    </Pipeline>
  );
}
```

2. **Compile to YAML**:

```bash
npx pipeline-components my-pipeline.tsx
```

3. **Profit!** 🎉 Your `my-pipeline.generated.yml` is ready to use in Azure DevOps!

---

## 📚 Examples & Recipes

<details>
<summary><b>🎯 Basic Azure DevOps Pipeline</b></summary>

```tsx
import React from 'react';
import { Pipeline, Job, Powershell, Bash } from 'pipeline-components/azure-devops';

export default function BasicPipeline() {
  return (
    <Pipeline 
      trigger={{ branches: { include: ["main", "develop"] } }}
      pr={{ branches: { include: ["main"] } }}
    >
      <Job job="Build" displayName="Build & Test" pool={{ vmImage: "ubuntu-latest" }}>
        <Powershell displayName="Install">npm ci</Powershell>
        <Bash displayName="Lint">npm run lint</Bash>
        <Bash displayName="Test">npm test -- --coverage</Bash>
        <Powershell displayName="Build">npm run build</Powershell>
      </Job>
    </Pipeline>
  );
}
```

</details>

<details>
<summary><b>🔄 Reusable Components & Composition</b></summary>

```tsx
import React, { PropsWithChildren } from 'react';
import { Pipeline, Job, Stage, Powershell, Bash } from 'pipeline-components/azure-devops';

// Reusable wrapper component
function Measure({ suffix, children }: PropsWithChildren<{ suffix: string }>) {
  return (
    <>
      <Powershell displayName={`⏱️ Start ${suffix}`}>
        Write-Host "Starting timer for {suffix}"
      </Powershell>
      {children}
      <Powershell displayName={`✅ Stop ${suffix}`}>
        Write-Host "Finished timer for {suffix}"
      </Powershell>
    </>
  );
}

// Reusable test suite component
function TestSuite({ name, testCommand }: { name: string; testCommand: string }) {
  return (
    <Measure suffix={name.toLowerCase().replace(' ', '-')}>
      <Bash displayName={`🧪 ${name}`}>{testCommand}</Bash>
    </Measure>
  );
}

export default function AdvancedPipeline() {
  return (
    <Pipeline trigger={{ branches: { include: ["main"] } }}>
      <Stage stage="Test" displayName="🧪 Testing Stage">
        <Job job="UnitTests" displayName="Unit Tests" pool={{ vmImage: "ubuntu-latest" }}>
          <Powershell displayName="📦 Install">npm ci</Powershell>
          <TestSuite name="Unit Tests" testCommand="npm run test:unit" />
          <TestSuite name="Integration Tests" testCommand="npm run test:integration" />
        </Job>
      </Stage>
      
      <Stage stage="Build" displayName="🏗️ Build Stage" dependsOn={["Test"]}>
        <Job job="Build" displayName="Build Application" pool={{ vmImage: "ubuntu-latest" }}>
          <Measure suffix="build">
            <Powershell displayName="📦 Install">npm ci</Powershell>
            <Bash displayName="🏗️ Build">npm run build</Bash>
          </Measure>
        </Job>
      </Stage>
    </Pipeline>
  );
}
```

</details>

<details>
<summary><b>🌟 GitHub Actions Support</b></summary>

```tsx
import React from 'react';
import { Workflow, Job, Step, Run } from 'pipeline-components/github-actions';

export default function GitHubWorkflow() {
  return (
    <Workflow 
      name="CI/CD" 
      on={{ 
        push: { branches: ['main'] }, 
        pullRequest: { branches: ['main'] } 
      }}
    >
      <Job id="test" name="Test" runsOn="ubuntu-latest">
        <Step name="📥 Checkout" uses="actions/checkout@v4" />
        <Step name="🟢 Setup Node.js" uses="actions/setup-node@v4" 
              with={{ 'node-version': '18', 'cache': 'npm' }} />
        <Step name="📦 Install" run="npm ci" />
        <Run name="🧪 Test">npm test</Run>
      </Job>
    </Workflow>
  );
}
```

</details>

<details>
<summary><b>🎨 Conditional Logic & Dynamic Pipelines</b></summary>

```tsx
import React from 'react';
import { Pipeline, Stage, Job, Bash } from 'pipeline-components/azure-devops';

export default function ConditionalPipeline() {
  // Pipeline variable names stored as constants for reusability
  const IS_MAIN = 'isMain';

  return (
    <Pipeline
      trigger={{ branches: { include: ["main"] } }}
      variables={[{
          name: VARIABLES.IS_MAIN,
          value: "$[eq(variables['Build.SourceBranch'], 'refs/heads/main')]"
        }]}
    >
      <Stage stage="A">
        <Job job="A1">
          <Bash>echo Hello Stage A!</Bash>
        </Job>
      </Stage>

      <Stage
        stage="B"
        condition={`and(succeeded(), eq(variables.${VARIABLES.IS_MAIN}, true))`}
      >
        <Job job="B1">
          <Bash>echo Hello Stage B!</Bash>
          <Bash>echo $(${VARIABLES.IS_MAIN})</Bash>
        </Job>
      </Stage>
    </Pipeline>
  );
}
```

</details>

<details>
<summary><b>🔧 Custom Matrix Builds</b></summary>

```tsx
import React from 'react';
import { Pipeline, Job, Powershell } from 'pipeline-components/azure-devops';

const platforms = [
  { name: 'Windows', vmImage: 'windows-latest', nodeVersion: '18' },
  { name: 'Linux', vmImage: 'ubuntu-latest', nodeVersion: '18' },
  { name: 'macOS', vmImage: 'macos-latest', nodeVersion: '18' }
];

export default function MatrixPipeline() {
  return (
    <Pipeline trigger={{ branches: { include: ["main"] } }}>
      {platforms.map(platform => (
        <Job 
          key={platform.name}
          job={`Test_${platform.name}`}
          displayName={`🧪 Test on ${platform.name}`}
          pool={{ vmImage: platform.vmImage }}
        >
          <Powershell displayName={`📦 Install Node ${platform.nodeVersion}`}>npm ci</Powershell>
          <Powershell displayName="🧪 Run Tests">npm test</Powershell>
        </Job>
      ))}
    </Pipeline>
  );
}
```

</details>

---

## 📖 CLI Reference

```bash
# Basic usage with a single file or glob
npx pipeline-components src/pipelines/*.tsx

# Multiple globs or files
npx pipeline-components src/azure-devops/*.tsx src/github-actions/*.tsx

# Output to a specific directory (all generated files will be placed in this directory)
npx pipeline-components tools/workflows/my-pipeline.tsx --out .github/workflows

# With npm script
npm run build:pipeline
```

### CLI Options

| Option   | Description                                   | Example                         |
|----------|-----------------------------------------------|---------------------------------|
| `<input>`| One or more file paths or globs to process     | `src/**/*.tsx`                  |
| `--out`  | Specify output directory for generated files   | `--out dist/pipelines`          |
| `--help` | Show help information                         | `--help`                        |

- Output files are named using the same name as the input file, but with `.generated.<extension>` (currently `.generated.yaml` for YAML renderers).
- If `--out <dir>` is specified, all generated files will be placed in the given directory. If not specified, output files are placed in the same directory as their input file.
- You can specify one or more file paths or glob patterns as input. All matched files will be rendered to their respective output files (e.g., `my-pipeline.generated.yaml`).
- **Note:** Only files that have a default export (i.e., `export default function ...`) will generate pipelines. Files without a default export are ignored. The example pipelines in this repository are a prime example of this feature—each pipeline component is exported as default.

---

## 🏗️ Architecture

Pipeline Components parses your JSX/TSX component tree and transforms it into structured pipeline objects, which are then serialized to YAML.

```
JSX Components → Pipeline AST → YAML Output
```

### Supported Platforms

- ✅ **Azure DevOps** - Full support for pipelines, stages, jobs, and tasks
- 🚧 **GitHub Actions** - Partial support for workflows, jobs, and steps.
- 📋 **Jenkins** - Possible future release
- 📋 **GitLab CI** - Planned for future release
- 📋 **CircleCI** - Planned for future release

---

## 🤝 Contributing

We love contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes Pipeline Components better for everyone.

### 🚀 Getting Started

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/azdo-pipeline-components.git
   cd azdo-pipeline-components
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Start Development**
   ```bash
   npm run dev  # Starts test watcher
   ```

### 🧪 Testing Your Changes

```bash
# Run all tests
npm test

# Test the CLI with examples
npm run test:cli

# Lint your code
npm run lint
```

### 📝 Contribution Guidelines

- **🐛 Bug Reports**: Use the issue template and include minimal reproduction cases
- **✨ Feature Requests**: Describe the use case and provide examples
- **🔧 Pull Requests**: 
  - Write tests for new features
  - Update documentation as needed
  - Follow the existing code style
  - Ensure all tests pass

### 🎯 Areas We Need Help With

- 🚧 **GitHub Actions Support**: Help us expand the GitHub Actions renderer
- 📚 **Documentation**: More examples and tutorials
- 🧪 **Testing**: Edge cases and complex scenarios
- 🎨 **Component Library**: More built-in reusable components
- 🔧 **Tooling**: Better dev experience and debugging tools

### 💡 Ideas for Contributions

<details>
<summary><b>🔧 Core Features</b></summary>

- **Watch Mode**: Auto-regenerate YAML on file changes
- **Validation**: Lint and validate pipeline configurations
- **Debugging**: Better error messages and stack traces
- **Templates**: Starter templates for common pipeline patterns

</details>

<details>
<summary><b>🎨 Component Library</b></summary>

- **Deployment Components**: `<DeployToAzure>`, `<PublishNpm>`, `<DockerBuild>`
- **Testing Components**: `<JestTests>`, `<PlaywrightE2E>`, `<LighthouseAudit>`
- **Utility Components**: `<Cache>`, `<Artifacts>`, `<Notifications>`

</details>

<details>
<summary><b>📋 Platform Support</b></summary>

- **GitHub Actions**: Complete the GitHub Actions renderer
- **Jenkins**: Jenkinsfile generation support
- **GitLab CI**: `.gitlab-ci.yml` generation
- **CircleCI**: `.circleci/config.yml` generation

</details>

### 📞 Questions?

- 💬 **Discussions**: Use GitHub Discussions for questions and ideas
- 🐛 **Issues**: Report bugs and request features
- 📧 **Email**: Reach out to the maintainers for complex topics

---

## 📄 License

MIT © Pipeline Components Contributors

---

<div align="center">

**Made with ❤️ by developers who were tired of messy Enterprise YAML**

[⭐ Star us on GitHub](https://github.com/jimbuck/pipeline-components) • [📚 Documentation](https://github.com/jimbuck/pipeline-components) • [🐛 Report Bug](https://github.com/jimbuck/pipeline-components/issues) • [💡 Request Feature](https://github.com/jimbuck/pipeline-components/issues)

</div>
