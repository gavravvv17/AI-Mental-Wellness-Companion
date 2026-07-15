import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Save, CheckCircle, Battery, Droplet, Moon, Dumbbell, FileText, Smile, Heart } from 'lucide-react';

const moods = [
  { name:'Happy',    emoji:'😄', desc:'Joyful & cheerful', color:'#fff4c7', border:'#ffe88a', dot:'#f59e0b' },
  { name:'Calm',     emoji:'😌', desc:'Peaceful & relaxed', color:'#cdeccf', border:'#a8d9ab', dot:'#4caf50' },
  { name:'Energetic',emoji:'⚡', desc:'Active & motivated', color:'#ffe5d4', border:'#ffaa78', dot:'#f97316' },
  { name:'Stressed', emoji:'😤', desc:'Overwhelmed & tense', color:'#fecaca', border:'#f97f7f', dot:'#ef4444' },
  { name:'Anxious',  emoji:'😰', desc:'Worried & nervous',  color:'#f5f0ff', border:'#c4adfa', dot:'#8b5cf6' },
  { name:'Sad',      emoji:'😢', desc:'Down & heavy',       color:'#dbeeff', border:'#93cbff', dot:'#0ea5e9' },
];

const emotionTags = [
  'grateful','productive','exhausted','hopeful','lonely',
  'excited','inspired','restless','irritable','overwhelmed',
  'peaceful','content','unfocused','tired','bored'
];

