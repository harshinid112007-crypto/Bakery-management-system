import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Plus,
  Zap,
  ListTodo,
  FileText,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, BakeryTask, Project } from '../types';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: BakeryTask[];
  projects: Project[];
  onAddTasks: (newTasks: Array<Partial<BakeryTask>>) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onAddTasks,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'quick-welcome',
      role: 'assistant',
      content: `👋 **Chef Brioche here!** How can I optimize your baking shift right now? Ask me to organize a new batch, summarize shift progress, or prioritize deck oven loads.`,
      timestamp: 'Now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [isOpen, initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `drawer-u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const bakeryContext = {
        tasksCount: tasks.length,
        completedCount: tasks.filter((t) => t.status === 'completed').length,
        urgentTasks: tasks
          .filter((t) => t.priority === 'Urgent' && t.status !== 'completed')
          .map((t) => t.title),
        activeTasks: tasks
          .filter((t) => t.status !== 'completed')
          .map((t) => ({ title: t.title, status: t.status, priority: t.priority, station: t.station })),
        projects: projects.map((p) => ({ name: p.name, client: p.client, deadline: p.deadline })),
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          bakeryContext,
        }),
      });

      const data = await res.json();

      let suggestedTasks: Array<Partial<BakeryTask>> | undefined = undefined;
      const lower = text.toLowerCase();
      if (
        lower.includes('organize') ||
        lower.includes('schedule') ||
        lower.includes('croissant') ||
        lower.includes('tasks for') ||
        lower.includes('break down')
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
        } catch {
          // ignore
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `drawer-ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Floor analysis updated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedTasks,
          actions: data.suggestedActions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `drawer-err-${Date.now()}`,
          role: 'assistant',
          content: '### 👨‍🍳 Quick Advice\nDeck Oven 1 is at peak temp. Ensure batch dispatch happens before 06:45 AM.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTasks = (suggested: Array<Partial<BakeryTask>>) => {
    onAddTasks(suggested);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-drawer-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Added ${suggested.length} tasks directly to your board!**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-stone-300 flex flex-col transition-all duration-300 overflow-hidden ${
        isExpanded
          ? 'w-[calc(100vw-2rem)] max-w-2xl h-[85vh]'
          : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[560px]'
      }`}
    >
      {/* Header */}
      <div className="bg-stone-900 text-stone-100 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-100 font-['Outfit',sans-serif]">
              Chef Brioche AI Assistant
            </h3>
            <span className="text-[10px] text-amber-400 font-medium">Bakery Floor Copilot</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            title={isExpanded ? 'Restore' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40 text-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                  isUser
                    ? 'bg-stone-900 text-stone-100 rounded-tr-none'
                    : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p>{m.content}</p>
                ) : (
                  <div className="markdown-body [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_p]:my-1">
                    <Markdown>{m.content}</Markdown>
                  </div>
                )}

                {/* Suggested tasks */}
                {m.suggestedTasks && m.suggestedTasks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 bg-amber-50/50 p-2.5 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-amber-900">
                        {m.suggestedTasks.length} Suggested Tasks
                      </span>
                      <button
                        onClick={() => handleApplyTasks(m.suggestedTasks!)}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add to Board
                      </button>
                    </div>
                    <div className="space-y-1">
                      {m.suggestedTasks.map((t, idx) => (
                        <div key={idx} className="bg-white p-1.5 rounded border border-amber-200/50 text-[10px]">
                          <span className="font-bold text-stone-900">{t.title}</span>
                          <span className="text-stone-600 block">{t.station} • {t.quantity || 'Standard batch'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-stone-600 mt-0.5 px-1">{m.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-1.5 text-stone-600 text-xs py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>Chef Brioche is preparing recommendations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-stone-200 bg-stone-100/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendMessage('Summarize shift progress & handover')}
          disabled={isLoading}
          className="text-[11px] bg-white hover:bg-amber-50 border border-stone-200 text-stone-700 px-2 py-1 rounded-md whitespace-nowrap font-medium flex items-center gap-1"
        >
          <FileText className="w-3 h-3 text-amber-600" />
          Shift Summary
        </button>
        <button
          onClick={() => handleSendMessage('Prioritize urgent work and oven sequence')}
          disabled={isLoading}
          className="text-[11px] bg-white hover:bg-amber-50 border border-stone-200 text-stone-700 px-2 py-1 rounded-md whitespace-nowrap font-medium flex items-center gap-1"
        >
          <Zap className="w-3 h-3 text-amber-600" />
          Prioritize Ovens
        </button>
        <button
          onClick={() => handleSendMessage('Organize production tasks for 40 baguettes and 60 croissants')}
          disabled={isLoading}
          className="text-[11px] bg-white hover:bg-amber-50 border border-stone-200 text-stone-700 px-2 py-1 rounded-md whitespace-nowrap font-medium flex items-center gap-1"
        >
          <ListTodo className="w-3 h-3 text-amber-600" />
          Bake Tasks
        </button>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Chef Brioche..."
            className="flex-1 bg-stone-50 text-xs text-stone-900 placeholder-stone-600 px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 p-2 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
