import React, { PropsWithChildren } from 'react';
import { JobNode, PipelineNode, StageNode, TaskNode } from './types';

export const Pipeline: React.FC<PropsWithChildren<Omit<PipelineNode, 'stages' | 'jobs' | 'steps'>>> = ({ children }) => <>{children}</>;

export const Stage: React.FC<PropsWithChildren<Omit<StageNode, 'jobs'>>> = ({ children }) => <>{children}</>;

export const Job: React.FC<PropsWithChildren<Omit<JobNode, 'steps'>>> = ({ children }) => <>{children}</>;

export const Step: React.FC<TaskNode> = () => null;
