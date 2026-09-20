import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, Loader2, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError('Please enter a message.');
      return;
    }
    if (trimmed.length > 4000) {
      setValidationError('Your message is too long. Please shorten it and try again.');
      return;
    }

    setValidationError(null);
    onSendMessage(trimmed);
    setText('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (validationError) setValidationError(null);

    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="w-full bg-slate-900/90 border-t border-slate-800 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {validationError && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/40 p-2 shadow-inner transition-all">
          <div className="p-2 text-slate-400 self-end mb-0.5">
            <Shield className="w-4 h-4 text-emerald-500/70" />
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={isLoading ? 'Safety check in progress...' : 'Type your message... (Shift + Enter for new line)'}
            className="w-full resize-none bg-transparent py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none max-h-40 overflow-y-auto"
            aria-label="Chat message input"
          />

          <button
            onClick={handleSend}
            disabled={disabled || isLoading || !text.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:active:scale-100 transition-all shrink-0 flex items-center justify-center shadow-md shadow-emerald-950/40"
            aria-label="Send message through moderation gate"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Every message is checked server-side before reaching the chat.</span>
          <span>{text.length}/4000</span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
