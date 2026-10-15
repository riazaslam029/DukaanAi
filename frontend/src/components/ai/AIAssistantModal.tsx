import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Sparkles, Terminal, CheckCircle2, AlertCircle, Send, ArrowRight, User, Bot, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { AIStatusResponse } from '../../services/types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  suggested_actions?: string[];
  timestamp: Date;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Assalam-o-Alaikum! I am your DukaanAI store advisor powered by local Gemma. Ask me anything about your inventory, low stock items, today\'s profits, or restock suggestions.',
      source: 'DukaanAI Assistant',
      suggested_actions: ['Which items are low in stock?', 'Summarize store profit', 'Restock advice'],
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadStatus = async () => {
    try {
      const data = await api.getAIStatus();
      setStatus(data);
    } catch {
      // fallback
    }
  };

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || prompt).trim();
    if (!q || isLoading) return;

    // 1. Immediately append user's question
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToAsk) setPrompt('');
    setIsLoading(true);

    try {
      const data = await api.queryAI(q);
      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: data.answer,
        source: data.source,
        suggested_actions: data.suggested_actions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `Error connecting to AI service: ${err.message}. Please ensure the backend is running.`,
        source: 'Error Notice',
        suggested_actions: [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Which items are critically low on stock?',
    'How is my store profit this week?',
    'What are my highest expense categories?',
    'Give me Kiryana store restock advice',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900">DukaanAI Business Advisor</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              {status?.model_name || 'Gemma'}
            </span>
          </div>
        </div>
      }
      subtitle="Local AI reasoning for Pakistani Kiryana and retail shopkeepers"
    >
      <div className="space-y-4">
        {/* Status Banner */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 text-xs">
          {status?.is_available ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Ollama Engine: {status?.status || 'Active'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                {status?.model_name || 'gemma3:1b'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {status?.message || 'Local Gemma reasoning active.'}
            </p>
          </div>
        </div>

        {/* Chat Thread Container */}
        <div className="h-80 overflow-y-auto space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white'
                    : 'bg-teal-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-none'
                }`}
              >
                {msg.source && (
                  <div className="text-[10px] font-semibold text-teal-700 border-b border-slate-100 pb-1">
                    {msg.source}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.suggested_actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (act.includes('?')) {
                            handleAsk(act);
                          } else {
                            onClose();
                            if (act.toLowerCase().includes('stock') || act.toLowerCase().includes('inventory')) {
                              onNavigate('inventory');
                            } else if (act.toLowerCase().includes('report') || act.toLowerCase().includes('csv')) {
                              onNavigate('reports');
                            } else if (act.toLowerCase().includes('sale')) {
                              onNavigate('sales');
                            } else if (act.toLowerCase().includes('expense')) {
                              onNavigate('expenses');
                            }
                          }
                        }}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 flex items-center gap-1 transition-colors"
                      >
                        <span>{act}</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking / Loading Bubble */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 animate-pulse">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none p-3.5 border border-teal-200/80 shadow-sm text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-teal-700 font-semibold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Gemma is thinking...</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Processing your query against live store inventory and financials (approx 5–15s).
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sq)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-700 whitespace-nowrap transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAsk()}
            placeholder="Ask about inventory, profits, sales, or restock orders..."
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={isLoading}
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => handleAsk()}
            isLoading={isLoading}
            disabled={!prompt.trim() || isLoading}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Ask
          </Button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Terminal className="h-3.5 w-3.5" />
            <span>Local Gemma model: runs 100% privately on your PC.</span>
          </div>
          <span className="text-[10px] text-slate-400">Press Enter to send</span>
        </div>
      </div>
    </Modal>
  );
};
