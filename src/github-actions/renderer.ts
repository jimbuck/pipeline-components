import React, { PropsWithChildren } from 'react';
import yaml from 'js-yaml';
import debugFactory from 'debug';

import { PipelineRenderer } from '../shared/renderer.js';
import { flattenChildren, resolveElement } from '../shared/utils.js';

import { WorkflowNode, JobNode, StepNode } from './types.js';
import { Workflow, Job, Step } from './components.js';
import { isPrimitiveComponent } from './utils.js';

const debug = debugFactory('pipeline-components:github-actions');

function collectSteps(node: React.ReactNode): React.ReactElement[] {
  const steps: React.ReactElement[] = [];
  React.Children.forEach(node, child => {
    if (React.isValidElement(child)) {
      let resolved = resolveElement(child, isPrimitiveComponent);

      // If the resolved element is still a custom component (not primitive), resolve it again
      while (resolved && React.isValidElement(resolved) && typeof resolved.type === 'function' && !isPrimitiveComponent(resolved.type)) {
        resolved = resolveElement(resolved, isPrimitiveComponent);
      }

      if (!resolved) return;

      if (resolved.type === Step) {
        steps.push(resolved);
      } else {
        // Fragment, custom component or other: recursively collect
        steps.push(...collectSteps((resolved.props as PropsWithChildren).children));
      }
    }
  });
  return steps;
}

class GitHubActionsYamlRenderer extends PipelineRenderer<WorkflowNode> {
  public canRender(element: React.ReactNode): boolean {
    return React.isValidElement(element) && (element.type === Workflow);
  }

  public getFileExtension(): string {
    return 'yml';
  }

  public compilePipeline(element: React.ReactNode): WorkflowNode | null {
    if (!React.isValidElement(element) || element.type !== Workflow) {
      debug('Element is not a valid Workflow component');
      return null;
    }
    // If no children, return null (for empty workflow test)
    if (!(element.props as PropsWithChildren).children) return null;
    return this._compileWorkflow(element);
  }

  private _compileWorkflow(element: React.ReactElement): WorkflowNode | null {
    // Resolve custom components
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;

    const { name, runName, on, permissions, env, defaults, concurrency, children } = (el.props as PropsWithChildren<WorkflowNode>);
    const childElements = flattenChildren(children);

    const jobs = childElements.filter(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      return resolved && resolved.type === Job;
    });

    if (jobs.length === 0) {
      debug('No jobs found in workflow');
      return null;
    }

    const compiledJobs: Record<string, JobNode> = {};
    jobs.forEach(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      if (resolved) {
        const job = this._compileJob(resolved);
        if (job) {
          const jobProps = resolved.props as JobNode & { id: string };
          const jobId = jobProps.id || 'job';
          compiledJobs[jobId] = job;
        }
      }
    });

    return {
      name,
      runName,
      on,
      permissions,
      env,
      defaults,
      concurrency,
      jobs: compiledJobs,
    };
  }

  private _compileJob(element: React.ReactElement): JobNode | null {
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;

    const { name, runsOn, needs, if: ifCondition, permissions, env, defaults, strategy, continueOnError, timeoutMinutes, container, services, children } = (el.props as PropsWithChildren<JobNode & { id: string }>);

    // Deeply collect all Step elements from children, including custom components/fragments
    const steps: StepNode[] = collectSteps(children).map(child => this._compileStep(child)!).filter(Boolean);

    return {
      name,
      runsOn,
      needs,
      if: ifCondition,
      permissions,
      env,
      defaults,
      strategy,
      continueOnError,
      timeoutMinutes,
      container,
      services,
      steps,
    };
  }

  private _compileStep(element: React.ReactElement): StepNode | null {
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;

    const step = el.props as StepNode;

    // Validate that step has either 'uses' or 'run' but not both
    if ('uses' in step && step.uses && 'run' in step && step.run) {
      throw new Error('Step cannot have both "uses" and "run" properties');
    }

    if ((!('uses' in step) || !step.uses) && (!('run' in step) || !step.run)) {
      throw new Error('Step must have either "uses" or "run" property');
    }

    return step;
  }

  public render(workflow: WorkflowNode): string {
    // Convert camelCase properties to kebab-case for GitHub Actions YAML
    const yamlWorkflow = this.convertToYamlFormat(workflow);
    return yaml.dump(yamlWorkflow, { noRefs: true, lineWidth: -1 });
  }

  private convertToYamlFormat(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertToYamlFormat(item));
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        // Convert camelCase to kebab-case for specific GitHub Actions properties
        let yamlKey = key;
        if (key === 'runName') yamlKey = 'run-name';
        else if (key === 'runsOn') yamlKey = 'runs-on';
        else if (key === 'continueOnError') yamlKey = 'continue-on-error';
        else if (key === 'timeoutMinutes') yamlKey = 'timeout-minutes';
        else if (key === 'workingDirectory') yamlKey = 'working-directory';
        else if (key === 'failFast') yamlKey = 'fail-fast';
        else if (key === 'maxParallel') yamlKey = 'max-parallel';
        else if (key === 'cancelInProgress') yamlKey = 'cancel-in-progress';
        else if (key === 'branchesIgnore') yamlKey = 'branches-ignore';
        else if (key === 'tagsIgnore') yamlKey = 'tags-ignore';
        else if (key === 'pathsIgnore') yamlKey = 'paths-ignore';
        else if (key === 'pullRequest') yamlKey = 'pull_request';
        else if (key === 'workflowDispatch') yamlKey = 'workflow_dispatch';
        else if (key === 'workflowCall') yamlKey = 'workflow_call';

        if (value !== undefined) {
          result[yamlKey] = this.convertToYamlFormat(value);
        }
      }

      return result;
    }

    return obj;
  }
}

const renderer = new GitHubActionsYamlRenderer();
export default renderer;
