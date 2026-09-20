import React, { useState, useEffect } from 'react';
import type { ChatMessage } from '../types/moderation';
import { api } from '../services/api';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import FlaggedMessageCard from '../components/FlaggedMessageCard';
import { Trash2, AlertCircle } from 'lucide-react';

interface ChatPageProps {
  onActivityLogged?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onActivityLogged }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flaggedAlert, setFlaggedAlert] = useState<{
    category: string | null;
    reason: string | null;
    preview: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const res = await api.getChatHistory();
      if (res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsProcessing(true);
    setFlaggedAlert(null);
    setErrorMessage(null);

    try {
      const response = await api.sendChatMessage(text, messages);

      if (response.flagged) {
        setFlaggedAlert({
          category: response.category,
          reason: response.reason,
          preview: text,
        });
        onActivityLogged?.();
      } else if (response.allowed && response.message) {
        const userMsg: ChatMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: text,
          createdAt: new Date().toISOString(),
          moderation: {
            allowed: true,
            flagged: false,
            category: null,
            reason: null,
          }
        };

        setMessages((prev) => [...prev, userMsg, response.message!]);
        onActivityLogged?.();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "We couldn't complete the safety check. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([]);
      setFlaggedAlert(null);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden bg-slate-950">
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">Chat Safety Filter: Live Enforcement</span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {flaggedAlert && (
        <div className="px-4 sm:px-6 pt-2">
          <FlaggedMessageCard
            category={flaggedAlert.category}
            reason={flaggedAlert.reason}
            messagePreview={flaggedAlert.preview}
            onDismiss={() => setFlaggedAlert(null)}
          />
        </div>
      )}

      {errorMessage && (
        <div className="px-4 sm:px-6 pt-2">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-400 hover:text-amber-200 font-medium ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <ChatWindow
        messages={messages}
        onSelectPrompt={handleSendMessage}
        isProcessing={isProcessing}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default ChatPage;
