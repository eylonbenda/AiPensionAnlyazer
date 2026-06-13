export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  accessToken: string;
  user: AuthUser;
};

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export type Job = {
  id: string;
  status: JobStatus;
  attempts: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  lockedAt: string | null;
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DISMISSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskSourceType = 'FLAG' | 'GAP' | 'SYSTEM';

export type Task = {
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
  createdAt: string;
  updatedAt: string;
};

export type GapSeverity = 'high' | 'medium' | 'low' | 'info';
export type GapCategory = 'projection-gap' | 'data-completeness';

export type ProjectionGapFlag = {
  id: string;
  severity: GapSeverity;
  category: GapCategory;
  message: string;
  field?: string;
  value?: unknown;
};

export type ProjectionSummary = {
  totalCurrentBalance: number | null;
  totalProjectedWithDeposits: number | null;
  totalProjectedNoDeposits: number | null;
  totalMonthlyPensionWithDeposits: number | null;
  totalMonthlyPensionNoDeposits: number | null;
  projectedGrowthPercent: number | null;
  depositImpactOnBalance: number | null;
  depositImpactOnPension: number | null;
  plansWithProjections: number;
  totalPlans: number;
  currency: string;
};

export type AnalysisPlanResponse = {
  documentId: string;
  job: Job | null;
  summary: string | null;
  projection: ProjectionSummary | null;
  retirementGap: {
    targetMonthlyPension: number;
    projectedMonthlyPension: number;
    gapAmount: number;
    gapPercent: number | null;
    status: 'SHORTFALL' | 'ON_TRACK' | 'SURPLUS';
    currency: string;
  } | null;
  redFlags: unknown;
  redFlagsBySeverity: { high: number; medium: number; low: number };
  projectionGaps: ProjectionGapFlag[];
  tasks: Task[];
};

export type ExtractionResponse = {
  id: string;
  documentId: string;
  text: string;
  textStorageKey: string | null;
  meta: unknown;
  structured: unknown;
  analysisError: string | null;
  createdAt: string;
};

type ApiRequestOptions = {
  token?: string | null;
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
  }
  // Ensure no trailing slash to keep URL join predictable.
  return baseUrl.replace(/\/+$/, '');
}

async function requestJson<T>(
  path: string,
  options: RequestInit & ApiRequestOptions,
): Promise<T> {
  const { token } = options;
  const baseUrl = getApiBaseUrl();

  const headers: Record<string, string> = {
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : (options.headers as Record<string, string> | undefined) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }

  // API always returns JSON for our endpoints.
  return res.json() as Promise<T>;
}

export async function apiLogin(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function apiRegister(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResult> {
  return requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function apiGetMe(token: string): Promise<AuthUser> {
  return requestJson('/auth/me', { method: 'GET', token });
}

export async function apiUploadDocument(token: string, file: File): Promise<{
  documentId: string;
  jobId: string;
}> {
  const form = new FormData();
  form.append('file', file);

  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }

  return res.json();
}

export async function apiGetJob(token: string, jobId: string): Promise<Job> {
  return requestJson(`/jobs/${encodeURIComponent(jobId)}`, { method: 'GET', token });
}

export async function apiGetAnalysisPlan(
  token: string,
  documentId: string,
  input?: { targetMonthlyPension?: number | null },
): Promise<AnalysisPlanResponse> {
  const target = input?.targetMonthlyPension;
  const qs = typeof target === 'number' && Number.isFinite(target) && target > 0 ? `?targetMonthlyPension=${encodeURIComponent(target)}` : '';
  return requestJson(`/documents/${encodeURIComponent(documentId)}/plan${qs}`, {
    method: 'GET',
    token,
  });
}

export async function apiGetExtraction(
  token: string,
  documentId: string,
): Promise<ExtractionResponse> {
  return requestJson(`/documents/${encodeURIComponent(documentId)}/extraction`, {
    method: 'GET',
    token,
  });
}

export async function apiGetTasks(token: string, documentId: string): Promise<Task[]> {
  return requestJson(`/documents/${encodeURIComponent(documentId)}/tasks`, {
    method: 'GET',
    token,
  });
}

export async function apiUpdateTaskStatus(
  token: string,
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  return requestJson(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    token,
  });
}

