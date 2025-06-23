# Pipeline Components - Design Brainstorm

## 🎯 Project Vision

Build a tool that compiles JSX/TSX components into CI/CD pipeline files, enabling:
- Programmatic pipeline composition using React patterns
- Platform-specific reusable pipeline components
- Type-safe pipeline definitions
- Component-based pipeline inheritance and composition
- Dedicated component implementations for each platform

### Supported Platforms
- **Azure DevOps** (Phase 1): YAML pipeline generation
- **GitHub Actions** (Future): Workflow YAML generation

## 🏗️ Core Architecture

### Custom React Renderer
- Use `react-reconciler` to create a custom renderer
- Transform JSX tree into structured pipeline objects
- Serialize to YAML using `js-yaml`
- Support component lifecycle and composition patterns

### Component Hierarchy (Azure DevOps)
```tsx
import { Pipeline, Job, Task } from 'pipeline-components/azure-devops';

<Pipeline>
  <Job displayName="Build" pool={{ vmImage: "ubuntu-latest" }}>
    <Task displayName="Install" script="npm install" />
    <CustomTask />
    <Task displayName="Test" type="DotNetBuild@2" />
  </Job>
</Pipeline>
```

### Component Hierarchy (Future - GitHub Actions)
```tsx
import { Workflow, Job, Step } from 'pipeline-components/github-actions';

<Workflow>
  <Job runsOn="ubuntu-latest">
    <Step name="Install" run="npm install" />
    <CustomStep />
    <Step name="Test" uses="actions/setup-dotnet@v3" />
  </Job>
</Workflow>
```

## 🧩 Core Components

### Azure DevOps Specific Components
- **Pipeline**: Root component, contains jobs
- **Job**: Execution context with specific VM/pool
- **Task**: Individual pipeline step (script, marketplace task, etc.)
- **Stage**: Grouping of jobs (for complex pipelines)

Github Actions components will follow a similar pattern at a future date.

## 🔧 Implementation Details

### Renderer Functions
- `createInstance`: Factory for component types
- `appendChild`: Tree building logic
- `finalizeInitialChildren`: Post-processing
- Component-specific logic for task injection

## 🖥️ CLI Interface

### Basic Usage
```bash
# Azure DevOps pipeline
npx pipeline-components compile .pipelines/build.tsx --out .pipelines/build.yml
```

### Development Mode
```bash
npx pipeline-components compile src/pipeline.tsx --out pipeline.yml --watch
```

### CLI Features
- File watching for development
- YAML validation against Azure DevOps schema
- Environment-specific compilation

## 📁 Project Structure

- src
- docs
- tests
- examples

## 🚀 Development Phases

### Phase 1: Core Foundation & Azure DevOps
- [ ] Core abstractions and base renderer
- [ ] Azure DevOps React reconciler implementation
- [ ] Basic Pipeline/Job/Task components for Azure DevOps
- [ ] YAML serialization for Azure DevOps
- [ ] Basic CLI interface

### Phase 2: Advanced Azure DevOps Features
- [ ] Task injection (before/after children)
- [ ] Conditional components
- [ ] Parameter support
- [ ] Multi-stage pipelines
- [ ] Azure DevOps marketplace task components


## 🎨 Component Design Patterns

### Task Injection Pattern (Azure DevOps)
```tsx
import { Task } from 'pipeline-components/azure-devops';

const MeasureSteps: React.FC = ({ children }) => (
  <>
    <Task displayName="StartTimer" script="echo StartTimer" />
    {children}
    <Task displayName="StopTimer" script="echo StopTimer" />
  </>
);
```

### Platform-Specific Parameterized Components
```tsx
// Azure DevOps
import { Task } from 'pipeline-components/azure-devops';

const DotNetBuildAndTest: React.FC<{ project: string; configuration: string }> = ({ project, configuration }) => (
  <>
    <Task displayName="Build" script={`dotnet build ${project} -c ${configuration}`} />
    <Task displayName="Test" script={`dotnet test ${project} -c ${configuration}`} />
	</>
);
```

## 🔍 Technical Considerations

### Platform Abstraction Strategy
- **Shared Core**: Common interfaces and base functionality within compiler
- **Platform Adapters**: Platform-specific implementations, decided at compile time by top level component.

### Type Safety
- Strong TypeScript support for all components
- Platform-specific type definitions
- Compile-time validation of pipeline structure
- IntelliSense support for component props
- Cross-platform type compatibility

### Performance
- Efficient tree traversal across platforms
- Minimal memory footprint
- Fast compilation times
- Lazy loading of platform-specific modules
- Caching of compiled outputs

### Multi-Platform Considerations
- Import path consistency (`pipeline-components/{platform}`)
- Platform detection and auto-configuration
- Shared documentation and examples

## 🧪 Testing Strategy

### Unit Tests
- Using Vitest
- Component rendering logic (per platform)
- YAML serialization accuracy
- CLI argument parsing

### Integration Tests
- End-to-end pipeline compilation (Azure DevOps)
- Platform-specific validation
- Complex component composition

### Example Pipelines/Workflows
- Simple single-job pipeline (Azure DevOps)
- Multi-stage enterprise pipeline
- Complex conditional and parameterized pipelines
