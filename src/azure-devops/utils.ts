import { Job, Pipeline, Stage, Step } from './components';


export function isPrimitiveComponent(type: unknown): type is typeof Pipeline | typeof Stage | typeof Job | typeof Step {
	return type === Pipeline || type === Stage || type === Job || type === Step;
}