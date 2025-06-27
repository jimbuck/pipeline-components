import React, { PropsWithChildren } from 'react';
import { Workflow, Job, Step, Run } from '../../src/github-actions/index.js';

function TestSuite({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <>
      <Step name={`Start ${name}`} run={`echo "Starting ${name}"`} />
      {children}
      <Step name={`Finish ${name}`} run={`echo "Finished ${name}"`} />
    </>
  );
}

export default function() {
  return (
    <Workflow 
      name="CI" 
      on={{ 
        push: { branches: ['main'] }, 
        pullRequest: { branches: ['main'] } 
      }}
    >
      <Job id="test" name="Test" runsOn="ubuntu-latest">
        <Step name="Checkout" uses="actions/checkout@v4" />
        <Step name="Setup Node.js" uses="actions/setup-node@v4" with={{ 'node-version': '18' }} />
        <TestSuite name="Unit Tests">
          <Step name="Install dependencies" run="npm ci" />
          <Run name="Run tests">npm test</Run>
        </TestSuite>
      </Job>
      
      <Job id="build" name="Build" runsOn="windows-latest" needs="test">
        <Step name="Checkout" uses="actions/checkout@v4" />
        <Step name="Setup Node.js" uses="actions/setup-node@v4" with={{ 'node-version': '18' }} />
        <Step name="Install dependencies" run="npm ci" />
        <Run name="Build application">{`
          npm run build
          echo "Build completed successfully"
        `}</Run>
      </Job>
    </Workflow>
  );
}
