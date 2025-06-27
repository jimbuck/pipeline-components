import React from 'react';
import debugFactory from 'debug';

import azureDevOpsYamlRenderer from './azure-devops/renderer.js';
import gitHubActionsYamlRenderer from './github-actions/renderer.js';
import { PipelineRenderer } from './shared/renderer.js';


const debug = debugFactory('pipeline-components:renderer');

const renderers = [
  azureDevOpsYamlRenderer,
  gitHubActionsYamlRenderer,
] as PipelineRenderer<unknown>[];

export function renderPipeline(pipeline: React.ReactNode): string | null {
  const renderer = getRenderer(pipeline);
  if (!renderer) {
    debug('No suitable renderer found for the provided pipeline.');
    return null;
  }

  const compiledElements = renderer.compilePipeline(pipeline);
  if (!compiledElements) {
    debug('Failed to compile pipeline elements');
    return null;
  }
  return renderer.render(compiledElements);
}

export function getFileExtension(pipeline: React.ReactNode): string | null {
  const renderer = getRenderer(pipeline);
  if (!renderer) {
    debug('No suitable renderer found for the provided pipeline.');
    return null;
  }
  return renderer.getFileExtension();
}

function getRenderer(pipeline: React.ReactNode): PipelineRenderer<unknown> | null {
  for (const renderer of renderers) {
    if (renderer.canRender(pipeline)) {
      return renderer;
    }
  }
  debug('No suitable renderer found for the provided pipeline.');
  return null;
}