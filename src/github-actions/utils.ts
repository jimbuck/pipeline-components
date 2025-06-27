import { Workflow, Job, Step } from './components.js';

export function isPrimitiveComponent(type: unknown): type is typeof Workflow | typeof Job | typeof Step {
	return type === Workflow || type === Job || type === Step;
}
