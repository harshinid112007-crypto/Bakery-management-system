export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'prep' | 'proofing' | 'baking' | 'finishing' | 'completed';

export type Station =
  | 'Breads'
  | 'Viennoiserie'
  | 'Custom Cakes'
  | 'Prep & Doughs'
  | 'Ovens'
  | 'Finishing & Packaging';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface BakeryTask {
  id: string;
  title: string;
  description: string;
  station: Station;
  priority: TaskPriority;
  status: TaskStatus;
  dueTime: string;
  estimatedMinutes: number;
  quantity?: string;
  assignedBaker: string;
  projectId?: string;
  checklist: ChecklistItem[];
  createdAt: string;
  completedAt?: string;
  tags?: string[];
  ovenSlot?: string;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  description: string;
  deadline: string;
  status: 'in_progress' | 'scheduled' | 'review' | 'completed';
  targetUnits: number;
  category: string;
  assignedLead: string;
  color: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedTasks?: Array<Partial<BakeryTask>>;
  actions?: Array<{
    label: string;
    actionType: string;
    payload?: any;
  }>;
  isSimulated?: boolean;
}

export interface OvenStatus {
  id: string;
  name: string;
  type: 'Deck' | 'Convection Rack' | 'Proof Box';
  targetTemp: string;
  currentTemp: string;
  currentBatch?: string;
  timeRemaining?: string;
  status: 'active' | 'preheating' | 'idle';
}

export type ActiveTab = 'dashboard' | 'tasks' | 'projects' | 'analytics' | 'assistant';
