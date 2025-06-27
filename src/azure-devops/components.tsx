import React, { PropsWithChildren } from 'react';
import { JobNode, PipelineNode, StageNode, TaskNode } from './types.js';
import { renderChildrenToString } from '../shared/utils.js';

export const Pipeline: React.FC<PropsWithChildren<Omit<PipelineNode, 'stages' | 'jobs' | 'steps'>>> = ({ children }) => <>{children}</>;

export const Stage: React.FC<PropsWithChildren<Omit<StageNode, 'jobs'>>> = ({ children }) => <>{children}</>;

export const Job: React.FC<PropsWithChildren<Omit<JobNode, 'steps'>>> = ({ children }) => <>{children}</>;

export const Step: React.FC<TaskNode> = () => null;

type ScriptProps = Omit<TaskNode, 'task' | 'inputs'> & {
	workingDirectory?: string;
	failOnStderr?: string;
}

function createCustomScriptStep(task: string) {

	return function CustomScriptStep({ children, workingDirectory, failOnStderr, ...props }: PropsWithChildren<ScriptProps>) {
		const script = renderChildrenToString(children);

		if (!script) {
			throw new Error('Powershell step requires a script input or children containing the script.');
		}

		return (<Step {...props} task={task} inputs={{ script }} />);
	}
}

export const Powershell = createCustomScriptStep('Powershell@2');
export const Pwsh = Powershell; // Alias for compatibility
export const CmdLine = createCustomScriptStep('CmdLine@2');
export const Bash = createCustomScriptStep('ShellScript@2');

