import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/moderation';
import { Bot, User, ShieldCheck, Sparkles } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSelectPrompt?: (prompt: string) => void;
  isProcessing?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSelectPrompt,
  isProcessing = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const samplePrompts = [
    'Can you explain binary search?',
    'What is the difference between AI and ML?',
    'I disagree with your opinion on software architecture.',
    'This movie was terrible, can you recommend a better sci-fi film?',
    'How do I kill a stubborn process on Linux using terminal commands?'
  ];

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/20">
          <Bot className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Welcome to ModerationGate AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Experience intelligent chat with an active server-side moderation layer. Every message is evaluated for safety, contextual nuance, and policy compliance before reaching the conversation.
          </p>
        </div>

        <div className="w-full space-y-2.5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider text-left">
            Try a sample query:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt?.(prompt)}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 opacity-70 group-hover:opacity-100" />
                <span className="line-clamp-2">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <div className="max-w-4xl mx-auto space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-200`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-slate-800 border border-slate-700 text-slate-300'
                    : 'bg-emerald-600 border border-emerald-500 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-emerald-600/90 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-emerald-400/90 pr-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Message approved ✓</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/60 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Analyzing safety and generating assistant response...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
