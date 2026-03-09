export interface Document {
  id: string;
  originalFileName: string;
  mimeType: string;
  storageKey: string;
  createdAt: Date;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export interface Job {
  id: string;
  documentId: string;
  status: JobStatus;
  attempts: number;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  lockedAt: Date | null;
}

export interface Extraction {
  id: string;
  documentId: string;
  text: string;
  textStorageKey: string | null;
  meta: unknown | null;
  structured: unknown | null;
  analysisError?: string | null;
  redFlags?: unknown | null;
  createdAt: Date;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DISMISSED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskSourceType = 'FLAG' | 'GAP' | 'SYSTEM';

export interface Task {
  id: string;
  documentId: string;
  taskKey: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sourceType: TaskSourceType;
  sourceRef: string | null;
  relatedPlanIndexes: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}


