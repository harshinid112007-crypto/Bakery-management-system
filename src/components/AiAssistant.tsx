import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Zap,
  ListTodo,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wheat,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, BakeryTask, Project } from '../types';

interface AiAssistantProps {
  tasks: BakeryTask[];
  projects: Project[];
  onAddTasks: (newTasks: Array<Partial<BakeryTask>>) => void;
  onSelectTask?: (task: BakeryTask) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const DEFAULT_PROMPTS = [
  {
    icon: FileText,
    label: 'Summarize Shift Progress',
    prompt: 'Can you summarize today’s bakery progress, completed batches, and any outstanding orders for shift handover?',
  },
  {
    icon: Zap,
    label: 'Prioritize Work & Ovens',
    prompt: 'Review all our active tasks and advise how to prioritize the work and deck oven slots to avoid bottlenecks.',
  },
  {
    icon: ListTodo,
    label: 'Organize Croissant & Baguette Run',
    prompt: 'Organize and break down a production schedule for 50 Butter Croissants and 30 Sourdough Baguettes needed for morning pickup.',
  },
  {
    icon: Wheat,
    label: 'Calculate Hydration & Baker’s %',
    prompt: 'Calculate baker’s percentages for a 75% hydration rustic sourdough dough batch yielding 40kg total dough.',
  },
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  tasks,
  projects,
  onAddTasks,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `### 👨‍🍳 Welcome to your Bakery AI Floor Assistant!
I'm **Chef Brioche**, your AI Operations Specialist. I have full real-time awareness of your active tasks, oven temperatures, and wholesale delivery deadlines.

Here is how I can help your shift today:
- **Organize Tasks:** Give me a recipe, product quantity, or order, and I'll generate actionable, sequenced bakery tasks with proof times and checklist items you can add directly to your board.
- **Prioritize Work:** I'll analyze current bottlenecks between deck ovens, proofing cabinets, and delivery deadlines to suggest the ideal baking sequence.
- **Summarize Progress:** Generate executive shift status briefings and afternoon handover logs.

*Select a quick prompt below or ask me anything!*`,
      timestamp: 'Just now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle auto-triggering initial prompt if passed from header or dashboard
  useEffect(() => {
    if (initialPrompt) {
      sendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build bakery floor context
      const bakeryContext = {
        tasksCount: tasks.length,
        completedCount: tasks.filter((t) => t.status === 'completed').length,
        urgentTasks: tasks
          .filter((t) => t.priority === 'Urgent' && t.status !== 'completed')
          .map((t) => ({ title: t.title, dueTime: t.dueTime, station: t.station })),
        activeTasks: tasks
          .filter((t) => t.status !== 'completed')
          .map((t) => ({ title: t.title, status: t.status, priority: t.priority, station: t.station })),
        projects: projects.map((p) => ({ name: p.name, client: p.client, deadline: p.deadline, status: p.status })),
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          bakeryContext,
        }),
      });

      const data = await res.json();

      let suggestedTasks: Array<Partial<BakeryTask>> | undefined = undefined;

      // If user asks to organize, generate, or schedule tasks, call task organizer
      const lower = text.toLowerCase();
      if (
        lower.includes('organize') ||
        lower.includes('schedule') ||
        lower.includes('generate') ||
        lower.includes('croissant') ||
        lower.includes('break down') ||
        lower.includes('tasks for')
      ) {
        try {
          const taskRes = await fetch('/api/gemini/organize-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: text,
              currentTasks: tasks,
              projects,
            }),
          });
          const taskData = await taskRes.json();
          if (Array.isArray(taskData.tasks) && taskData.tasks.length > 0) {
            suggestedTasks = taskData.tasks;
          }
        } catch (e) {
          console.error('Error generating tasks:', e);
        }
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I have analyzed your bakery production requirements.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedTasks,
        actions: data.suggestedActions,
        isSimulated: data.isSimulated,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `### 👨‍🍳 Chef Brioche Quick Advisory
I've reviewed your current floor:
- Ensure Deck Ovens 1 & 2 are cleared of Sourdough before loading morning baguettes.
- Maintain proofing chamber at 27°C / 75% RH for viennoiserie.
- Wholesale dispatch for Café Luna is your top priority right now.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestedTasks = (taskList: Array<Partial<BakeryTask>>) => {
    onAddTasks(taskList);
    // Add confirmation message in chat
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Added ${taskList.length} production tasks to the board!** You can view them in the **Tasks & Board** tab.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[580px] bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="bg-stone-900 text-stone-100 p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-100 font-['Outfit',sans-serif]">
                Chef Brioche
              </h2>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-stone-400">Master Baker & Production Operations AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Context-Aware Floor Assistant</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-stone-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto w-full`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-600">
                <span>{isUser ? 'Head Baker' : 'Chef Brioche'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.isSimulated && (
                  <span className="text-amber-800 font-medium">(Local Knowledge Engine)</span>
                )}
              </div>

              <div
                className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed max-w-2xl shadow-xs transition-all ${
                  isUser
                    ? 'bg-stone-900 text-stone-100 rounded-tr-none'
                    : 'bg-white text-stone-900 border border-stone-200 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-body prose prose-stone max-w-none text-stone-800 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_strong]:text-stone-900 [&_p]:my-1">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}

                {/* Suggested Actionable Tasks Box */}
                {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-200/80 bg-amber-50/50 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        AI-Generated Actionable Tasks ({msg.suggestedTasks.length})
                      </span>
                      <button
                        onClick={() => handleApplySuggestedTasks(msg.suggestedTasks!)}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add All to Board</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {msg.suggestedTasks.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-lg border border-amber-200/60 text-xs text-stone-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-stone-900 truncate">{t.title}</div>
                            <div className="text-[11px] text-stone-600 truncate mt-0.5">
                              {t.description}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-stone-600 mt-1">
                              <span className="bg-stone-100 px-1.5 py-0.5 rounded font-medium">
                                {t.station}
                              </span>
                              <span>•</span>
                              <span>Est: {t.estimatedMinutes}m</span>
                              {t.quantity && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-amber-800">{t.quantity}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Follow-up Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(act.label)}
                        className="text-xs bg-stone-100 hover:bg-amber-100/70 text-stone-700 hover:text-amber-900 px-2.5 py-1 rounded-md font-medium transition-colors border border-stone-200"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-600">
              <span>Chef Brioche</span>
              <span>•</span>
              <span className="text-amber-800 font-semibold animate-pulse">
                Evaluating oven schedules & production math...
              </span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-4 border border-stone-200 shadow-xs flex items-center gap-2 text-stone-600 text-xs">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Analyzing bakery state...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-3 bg-stone-100/70 border-t border-stone-200">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {DEFAULT_PROMPTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => sendMessage(p.prompt)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 hover:border-amber-300 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-2xs disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-amber-600" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            id="ai-assistant-input"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Chef Brioche to organize tasks, balance oven temps, or summarize progress..."
            className="flex-1 bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-600 px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:bg-stone-100"
          />
          <button
            id="ai-send-btn"
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 p-3 rounded-xl transition-all shadow-sm shadow-amber-600/20 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
