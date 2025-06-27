import React from 'react';


export abstract class PipelineRenderer<TRoot> {
	public abstract canRender(node: React.ReactNode): boolean;
	public abstract getFileExtension(): string;
	public abstract compilePipeline(element: React.ReactNode): TRoot | null;
	public abstract render(pipeline: TRoot): string;
}