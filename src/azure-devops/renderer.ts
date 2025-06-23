import React, { PropsWithChildren } from 'react';
import yaml from 'js-yaml';

import { PipelineRenderer } from '../shared/renderer';
import { PipelineNode, Node, StageNode, JobNode, TaskNode } from './types';
import { Job, Pipeline, Stage, Step } from './components';

import debugFactory from 'debug';
const debug = debugFactory('pipeline-components:azure-devops');

export class AzureDevOpsYamlRenderer extends PipelineRenderer<PipelineNode, Node> {

	public canRender(element: React.ReactNode): boolean {
		return React.isValidElement(element) && (element.type === Pipeline);
	}

	public compilePipeline(element: React.ReactNode): PipelineNode | null {
		if (!React.isValidElement(element) || element.type !== Pipeline) {
			debug('Element is not a valid Pipeline component');
			return null;
		}

		if (!(element.props as React.PropsWithChildren).children) {
			debug('Pipeline has no children');
			return null;
		}

		const { trigger, pool, variables } = (element.props as React.PropsWithChildren<Omit<PipelineNode, 'stages' | 'jobs' | 'steps'>>);

		const children = Array.isArray((element.props as React.PropsWithChildren).children) ? (element.props as React.PropsWithChildren).children as React.ReactElement[] : [(element.props as React.PropsWithChildren).children as React.ReactElement];

		const stages = children.filter(child => React.isValidElement(child) && child.type === Stage);
		const jobs = children.filter(child => React.isValidElement(child) && child.type === Job);
		const tasks = children.filter(child => React.isValidElement(child) && child.type === Step);
		if (stages.length > 0) {
			return {
				trigger, pool, variables,
				stages: stages.map(child => this.compileStage(child)).filter(Boolean) as StageNode[],
			}
		} else if (jobs.length > 0) {
			return {
				trigger, pool, variables,
				jobs: jobs.map(child => this.compileJob(child)).filter(Boolean) as JobNode[],
			}
		} else if (tasks.length > 0) {
			return {
				trigger, pool, variables,
				steps: tasks.map(child => this.compileStep(child)).filter(Boolean) as TaskNode[],
			}
		}

		return {
			trigger, pool, variables,
			stages: [],
		}
	}

	private compileStage(element: React.ReactElement): StageNode | null {
		if (!React.isValidElement(element) || element.type !== Stage) {
			return null;
		}

		const { stage: stageName, displayName, pool, children, dependsOn, condition, variables } = element.props as PropsWithChildren<Omit<StageNode, 'jobs'>>;

		const stage: StageNode = {
			stage: stageName,
			displayName,
			pool: typeof pool === 'string' ? { name: pool } : pool,
			dependsOn,
			condition,
			variables,
			jobs: [],
		};

		if (children) {
			if (Array.isArray(children)) {
				stage.jobs = children.map(child => this.compileJob(child)).filter(Boolean) as JobNode[];
			} else if (React.isValidElement(children)) {
				const job = this.compileJob(children);
				if (job) {
					stage.jobs.push(job);
				}
			}
		}

		return stage;
	}

	private compileJob(element: React.ReactElement): JobNode | null {
		if (!React.isValidElement(element) || element.type !== Job) {
			return null;
		}

		const { job: jobName, displayName, condition, continueOnError, pool, dependsOn, children } = element.props as PropsWithChildren<Omit<JobNode, 'steps'>>;

		const job: JobNode = {
			job: jobName,
			displayName,
			condition,
			continueOnError,
			dependsOn,
			pool,
			steps: [],
		};

		if (children) {
			if (Array.isArray(children)) {
				job.steps = children.map(child => this.compileStep(child)).filter(Boolean) as TaskNode[];
			} else if (React.isValidElement(children)) {
				const step = this.compileStep(children);
				if (step) {
					job.steps.push(step);
				}
			}
		}

		return job;
	}

	private compileStep(element: React.ReactElement): TaskNode | null {
		if (!React.isValidElement(element) || element.type !== Step) {
			return null;
		}

		const { task, inputs, condition, continueOnError, displayName, env } = element.props as TaskNode;

		const taskNode: TaskNode = {
			task,
			displayName,
			env,
			condition,
			continueOnError,
			inputs,
		};

		return taskNode;
	}

	public render(pipeline: PipelineNode): string {
		return yaml.dump(pipeline, { noRefs: true, noArrayIndent: true });
	}
}

const renderer = new AzureDevOpsYamlRenderer();
export default renderer;