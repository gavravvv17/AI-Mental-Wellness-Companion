import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wind, Volume2, VolumeX, Play, Pause, Compass,
  Eye, Fingerprint, Ear, Smile, Flame, CloudRain,
  Trees, Waves, RefreshCw, ChevronRight
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   WEB AUDIO AMBIENT SOUND ENGINE
   Generates all sounds synthetically – no external URLs,
   no CORS issues, works 100% offline.
───────────────────────────────────────────────────── */
class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.nodes = {};
  }

  _getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _whiteNoise(ctx) {
    const bufSize = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  play(id, volume = 0.5) {
    const ctx = this._getCtx();
    if (this.nodes[id]) this.stop(id);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(ctx.destination);

    let sources = [];

    if (id === 'rain') {
      // White noise → low-pass filter → subtle tremolo
      const noise = this._whiteNoise(ctx);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 1200; lpf.Q.value = 0.5;
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 200;
      noise.connect(hpf); hpf.connect(lpf); lpf.connect(gainNode);
      noise.start();
      sources.push(noise);
    }

    if (id === 'waves') {
      // Multiple noise layers at low frequency with LFO for wave rhythm
      const noise = this._whiteNoise(ctx);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 700; lpf.Q.value = 1.5;

      // LFO for wave rhythm (~0.12 Hz = 1 wave every 8 sec)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      noise.connect(lpf); lpf.connect(gainNode);
      noise.start(); lfo.start();
      sources.push(noise, lfo);
    }

    if (id === 'forest') {
      // Band-pass filtered noise for stream + high-pitched birds
      const noise = this._whiteNoise(ctx);
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 1800; bpf.Q.value = 0.3;
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 4000;
      noise.connect(bpf); bpf.connect(lpf); lpf.connect(gainNode);
      noise.start();

      // Subtle bird chirp oscillator
      const birdOsc = ctx.createOscillator();
      birdOsc.type = 'sine'; birdOsc.frequency.value = 3200;
      const birdGain = ctx.createGain(); birdGain.gain.value = 0;
      birdOsc.connect(birdGain); birdGain.connect(gainNode);
      birdOsc.start();
      // Schedule chirps every few seconds
      const chirpInterval = setInterval(() => {
        if (this.ctx && this.ctx.state !== 'closed') {
          const now = this.ctx.currentTime;
          birdGain.gain.setValueAtTime(0, now);
          birdGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
          birdGain.gain.linearRampToValueAtTime(0, now + 0.2);
          birdOsc.frequency.setValueAtTime(3200, now);
          birdOsc.frequency.linearRampToValueAtTime(3800, now + 0.1);
          birdOsc.frequency.linearRampToValueAtTime(3200, now + 0.2);
        }
      }, 3000 + Math.random() * 2000);
      sources.push(noise, birdOsc);
      this.nodes[id] = { gainNode, sources, chirpInterval };
      gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
      return;
    }

    if (id === 'fire') {
      // Low-pass noise with slight amplitude modulation for crackle
      const noise = this._whiteNoise(ctx);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 800; lpf.Q.value = 2;

      // Crackle LFO (faster, irregular feel)
      const crackleLfo = ctx.createOscillator();
      crackleLfo.type = 'sawtooth'; crackleLfo.frequency.value = 6;
      const crackleGain = ctx.createGain(); crackleGain.gain.value = 0.12;
      crackleLfo.connect(crackleGain);
      crackleGain.connect(gainNode.gain);

      noise.connect(lpf); lpf.connect(gainNode);
      noise.start(); crackleLfo.start();
      sources.push(noise, crackleLfo);
    }

    gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
    this.nodes[id] = { gainNode, sources };
  }

  setVolume(id, volume) {
    if (this.nodes[id]) {
      const ctx = this._getCtx();
      this.nodes[id].gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }
  }

  stop(id) {
    if (this.nodes[id]) {
      const { gainNode, sources, chirpInterval } = this.nodes[id];
      if (chirpInterval) clearInterval(chirpInterval);
      const ctx = this._getCtx();
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(() => {
        try { sources.forEach(s => s.stop()); } catch {}
        try { gainNode.disconnect(); } catch {}
      }, 600);
      delete this.nodes[id];
    }
  }

  stopAll() {
    Object.keys(this.nodes).forEach(id => this.stop(id));
  }
}

/* ─────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────── */
const TabBtn = ({ id, label, icon: Icon, active, onClick }) => (
  <button onClick={() => onClick(id)}
    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
    style={active
      ? { background: '#f5f0ff', color: '#8b5cf6', border: '2px solid #dccef9' }
      : { background: 'transparent', color: '#6B7280', border: '2px solid transparent' }}>
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);

