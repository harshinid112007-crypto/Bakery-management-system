import { BakeryTask, Project, OvenStatus, NaturalLanguageSearchResponse } from '../types';

export interface DatabaseHealth {
  configured: boolean;
  connected: boolean;
  database: string;
  tables: {
    projects: number;
    tasks: number;
    ovens: number;
  };
  message: string;
}

// -----------------------------------------------------------------------------
// Database Status & Operations
// -----------------------------------------------------------------------------

export async function fetchDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) {
      throw new Error(`Status check failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      database: 'Local Mode',
      tables: { projects: 0, tasks: 0, ovens: 0 },
      message: err.message || 'Unable to connect to database service',
    };
  }
}

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/db/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Seeding failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchSchemaSql(): Promise<string> {
  const res = await fetch('/api/db/schema');
  if (!res.ok) {
    throw new Error('Failed to fetch schema SQL');
  }
  return await res.text();
}

// -----------------------------------------------------------------------------
// Tasks API (Supabase PostgreSQL backed)
// -----------------------------------------------------------------------------

export async function fetchTasks(): Promise<BakeryTask[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error(`Failed to load tasks: ${res.statusText}`);
  }
  return await res.json();
}

export async function createTask(task: Partial<BakeryTask>): Promise<BakeryTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateTask(id: string, task: Partial<BakeryTask>): Promise<BakeryTask> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    throw new Error(`Failed to update task: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteTask(id: string): Promise<boolean> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete task: ${res.statusText}`);
  }
  const result = await res.json();
  return result.success;
}

// -----------------------------------------------------------------------------
// Projects API (Supabase PostgreSQL backed)
// -----------------------------------------------------------------------------

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) {
    throw new Error(`Failed to load projects: ${res.statusText}`);
  }
  return await res.json();
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    throw new Error(`Failed to create project: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateProject(id: string, project: Partial<Project>): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    throw new Error(`Failed to update project: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete project: ${res.statusText}`);
  }
  const result = await res.json();
  return result.success;
}

// -----------------------------------------------------------------------------
// Ovens API (Supabase PostgreSQL backed)
// -----------------------------------------------------------------------------

export async function fetchOvens(): Promise<OvenStatus[]> {
  const res = await fetch('/api/ovens');
  if (!res.ok) {
    throw new Error(`Failed to load ovens: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateOven(id: string, oven: Partial<OvenStatus>): Promise<OvenStatus> {
  const res = await fetch(`/api/ovens/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oven),
  });
  if (!res.ok) {
    throw new Error(`Failed to update oven: ${res.statusText}`);
  }
  return await res.json();
}

// -----------------------------------------------------------------------------
// AI Natural Language Search API
// -----------------------------------------------------------------------------

export async function performNaturalLanguageSearch(
  query: string,
  tasks?: BakeryTask[],
  projects?: Project[]
): Promise<NaturalLanguageSearchResponse> {
  const res = await fetch('/api/ai/natural-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, tasks, projects }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Search failed: ${res.statusText}`);
  }
  return await res.json();
}
