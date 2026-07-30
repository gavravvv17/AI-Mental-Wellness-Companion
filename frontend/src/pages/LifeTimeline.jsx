import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Lightbulb, Plus, Calendar, Moon, Dumbbell,
  Droplet, Bookmark, Milestone, CheckCircle, X,
  AlertTriangle, Compass, BrainCircuit, HeartHandshake
} from 'lucide-react';

const getMoodEmoji = (m) => {
  const map = { happy:'😄', calm:'😌', stressed:'😤', anxious:'😰', sad:'😢', energetic:'⚡' };
  return map[m?.toLowerCase()] || '✨';
};
const getMoodStyle = (m) => {
  const map = {
    happy:    { bg:'#fff4c7', border:'#ffe88a', text:'#d97706' },
    calm:     { bg:'#cdeccf', border:'#a8d9ab', text:'#388e3c' },
    energetic:{ bg:'#ffe5d4', border:'#ffaa78', text:'#f97316' },
    stressed: { bg:'#fecaca', border:'#f97f7f', text:'#ef4444' },
    anxious:  { bg:'#f5f0ff', border:'#c4adfa', text:'#8b5cf6' },
    sad:      { bg:'#dbeeff', border:'#93cbff', text:'#0ea5e9' },
  };
  return map[m?.toLowerCase()] || { bg:'#F7F9FC', border:'#E2E6ED', text:'#6B7280' };
};

