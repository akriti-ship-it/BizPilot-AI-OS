import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/api';
import { AgentGraph } from '../components/AgentGraph';
import { Send, Mic, MicOff, Sparkles, Bot, Clock, CornerDownRight } from 'lucide-react';

export const AIEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your Executive Coordinator Agent. How can I help you automate operations today? You can type instructions or click the microphone to say: "Hey BizPilot, check my stock level" or "Reorder coffee beans".',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  
  // Agent Collaboration Graph state
  const [activeNodes, setActiveNodes] = useState<string[]>(['Executive Coordinator']);
  const [activeEdges, setActiveEdges] = useState<any[]>([]);
  
  // Action Timeline state
  const [timelineLogs, setTimelineLogs] = useState<any[]>([
    {
      agent: 'Executive Coordinator',
      action: 'Awaiting instruction queue...',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Voice Speech Recognition setup
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Text-To-Speech (TTS) Voice response using Web Speech Synthesis
  const speakText = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Clean markdown characters like *, #, `, _, -
        const cleanText = text.replace(/[*#`_\-]/g, '').substring(0, 200); // limit to first 200 chars for clean vocal response
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel(); // cancel previous speaking
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
  };

  const handleVoiceCommand = (command: string) => {
    const cmdLower = command.toLowerCase();
    
    // Voice navigation routes
    if (cmdLower.includes("show inventory") || cmdLower.includes("open inventory") || cmdLower.includes("go to inventory")) {
      speakText("Opening inventory registry.");
      navigate("/inventory");
      return;
    }
    if (cmdLower.includes("show invoices") || cmdLower.includes("open invoices") || cmdLower.includes("go to invoices")) {
      speakText("Navigating to invoice center.");
      navigate("/invoices");
      return;
    }
    if (cmdLower.includes("show orders") || cmdLower.includes("open orders") || cmdLower.includes("go to orders")) {
      speakText("Opening order dashboard.");
      navigate("/orders");
      return;
    }
    if (cmdLower.includes("show reports") || cmdLower.includes("open reports") || cmdLower.includes("go to reports")) {
      speakText("Opening reports generator.");
      navigate("/reports");
      return;
    }
    if (cmdLower.includes("show analytics") || cmdLower.includes("open analytics") || cmdLower.includes("go to analytics")) {
      speakText("Opening operational analytics.");
      navigate("/analytics");
      return;
    }
    if (cmdLower.includes("show settings") || cmdLower.includes("open settings") || cmdLower.includes("go to settings")) {
      speakText("Opening system settings.");
      navigate("/settings");
      return;
    }
    if (cmdLower.includes("show dashboard") || cmdLower.includes("open dashboard") || cmdLower.includes("go to dashboard")) {
      speakText("Returning to dashboard.");
      navigate("/");
      return;
    }
    
    // If not a routing command, submit as standard chat query
    submitMessage(command);
  };

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setMessage('Listening...');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        handleVoiceCommand(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setMessage('');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [recognitionRef.current]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Try Chrome, Safari, or Edge.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      speakText("Voice Mode activated. I am listening.");
      recognitionRef.current.start();
    }
  };

  const submitMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    
    // Add user message to history
    setChatHistory(prev => [...prev, {
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    setLoading(true);
    // Reset active visualization
    setActiveNodes(['Executive Coordinator']);
    setActiveEdges([]);
    
    try {
      const data = await chatService.sendMessage(msgText);
      
      // Update graph nodes and edges
      if (data.collaboration_graph) {
        setActiveNodes(data.collaboration_graph.nodes || []);
        setActiveEdges(data.collaboration_graph.edges || []);
      }
      
      // Update timeline
      if (data.agent_logs) {
        const mappedLogs = data.agent_logs.map((log: any) => ({
          agent: log.agent,
          action: log.action,
          timestamp: new Date(log.timestamp).toLocaleTimeString()
        }));
        setTimelineLogs(mappedLogs);
      }
      
      // Add AI response
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: data.response,
        timestamp: new Date().toLocaleTimeString()
      }]);

      // Speak response using TTS
      speakText(data.response);
      
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: 'Sorry, I encountered an issue coordinating with the agent nodes. Please check if the backend is running.',
        timestamp: new Date().toLocaleTimeString()
      }]);
      speakText("I encountered an issue coordinating with the agent nodes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message === 'Listening...') return;
    const userMsgText = message;
    setMessage('');
    submitMessage(userMsgText);
  };

  const loadPredefinedQuery = (queryText: string) => {
    setMessage(queryText);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">AI Employee Workspace</h2>
        <p className="text-xs md:text-sm text-slate-400">Collaborative portal where multiple specialized agents automate SME actions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat Interface Column */}
        <div className="lg:col-span-7 flex flex-col h-[75vh] glass-panel border border-[#1f2937]/30 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Chat header */}
          <div className="bg-[#0f111a] border-b border-[#1f2937]/30 px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">BizPilot Executive Chat</h3>
                <p className="text-[10px] text-slate-500">Autonomous workflow routing engine active</p>
              </div>
            </div>
            {/* Pulsing indicator */}
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-full border border-indigo-500/10 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              Orchestrator online
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 bg-slate-950/20">
            {chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${
                  chat.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {chat.sender === 'ai' ? (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0 font-bold text-xs text-slate-300">
                    U
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  chat.sender === 'user' 
                    ? 'bg-indigo-600 border-indigo-500/20 text-white rounded-tr-none' 
                    : 'bg-slate-900/60 border-[#1f2937]/40 text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  <p className="whitespace-pre-line">{chat.text}</p>
                  <span className="block text-[9px] text-slate-500 mt-2 font-mono text-right">{chat.timestamp}</span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-slate-900/60 border border-[#1f2937]/30 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="px-6 py-2 border-t border-[#1f2937]/15 flex gap-2 overflow-x-auto bg-slate-950/30 shrink-0 select-none">
            <button
              onClick={() => loadPredefinedQuery("Show products that need reordering")}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-[#1f2937]/40 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-full shrink-0 font-medium transition active:scale-95"
            >
              Check Low Stock
            </button>
            <button
              onClick={() => loadPredefinedQuery("Reorder Premium Coffee Beans")}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-[#1f2937]/40 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-full shrink-0 font-medium transition active:scale-95"
            >
              Reorder Coffee Beans
            </button>
            <button
              onClick={() => loadPredefinedQuery("Check my business health score")}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-[#1f2937]/40 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-full shrink-0 font-medium transition active:scale-95"
            >
              Check Health Score
            </button>
          </div>

          {/* Message form input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#0f111a] border-t border-[#1f2937]/30 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-red-500/10 text-red-400 border-red-500/25 animate-pulse' 
                  : 'bg-slate-900 border-[#1f2937] text-slate-400 hover:text-slate-200'
              }`}
              title="Voice mode: Say 'Hey BizPilot, reorder coffee beans'"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading || isListening}
              placeholder={isListening ? "Listening, speak now..." : "Instruct BizPilot agents..."}
              className="flex-1 bg-slate-900/60 border border-[#1f2937] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Visual Graph & Timeline Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Agent Collaboration View */}
          <AgentGraph activeNodes={activeNodes} activeEdges={activeEdges} />

          {/* AI Action Decision Timeline */}
          <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                AI Agent Action Timeline
              </h4>
              <p className="text-xs text-slate-400">Step-by-step decision log generated by active agent instances</p>
            </div>

            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
              {timelineLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 relative pb-4 last:pb-0 border-l border-[#1f2937]/30 pl-4">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border border-slate-950 shadow-inner"></div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.agent}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
