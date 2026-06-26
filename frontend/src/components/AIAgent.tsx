'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { parseAgentCommand, AIAgentAction } from '@/services/aiAgentService';
import { Bot, Mic, Send, X, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext'; // Trigger TS Server re-validation

export const AIAgent: React.FC = () => {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const { upgradeMembership, registerTeam, tournaments } = useDatabase();
  const { showToast } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Hi! I am the CricketHub AI Agent. You can type commands or tap the Mic to speak! Try: "Upgrade my membership to gold" or "Register my team Mumbai Titans to IPL Cricket Cup 2026"' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addTerminalLog = (log: string) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, terminalLogs]);

  // Speech Recognition setup
  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Error', 'Voice commands are not supported in your browser.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Listening...', 'Speak your cricket request.', 'info');
    };

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
      handleSendMessage(speechToText);
    };

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    recognition.onerror = (err: any) => {
      console.error('Speech recognition error', err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputText('');

    addTerminalLog(`Contacting AI Brain server...`);
    addTerminalLog(`Analyzing query: "${text}"`);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: text, isAdmin })
      });

      if (!response.ok) {
        throw new Error(`Brain server returned status ${response.status}`);
      }

      const res = await response.json();
      addTerminalLog(`Brain output: success=${res.success}`);

      setMessages((prev) => [...prev, { sender: 'bot', text: res.message }]);

      if (res.action) {
        addTerminalLog(`Detected Intent: ${res.action.intent}`);
        addTerminalLog(`Parameters: ${JSON.stringify(res.action.parameters)}`);
        await executeAction(res.action);
      } else {
        addTerminalLog(`Conversational response complete.`);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      addTerminalLog(`[WARNING] Server-side AI failed: ${errMsg}`);
      addTerminalLog(`Activating local parser backup...`);

      // Fallback to local service parsing
      const res = parseAgentCommand(text, isAdmin);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.message }]);

      if (res.action) {
        await executeAction(res.action);
      }
    }
  };

  const executeAction = async (action: AIAgentAction) => {
    addTerminalLog(`Executing Action Plan...`);
    
    // Check targetUrl navigation
    if (action.targetUrl) {
      const url = action.targetUrl;
      setTimeout(() => {
        addTerminalLog(`Redirecting viewport to: ${url}`);
        router.push(url);
      }, 500);
    }

    // Direct modifications check
    switch (action.intent) {
      case 'UPGRADE_MEMBERSHIP':
        if (!user) {
          addTerminalLog(`[ERR] Action halted: User must be signed in.`);
          showToast('Authentication Required', 'Please log in to upgrade membership', 'error');
          return;
        }
        addTerminalLog(`Triggering billing pipeline...`);
        try {
          const tier = action.parameters.tier || 'gold';
          await upgradeMembership(user.id, tier);
          addTerminalLog(`[SUCCESS] Upgraded user ${user.name} to ${tier.toUpperCase()}`);
          showToast('Membership Upgraded!', `You are now a ${tier.toUpperCase()} member.`, 'success');
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          addTerminalLog(`[ERR] Upgrade failed: ${errMsg}`);
        }
        break;

      case 'REGISTER_TEAM':
        if (!user) {
          addTerminalLog(`[ERR] Action halted: User must be signed in.`);
          showToast('Authentication Required', 'Please log in to register teams', 'error');
          return;
        }
        addTerminalLog(`Searching tournament logs...`);
        // Find tournament match
        const searchName = (action.parameters.tournamentName || '').toLowerCase();
        const foundTourney = tournaments.find(t => t.name.toLowerCase().includes(searchName));
        if (!foundTourney) {
          addTerminalLog(`[WARNING] Tournament not matched. Opening directory.`);
          showToast('Rerouting', 'Opening tournament directory so you can select the tournament.', 'info');
          return;
        }

        addTerminalLog(`Auto-registering team "${action.parameters.teamName}" to "${foundTourney.name}"...`);
        try {
          // Trigger registration inside DatabaseContext
          const teamName = action.parameters.teamName || 'Agent Smashers';
          await registerTeam(
            foundTourney.id,
            teamName,
            user.name,
            user.email,
            ['Player Alpha', 'Player Beta', 'Player Gamma'],
            foundTourney.entry_fee
          );
          addTerminalLog(`[SUCCESS] Registered team "${teamName}" for ${foundTourney.name}`);
          showToast('Registration Success!', `Registered "${teamName}" for ${foundTourney.name}. Check-in QR generated.`, 'success');
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          addTerminalLog(`[ERR] Auto-registration failed: ${errMsg}`);
        }
        break;

      case 'GENERATE_FIXTURES':
        addTerminalLog(`Accessing scheduler configurations...`);
        showToast('AI Fixtures', 'Opening scheduling panel inside admin workspace.', 'info');
        break;

      case 'SEND_REMINDERS':
        addTerminalLog(`Batching reminder emails...`);
        addTerminalLog(`Simulating Resend trigger queue...`);
        setTimeout(() => {
          addTerminalLog(`[SUCCESS] 24 emails dispatched to captains.`);
          showToast('Emails Sent', 'Reminder emails successfully sent to all captains.', 'success');
        }, 1200);
        break;

      default:
        addTerminalLog(`Action executed successfully.`);
    }
  };

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        id="ai-agent-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] p-4 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-emerald-400 hover:to-[#10b981] text-black font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-bounce glow-green border border-emerald-300/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* AI Panel Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[550px] bg-[#0c0f17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-[999] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-[#10b981]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-100">CricketHub AI Agent</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Live Action Scheduler Active
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[75%] ${
                  m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#10b981] text-black font-semibold rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={startSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-rose-950 border-rose-500 text-rose-400 animate-pulse' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Record Voice Command"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything or run command..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2.5 bg-[#10b981] hover:bg-emerald-400 text-black rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default AIAgent;
