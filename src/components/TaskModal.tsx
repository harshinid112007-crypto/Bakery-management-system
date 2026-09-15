import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Clock,
  Flame,
  User,
  FolderKanban,
  CheckCircle2,
  CheckSquare,
} from 'lucide-react';
import { BakeryTask, TaskStatus, Station, TaskPriority, Project, ChecklistItem } from '../types';
import { BAKERY_STATIONS, BAKERS } from '../data/initialData';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: BakeryTask | null; // If null, create mode
  initialStatus?: TaskStatus;
  initialProjectId?: string;
  projects: Project[];
  onSaveTask: (taskData: Partial<BakeryTask>) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  initialStatus = 'prep',
  initialProjectId,
  projects,
  onSaveTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [station, setStation] = useState<Station>('Breads');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [dueTime, setDueTime] = useState('07:00 AM');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [quantity, setQuantity] = useState('');
  const [assignedBaker, setAssignedBaker] = useState(BAKERS[0]);
  const [projectId, setProjectId] = useState<string>(initialProjectId || '');
  const [ovenSlot, setOvenSlot] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStation(task.station);
      setPriority(task.priority);
      setStatus(task.status);
      setDueTime(task.dueTime);
      setEstimatedMinutes(task.estimatedMinutes);
      setQuantity(task.quantity || '');
      setAssignedBaker(task.assignedBaker);
      setProjectId(task.projectId || '');
      setOvenSlot(task.ovenSlot || '');
      setChecklist(task.checklist || []);
    } else {
      setTitle('');
      setDescription('');
      setStation('Breads');
      setPriority('Medium');
      setStatus(initialStatus);
      setDueTime('07:00 AM');
      setEstimatedMinutes(45);
      setQuantity('');
      setAssignedBaker(BAKERS[0]);
      setProjectId(initialProjectId || '');
      setOvenSlot('');
      setChecklist([]);
    }
  }, [task, initialStatus, initialProjectId, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: `c-${Date.now()}`,
        text: newChecklistText.trim(),
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveTask({
      ...(task ? { id: task.id } : {}),
      title: title.trim(),
      description: description.trim(),
      station,
      priority,
      status,
      dueTime,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      quantity: quantity.trim() || undefined,
      assignedBaker,
      projectId: projectId || undefined,
      ovenSlot: ovenSlot.trim() || undefined,
      checklist,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              {task ? 'Edit Production Batch' : 'New Production Task'}
            </span>
            <h2 className="text-lg font-bold font-['Outfit',sans-serif] text-stone-100">
              {task ? task.title : 'Schedule Baking Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mix Country Sourdough Batards Batch B"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Bake / Process Instructions
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flour type, target dough temperature, hydration, bake temperatures, steam..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Grid 1: Station, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Station
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value as Station)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
              >
                {BAKERY_STATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="Urgent">🔥 Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Production Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="prep">Prep & Doughs</option>
                <option value="proofing">Proofing</option>
                <option value="baking">In Oven</option>
                <option value="finishing">Finishing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Grid 2: Due Time, Minutes, Batch Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                Due Time
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="06:30 AM"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Est. Duration (min)
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Batch Quantity
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="48 pcs / 20 loaves"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Grid 3: Baker, Project, Oven Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-500" />
                Assigned Baker
              </label>
              <select
                value={assignedBaker}
                onChange={(e) => setAssignedBaker(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              >
                {BAKERS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-stone-500" />
                Linked Order
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              >
                <option value="">No Project (General Floor)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-stone-500" />
                Oven / Chamber Slot
              </label>
              <input
                type="text"
                value={ovenSlot}
                onChange={(e) => setOvenSlot(e.target.value)}
                placeholder="Deck 1 (245°C) or Proofer"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Interactive Checklist Section */}
          <div className="pt-2 border-t border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              Baker&apos;s Checklist & HACCP Protocol ({checklist.length})
            </label>

            <div className="space-y-2 mb-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs"
                >
                  <div
                    onClick={() => handleToggleChecklistItem(item.id)}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                      }`}
                    >
                      {item.completed && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className={`truncate ${item.completed ? 'line-through text-stone-600' : 'text-stone-800'}`}>
                      {item.text}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-stone-600 hover:text-rose-600 p-1 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add checklist step (e.g. Check dough core temp)..."
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            {task && onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to remove this task?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs shadow-sm shadow-amber-600/20 transition-all"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