const LifeTimeline = () => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventLoading, setEventLoading] = useState(false);

  const openJournal = async (item) => {
    setJournalLoading(true);
    try {
      const history = await API.get('/journal/history');
      const entries = history.data;
      // Try by ID first, fall back to matching by date
      let found = null;
      if (item.journalId) {
        found = entries.find(e => e.id === item.journalId);
      }
      if (!found) {
        // fallback: match by date
        const itemDate = item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date);
        found = entries.find(e => String(e.date) === itemDate);
      }
      if (found) setSelectedJournal(found);
    } catch (err) { console.error('openJournal error:', err); }
    finally { setJournalLoading(false); }
  };

  const getSentiment = (score) => {
    if (score > 0.5)   return { label: 'Vibrant',  bg: '#fff4c7', border: '#ffe88a', text: '#d97706' };
    if (score >= 0.1)  return { label: 'Calm',     bg: '#cdeccf', border: '#a8d9ab', text: '#388e3c' };
    if (score > -0.2)  return { label: 'Neutral',  bg: '#F7F9FC', border: '#E2E6ED', text: '#6B7280' };
    if (score >= -0.5) return { label: 'Heavy',    bg: '#ffe5d4', border: '#ffaa78', text: '#f97316' };
    return { label: 'Distress', bg: '#fecaca', border: '#f97f7f', text: '#ef4444' };
  };

  const fetchTimeline = async () => {
    try { const r = await API.get('/timeline'); setTimelineData(r.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTimeline(); }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setEventLoading(true);
    try {
      await API.post('/events', { title: eventTitle, description: eventDesc, date: eventDate });
      setEventTitle(''); setEventDesc(''); setShowModal(false);
      fetchTimeline();
    } catch (err) { console.error(err); }
    finally { setEventLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse max-w-4xl mx-auto">
        <div className="skeleton h-10 w-72 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-800">Life Timeline 🌳</h2>
          <p className="text-sm text-ink-400 mt-1">Connect moods, journals, and life events to spot meaningful patterns.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ fontSize:'0.8rem', padding:'0.6rem 1.2rem' }}>
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* AI Insights */}
      {timelineData?.insights?.length > 0 && (
        <div className="p-5 rounded-2xl animate-scale-in"
          style={{ background:'linear-gradient(135deg,#f5f0ff,#ddf5e5)', border:'1.5px solid #dccef9' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:'#8b5cf6' }}>
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'#8b5cf6' }}>AI Correlation Insights</span>
          </div>
          <div className="space-y-2">
            {timelineData.insights.map((insight, idx) => (
              <p key={idx} className="text-xs text-ink-600 leading-relaxed">• {insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {(!timelineData || timelineData.items.length === 0) ? (
        <div className="card p-14 text-center max-w-md mx-auto space-y-4" style={{ borderRadius:'28px' }}>
          <span className="text-6xl">🌱</span>
          <h3 className="font-bold text-ink-800">Your timeline is empty</h3>
          <p className="text-xs text-ink-400 max-w-xs mx-auto leading-relaxed">
            Log a mood, write a journal, or add a life event — it will appear here chronologically.
          </p>
        </div>
      ) : (
        /* Timeline Track */
        <div className="relative">
          {/* Gradient vertical line */}
          <div className="absolute hidden md:block"
            style={{ left:'130px', top:'12px', bottom:'12px', width:'2px',
              background:'linear-gradient(to bottom, #dccef9, #cdeccf, #d8ecff)' }} />

          <div className="space-y-8">
            {timelineData.items.map((item, idx) => {
              const moodStyle = getMoodStyle(item.mood);
              const isEvent = !!item.lifeEventTitle;
              const dotColor = isEvent ? '#f59e0b' : item.mood ? '#8b5cf6' : '#D1D5DB';

              return (
                <div key={idx} className="relative flex gap-0 group">
                  {/* Date (desktop) */}
                  <div className="hidden md:flex flex-col items-end justify-start w-[122px] flex-shrink-0 pt-1 pr-8">
                    <span className="text-xs font-bold text-ink-600">
                      {new Date(item.date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                    </span>
                    <span className="text-[10px] text-ink-300">
                      {new Date(item.date).toLocaleDateString('en-US', { year:'numeric' })}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="hidden md:flex absolute w-4 h-4 rounded-full border-2 border-white shadow-md z-10 group-hover:scale-125 transition-transform"
                    style={{ left:'124px', top:'6px', background: dotColor }} />

                  {/* Content */}
                  <div className="flex-1 md:pl-10 space-y-3">
                    {/* Mobile date */}
                    <div className="md:hidden">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl text-ink-500"
                        style={{ background:'#F7F9FC', border:'1px solid #E2E6ED' }}>
                        {new Date(item.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Mood Card */}
                      {(item.mood || item.sleepHours || item.exerciseMinutes) ? (
                        <div className="card p-4 space-y-3" style={{ borderRadius:'16px' }}>
                          {item.mood && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border"
                              style={{ background:moodStyle.bg, borderColor:moodStyle.border, color:moodStyle.text }}>
                              {getMoodEmoji(item.mood)} {item.mood}
                            </span>
                          )}
                          {item.energyLevel && (
                            <div>
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-ink-400">Energy</span>
                                <span className="font-bold text-ink-600">{item.energyLevel}/10</span>
                              </div>
                              <div className="h-2 rounded-full" style={{ background:'#EEF0F5' }}>
                                <div className="h-full rounded-full transition-all"
                                  style={{ width:`${item.energyLevel*10}%`, background:'linear-gradient(90deg,#8b5cf6,#4caf50)' }} />
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            {item.sleepHours > 0 && <span className="flex items-center gap-1 font-semibold" style={{ color:'#8b5cf6' }}><Moon className="w-3 h-3"/>{item.sleepHours}h</span>}
                            {item.exerciseMinutes > 0 && <span className="flex items-center gap-1 font-semibold" style={{ color:'#4caf50' }}><Dumbbell className="w-3 h-3"/>{item.exerciseMinutes}m</span>}
                            {item.waterIntakeMl > 0 && <span className="flex items-center gap-1 font-semibold" style={{ color:'#0ea5e9' }}><Droplet className="w-3 h-3"/>{item.waterIntakeMl}ml</span>}
                          </div>
                          {item.emotions?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.emotions.slice(0,3).map((e,i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                  style={{ background:'#f5f0ff', color:'#8b5cf6', border:'1px solid #dccef9' }}>{e}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : <div />}

                      {/* Journal Card */}
                      {item.journalSummary ? (
                        <div
                          className="journal-note p-4 space-y-2 cursor-pointer"
                          style={{ borderRadius:'16px', transition: 'transform 0.15s, box-shadow 0.15s' }}
                          onClick={() => openJournal(item)}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Bookmark className="w-3 h-3" style={{ color:'#d97706' }} />
                              <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color:'#d97706' }}>Journal</span>
                            </div>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#f5f0ff', color: '#8b5cf6', border: '1px solid #dccef9' }}>View →</span>
                          </div>
                          <h4 className="text-xs font-bold text-ink-700 line-clamp-1">{item.journalTitle}</h4>
                          <p className="text-[10px] text-ink-500 leading-relaxed italic line-clamp-2">"{item.journalSummary}"</p>
                          {item.completedHabits?.length > 0 && (
                            <p className="text-[9px] text-ink-400">{item.completedHabits.length} habits done ✅</p>
                          )}
                        </div>
                      ) : <div />}

                      {/* Life Event Card */}
                      {item.lifeEventTitle ? (
                        <div
                          className="p-4 space-y-2 rounded-2xl border-2 cursor-pointer"
                          style={{ background:'#fffef0', borderColor:'#ffe88a', borderRadius:'16px', transition: 'transform 0.15s, box-shadow 0.15s' }}
                          onClick={() => setSelectedEvent(item)}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Milestone className="w-3 h-3 text-amber-500" />
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">Life Event</span>
                            </div>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#fff4c7', color: '#d97706', border: '1px solid #ffe88a' }}>View →</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-amber-700 line-clamp-2">{item.lifeEventTitle}</h4>
                          {item.lifeEventDescription && (
                            <p className="text-[10px] text-ink-500 leading-relaxed line-clamp-2">{item.lifeEventDescription}</p>
                          )}
                        </div>
                      ) : <div />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Journal Loading Spinner Modal */}
      {journalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
          <div className="card p-8 flex flex-col items-center gap-4 relative z-10 animate-scale-in" style={{ borderRadius:'28px' }}>
            <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#dccef9', borderTopColor: '#8b5cf6' }} />
            <p className="text-sm font-semibold text-ink-600">Loading journal entry…</p>
          </div>
        </div>
      )}

      {/* Journal Detail Modal */}
      {selectedJournal && !journalLoading && (() => {
        const s = getSentiment(selectedJournal.sentimentScore);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedJournal(null)} />
            <div className="relative z-10 flex min-h-full items-center justify-center p-4 py-8">
            <div className="card animate-scale-in w-full max-w-2xl" style={{ borderRadius:'28px' }}>
              {/* Header */}
              <div className="sticky top-0 z-10 p-6 pb-4 border-b border-warm-100 flex items-start justify-between gap-4"
                style={{ background: 'var(--color-surface, white)', borderRadius: '28px 28px 0 0' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fffef0' }}>
                    <Bookmark className="w-4 h-4" style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#d97706' }}>Journal Entry</p>
                    <p className="text-[10px] text-ink-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedJournal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: s.bg, borderColor: s.border, color: s.text }}>{s.label}</span>
                  <button onClick={() => setSelectedJournal(null)}
                    className="p-1.5 rounded-xl hover:bg-warm-100 text-ink-400 transition-colors border border-warm-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Title + Content */}
                <div>
                  <h3 className="font-bold text-ink-800 text-lg mb-3">{selectedJournal.title}</h3>
                  <div className="journal-note p-4 rounded-xl">
                    <p className="text-xs text-ink-600 leading-relaxed italic">"{selectedJournal.content}"</p>
                  </div>
                </div>

                {/* AI Summary */}
                {selectedJournal.summary && (
                  <div className="p-4 rounded-2xl space-y-2" style={{ background: '#fffef0', border: '1.5px solid #ffe88a' }}>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#d97706' }}>AI Summary</span>
                    </div>
                    <p className="text-xs text-ink-700 leading-relaxed">{selectedJournal.summary}</p>
                    {selectedJournal.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-amber-100">
                        {selectedJournal.themes.map((t, i) => (
                          <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: '#f5f0ff', color: '#8b5cf6', border: '1px solid #dccef9' }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reflection Prompts */}
                {selectedJournal.reflectionQuestions?.length > 0 && (
                  <div className="p-4 rounded-2xl space-y-2" style={{ background: '#f5f0ff', border: '1.5px solid #dccef9' }}>
                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Reflection Prompts</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedJournal.reflectionQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-ink-600 leading-relaxed p-2 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.6)' }}>
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: '#8b5cf6' }}>{i + 1}</span>
                          "{q}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wellness Suggestions */}
                {selectedJournal.copingStrategies?.length > 0 && (
                  <div className="p-4 rounded-2xl space-y-2" style={{ background: '#f0faf0', border: '1.5px solid #a8d9ab' }}>
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-3.5 h-3.5" style={{ color: '#388e3c' }} />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: '#388e3c' }}>Wellness Suggestions</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedJournal.copingStrategies.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-ink-600 leading-relaxed p-2 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.6)' }}>
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: '#4caf50' }}>{i + 1}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJournal.safetyAlertTriggered && (
                  <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 leading-relaxed">This entry flagged a moment of difficulty. Your Trusted Circle is always here for you. 💙</p>
                  </div>
                )}

                <button onClick={() => setSelectedJournal(null)} className="w-full btn-ghost text-xs">Close</button>
              </div>
            </div>
            </div>
          </div>
        );
      })()}

      {/* Life Event Detail Modal */}
      {selectedEvent && (

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative z-10 flex min-h-full items-center justify-center p-4 py-8">
          <div className="card max-w-md w-full p-7 animate-scale-in space-y-5" style={{ borderRadius:'28px', border:'2px solid #ffe88a' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'#ffe88a' }}>
                  <Milestone className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600">Life Event</p>
                  <p className="text-[10px] text-ink-400">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl hover:bg-warm-100 text-ink-400 transition-colors border border-warm-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl" style={{ background:'#fffef0', border:'1.5px solid #ffe88a' }}>
              <h3 className="font-bold text-amber-800 text-base leading-snug">{selectedEvent.lifeEventTitle}</h3>
              {selectedEvent.lifeEventDescription && (
                <p className="text-sm text-ink-600 mt-3 leading-relaxed">{selectedEvent.lifeEventDescription}</p>
              )}
            </div>

            {/* Related mood from same day */}
            {selectedEvent.mood && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#f5f0ff' }}>
                <span className="text-2xl">{selectedEvent.mood === 'happy' ? '😄' : selectedEvent.mood === 'calm' ? '😌' : selectedEvent.mood === 'stressed' ? '😤' : selectedEvent.mood === 'anxious' ? '😰' : selectedEvent.mood === 'sad' ? '😢' : '⚡'}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Mood on this day</p>
                  <p className="text-xs font-semibold text-ink-700 capitalize">{selectedEvent.mood} {selectedEvent.energyLevel ? `· Energy ${selectedEvent.energyLevel}/10` : ''}</p>
                </div>
              </div>
            )}

            <button onClick={() => setSelectedEvent(null)} className="w-full btn-ghost text-xs">Close</button>
          </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="card max-w-md w-full p-7 relative z-10 animate-scale-in space-y-5" style={{ borderRadius:'28px' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-ink-800 flex items-center gap-2">
                <Milestone className="w-5 h-5 text-amber-500" /> Add Life Event
              </h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-warm-100 text-ink-400 transition-colors border border-warm-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1.5">Event Title</label>
                <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                  placeholder="E.g., Started new job, Family trip…"
                  className="w-full px-4 py-3 field text-ink-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1.5">Date</label>
                <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 field text-ink-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1.5">Description <span className="text-ink-300">(optional)</span></label>
                <textarea value={eventDesc} onChange={e => setEventDesc(e.target.value)}
                  placeholder="What happened? How did it affect you?"
                  className="w-full h-20 px-4 py-3 field text-ink-800 text-sm resize-none" />
              </div>
              <button type="submit" disabled={eventLoading || !eventTitle.trim()} className="btn-primary w-full disabled:opacity-50">
                {eventLoading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle className="w-4 h-4" /> Save Event</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeTimeline;
