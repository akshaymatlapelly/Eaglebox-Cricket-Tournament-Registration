'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey! 👋 I\'m your CricketHub AI Assistant. Ask me anything about cricket, tournaments, or the platform!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, isAdmin: false })
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Sorry, I couldn\'t process that. Try again!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Oops! Something went wrong. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-[#10b981] hover:bg-emerald-400 text-black rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 cursor-pointer group"
        >
          <MessageSquare className="w-6 h-6" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-20" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-[#0a0d16] border border-slate-800 rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="px-5 py-4 bg-[#06080d] border-b border-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800/30 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-[#10b981]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">AI Assistant</h3>
                <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-950 border border-blue-800/30'
                    : 'bg-emerald-950 border border-emerald-800/30'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-blue-400" />
                    : <Bot className="w-3.5 h-3.5 text-[#10b981]" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600/15 border border-blue-500/15 text-slate-200 rounded-tr-md'
                    : 'bg-slate-900/70 border border-slate-800/60 text-slate-300 rounded-tl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800/30 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#10b981]" />
                </div>
                <div className="px-4 py-3 bg-slate-900/70 border border-slate-800/60 rounded-2xl rounded-tl-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-[#06080d] border-t border-slate-900 shrink-0">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-[#10b981]/40 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[8px] text-slate-700 text-center mt-1.5">
              Powered by CricketHub AI • Ask about cricket, tournaments & more
            </p>
          </div>
        </div>
      )}
    </>
  );
};
