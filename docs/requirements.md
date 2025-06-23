# Requirements for pipeline-components

## 1. Platform Support
- The tool must support Azure DevOps pipelines (YAML) as the initial platform.
- The tool must be designed to allow future support for GitHub Actions workflows.
- Each platform must have its own dedicated set of components (e.g., Pipeline, Job, Task for Azure DevOps).

## 2. Component System
- Users must be able to define pipelines using JSX/TSX syntax with React components.
- Components must be imported from platform-specific entrypoints (e.g., 'pipeline-components/azure-devops').
- Components must support composition, parameterization, and conditional logic.
- Components can inject steps before/after their children (e.g., for wrappers or hooks).

## 3. Custom React Renderer
- The tool must use a custom React renderer (via react-reconciler) to transform the component tree into a structured pipeline object.
- The renderer must support tree traversal, child insertion, and serialization to YAML.

## 4. CLI Interface
- The tool must provide a CLI for compiling TSX pipeline definitions to YAML.
- CLI must support specifying input and output files, watch mode, and validation.
- Example usage: `npx pipeline-components compile .pipelines/build.tsx --out .pipelines/build.yml`

## 5. Type Safety & Validation
- All components must be strongly typed with TypeScript.
- The tool must validate pipeline structure at compile time.
- The tool must provide IntelliSense for component props.
- The tool must validate output YAML against the Azure DevOps schema.

## 6. Performance
- The renderer must be efficient and support fast compilation times.
- The tool should minimize memory usage and support caching of compiled outputs.

## 7. Project Structure
- The project must be organized with clear separation of src, docs, tests, and examples.
- Platform-specific code must be isolated in dedicated folders/packages.

## 8. Testing
- The project must use Vitest for unit and integration tests.
- Unit tests must cover component rendering and YAML serialization.
- Integration tests must cover end-to-end pipeline compilation and validation.

## 9. Documentation
- The project must include clear documentation and examples for each supported platform.
- Documentation must show how to define pipelines using the provided components and CLI.

## 10. Extensibility
- The architecture must allow for easy addition of new platforms and new component types in the future.
- Platform detection and configuration must be handled at compile time by the top-level component import.

## 11. Example Patterns
- The tool must support patterns such as task injection, parameterized components, and conditional execution (see brainstorm.md for code examples).

## 12. Output
- The tool must output valid Azure DevOps YAML (and GitHub Actions YAML in the future) that can be used directly in CI/CD workflows.
