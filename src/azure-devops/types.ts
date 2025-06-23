
export type PipelineNode
	= { trigger: 'none' | string[] | TriggerNode, pool?: string | PoolNode, variables?: VariablesNode, stages: StageNode[] }
	| { trigger: 'none' | string[] | TriggerNode, pool?: string | PoolNode, variables?: VariablesNode, jobs: JobNode[] }
	| { trigger: 'none' | string[] | TriggerNode, pool?: string | PoolNode, variables?: VariablesNode, steps: TaskNode[] };

export type TriggerNode = {
	batch?: boolean;
	branches?: {
		include?: string[];
		exclude?: string[];
	},
	paths?: {
		include?: string[];
		exclude?: string[];
	},
	tags?: {
		include?: string[];
		exclude?: string[];
	}
};

export type PoolNode = {
	name?: string;
	demands?: string | string[];
	vmImage?: string;
}

export type VariablesNode = Array<{ name: string, value: string } | { group: string }>;

export type StageNode = {
	stage: string;
	displayName?: string;
	pool?: string | PoolNode;
	dependsOn?: string | string[];
	condition?: string;
	variables?: VariablesNode;
	jobs: JobNode[];
};

export type JobNode = {
	job: string;
	displayName?: string;
	dependsOn?: string | string[];
	condition?: string;
	continueOnError?: boolean;
	pool?: string | PoolNode;

	variables?: VariablesNode;

	workspace?: {
		clean: 'outputs' | 'resources' | 'all';
	};
	steps: TaskNode[];
};

// Types for Azure DevOps pipeline
export type TaskNode = {
	task: string;
	inputs?: Record<string, string | number | boolean | string[] | number[] | boolean[]>;
	condition?: string;
	continueOnError?: boolean;
	displayName?: string;
	env?: Record<string, string>;
};

export type Node = PipelineNode | TriggerNode | PoolNode | VariablesNode | StageNode | JobNode | TaskNode;