import React from 'react';
import { Workflow, Job, Step, Run } from '../../src/github-actions';
import { LintTestNode } from './shared';

export default function () {
	return (
		<Workflow name="PR Pipeline" on={{ pullRequest: { branches: ['main'] } }}>
			<Job id="lint-test" name="Lint & Test" runsOn="ubuntu-latest">
				<Step name="Checkout" uses="actions/checkout@v4" />
				<LintTestNode />
			</Job>
		</Workflow>
	);
}
