import React from 'react';
import debugFactory from 'debug';

import azureDevOpsYamlRenderer from './azure-devops/renderer.js';
import { PipelineRenderer } from './shared/renderer.js';


const debug = debugFactory('pipeline-components:renderer');

const renderers = [
  azureDevOpsYamlRenderer,
] as PipelineRenderer<unknown, unknown>[];

export function renderPipeline(pipeline: React.ReactNode): string | null {
  for (const renderer of renderers) {
    if (renderer.canRender(pipeline)) {
      const compiledElements = renderer.compilePipeline(pipeline);
      if (!compiledElements) {
        debug('Failed to compile pipeline elements');
        return null;
      }
      return renderer.render(compiledElements);
    }
  }

  debug('No suitable renderer found for the provided pipeline.');
  return null;
}