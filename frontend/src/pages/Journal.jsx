import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import {
  BookOpen, Mic, MicOff, Sparkles, Send, Calendar,
  Bookmark, Compass, BrainCircuit, HeartHandshake,
  AlertTriangle, History, PenLine, ArrowLeft,
  Volume2, VolumeX, Square
} from 'lucide-react';

/* ─── Text-to-Speech helper ─── */
const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => 'speechSynthesis' in window);

  const speak = (text) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1.05;
    utter.volume = 1;
    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith('en') && v.localService) || voices.find(v => v.lang.startsWith('en'));
    if (pref) utter.voice = pref;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stop = () => { window.speechSynthesis.cancel(); setSpeaking(false); };

  return { speak, stop, speaking, supported };
};

const Journal = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [error, setError] = useState('');
  const tts = useTTS();

  /* ── Speech Recognition (dictate) ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
      rec.onresult = (e) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; ++i)
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        if (final) setContent(p => p + final);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      setRecognition(rec); setSpeechSupported(true);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;
    if (isRecording) { recognition.stop(); setIsRecording(false); }
    else { recognition.start(); setIsRecording(true); }
  };

  /* ── Fetch history ── */
  const fetchHistory = async () => {
    try {
      const r = await API.get('/journal/history');
      setHistoryList(r.data);
    } catch (err) {
      if (err.response?.status !== 401)
        setError('Could not load journal history. Check backend connection.');
    }
  };
  useEffect(() => { fetchHistory(); }, []);

  /* ── Submit entry ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await API.post('/journal', {
        title: title.trim() || 'Daily Reflection',
        content: content.trim(),
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedEntry(r.data);
      setContent(''); setTitle('');
      fetchHistory(); setActiveTab('detail');
    } catch (err) {
      if (err.response?.status !== 401)
        setError('Could not save journal entry. Please try again.');
    } finally { setLoading(false); }
  };

  const getSentiment = (score) => {
    if (score > 0.5)   return { label: 'Vibrant',  bg: '#fff4c7', border: '#ffe88a', text: '#d97706' };
    if (score >= 0.1)  return { label: 'Calm',     bg: '#cdeccf', border: '#a8d9ab', text: '#388e3c' };
    if (score > -0.2)  return { label: 'Neutral',  bg: '#F7F9FC', border: '#E2E6ED', text: '#6B7280' };
    if (score >= -0.5) return { label: 'Heavy',    bg: '#ffe5d4', border: '#ffaa78', text: '#f97316' };
    return { label: 'Distress', bg: '#fecaca', border: '#f97f7f', text: '#ef4444' };
  };

  const TabBtn = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => { setActiveTab(id); if (id !== 'detail') setSelectedEntry(null); }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
      style={activeTab === id || (id === 'write' && activeTab === 'detail')
        ? { background: '#f5f0ff', color: '#8b5cf6', border: '2px solid #dccef9' }
        : { background: 'transparent', color: '#6B7280', border: '2px solid transparent' }}>
      <Icon className="w-3.5 h-3.5" />
      {label}{count != null ? ` (${count})` : ''}
    </button>
  );

  /* ── TTS button for an entry ── */
  const TTSButton = ({ text }) => {
    if (!tts.supported) return null;
    return tts.speaking ? (
      <button onClick={tts.stop}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: '#fecaca', border: '1px solid #f97f7f', color: '#ef4444' }}>
        <Square className="w-3 h-3" fill="currentColor" /> Stop Reading
      </button>
    ) : (
      <button onClick={() => tts.speak(text)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: '#f0f8ff', border: '1px solid #d8ecff', color: '#0ea5e9' }}>
        <Volume2 className="w-3.5 h-3.5" /> Read Aloud
      </button>
    );
  };

  const prompts = [
    "What made you smile today? 😊",
    "What are you grateful for right now? 🌸",
    "What's weighing on your mind? 💭",
    "Describe one small win from today 🏆",
  ];
  const [promptIdx] = useState(() => Math.floor(Math.random() * 4));
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5 page-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-800">My Journal 📔</h2>
          <p className="text-sm text-ink-400 mt-1">Write freely. AI reflects themes, prompts, and insights.</p>
        </div>
        <div className="flex items-center gap-1 p-1.5 rounded-2xl" style={{ background: '#F7F9FC', border: '1.5px solid #E2E6ED' }}>
          <TabBtn id="write" label="New Entry" icon={PenLine} />
          <TabBtn id="history" label="Past Entries" icon={History} count={historyList.length} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-2 text-sm"
          style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-ink-400 hover:text-ink-800">✕</button>
        </div>
      )}

      {/* ── WRITE TAB ── */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 card p-6 md:p-8" style={{ borderRadius: '24px' }}>
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-lavender-200 border-t-lavender-500 animate-spin" style={{ borderColor: '#dccef9', borderTopColor: '#8b5cf6' }} />
                  <Sparkles className="w-7 h-7 absolute inset-0 m-auto animate-bounce-gentle" style={{ color: '#8b5cf6' }} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-ink-800">MindMate is reflecting…</h3>
                  <p className="text-xs text-ink-400 mt-1">Analyzing sentiment, identifying themes, crafting prompts.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1.5">Entry Title <span className="text-ink-300">(optional)</span></label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Morning Thoughts, Evening Reflection…"
                    className="w-full px-4 py-3 field text-ink-800 text-sm font-medium" />
                </div>

                <div className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-ink-500">Your Canvas <span className="text-ink-300">🔒 Private</span></label>
                    {speechSupported && (
                      <button type="button" onClick={toggleRecording}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                        style={isRecording
                          ? { background: '#fecaca', borderColor: '#f97f7f', color: '#ef4444' }
                          : { background: '#F7F9FC', borderColor: '#E2E6ED', color: '#6B7280' }}>
                        {isRecording ? <><MicOff className="w-3 h-3" /> Stop</> : <><Mic className="w-3 h-3" /> Dictate</>}
                      </button>
                    )}
                  </div>
                  <div className="journal-note" style={{ borderRadius: '20px' }}>
                    <textarea required value={content} onChange={e => setContent(e.target.value)}
                      placeholder={`Try: "${prompts[promptIdx]}"`}
                      className="w-full h-56 px-6 py-5 bg-transparent text-ink-800 text-sm leading-relaxed resize-none outline-none placeholder:text-amber-400/60 font-medium" />
                  </div>
                  {isRecording && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-red-500 font-semibold animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full" /> Listening — speak clearly…
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-300">{wordCount} words</span>
                  <button type="submit" disabled={!content.trim()} className="btn-primary disabled:opacity-40">
                    <Send className="w-4 h-4" /> Analyze & Save
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="card p-5 space-y-4" style={{ borderRadius: '20px' }}>
            <h3 className="font-bold text-sm text-ink-800">✨ How AI Reflection Works</h3>
            {[
              { icon: BrainCircuit, color: '#8b5cf6', bg: '#f5f0ff', title: 'Thematic Tags', desc: 'Labels patterns like "work stress", "gratitude", or "relationship".' },
              { icon: Compass,       color: '#d97706', bg: '#fffef0', title: 'Reflection Prompts', desc: 'Thoughtful questions tailored to your entry.' },
              { icon: HeartHandshake,color: '#4caf50', bg: '#f0faf0', title: 'Wellness Ideas', desc: 'Practical non-medical suggestions — breathing, walks, hydration.' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="flex gap-3 p-3 rounded-2xl" style={{ background: bg }}>
                <div className="p-1.5 rounded-xl flex-shrink-0" style={{ background: '#ffffff' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-700">{title}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-2xl" style={{ background: '#f0f8ff' }}>
              <p className="text-[10px] text-ink-500 leading-relaxed flex items-start gap-1.5">
                <Volume2 className="w-3 h-3 text-sky-400 flex-shrink-0 mt-0.5" />
                After saving, click <strong className="text-ink-700">Read Aloud</strong> on any entry to have MindMate narrate it back to you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL TAB ── */}
      {activeTab === 'detail' && selectedEntry && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start animate-fade-up">
          {/* Original entry + TTS */}
          <div className="card p-5 space-y-4" style={{ borderRadius: '20px' }}>
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <span className="text-xs text-ink-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                {new Date(selectedEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {(() => { const s = getSentiment(selectedEntry.sentimentScore); return (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{ background: s.bg, borderColor: s.border, color: s.text }}>{s.label}</span>
              );})()}
            </div>
            <h3 className="font-bold text-ink-800">{selectedEntry.title}</h3>

            {/* Read Aloud button */}
            <div className="flex justify-end">
              <TTSButton text={`${selectedEntry.title}. ${selectedEntry.content}`} />
            </div>

            <div className="journal-note p-4 rounded-xl">
              <p className="text-xs text-ink-500 leading-relaxed italic">"{selectedEntry.content}"</p>
            </div>
            <button onClick={() => { setActiveTab('write'); setSelectedEntry(null); tts.stop(); }}
              className="w-full btn-ghost text-xs flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Write Another Entry
            </button>
          </div>

          {/* AI Output */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEntry.safetyAlertTriggered && (
              <div className="p-5 rounded-2xl flex items-start gap-3 animate-scale-in"
                style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-red-700">We're thinking of you 💙</h4>
                  <p className="text-xs text-red-500 mt-1 leading-relaxed">
                    Your entry suggests a difficult time. Please reach out to your Trusted Circle or a mental health professional — you don't have to carry this alone.
                  </p>
                </div>
              </div>
            )}

            {/* Summary & Themes */}
            <div className="card p-5 space-y-3" style={{ borderRadius: '20px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl" style={{ background: '#fffef0' }}>
                    <Bookmark className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#d97706' }}>AI Summary</span>
                </div>
                <TTSButton text={selectedEntry.summary} />
              </div>
              <p className="text-sm text-ink-700 leading-relaxed font-medium">{selectedEntry.summary || 'No summary available.'}</p>
              {selectedEntry.themes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-warm-100">
                  {selectedEntry.themes.map((t, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                      style={{ background: '#f5f0ff', borderColor: '#dccef9', color: '#8b5cf6' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Reflection Prompts */}
            {selectedEntry.reflectionQuestions?.length > 0 && (
              <div className="card p-5 space-y-3" style={{ borderRadius: '20px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl" style={{ background: '#f5f0ff' }}>
                      <Compass className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Reflection Prompts</span>
                  </div>
                  <TTSButton text={selectedEntry.reflectionQuestions.join('. ')} />
                </div>
                <div className="space-y-2">
                  {selectedEntry.reflectionQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-xs text-ink-600 leading-relaxed"
                      style={{ background: '#f5f0ff' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: '#8b5cf6' }}>{i + 1}</span>
                      "{q}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wellness Suggestions */}
            {selectedEntry.copingStrategies?.length > 0 && (
              <div className="card p-5 space-y-3" style={{ borderRadius: '20px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl" style={{ background: '#f0faf0' }}>
                      <HeartHandshake className="w-3.5 h-3.5" style={{ color: '#4caf50' }} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#4caf50' }}>Wellness Suggestions</span>
                  </div>
                  <TTSButton text={selectedEntry.copingStrategies.join('. ')} />
                </div>
                <div className="space-y-2">
                  {selectedEntry.copingStrategies.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl text-xs text-ink-600 leading-relaxed"
                      style={{ background: '#f0faf0' }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ background: '#4caf50' }}>{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-up">
          {historyList.length === 0 ? (
            <div className="card p-14 text-center max-w-sm mx-auto space-y-3" style={{ borderRadius: '28px' }}>
              <span className="text-6xl">📖</span>
              <h3 className="font-bold text-ink-800">Your journal is empty</h3>
              <p className="text-xs text-ink-400">Write your first reflection to get started 🌱</p>
              <button onClick={() => setActiveTab('write')} className="btn-primary mx-auto"
                style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}>Start Writing</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {historyList.map(entry => {
                const s = getSentiment(entry.sentimentScore);
                return (
                  <div key={entry.id} onClick={() => { setSelectedEntry(entry); setActiveTab('detail'); }}
                    className="card p-5 cursor-pointer card-hover space-y-3" style={{ borderRadius: '20px' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-ink-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {tts.supported && (
                          <button onClick={e => { e.stopPropagation(); tts.speak(`${entry.title}. ${entry.content}`); }}
                            className="p-1 rounded-lg transition-all"
                            style={{ background: '#f0f8ff', color: '#0ea5e9' }}
                            title="Read aloud">
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                          style={{ background: s.bg, borderColor: s.border, color: s.text }}>{s.label}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-ink-800">{entry.title}</h4>
                    <p className="text-xs text-ink-400 line-clamp-2 italic">"{entry.content}"</p>
                    {entry.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-warm-100">
                        {entry.themes.slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: '#f5f0ff', color: '#8b5cf6', border: '1px solid #dccef9' }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Journal;
