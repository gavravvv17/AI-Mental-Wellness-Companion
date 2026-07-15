import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Activity, Lightbulb, Plus, Calendar, Moon, Dumbbell,
  Droplet, Bookmark, Milestone, CheckCircle, X
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
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventLoading, setEventLoading] = useState(false);

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
                        <div className="journal-note p-4 space-y-2" style={{ borderRadius:'16px' }}>
                          <div className="flex items-center gap-1.5">
                            <Bookmark className="w-3 h-3" style={{ color:'#d97706' }} />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color:'#d97706' }}>Journal</span>
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
                        <div className="p-4 space-y-2 rounded-2xl border-2" style={{ background:'#fffef0', borderColor:'#ffe88a', borderRadius:'16px' }}>
                          <div className="flex items-center gap-1.5">
                            <Milestone className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">Life Event</span>
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

      {/* Modal */}
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
