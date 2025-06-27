import React from 'react';
import { Workflow, Job, Step, Run } from '../../src/github-actions';
import { LintTestNode } from './shared';

export default function () {
	return (
		<Workflow name="Release Pipeline" on={{ push: { branches: ['main'] } }}>
			<Job id="bump-version-and-publish" name="Bump Version and Publish" runsOn="ubuntu-latest"
				permissions={{
					contents: 'write',
					'id-token': 'write',
				}}
			>
				<Step name="Checkout source code" uses="actions/checkout@v4" with={{ ref: '${{ github.ref }}' }} />
				<LintTestNode />
				<Step name="Automated Version Bump" id="version-bump" uses="phips28/gh-action-bump-version@master"
					env={{
						GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
					}}
					with={{
						'tag-prefix': 'v',
						'commit-message': 'ci: bumps version to {{version}}',
					}}
				/>
				<Run name="Build">npm run build</Run>
				<Run name="Publish to npm" env={{ NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}' }}>npm publish --provenance --access public</Run>
			</Job>
		</Workflow>
	);
}
