import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BakeryTask, Project, OvenStatus } from '../src/types.ts';
import { INITIAL_TASKS, INITIAL_PROJECTS, INITIAL_OVENS } from '../src/data/initialData.ts';

// In-memory operational cache for ultra-fast response & offline fallback
let localTasks: BakeryTask[] = [...INITIAL_TASKS];
let localProjects: Project[] = [...INITIAL_PROJECTS];
let localOvens: OvenStatus[] = [...INITIAL_OVENS];

let supabaseClient: SupabaseClient | null = null;

/**
 * Lazy initialization of Supabase client to prevent crashes if credentials are unset.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
}

// -----------------------------------------------------------------------------
// Data Mapping Transformers
// -----------------------------------------------------------------------------

function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client ?? undefined,
    description: row.description ?? '',
    deadline: row.deadline ?? '',
    status: row.status,
    targetUnits: Number(row.target_units ?? 0),
    category: row.category ?? 'Wholesale B2B',
    assignedLead: row.assigned_lead ?? '',
    color: row.color ?? '#D97706',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function projectToRow(p: Partial<Project>): Record<string, any> {
  const row: Record<string, any> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.client !== undefined) row.client = p.client;
  if (p.description !== undefined) row.description = p.description;
  if (p.deadline !== undefined) row.deadline = p.deadline;
  if (p.status !== undefined) row.status = p.status;
  if (p.targetUnits !== undefined) row.target_units = p.targetUnits;
  if (p.category !== undefined) row.category = p.category;
  if (p.assignedLead !== undefined) row.assigned_lead = p.assignedLead;
  if (p.color !== undefined) row.color = p.color;
  if (p.createdAt !== undefined) row.created_at = p.createdAt;
  return row;
}

function rowToTask(row: any): BakeryTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    station: row.station,
    priority: row.priority,
    status: row.status,
    dueTime: row.due_time ?? '07:00 AM',
    estimatedMinutes: Number(row.estimated_minutes ?? 30),
    quantity: row.quantity ?? undefined,
    assignedBaker: row.assigned_baker ?? '',
    projectId: row.project_id ?? undefined,
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    ovenSlot: row.oven_slot ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function taskToRow(t: Partial<BakeryTask>): Record<string, any> {
  const row: Record<string, any> = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.station !== undefined) row.station = t.station;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.status !== undefined) row.status = t.status;
  if (t.dueTime !== undefined) row.due_time = t.dueTime;
  if (t.estimatedMinutes !== undefined) row.estimated_minutes = t.estimatedMinutes;
  if (t.quantity !== undefined) row.quantity = t.quantity;
  if (t.assignedBaker !== undefined) row.assigned_baker = t.assignedBaker;
  if (t.projectId !== undefined) row.project_id = t.projectId || null;
  if (t.checklist !== undefined) row.checklist = t.checklist;
  if (t.tags !== undefined) row.tags = t.tags;
  if (t.ovenSlot !== undefined) row.oven_slot = t.ovenSlot;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt;
  if (t.createdAt !== undefined) row.created_at = t.createdAt;
  return row;
}

function rowToOven(row: any): OvenStatus {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    targetTemp: row.target_temp ?? '',
    currentTemp: row.current_temp ?? '',
    currentBatch: row.current_batch ?? undefined,
    timeRemaining: row.time_remaining ?? undefined,
    status: row.status,
  };
}

function ovenToRow(o: Partial<OvenStatus>): Record<string, any> {
  const row: Record<string, any> = {};
  if (o.id !== undefined) row.id = o.id;
  if (o.name !== undefined) row.name = o.name;
  if (o.type !== undefined) row.type = o.type;
  if (o.targetTemp !== undefined) row.target_temp = o.targetTemp;
  if (o.currentTemp !== undefined) row.current_temp = o.currentTemp;
  if (o.currentBatch !== undefined) row.current_batch = o.currentBatch;
  if (o.timeRemaining !== undefined) row.time_remaining = o.timeRemaining;
  if (o.status !== undefined) row.status = o.status;
  return row;
}

// -----------------------------------------------------------------------------
// Database Operations (Projects)
// -----------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) {
    return localProjects;
  }

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getProjects warning, using local cache:', error.message);
      return localProjects;
    }

    if (!data || data.length === 0) {
      // Auto-seed if table is empty in Supabase
      await seedDatabase();
      return localProjects;
    }

    const mapped = data.map(rowToProject);
    localProjects = mapped;
    return mapped;
  } catch (err: any) {
    console.error('Error in getProjects:', err.message);
    return localProjects;
  }
}

export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const newProject: Project = {
    id: projectData.id || `proj-${Date.now()}`,
    name: projectData.name || 'New Order',
    client: projectData.client,
    description: projectData.description || '',
    deadline: projectData.deadline || 'Today, 12:00 PM',
    status: projectData.status || 'in_progress',
    targetUnits: projectData.targetUnits || 100,
    category: projectData.category || 'Wholesale B2B',
    assignedLead: projectData.assignedLead || 'Chef Marcus',
    color: projectData.color || '#D97706',
    createdAt: projectData.createdAt || new Date().toISOString(),
  };

  // Update local cache
  localProjects = [newProject, ...localProjects.filter(p => p.id !== newProject.id)];

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = projectToRow(newProject);
      const { data, error } = await client.from('projects').insert(row).select().single();
      if (error) {
        console.error('Supabase createProject error:', error.message);
      } else if (data) {
        return rowToProject(data);
      }
    } catch (err: any) {
      console.error('Failed to insert project into Supabase:', err.message);
    }
  }

  return newProject;
}

export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  const existing = localProjects.find((p) => p.id === id);
  const updated: Project = {
    ...(existing || {} as Project),
    ...projectData,
    id,
  };

  localProjects = localProjects.map((p) => (p.id === id ? updated : p));

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = projectToRow(projectData);
      const { data, error } = await client
        .from('projects')
        .update(row)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateProject error:', error.message);
      } else if (data) {
        return rowToProject(data);
      }
    } catch (err: any) {
      console.error('Failed to update project in Supabase:', err.message);
    }
  }

  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  localProjects = localProjects.filter((p) => p.id !== id);
  // Also detach project from tasks in local cache
  localTasks = localTasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('projects').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteProject error:', error.message);
        return false;
      }
    } catch (err: any) {
      console.error('Failed to delete project in Supabase:', err.message);
      return false;
    }
  }

  return true;
}

// -----------------------------------------------------------------------------
// Database Operations (Tasks)
// -----------------------------------------------------------------------------

export async function getTasks(): Promise<BakeryTask[]> {
  const client = getSupabaseClient();
  if (!client) {
    return localTasks;
  }

  try {
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getTasks warning, using local cache:', error.message);
      return localTasks;
    }

    if (!data || data.length === 0) {
      await seedDatabase();
      return localTasks;
    }

    const mapped = data.map(rowToTask);
    localTasks = mapped;
    return mapped;
  } catch (err: any) {
    console.error('Error in getTasks:', err.message);
    return localTasks;
  }
}

export async function createTask(taskData: Partial<BakeryTask>): Promise<BakeryTask> {
  const newTask: BakeryTask = {
    id: taskData.id || `task-${Date.now()}`,
    title: taskData.title || 'New Baking Task',
    description: taskData.description || '',
    station: taskData.station || 'Breads',
    priority: taskData.priority || 'Medium',
    status: taskData.status || 'prep',
    dueTime: taskData.dueTime || '07:00 AM',
    estimatedMinutes: taskData.estimatedMinutes || 30,
    quantity: taskData.quantity,
    assignedBaker: taskData.assignedBaker || 'Chef Marcus',
    projectId: taskData.projectId,
    checklist: taskData.checklist || [],
    tags: taskData.tags || [],
    ovenSlot: taskData.ovenSlot,
    completedAt: taskData.completedAt,
    createdAt: taskData.createdAt || new Date().toISOString(),
  };

  localTasks = [newTask, ...localTasks.filter(t => t.id !== newTask.id)];

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = taskToRow(newTask);
      const { data, error } = await client.from('tasks').insert(row).select().single();
      if (error) {
        console.error('Supabase createTask error:', error.message);
      } else if (data) {
        return rowToTask(data);
      }
    } catch (err: any) {
      console.error('Failed to insert task into Supabase:', err.message);
    }
  }

  return newTask;
}

export async function updateTask(id: string, taskData: Partial<BakeryTask>): Promise<BakeryTask | null> {
  const existing = localTasks.find((t) => t.id === id);
  const updated: BakeryTask = {
    ...(existing || {} as BakeryTask),
    ...taskData,
    id,
  };

  localTasks = localTasks.map((t) => (t.id === id ? updated : t));

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = taskToRow(taskData);
      const { data, error } = await client
        .from('tasks')
        .update(row)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateTask error:', error.message);
      } else if (data) {
        return rowToTask(data);
      }
    } catch (err: any) {
      console.error('Failed to update task in Supabase:', err.message);
    }
  }

  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  localTasks = localTasks.filter((t) => t.id !== id);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteTask error:', error.message);
        return false;
      }
    } catch (err: any) {
      console.error('Failed to delete task in Supabase:', err.message);
      return false;
    }
  }

  return true;
}

// -----------------------------------------------------------------------------
// Database Operations (Ovens)
// -----------------------------------------------------------------------------

export async function getOvens(): Promise<OvenStatus[]> {
  const client = getSupabaseClient();
  if (!client) {
    return localOvens;
  }

  try {
    const { data, error } = await client.from('ovens').select('*').order('id');
    if (error || !data || data.length === 0) {
      return localOvens;
    }
    const mapped = data.map(rowToOven);
    localOvens = mapped;
    return mapped;
  } catch (err: any) {
    console.error('Error fetching ovens:', err.message);
    return localOvens;
  }
}

export async function updateOven(id: string, ovenData: Partial<OvenStatus>): Promise<OvenStatus | null> {
  const existing = localOvens.find((o) => o.id === id);
  const updated: OvenStatus = {
    ...(existing || {} as OvenStatus),
    ...ovenData,
    id,
  };

  localOvens = localOvens.map((o) => (o.id === id ? updated : o));

  const client = getSupabaseClient();
  if (client) {
    try {
      const row = ovenToRow(ovenData);
      row.updated_at = new Date().toISOString();
      await client.from('ovens').update(row).eq('id', id);
    } catch (err: any) {
      console.error('Failed to update oven in Supabase:', err.message);
    }
  }

  return updated;
}

// -----------------------------------------------------------------------------
// Database Seeding & Health Check
// -----------------------------------------------------------------------------

export async function seedDatabase(): Promise<{
  success: boolean;
  message: string;
  count: { projects: number; tasks: number; ovens: number };
}> {
  // Always update local cache
  localProjects = [...INITIAL_PROJECTS];
  localTasks = [...INITIAL_TASKS];
  localOvens = [...INITIAL_OVENS];

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      message: 'Initial dataset loaded in local operational cache (Configure SUPABASE_URL & SUPABASE_ANON_KEY to persist to PostgreSQL).',
      count: {
        projects: localProjects.length,
        tasks: localTasks.length,
        ovens: localOvens.length,
      },
    };
  }

  try {
    // 1. Seed Projects
    for (const proj of INITIAL_PROJECTS) {
      await client.from('projects').upsert(projectToRow(proj), { onConflict: 'id' });
    }

    // 2. Seed Tasks
    for (const task of INITIAL_TASKS) {
      await client.from('tasks').upsert(taskToRow(task), { onConflict: 'id' });
    }

    // 3. Seed Ovens
    for (const oven of INITIAL_OVENS) {
      await client.from('ovens').upsert(ovenToRow(oven), { onConflict: 'id' });
    }

    return {
      success: true,
      message: 'Successfully seeded initial bakery operations data into Supabase PostgreSQL tables.',
      count: {
        projects: INITIAL_PROJECTS.length,
        tasks: INITIAL_TASKS.length,
        ovens: INITIAL_OVENS.length,
      },
    };
  } catch (err: any) {
    console.error('Supabase seeding error:', err.message);
    return {
      success: false,
      message: `Failed to seed Supabase: ${err.message}`,
      count: {
        projects: localProjects.length,
        tasks: localTasks.length,
        ovens: localOvens.length,
      },
    };
  }
}

export async function getDatabaseHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  database: string;
  tables: {
    projects: number;
    tasks: number;
    ovens: number;
  };
  message: string;
}> {
  const configured = isSupabaseConfigured();
  const client = getSupabaseClient();

  if (!configured || !client) {
    return {
      configured: false,
      connected: false,
      database: 'Local In-Memory Cache (Pending Supabase credentials)',
      tables: {
        projects: localProjects.length,
        tasks: localTasks.length,
        ovens: localOvens.length,
      },
      message: 'Supabase credentials not detected. Operating in local memory mode. Provide SUPABASE_URL and SUPABASE_ANON_KEY to activate cloud PostgreSQL synchronization.',
    };
  }

  try {
    // Test connection with a lightweight query
    const { count: projCount, error: projError } = await client
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projError) {
      return {
        configured: true,
        connected: false,
        database: 'Supabase PostgreSQL',
        tables: {
          projects: localProjects.length,
          tasks: localTasks.length,
          ovens: localOvens.length,
        },
        message: `Supabase connected, but tables not found or RLS restricted: ${projError.message}. Execute /supabase/schema.sql in your Supabase SQL Editor.`,
      };
    }

    const { count: taskCount } = await client
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    const { count: ovenCount } = await client
      .from('ovens')
      .select('*', { count: 'exact', head: true });

    return {
      configured: true,
      connected: true,
      database: 'Supabase PostgreSQL (Live)',
      tables: {
        projects: projCount ?? localProjects.length,
        tasks: taskCount ?? localTasks.length,
        ovens: ovenCount ?? localOvens.length,
      },
      message: 'Connected to Supabase PostgreSQL database. Tables verified and operational.',
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      database: 'Supabase PostgreSQL',
      tables: {
        projects: localProjects.length,
        tasks: localTasks.length,
        ovens: localOvens.length,
      },
      message: `Connection error: ${err.message}`,
    };
  }
}
