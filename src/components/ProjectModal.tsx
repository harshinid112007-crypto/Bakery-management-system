import React, { useState, useEffect } from 'react';
import { X, FolderKanban } from 'lucide-react';
import { Project } from '../types';
import { BAKERS } from '../data/initialData';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSaveProject: (projectData: Partial<Project>) => void;
}

const CATEGORIES = ['Wholesale B2B', 'Custom Event', 'Retail Special', 'Hospitality', 'Catering'];
const COLORS = ['#D97706', '#E11D48', '#059669', '#7C3AED', '#2563EB', '#D946EF'];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveProject,
}) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('Today, 12:00 PM');
  const [targetUnits, setTargetUnits] = useState(100);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [assignedLead, setAssignedLead] = useState(BAKERS[0]);
  const [status, setStatus] = useState<Project['status']>('in_progress');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClient(project.client || '');
      setDescription(project.description);
      setDeadline(project.deadline);
      setTargetUnits(project.targetUnits);
      setCategory(project.category);
      setAssignedLead(project.assignedLead);
      setStatus(project.status);
      setColor(project.color || COLORS[0]);
    } else {
      setName('');
      setClient('');
      setDescription('');
      setDeadline('Today, 02:00 PM');
      setTargetUnits(100);
      setCategory(CATEGORIES[0]);
      setAssignedLead(BAKERS[0]);
      setStatus('in_progress');
      setColor(COLORS[0]);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveProject({
      ...(project ? { id: project.id } : {}),
      name: name.trim(),
      client: client.trim() || undefined,
      description: description.trim(),
      deadline,
      targetUnits: Number(targetUnits) || 1,
      category,
      assignedLead,
      status,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden my-4 sm:my-8 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                {project ? 'Update Order / Contract' : 'Create Production Order'}
              </span>
              <h2 className="text-base font-bold font-['Outfit',sans-serif] text-stone-100">
                {project ? project.name : 'New Wholesale / Event Contract'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Order / Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Café Luna Daily Wholesale Delivery"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Client / Recipient
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g., Café Luna"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavors, packaging requirements, delivery window..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Deadline / Drop Time
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Today, 06:45 AM"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Target Units
              </label>
              <input
                type="number"
                min="1"
                value={targetUnits}
                onChange={(e) => setTargetUnits(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Assigned Lead Baker
              </label>
              <select
                value={assignedLead}
                onChange={(e) => setAssignedLead(e.target.value)}
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
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Project['status'])}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="in_progress">In Production</option>
                <option value="scheduled">Scheduled</option>
                <option value="review">Quality Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Color tag */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Color Tag
            </label>
            <div className="flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-stone-800' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs shadow-sm shadow-amber-600/20"
            >
              {project ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
