import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Smile, BookOpen, Wind, MessageCircleHeart, Droplet,
  Moon, Dumbbell, Tv, BookOpenCheck, CheckCircle2,
  ShieldAlert, ArrowRight, Heart, Sparkles
} from 'lucide-react';

const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} />;

const Dashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Hello');
  const [stats, setStats] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [todayHabits, setTodayHabits] = useState([]);
  const [safetyBanner, setSafetyBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  const habitsList = [
    { key: 'water',      label: 'Hydration', emoji: '💧', color: '#d8ecff', border: '#93cbff' },
    { key: 'sleep',      label: 'Sleep',     emoji: '🌙', color: '#f5f0ff', border: '#c4adfa' },
    { key: 'exercise',   label: 'Exercise',  emoji: '🏃', color: '#cdeccf', border: '#a8d9ab' },
    { key: 'meditation', label: 'Meditate',  emoji: '🧘', color: '#ddf5e5', border: '#9ee6b4' },
    { key: 'reading',    label: 'Reading',   emoji: '📖', color: '#fff4c7', border: '#ffe88a' },
    { key: 'screentime', label: 'Screen ↓',  emoji: '📵', color: '#ffe5d4', border: '#ffaa78' },
  ];

  const moodEmojis = { happy: '😄', calm: '😌', energetic: '⚡', stressed: '😤', anxious: '😰', sad: '😢' };
  const moodColors = {
    happy: '#fff4c7', calm: '#cdeccf', energetic: '#ffe5d4',
    stressed: '#fecaca', anxious: '#f5f0ff', sad: '#d8ecff'
  };

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, moodRes, habitsRes, journalRes] = await Promise.all([
          API.get('/mood/stats'),
          API.get('/mood/history'),
          API.get('/habits/history'),
          API.get('/journal/history'),
        ]);
        setStats(statsRes.data);
        const todayStr = new Date().toISOString().split('T')[0];
        setTodayMood(moodRes.data.find(l => l.date === todayStr) || null);
        const ht = habitsRes.data.find(l => l.date === todayStr);
        if (ht) setTodayHabits(ht.completedHabits);
        setSafetyBanner(journalRes.data.slice(0, 3).some(e => e.safetyAlertTriggered));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleToggleHabit = async (key) => {
    try {
      const res = await API.post(`/habits/toggle?habitName=${key}`);
      setTodayHabits(res.data.completedHabits);
    } catch (err) { console.error(err); }
  };

  const completedCount = todayHabits.length;
  const firstName = user?.fullName?.split(' ')[0] || 'Friend';

  if (loading) {
    return (
      <div className="space-y-5 page-in">
        <Skeleton className="h-36 rounded-3xl w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
        <Skeleton className="h-44 rounded-3xl w-full" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-in">

      {/* Safety Banner */}
      {safetyBanner && (
        <div className="p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-scale-in"
          style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💙</span>
            <div>
              <h3 className="font-bold text-sm text-ink-800">We're here for you</h3>
              <p className="text-xs text-ink-400 mt-0.5 max-w-md">
                Your recent reflections suggest you may be struggling. Please consider reaching out to your Trusted Circle.
              </p>
            </div>
          </div>
          <button onClick={() => setCurrentTab('circle')}
            className="btn-ghost text-rose-500 border-rose-200 hover:bg-rose-50 flex-shrink-0" style={{ fontSize: '0.75rem' }}>
            Get Support
          </button>
        </div>
      )}

      {/* Hero Greeting */}
      <div className="rounded-3xl p-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #ddf5e5 60%, #fff4c7 100%)' }}>
        <div className="absolute right-6 top-4 text-6xl opacity-30 animate-float select-none">🌿</div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8b5cf6' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-3xl font-bold text-ink-800 leading-tight">
          {greeting},<br />{firstName}! {todayMood ? moodEmojis[todayMood.mood?.toLowerCase()] || '✨' : '☀️'}
        </h2>
        <p className="text-sm text-ink-500 mt-2 max-w-sm">
          {todayMood
            ? `You're feeling ${todayMood.mood?.toLowerCase()} today. Energy: ${todayMood.energyLevel}/10 — keep going! 🌱`
            : 'Take a gentle moment to check in with yourself. How are you feeling?'}
        </p>

        {!todayMood && (
          <button onClick={() => setCurrentTab('mood')}
            className="mt-4 btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
            Log Today's Mood
          </button>
        )}
      </div>

      {/* Mood + Affirmation row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Today's Mood */}
        <div className="card p-5" style={{ borderRadius: '24px' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Today's Check-in</p>
          {todayMood ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: moodColors[todayMood.mood?.toLowerCase()] || '#f5f0ff' }}>
                <span className="text-4xl">{moodEmojis[todayMood.mood?.toLowerCase()] || '✨'}</span>
                <div className="flex-1">
                  <p className="font-bold text-ink-800 text-sm">{todayMood.mood}</p>
                  <div className="mt-1">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-ink-400">Energy</span>
                      <span className="font-bold text-ink-600">{todayMood.energyLevel}/10</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: '#e2e6ed' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${todayMood.energyLevel*10}%`, background: 'linear-gradient(90deg, #8b5cf6, #22c55e)' }} />
                    </div>
                  </div>
                </div>
              </div>
              {todayMood.emotions?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {todayMood.emotions.slice(0, 4).map((e, i) => (
                    <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#f5f0ff', color: '#8b5cf6', border: '1px solid #dccef9' }}>
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-5xl block mb-2">😶</span>
              <p className="text-xs text-ink-400">No mood logged yet</p>
            </div>
          )}
        </div>

        {/* Daily Affirmation */}
        <div className="journal-note p-5 flex flex-col justify-between" style={{ borderRadius: '24px' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Daily Affirmation</span>
          </div>
          <p className="text-sm font-medium text-ink-700 leading-relaxed italic flex-1">
            {todayMood?.mood?.toLowerCase() === 'stressed'
              ? '"You don\'t have to control everything. One step at a time is enough. 🌬️"'
              : todayMood?.mood?.toLowerCase() === 'sad'
              ? '"Be gentle with yourself. Every feeling is valid and it\'s okay to rest. 🌷"'
              : '"Every small step forward is progress worth celebrating. You\'re doing beautifully. 🌟"'}
          </p>
          <p className="text-[9px] text-amber-500 mt-3">— MindMate AI</p>
        </div>
      </div>

      {/* Daily Habits */}
      <div className="card p-6" style={{ borderRadius: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-ink-800">Daily Habits</h3>
            <p className="text-xs text-ink-400 mt-0.5">
              {completedCount === 6 ? '🎉 All done! You\'re amazing!' : `${completedCount} of 6 completed`}
            </p>
          </div>
          {/* Progress bar */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>{Math.round((completedCount/6)*100)}%</span>
            <div className="w-24 h-2 rounded-full" style={{ background: '#EEF0F5' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(completedCount/6)*100}%`, background: 'linear-gradient(90deg, #8b5cf6, #22c55e)' }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {habitsList.map(habit => {
            const done = todayHabits.includes(habit.key);
            return (
              <button key={habit.key} onClick={() => handleToggleHabit(habit.key)}
                className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer group"
                style={done
                  ? { background: habit.color, borderColor: habit.border, transform: 'scale(1.02)' }
                  : { background: '#F7F9FC', borderColor: '#E2E6ED' }}>
                <span className="text-2xl">{habit.emoji}</span>
                <span className="text-[10px] font-semibold text-center leading-tight text-ink-600">{habit.label}</span>
                {done && <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-sage-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wellness Corner */}
      <div>
        <h3 className="font-bold text-ink-800 mb-3">Explore Wellness</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { tab:'journal', emoji:'📔', title:'AI Journal', desc:'Write freely and let AI reflect back insights, themes, and coping ideas.', bg:'#fffef0', border:'#fff4c7', color:'#d97706' },
            { tab:'mindfulness', emoji:'🌬️', title:'Breathe & Ground', desc:'Guided breathing, 5-4-3-2-1 grounding, and ambient soundscapes.', bg:'#f0f8ff', border:'#d8ecff', color:'#0ea5e9' },
            { tab:'chatbot', emoji:'🤝', title:'AI Buddy', desc:'Chat with your supportive companion anytime. Judgment-free.', bg:'#f5f0ff', border:'#dccef9', color:'#8b5cf6' },
          ].map(({ tab, emoji, title, desc, bg, border, color }) => (
            <button key={tab} onClick={() => setCurrentTab(tab)}
              className="text-left p-5 rounded-2xl border-2 card-hover cursor-pointer"
              style={{ background: bg, borderColor: border }}>
              <span className="text-3xl mb-2 block">{emoji}</span>
              <h4 className="font-bold text-sm text-ink-800 mb-1">{title}</h4>
              <p className="text-[11px] text-ink-400 leading-relaxed">{desc}</p>
              <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