const Mindfulness = () => {
  const [activeTab, setActiveTab] = useState('breathing');
  const engineRef = useRef(null);

  useEffect(() => {
    engineRef.current = new AmbientEngine();
    return () => engineRef.current?.stopAll();
  }, []);

  /* ── Breathing ── */
  const [breathPattern, setBreathPattern] = useState('box');
  const [breathPhase, setBreathPhase] = useState('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [breathingActive, setBreathingActive] = useState(false);
  const breathTimerRef = useRef(null);

  const patterns = {
    box:   { inhale: 4, hold: 4, exhale: 4, holdExhale: 4, label: 'Box Breathing',  sub: 'Calms the nervous system' },
    relax: { inhale: 4, hold: 7, exhale: 8, holdExhale: 0, label: '4-7-8 Breathing', sub: 'Reduces anxiety fast'    },
    equal: { inhale: 4, hold: 0, exhale: 4, holdExhale: 0, label: 'Equal Breathing', sub: 'Improves focus & balance' },
  };

  useEffect(() => {
    setBreathPhase('Inhale');
    setSecondsLeft(patterns[breathPattern].inhale);
    setBreathingActive(false);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
  }, [breathPattern]);

  useEffect(() => {
    if (breathingActive) {
      breathTimerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            const p = patterns[breathPattern];
            setBreathPhase(curr => {
              if (curr === 'Inhale') {
                if (p.hold > 0) { setSecondsLeft(p.hold); return 'Hold'; }
                setSecondsLeft(p.exhale); return 'Exhale';
              }
              if (curr === 'Hold') { setSecondsLeft(p.exhale); return 'Exhale'; }
              if (curr === 'Exhale') {
                if (p.holdExhale > 0) { setSecondsLeft(p.holdExhale); return 'Hold Exhale'; }
                setSecondsLeft(p.inhale); return 'Inhale';
              }
              setSecondsLeft(p.inhale); return 'Inhale';
            });
            return prev; // will be overwritten by setSecondsLeft above
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }
    return () => { if (breathTimerRef.current) clearInterval(breathTimerRef.current); };
  }, [breathingActive, breathPattern]);

  const phaseStyles = {
    'Inhale':       { bg: '#cdeccf', border: '#a8d9ab', text: '#388e3c', hint: 'Breathe in slowly through your nose.' },
    'Hold':         { bg: '#fff4c7', border: '#ffe88a', text: '#d97706', hint: 'Hold gently. Let calm settle in.'     },
    'Exhale':       { bg: '#dbeeff', border: '#93cbff', text: '#0ea5e9', hint: 'Slowly release all tension out.'      },
    'Hold Exhale':  { bg: '#f5f0ff', border: '#c4adfa', text: '#8b5cf6', hint: 'Rest in the quiet between breaths.'   },
  };
  const ps = phaseStyles[breathPhase] || phaseStyles['Inhale'];
  const circleScale = !breathingActive ? 1.0 : (breathPhase === 'Inhale' || breathPhase === 'Hold') ? 1.25 : 0.82;

  /* ── Grounding ── */
  const [groundingStep, setGroundingStep] = useState(0);
  const groundingSteps = [
    { count: 5, label: 'Things you can SEE',   desc: 'Name five objects around you — shapes, colors, textures.', icon: Eye,         bg: '#d8ecff', border: '#93cbff',  text: '#0ea5e9' },
    { count: 4, label: 'Things you can FEEL',  desc: 'Acknowledge four textures — your chair, clothing, the air.', icon: Fingerprint, bg: '#ffe5d4', border: '#ffaa78',  text: '#f97316' },
    { count: 3, label: 'Things you can HEAR',  desc: 'Listen for three sounds — traffic, birds, or your own breath.', icon: Ear,     bg: '#fff4c7', border: '#ffe88a',  text: '#d97706' },
    { count: 2, label: 'Things you can SMELL', desc: 'Identify two scents in your environment — soap, coffee, air.', icon: Wind,    bg: '#cdeccf', border: '#a8d9ab',  text: '#388e3c' },
    { count: 1, label: 'Thing you can TASTE',  desc: 'Notice one taste, or mindfully sip a glass of water.',          icon: Smile,   bg: '#f5f0ff', border: '#c4adfa',  text: '#8b5cf6' },
  ];

  /* ── Sounds ── */
  const soundDefs = [
    { id: 'rain',   label: 'Rain Shower',      icon: CloudRain, color: '#0ea5e9', bg: '#f0f8ff', desc: 'Soft patter on leaves'     },
    { id: 'waves',  label: 'Ocean Waves',       icon: Waves,     color: '#0ea5e9', bg: '#dbeeff', desc: 'Rhythmic coastal waves'    },
    { id: 'forest', label: 'Forest Stream',     icon: Trees,     color: '#4caf50', bg: '#f0faf0', desc: 'Creek & distant birdsong'  },
    { id: 'fire',   label: 'Campfire Crackle',  icon: Flame,     color: '#f97316', bg: '#fff9f6', desc: 'Warm fireside atmosphere'  },
  ];
  const [playingSounds, setPlayingSounds] = useState({});
  const [volumes, setVolumes] = useState({ rain: 0.5, waves: 0.5, forest: 0.5, fire: 0.5 });
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const toggleSound = useCallback((id) => {
    setAudioUnlocked(true);
    const eng = engineRef.current;
    if (!eng) return;
    setPlayingSounds(prev => {
      const isPlaying = prev[id];
      if (isPlaying) { eng.stop(id); return { ...prev, [id]: false }; }
      else { eng.play(id, volumes[id]); return { ...prev, [id]: true }; }
    });
  }, [volumes]);

  const handleVolumeChange = useCallback((id, val) => {
    setVolumes(p => ({ ...p, [id]: val }));
    if (playingSounds[id]) engineRef.current?.setVolume(id, val);
  }, [playingSounds]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-in">

      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-800">Mindfulness 🌬️</h2>
          <p className="text-sm text-ink-400 mt-1">Breathe, ground yourself, and find your calm center.</p>
        </div>
        <div className="flex gap-1 p-1.5 rounded-2xl self-start" style={{ background: '#F7F9FC', border: '1.5px solid #E2E6ED' }}>
          <TabBtn id="breathing" label="Breathing"  icon={Wind}    active={activeTab === 'breathing'}  onClick={setActiveTab} />
          <TabBtn id="grounding" label="5-4-3-2-1"  icon={Compass} active={activeTab === 'grounding'} onClick={setActiveTab} />
          <TabBtn id="sounds"    label="Sounds"     icon={Volume2}  active={activeTab === 'sounds'}    onClick={setActiveTab} />
        </div>
      </div>

      {/* ── Breathing ── */}
      {activeTab === 'breathing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="card p-5 space-y-3" style={{ borderRadius: '24px' }}>
            <h3 className="font-bold text-ink-800">Techniques</h3>
            <p className="text-xs text-ink-400">Choose the right pattern for your headspace.</p>
            <div className="space-y-2 pt-1">
              {Object.entries(patterns).map(([key, pat]) => (
                <button key={key} onClick={() => setBreathPattern(key)}
                  className="w-full text-left p-4 rounded-2xl border-2 transition-all"
                  style={breathPattern === key
                    ? { background: '#f5f0ff', borderColor: '#8b5cf6' }
                    : { background: '#F7F9FC', borderColor: '#E2E6ED' }}>
                  <span className="text-xs font-bold block text-ink-800">{pat.label}</span>
                  <span className="text-[10px] text-ink-400 mt-0.5 block">{pat.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 card p-10 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#fafaf7,#f5f0ff 50%,#f0faf0)', borderRadius: '28px' }}>
            <div className="absolute w-72 h-72 rounded-full opacity-15 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #dccef9, transparent)' }} />

            <div className="flex flex-col items-center gap-7 z-10">
              {/* Breathing circle */}
              <div className="w-44 h-44 rounded-full flex items-center justify-center relative shadow-xl"
                style={{ background: ps.bg, border: `3px solid ${ps.border}`, boxShadow: `0 0 50px ${ps.border}80`,
                  transform: `scale(${circleScale})`, transition: 'transform 4s ease-in-out, background 1s ease, border-color 1s ease' }}>
                <div className="text-center select-none">
                  <span className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: ps.text }}>sec</span>
                  <span className="text-5xl font-bold" style={{ color: ps.text }}>{secondsLeft}</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <span className="inline-block px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-2"
                  style={{ background: ps.bg, borderColor: ps.border, color: ps.text }}>{breathPhase}</span>
                <p className="text-xs text-ink-400 italic max-w-xs">{ps.hint}</p>
              </div>

              <button onClick={() => setBreathingActive(a => !a)}
                className={breathingActive ? 'btn-ghost' : 'btn-primary'}
                style={{ minWidth: '160px', ...(breathingActive ? { color: '#ef4444', borderColor: '#fecaca' } : {}) }}>
                {breathingActive ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Breathing</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grounding ── */}
      {activeTab === 'grounding' && groundingStep < groundingSteps.length && (
        <div className="max-w-lg mx-auto card p-8 animate-scale-in space-y-5" style={{ borderRadius: '28px' }}>
          <div>
            <div className="flex justify-between text-[10px] text-ink-400 mb-2">
              <span>5-4-3-2-1 Grounding</span>
              <span>Step {groundingStep + 1} of {groundingSteps.length}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#EEF0F5' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(groundingStep / groundingSteps.length) * 100}%`, background: 'linear-gradient(90deg,#8b5cf6,#4caf50)' }} />
            </div>
          </div>
          {(() => {
            const step = groundingSteps[groundingStep];
            const StepIcon = step.icon;
            return (
              <div className="flex flex-col items-center text-center space-y-4 py-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center border-2"
                  style={{ background: step.bg, borderColor: step.border }}>
                  <StepIcon className="w-9 h-9" style={{ color: step.text }} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-ink-800">
                    Notice <span style={{ color: step.text }}>{step.count}</span>
                  </h3>
                  <h4 className="font-bold text-base text-ink-700 mt-1">{step.label}</h4>
                  <p className="text-xs text-ink-400 mt-2 max-w-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })()}
          <button onClick={() => setGroundingStep(s => s + 1)} className="btn-primary w-full">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'grounding' && groundingStep >= groundingSteps.length && (
        <div className="max-w-lg mx-auto card p-12 text-center space-y-4 animate-scale-in"
          style={{ borderRadius: '28px', background: 'linear-gradient(135deg,#f0faf0,#f5f0ff)' }}>
          <span className="text-6xl block animate-bounce-gentle">🌿</span>
          <h3 className="text-2xl font-bold text-ink-800">Grounded! 🎉</h3>
          <p className="text-sm text-ink-400 max-w-xs mx-auto leading-relaxed">
            You've completed the 5-4-3-2-1 exercise. You should feel more anchored in the present moment.
          </p>
          <button onClick={() => setGroundingStep(0)} className="btn-ghost mx-auto flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Start Over
          </button>
        </div>
      )}

      {/* ── Sounds ── */}
      {activeTab === 'sounds' && (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
          <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg,#f0f8ff,#ddf5e5)', border: '1px solid #d8ecff' }}>
            <h3 className="font-bold text-ink-800 mb-1">🎵 Soundscape Mixer</h3>
            <p className="text-xs text-ink-400 leading-relaxed">
              Synthetic ambient sounds — generated in-browser, no downloads needed. Layer them to create your perfect focus or sleep environment.
            </p>
            {!audioUnlocked && (
              <p className="text-[10px] text-amber-600 font-semibold mt-2">
                ⚡ Tap any Play button to activate audio (browser security requires a user gesture).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {soundDefs.map(sound => {
              const SoundIcon = sound.icon;
              const isPlaying = !!playingSounds[sound.id];
              return (
                <div key={sound.id} className="card p-5 space-y-4 card-hover transition-all"
                  style={{ borderRadius: '20px', border: isPlaying ? `2px solid ${sound.color}40` : '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSound(sound.id)}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all"
                      style={isPlaying
                        ? { background: sound.bg, borderColor: sound.color, color: sound.color, transform: 'scale(1.05)' }
                        : { background: '#F7F9FC', borderColor: '#E2E6ED', color: '#9ca3af' }}>
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <div>
                      <p className="font-semibold text-sm text-ink-800 flex items-center gap-1.5">
                        <SoundIcon className="w-4 h-4" style={{ color: isPlaying ? sound.color : '#9ca3af' }} />
                        {sound.label}
                      </p>
                      <p className="text-[10px] text-ink-400">{sound.desc}</p>
                      {isPlaying && <span className="text-[10px] font-semibold animate-pulse" style={{ color: sound.color }}>● Playing</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <VolumeX className="w-3.5 h-3.5 flex-shrink-0 text-ink-300" />
                    <input type="range" min="0" max="1" step="0.02"
                      value={volumes[sound.id]}
                      onChange={e => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                      className="w-full"
                      style={{ accentColor: sound.color }} />
                    <Volume2 className="w-3.5 h-3.5 flex-shrink-0 text-ink-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="p-4 rounded-2xl text-xs text-ink-400 flex items-start gap-2"
            style={{ background: '#fffef0', border: '1px solid #fff4c7' }}>
            <span className="text-base">💡</span>
            <span className="leading-relaxed">
              <strong className="text-ink-600">Tip:</strong> Combine Rain + Forest for a jungle stream, or Waves + Fire for a warm beach evening. All sounds are generated locally by your browser — they work even when offline.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mindfulness;
