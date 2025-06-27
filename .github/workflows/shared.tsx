import React from 'react';
import { Run, Step } from '../../src/github-actions';


export function LintTestNode() {
	return (<>
		<Step name="Setup Node.js" uses="actions/setup-node@v4" with={{ 'node-version': '20.x' }} />
		<Run name={`Install dependencies`}>npm ci</Run>
		<Run name={`Run Linter`}>npm run lint</Run>
		<Run name={`Run Tests`}>npm test</Run>
	</>)
}