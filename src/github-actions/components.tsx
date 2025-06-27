import React, { PropsWithChildren } from 'react';
import { WorkflowNode, JobNode, StepNode } from './types.js';
import { renderChildrenToString } from '../shared/utils.js';

export const Workflow: React.FC<PropsWithChildren<Omit<WorkflowNode, 'jobs'>>> = ({ children }) => <>{children}</>;

export const Job: React.FC<PropsWithChildren<Omit<JobNode, 'steps'> & { id: string }>> = ({ children }) => <>{children}</>;

export const Step: React.FC<StepNode> = () => null;

type RunScriptProps = Omit<StepNode, 'uses' | 'run'> & {
	shell?: 'bash' | 'pwsh' | 'powershell' | 'cmd' | 'sh' | 'python';
};

function detectShell(script: string): 'bash' | 'pwsh' | 'powershell' | 'cmd' | 'sh' | 'python' | undefined {
	// PowerShell indicators
	const powershellPatterns = [
		/Write-Output/i,
		/Write-Host/i,
		/Get-Date/i,
		/Get-\w+/i,
		/\$env:/i,
		/\$\w+\.\w+/i // PowerShell object notation
	];

	// CMD indicators
	const cmdPatterns = [
		/dir\s+\/[a-z]/i, // dir with switches like dir /b
		/echo\s+[^"'\n]*\s*$/m, // echo without quotes (CMD style)
		/set\s+\w+=/i,
		/if\s+exist/i,
		/goto\s+\w+/i
	];

	// Bash indicators
	const bashPatterns = [
		/ls\s+-[a-z]/i, // ls with flags like ls -la
		/whoami/i,
		/grep\s/i,
		/sed\s/i,
		/awk\s/i,
		/chmod\s/i,
		/export\s+\w+=/i
	];

	// Check PowerShell first (most specific)
	if (powershellPatterns.some(pattern => pattern.test(script))) {
		return 'pwsh';
	}

	// Check CMD patterns
	if (cmdPatterns.some(pattern => pattern.test(script))) {
		return 'cmd';
	}

	// Check Bash patterns
	if (bashPatterns.some(pattern => pattern.test(script))) {
		return 'bash';
	}

	// No specific shell detected
	return undefined;
}

function createRunScriptStep(defaultShell?: 'bash' | 'pwsh' | 'powershell' | 'cmd' | 'sh' | 'python') {
	return function RunScriptStep({ children, shell, ...props }: PropsWithChildren<RunScriptProps>) {
		const script = renderChildrenToString(children);

		if (!script) {
			throw new Error('Run script step requires a script input or children containing the script.');
		}

		// Use explicit shell, fallback to detected shell, then default shell
		const finalShell = shell || detectShell(script) || defaultShell;

		return (<Step {...props} run={script} shell={finalShell} />);
	};
}

export const Run = createRunScriptStep();