const MoodTracker = ({ setCurrentTab }) => {
  const [mood, setMood] = useState('Calm');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [sleepHours, setSleepHours] = useState(7);
  const [exerciseMinutes, setExerciseMinutes] = useState(30);
  const [waterIntakeMl, setWaterIntakeMl] = useState(1500);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTodayLog = async () => {
      try {
        const res = await API.get('/mood/history');
        const todayStr = new Date().toISOString().split('T')[0];
        const log = res.data.find(l => l.date === todayStr);
        if (log) {
          setMood(log.mood);
          setEnergyLevel(log.energyLevel);
          setSelectedEmotions(log.emotions || []);
          setSleepHours(log.sleepHours);
          setExerciseMinutes(log.exerciseMinutes);
          setWaterIntakeMl(log.waterIntakeMl);
          setNote(log.note || '');
        }
      } catch (err) { console.error(err); }
    };
    fetchTodayLog();
  }, []);

  const toggleEmotion = tag =>
    setSelectedEmotions(p => p.includes(tag) ? p.filter(e => e !== tag) : [...p, tag]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccess(false);
    try {
      await API.post('/mood', {
        mood, energyLevel, emotions: selectedEmotions,
        sleepHours: parseFloat(sleepHours),
        exerciseMinutes: parseInt(exerciseMinutes),
        waterIntakeMl: parseInt(waterIntakeMl),
        note, date: new Date().toISOString().split('T')[0]
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setCurrentTab('dashboard'); }, 1500);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getEnergyLabel = v => {
    if (v <= 2) return { l:'Depleted', c:'#ef4444' };
    if (v <= 4) return { l:'Low', c:'#f97316' };
    if (v <= 6) return { l:'Moderate', c:'#f59e0b' };
    if (v <= 8) return { l:'High', c:'#4caf50' };
    return { l:'Peak', c:'#8b5cf6' };
  };
  const energyInfo = getEnergyLabel(energyLevel);

  const SectionCard = ({ step, title, icon: Icon, color, bg, children }) => (
    <div className="card p-6" style={{ borderRadius: '24px' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
          style={{ background: color }}>
          {step}
        </div>
        <h3 className="font-bold text-ink-800 flex items-center gap-1.5">
          <Icon className="w-4 h-4" style={{ color }} />
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-in">
      <div>
        <h2 className="text-2xl font-bold text-ink-800">How are you feeling? 🌸</h2>
        <p className="text-sm text-ink-400 mt-1">Take a breath and tune in to your emotional state.</p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl flex items-center gap-3 animate-scale-in"
          style={{ background: '#f0faf0', border: '1px solid #a8d9ab', color: '#388e3c' }}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Mood saved! ✨</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* Mood */}
        <SectionCard step="1" title="How do you feel?" icon={Smile} color="#8b5cf6" bg="#f5f0ff">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {moods.map(m => {
              const active = mood === m.name;
              return (
                <button key={m.name} type="button" onClick={() => setMood(m.name)}
                  className="p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 cursor-pointer"
                  style={active
                    ? { background: m.color, borderColor: m.dot, transform: 'scale(1.04)', boxShadow: `0 4px 16px ${m.dot}25` }
                    : { background: '#F7F9FC', borderColor: '#E2E6ED' }}>
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs font-bold text-ink-700">{m.name}</span>
                  <span className="text-[9px] text-ink-400 text-center">{m.desc}</span>
                  {active && <span className="w-2 h-2 rounded-full" style={{ background: m.dot }} />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Energy */}
        <SectionCard step="2" title="Energy Level" icon={Battery} color="#f97316" bg="#fff9f6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-400">How energized do you feel right now?</p>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold" style={{ color: energyInfo.c }}>{energyLevel}</span>
                <span className="text-xs text-ink-400">/10</span>
              </div>
            </div>
            <input type="range" min="1" max="10" value={energyLevel} onChange={e => setEnergyLevel(parseInt(e.target.value))}
              className="w-full"
              style={{
                color: energyInfo.c,
                background: `linear-gradient(to right, ${energyInfo.c} 0%, ${energyInfo.c} ${((energyLevel - 1) / 9) * 100}%, #E2E6ED ${((energyLevel - 1) / 9) * 100}%, #E2E6ED 100%)`
              }} />
            <div className="flex justify-between text-[10px] items-center">
              <span className="text-ink-400">Depleted</span>
              <span className="font-bold px-2.5 py-0.5 rounded-full text-white text-xs"
                style={{ background: energyInfo.c }}>{energyInfo.l}</span>
              <span className="text-ink-400">Peak</span>
            </div>
          </div>
        </SectionCard>

        {/* Emotions */}
        <SectionCard step="3" title="Detailed Emotions" icon={Heart} color="#ec4899" bg="#fff5f5">
          <p className="text-xs text-ink-400 mb-3">Select all that resonate with you</p>
          <div className="flex flex-wrap gap-2">
            {emotionTags.map(tag => {
              const active = selectedEmotions.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => toggleEmotion(tag)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-150 cursor-pointer"
                  style={active
                    ? { background: '#f5f0ff', borderColor: '#8b5cf6', color: '#8b5cf6' }
                    : { background: '#F7F9FC', borderColor: '#E2E6ED', color: '#6B7280' }}>
                  {active && '✓ '}{tag}
                </button>
              );
            })}
          </div>
          {selectedEmotions.length > 0 && (
            <p className="text-[10px] mt-2 font-semibold" style={{ color: '#8b5cf6' }}>{selectedEmotions.length} selected</p>
          )}
        </SectionCard>

        {/* Lifestyle */}
        <SectionCard step="4" title="Lifestyle Metrics" icon={Battery} color="#4caf50" bg="#f0faf0">
          <p className="text-xs text-ink-400 mb-4">Helps discover mood patterns over time</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label:'Sleep', icon:Moon,     color:'#8b5cf6', val:sleepHours,     set:setSleepHours,     min:0, max:16,  step:0.5, unit:'hrs' },
              { label:'Exercise', icon:Dumbbell, color:'#4caf50', val:exerciseMinutes, set:setExerciseMinutes, min:0, max:180, step:5,   unit:'min' },
              { label:'Water', icon:Droplet,  color:'#0ea5e9', val:waterIntakeMl,  set:setWaterIntakeMl,  min:0, max:4000,step:250, unit:'ml'  },
            ].map(({ label, icon:Icon, color, val, set, min, max, step, unit }) => {
              const fillPercent = ((val - min) / (max - min)) * 100;
              return (
                <div key={label} className="p-4 rounded-2xl border-2 space-y-2.5"
                  style={{ background: '#F7F9FC', borderColor: '#E2E6ED' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4" style={{ color }} />
                      <span className="text-xs font-bold text-ink-700">{label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color }}>{val} {unit}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(label==='Sleep'?parseFloat(e.target.value):parseInt(e.target.value))}
                    className="w-full"
                    style={{
                      color: color,
                      background: `linear-gradient(to right, ${color} 0%, ${color} ${fillPercent}%, #E2E6ED ${fillPercent}%, #E2E6ED 100%)`
                    }} />
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard step="5" title="Reflection Notes" icon={FileText} color="#d97706" bg="#fffef0">
          <p className="text-xs text-ink-400 mb-3">Optional — any triggers or observations?</p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="What might have influenced how you feel today…"
            className="w-full h-24 px-4 py-3 field text-ink-800 text-sm resize-none leading-relaxed"
            maxLength={300} />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-ink-300">{note.length}/300</span>
          </div>
        </SectionCard>

        <button type="submit" disabled={loading} className="btn-sage w-full">
          {loading
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><Save className="w-5 h-5" /> Save Today's Check-in</>}
        </button>
      </form>
    </div>
  );
};

export default MoodTracker;
