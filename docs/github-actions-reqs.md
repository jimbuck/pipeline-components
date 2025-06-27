# GitHub Actions Support Requirements

## Overview

This document outlines the requirements for implementing GitHub Actions support in the pipeline-components project. The GitHub Actions implementation will be a separate, standalone implementation that follows GitHub Actions native structure and terminology.

## Architecture

### File Structure
```
src/
  github-actions/
    components.tsx    # React components for GitHub Actions workflow elements
    index.tsx        # Main exports
    renderer.ts      # GitHub Actions YAML renderer
    types.ts         # TypeScript type definitions
    utils.ts         # Utility functions
examples/
  github-actions/
    workflow.tsx     # Example workflow implementation
    workflow.generated.yml  # Generated workflow file
```

### Component Hierarchy

Following GitHub Actions native structure:
- **Workflow** (top-level container)
  - **Job** (parallel or sequential execution units)
    - **Step** (individual actions or run commands)

## Core Components

### 1. Workflow Component
```tsx
<Workflow name="CI" on={...} permissions={...} env={...}>
  {/* Jobs */}
</Workflow>
```

**Props:**
- `name`: string - Workflow name
- `runName?`: string - Display name for the workflow run
- `on`: WorkflowTriggers - Trigger configuration
- `permissions?`: Permissions - GITHUB_TOKEN permissions
- `env?`: Record<string, string> - Environment variables
- `defaults?`: Defaults - Default settings
- `concurrency?`: Concurrency - Concurrency settings

### 2. Job Component
```tsx
<Job id="build" name="Build" runsOn="ubuntu-latest" needs={...}>
  {/* Steps */}
</Job>
```

**Props:**
- `id`: string - Job identifier
- `name?`: string - Display name
- `runsOn`: string | RunsOnMatrix - Runner specification
- `needs?`: string | string[] - Job dependencies
- `if?`: string - Conditional execution
- `permissions?`: Permissions - Job-level permissions
- `env?`: Record<string, string> - Job-level environment variables
- `defaults?`: Defaults - Job-level defaults
- `strategy?`: Strategy - Matrix/strategy configuration
- `continueOnError?`: boolean
- `timeoutMinutes?`: number
- `container?`: Container - Container configuration
- `services?`: Record<string, Service> - Service containers

### 3. Step Component
```tsx
<Step name="Checkout" uses="actions/checkout@v4" with={...} />
<Step name="Run tests" run="npm test" workingDirectory="./app" />
```

**Props:**
- `name?`: string - Step name
- `id?`: string - Step identifier
- `if?`: string - Conditional execution
- `uses?`: string - Action to use (marketplace or local)
- `run?`: string - Shell command to run
- `with?`: Record<string, any> - Action inputs
- `env?`: Record<string, string> - Step-level environment variables
- `continueOnError?`: boolean
- `timeoutMinutes?`: number
- `workingDirectory?`: string
- `shell?`: string - Shell to use

## Type Definitions

### Core Types
```typescript
export type WorkflowNode = {
  name: string;
  on: WorkflowTriggers;
  permissions?: Permissions;
  env?: Record<string, string>;
  defaults?: Defaults;
  concurrency?: Concurrency;
  jobs: Record<string, JobNode>;
};

export type JobNode = {
  name?: string;
  runsOn: string | RunsOnMatrix;
  needs?: string | string[];
  if?: string;
  permissions?: Permissions;
  env?: Record<string, string>;
  defaults?: Defaults;
  strategy?: Strategy;
  continueOnError?: boolean;
  timeoutMinutes?: number;
  container?: Container;
  services?: Record<string, Service>;
  steps: StepNode[];
};

export type StepNode = {
  name?: string;
  id?: string;
  if?: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  env?: Record<string, string>;
  continueOnError?: boolean;
  timeoutMinutes?: number;
  workingDirectory?: string;
  shell?: string;
};
```

### Trigger Types
```typescript
export type WorkflowTriggers = {
  push?: PushTrigger;
  pullRequest?: PullRequestTrigger;
  schedule?: ScheduleTrigger[];
  workflowDispatch?: WorkflowDispatchTrigger;
  workflowCall?: WorkflowCallTrigger;
  [key: string]: any; // Allow other trigger types
};

export type PushTrigger = {
  branches?: string[];
  branchesIgnore?: string[];
  tags?: string[];
  tagsIgnore?: string[];
  paths?: string[];
  pathsIgnore?: string[];
};

export type PullRequestTrigger = {
  types?: string[];
  branches?: string[];
  branchesIgnore?: string[];
  paths?: string[];
  pathsIgnore?: string[];
};
```

