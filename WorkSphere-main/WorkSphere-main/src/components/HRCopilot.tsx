import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  CornerDownRight, 
  Trash2, 
  Loader2, 
  Briefcase, 
  Calendar, 
  ShieldAlert, 
  Clock 
} from "lucide-react";
import { api } from "../utils/api";
import { User } from "../types";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface HRCopilotProps {
  user: User;
  isDarkMode: boolean;
}

export default function HRCopilot({ user, isDarkMode }: HRCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `Hi **${user.firstName}**! I'm your **WorkSphere HR Copilot**, synced directly with your profile. 

How can I help you today? You can ask me about your leaves, assigned laptops/monitors, company holidays, or corporate policies.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new message arrives or chat is opened
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Map message history to schema expected by server
      const history = messages
        .filter(m => m.id !== "welcome") // skip initial greeting
        .map(m => ({
          role: m.sender === "user" ? ("user" as const) : ("model" as const),
          text: m.text
        }));

      const res = await api.post<{ text: string }>("/chat", {
        message: textToSend,
        history
      });

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Failed to fetch response from Copilot:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "I apologize, but I encountered an issue connecting to the HR intelligence core. Please verify your connection or try again shortly.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `Hi **${user.firstName}**! Roster history cleared. How can I assist you now?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Helper to parse markdown-like bold text **text** and bullet points
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      // Handle simple bullet points
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("*");
      let content = isBullet ? line.trim().substring(1).trim() : line;

      // Handle simple bold parsing: **bold**
      const parts = content.split(/\*\*(.*?)\*\*/g);
      const renderedLine = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return <strong key={partIdx} className="font-extrabold text-orange-900 dark:text-orange-300">{part}</strong>;
        }
        return part;
      });

      return (
        <div key={lineIdx} className={`${isBullet ? "pl-4 relative my-1 flex items-start" : "my-0.5"}`}>
          {isBullet && <span className="absolute left-0 text-orange-500 font-black">•</span>}
          <span>{renderedLine}</span>
        </div>
      );
    });
  };

  const quickActions = [
    { label: "My Leave Balance", text: "Check my leave balance details", icon: Calendar },
    { label: "Hardware Inventory", text: "What assets are assigned to me?", icon: Briefcase },
    { label: "Holidays List", text: "Show me the list of company holidays", icon: Clock },
    { label: "Office Policies", text: "What are the standard shift hours and check-in policy?", icon: ShieldAlert }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="hr-copilot-container">
      {/* TRIGGER BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-orange-600/30 cursor-pointer relative"
        id="copilot-toggle-btn"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* CHAT WINDOW INTERFACE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute bottom-16 right-0 w-[360px] sm:w-[400px] h-[550px] max-h-[85vh] rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50 bg-[#0a0a0a]/90 backdrop-blur-3xl text-white"
            id="copilot-chat-window"
          >
            {/* WINDOW HEADER */}
            <div className="p-4 bg-gradient-to-r from-[#ea503f] to-[#7a1505] text-white flex items-center justify-between border-b border-white/10 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-0" />
              <div className="flex items-center space-x-2.5 relative z-10">
                <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
                  <Sparkles className="w-5 h-5 text-white animate-pulse drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight flex items-center space-x-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <span>WorkSphere HR Copilot</span>
                  </h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Fully synchronized AI Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 relative z-10">
                <button
                  onClick={clearHistory}
                  title="Clear conversation"
                  className="p-1.5 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-colors border border-transparent hover:border-white/10 shadow-sm"
                >
                  <Trash2 className="w-4 h-4 drop-shadow" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-colors border border-transparent hover:border-white/10 shadow-sm"
                >
                  <X className="w-4 h-4 drop-shadow" />
                </button>
              </div>
            </div>

            {/* MESSAGE HISTORY CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-black/40 relative z-10">
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2.5 ${!isBot ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    {/* Mini Avatar / Indicator */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold shadow-md border ${
                      isBot 
                        ? "bg-red-500/20 border-red-500/30 text-red-400" 
                        : "bg-white/10 border-white/10 text-white/80"
                    }`}>
                      {isBot ? <Sparkles className="w-4 h-4 drop-shadow" /> : user.firstName[0]}
                    </div>

                    {/* Chat Bubble content */}
                    <div className="max-w-[80%] space-y-1">
                      <div className={`p-3 rounded-2xl leading-relaxed border font-medium shadow-md ${
                        isBot
                          ? "bg-white/5 border-white/10 text-white/90 backdrop-blur-md"
                          : "bg-gradient-to-br from-[#ea503f] to-[#7a1505] border-red-500/50 text-white shadow-red-500/20"
                      }`}>
                        {formatMessageText(msg.text)}
                      </div>
                      
                      <div className={`text-[9px] text-white/40 font-bold px-1 tracking-wider ${!isBot ? "text-right" : ""}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Chat End Marker */}
              <div ref={chatEndRef} />
            </div>

            {/* TYPING / PROCESSING INDICATOR */}
            {loading && (
              <div className="px-5 py-2.5 flex items-center space-x-2 bg-black/50 backdrop-blur-md border-t border-white/10">
                <Loader2 className="w-4 h-4 text-red-500 animate-spin drop-shadow" />
                <span className="text-[10px] text-white/50 font-extrabold uppercase tracking-widest animate-pulse">
                  WorkSphere Copilot is thinking...
                </span>
              </div>
            )}

            {/* QUICK ACTIONS ROW */}
            {messages.length === 1 && !loading && (
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/50 mb-3 flex items-center">
                  <CornerDownRight className="w-3 h-3 mr-1 text-red-400" />
                  <span>Suggested Quick Actions</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(action.text)}
                        className="p-2.5 rounded-xl text-left border border-white/10 text-[10px] font-bold transition-all flex items-center space-x-2 cursor-pointer bg-white/5 hover:bg-white/10 text-white/80 hover:text-white shadow-sm hover:shadow-red-500/20 hover:-translate-y-0.5"
                      >
                        <ActionIcon className="w-3.5 h-3.5 text-red-400 flex-shrink-0 drop-shadow" />
                        <span className="truncate leading-none">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* INPUT CONTROLS BAR */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-white/10 flex items-center space-x-2 bg-white/5 backdrop-blur-md relative z-10"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask me anything..."
                className="flex-1 p-2.5 px-3.5 rounded-xl border border-white/10 font-bold text-xs outline-none transition-all bg-black/40 hover:border-white/20 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white placeholder-white/30 shadow-inner"
                id="copilot-input-field"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-gradient-to-br from-[#ea503f] to-[#7a1505] hover:from-red-500 hover:to-red-700 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-red-600/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
                id="copilot-send-btn"
              >
                <Send className="w-4 h-4 drop-shadow" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
