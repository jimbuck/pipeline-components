import React, { PropsWithChildren } from 'react';
import yaml from 'js-yaml';
import debugFactory from 'debug';

import { PipelineRenderer } from '../shared/renderer.js';
import { flattenChildren, resolveElement } from '../shared/utils.js';

import { PipelineNode, StageNode, JobNode, TaskNode } from './types.js';
import { Job, Pipeline, Stage, Step } from './components.js';
import { isPrimitiveComponent } from './utils.js';

const debug = debugFactory('pipeline-components:azure-devops');

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

class AzureDevOpsYamlRenderer extends PipelineRenderer<PipelineNode> {
  public canRender(element: React.ReactNode): boolean {
    return React.isValidElement(element) && (element.type === Pipeline);
  }

  public getFileExtension(): string {
    return 'yaml';
  }

  public compilePipeline(element: React.ReactNode): PipelineNode | null {
    if (!React.isValidElement(element) || element.type !== Pipeline) {
      debug('Element is not a valid Pipeline component');
      return null;
    }
    // If no children, return null (for empty pipeline test)
    if (!(element.props as PropsWithChildren).children) return null;
    return this._compilePipeline(element);
  }

  private _compilePipeline(element: React.ReactElement): PipelineNode | null {
  // Resolve custom components
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;
    const { trigger, pool, variables, children } = (el.props as PropsWithChildren<PipelineNode>);
    const childElements = flattenChildren(children);
    const stages = childElements.filter(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      return resolved && resolved.type === Stage;
    });
    const jobs = childElements.filter(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      return resolved && resolved.type === Job;
    });
    const steps = childElements.filter(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      return resolved && resolved.type === Step;
    });
    if (stages.length > 0) {
      return {
        trigger, pool, variables,
        stages: stages.map(child => this._compileStage(resolveElement(child, isPrimitiveComponent)!)).filter(Boolean) as StageNode[],
      };
    } else if (jobs.length > 0) {
      return {
        trigger, pool, variables,
        jobs: jobs.map(child => this._compileJob(resolveElement(child, isPrimitiveComponent)!)).filter(Boolean) as JobNode[],
      };
    } else if (steps.length > 0) {
      return {
        trigger, pool, variables,
        steps: steps.map(child => this._compileStep(resolveElement(child, isPrimitiveComponent)!)).filter(Boolean) as TaskNode[],
      };
    }
    return { trigger, pool, variables, stages: [] };
  }

  private _compileStage(element: React.ReactElement): StageNode | null {
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;
    const { stage: stageName, displayName, pool, children, dependsOn, condition, variables } = (el.props as PropsWithChildren<StageNode>);
    const jobs: JobNode[] = [];
    flattenChildren(children).forEach(child => {
      const resolved = resolveElement(child, isPrimitiveComponent);
      if (resolved && resolved.type === Job) {
        const job = this._compileJob(resolved);
        if (job) jobs.push(job);
      }
    });
    return {
      stage: stageName,
      displayName,
      pool: typeof pool === 'string' ? { name: pool } : pool,
      dependsOn,
      condition,
      variables,
      jobs,
    };
  }

  private _compileJob(element: React.ReactElement): JobNode | null {
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;
    const { job: jobName, displayName, condition, continueOnError, pool, dependsOn, variables, workspace, children } = (el.props as PropsWithChildren<JobNode>);
    // Deeply collect all Step elements from children, including custom components/fragments
    const steps: TaskNode[] = collectSteps(children).map(child => this._compileStep(child)!).filter(Boolean);
    return {
      job: jobName,
      displayName,
      condition,
      continueOnError,
      dependsOn,
      pool,
      workspace,
      variables,
      steps,
    };
  }

  private _compileStep(element: React.ReactElement): TaskNode | null {
    const el = resolveElement(element, isPrimitiveComponent);
    if (!el) return null;
    const { enabled, ...step } = el.props as TaskNode;
    if (typeof enabled !== 'undefined' && !enabled) {
      debug('Step is disabled, skipping:', step.task);
      return null; // Skip disabled steps
    }

    return step;
  }

  public render(pipeline: PipelineNode): string {
    return yaml.dump(pipeline, { noRefs: true, noArrayIndent: true, lineWidth: -1 });
  }
}

const renderer = new AzureDevOpsYamlRenderer();
export default renderer;