### Additional Types
```typescript
export type Permissions = 
  | 'read-all' 
  | 'write-all' 
  | Record<string, 'read' | 'write' | 'none'>;

export type Strategy = {
  matrix?: Record<string, any>;
  failFast?: boolean;
  maxParallel?: number;
};

export type RunsOnMatrix = {
  matrix: Record<string, any>;
};

export type Container = {
  image: string;
  credentials?: {
    username: string;
    password: string;
  };
  env?: Record<string, string>;
  ports?: number[];
  volumes?: string[];
  options?: string;
};
```

## Implementation Requirements

### 1. Renderer Implementation
- Create `GitHubActionsYamlRenderer` class extending `PipelineRenderer<WorkflowNode>`
- Implement YAML generation compatible with GitHub Actions specification
- Handle proper YAML formatting with correct indentation and structure
- Support all workflow features including matrix builds, environments, etc.

### 2. Component Resolution
- Implement component resolution similar to Azure DevOps implementation
- Handle nested components and custom user components
- Support React fragments and conditional rendering
- Properly collect and flatten step hierarchies

### 3. Validation
- Validate required fields (workflow name, job runs-on, etc.)
- Ensure mutual exclusivity where required (uses vs run in steps)
- Validate trigger configurations
- Provide meaningful error messages for invalid configurations

### 4. Utility Functions
- Create `isPrimitiveComponent` function for GitHub Actions components
- Implement helper functions for common GitHub Actions patterns
- Provide type guards and validation utilities

## Generic Step Support

For the initial implementation, focus on generic steps that can handle:

1. **Marketplace Actions** - Using `uses` property
2. **Shell Commands** - Using `run` property
3. **Conditional Execution** - Using `if` property
4. **Environment Variables** - Using `env` property
5. **Working Directory** - Using `workingDirectory` property

Future versions will include pre-built components for common actions like:
- `Checkout` component for `actions/checkout`
- `SetupNode` component for `actions/setup-node`
- `UploadArtifact` component for `actions/upload-artifact`
- etc.

## Example Usage

```tsx
import React from 'react';
import { Workflow, Job, Step } from '../src/github-actions';

export default function() {
  return (
    <Workflow 
      name="CI" 
      on={{ 
        push: { branches: ['main'] }, 
        pullRequest: { branches: ['main'] } 
      }}
    >
      <Job id="test" name="Test" runsOn="ubuntu-latest">
        <Step name="Checkout" uses="actions/checkout@v4" />
        <Step name="Setup Node.js" uses="actions/setup-node@v4" with={{ 'node-version': '18' }} />
        <Step name="Install dependencies" run="npm ci" />
        <Step name="Run tests" run="npm test" />
      </Job>
    </Workflow>
  );
}
```

## Testing Requirements

### 1. Unit Tests
- Test component rendering and compilation
- Test YAML output generation
- Test error handling and validation
- Test complex workflow scenarios (matrix, dependencies, etc.)

### 2. Integration Tests
- Test complete workflow compilation from JSX to YAML
- Test compatibility with GitHub Actions specification
- Test example workflows generate valid YAML

### 3. Test Coverage
- Maintain high test coverage similar to Azure DevOps implementation
- Test edge cases and error conditions
- Test TypeScript type safety

## Output Requirements

### 1. YAML Generation
- Generate standard GitHub Actions YAML
- Follow GitHub Actions YAML schema and conventions
- Support all GitHub Actions features and syntax
- Ensure generated YAML is valid and executable

### 2. File Output
- Examples should generate `.github/workflows/*.yaml` compatible files
- Support custom output paths via CLI
- Maintain consistent formatting and structure
- Property names should use GitHub action names but with camelCase (e.g., `branchesIgnore` instead of `branches-ignore`)

## CLI Integration

### 1. Command Support
Extend existing CLI to support GitHub Actions by adding the GitHub Actions renderer to the list of available renderers in the base renderer.

## Future Considerations

### 1. Advanced Features (Future Versions)
- Pre-built components for common marketplace actions
- Reusable action templates
- Composite action support
- Advanced matrix configurations
- Environment protection rules

### 2. Shared Utilities
- Common validation utilities
- Shared React component patterns
- Cross-platform compatibility helpers (if needed)

### 3. Documentation
- Component API documentation
- Best practices guide
- Migration guide from raw GitHub Actions YAML
- Example library

## Success Criteria

1. ✅ Complete GitHub Actions workflow can be defined using React components
2. ✅ Generated YAML is valid and executable on GitHub
3. ✅ All major GitHub Actions features are supported
4. ✅ Type safety is maintained throughout the API
5. ✅ Error messages are clear and actionable
6. ✅ Performance is comparable to Azure DevOps implementation
7. ✅ Test coverage meets project standards
8. ✅ Examples demonstrate real-world usage patterns