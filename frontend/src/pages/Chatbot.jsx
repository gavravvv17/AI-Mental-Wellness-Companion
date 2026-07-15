import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { Send, Sprout, User, HeartHandshake } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role:'bot', text:"Hi there! 🌸 I'm MindMate, your caring wellness companion. I'm here to listen, reflect, and support you. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const feedEndRef = useRef(null);

  const promptChips = [
    "I'm feeling really overwhelmed 😔",
    "Help me wind down for sleep 🌙",
    "Give me a calming affirmation 🌸",
    "I need to vent about something 💬",
  ];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim()) return;
    setMessages(p => [...p, { role:'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'bot' ? 'model' : 'user', text: m.text }));
      const r = await API.post('/chat', { message: text, history });
      setMessages(p => [...p, { role:'bot', text: r.data.message }]);
    } catch {
      setMessages(p => [...p, { role:'bot', text:"I'm having a little trouble connecting right now. Let's take a slow breath together. I'm still here 💙" }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4" style={{ height:'calc(100vh - 120px)' }}>

      {/* Header */}
      <div className="card px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderRadius:'20px' }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background:'linear-gradient(135deg,#8b5cf6,#a855f7)' }}>
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background:'#4caf50' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-ink-800">MindMate AI Buddy</h3>
            <span className="text-[10px] font-semibold" style={{ color:'#4caf50' }}>● Here for you</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] text-ink-400 font-medium"
          style={{ background:'#F7F9FC', border:'1px solid #E2E6ED' }}>
          <HeartHandshake className="w-3.5 h-3.5 text-lavender-400" />
          Supportive Session
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 card overflow-y-auto p-5 space-y-4 no-scrollbar min-h-0"
        style={{ borderRadius:'24px', background:'#FAFAF7' }}>
        {messages.map((msg, idx) => {
          const isBot = msg.role === 'bot';
          return (
            <div key={idx} className={`flex items-end gap-2.5 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={isBot
                  ? { background:'linear-gradient(135deg,#f5f0ff,#dccef9)', border:'1px solid #dccef9' }
                  : { background:'linear-gradient(135deg,#8b5cf6,#a855f7)' }}>
                {isBot
                  ? <Sprout className="w-4 h-4" style={{ color:'#8b5cf6' }} />
                  : <User className="w-4 h-4 text-white" />}
              </div>

              {/* Bubble */}
              <div className="px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-full"
                style={isBot
                  ? { background:'#ffffff', border:'1px solid #EEF0F5', color:'#2D3748', borderBottomLeftRadius:'6px',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }
                  : { background:'linear-gradient(135deg,#8b5cf6,#a855f7)', color:'#ffffff', borderBottomRightRadius:'6px',
                      boxShadow:'0 4px 12px rgba(139,92,246,0.25)' }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing */}
        {loading && (
          <div className="flex items-end gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#f5f0ff,#dccef9)', border:'1px solid #dccef9' }}>
              <Sprout className="w-4 h-4 animate-bounce-gentle" style={{ color:'#8b5cf6' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{ background:'#ffffff', border:'1px solid #EEF0F5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
              <span className="w-2 h-2 rounded-full typing-dot-1" style={{ background:'#dccef9' }} />
              <span className="w-2 h-2 rounded-full typing-dot-2" style={{ background:'#c4adfa' }} />
              <span className="w-2 h-2 rounded-full typing-dot-3" style={{ background:'#a888f5' }} />
            </div>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {/* Input Area */}
      <div className="space-y-3 flex-shrink-0">
        {/* Prompt chips */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {promptChips.map((chip, idx) => (
              <button key={idx} onClick={() => handleSend(chip)}
                className="px-4 py-2 text-xs font-medium text-ink-600 transition-all card-hover"
                style={{ background:'#ffffff', border:'1.5px solid #E2E6ED', borderRadius:'20px' }}>
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="flex items-center gap-2 p-2 rounded-2xl"
          style={{ background:'#ffffff', border:'1.5px solid #E2E6ED', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share what's on your mind… 🌸"
            className="flex-1 bg-transparent px-3 py-2 text-xs text-ink-800 outline-none placeholder:text-ink-300"
          />
          <button onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md"
            style={{ background:'linear-gradient(135deg,#8b5cf6,#a855f7)', boxShadow:'0 3px 10px rgba(139,92,246,0.3)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        <p className="text-center text-[9px] text-ink-300">
          MindMate AI is a wellness companion, not a clinical therapist. For emergencies, call 988 or local emergency services.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
