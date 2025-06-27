// GitHub Actions workflow type definitions

export type WorkflowNode = {
	name: string;
	runName?: string;
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
	with?: Record<string, string | number | boolean>;
	env?: Record<string, string>;
	continueOnError?: boolean;
	timeoutMinutes?: number;
	workingDirectory?: string;
} & ({
	uses: string;
} | {
	run: string;
	shell?: 'bash' | 'pwsh' | 'powershell' | 'cmd' | 'sh' | 'python' | undefined;
});

export type WorkflowTriggers = {
	push?: PushTrigger;
	pullRequest?: PullRequestTrigger;
	schedule?: ScheduleTrigger[];
	workflowDispatch?: WorkflowDispatchTrigger;
	workflowCall?: WorkflowCallTrigger;
	[key: string]: unknown; // Allow other trigger types
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

export type ScheduleTrigger = {
	cron: string;
};

export type WorkflowDispatchTrigger = {
	inputs?: Record<string, WorkflowDispatchInput>;
};

export type WorkflowCallTrigger = {
	inputs?: Record<string, WorkflowCallInput>;
	outputs?: Record<string, WorkflowCallOutput>;
	secrets?: Record<string, WorkflowCallSecret>;
};

export type WorkflowDispatchInput = {
	description?: string;
	required?: boolean;
	default?: string;
	type?: 'string' | 'number' | 'boolean' | 'choice' | 'environment';
	options?: string[];
};

export type WorkflowCallInput = {
	description?: string;
	required?: boolean;
	default?: string;
	type?: 'string' | 'number' | 'boolean';
};

export type WorkflowCallOutput = {
	description?: string;
	value: string;
};

export type WorkflowCallSecret = {
	description?: string;
	required?: boolean;
};

export type Permissions =
	| 'read-all'
	| 'write-all'
	| Record<string, 'read' | 'write' | 'none'>;

export type Defaults = {
	run?: {
		shell?: string;
		workingDirectory?: string;
	};
};

export type Concurrency = {
	group: string;
	cancelInProgress?: boolean;
};

export type Strategy = {
	matrix?: Record<string, string | number | boolean | string[]>;
	failFast?: boolean;
	maxParallel?: number;
};

export type RunsOnMatrix = {
	matrix: Record<string, string | number | boolean | string[]>;
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

export type Service = {
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

export type Node = WorkflowNode | JobNode | StepNode;
