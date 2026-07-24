import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  VolumeX, 
  Volume2, 
  Clock, 
  Calendar, 
  Folder, 
  Trash2,
  Sparkles
} from 'lucide-react';

export const FocusTimerModule: React.FC = () => {
  const { focusSessions, addFocusSession, projects } = useAppContext();
  const toast = useToast();

  // Timer modes
  const MODES = {
    focus: { label: 'Фокусування', duration: 25 },
    shortBreak: { label: 'Коротка Перерва', duration: 5 },
    longBreak: { label: 'Тривала Перерва', duration: 15 },
  };

  type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  // Audio synthesis state
  const [ambientSound, setAmbientSound] = useState<'none' | 'cyber_drone' | 'white_noise' | 'cosmic_rain'>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<any[]>([]);

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle mode switches
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].duration * 60);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Synthesize a completion bell ringing on-the-fly!
    playSuccessChime();

    if (mode === 'focus') {
      addFocusSession({
        date: new Date().toISOString().split('T')[0],
        duration: MODES.focus.duration,
        projectId: selectedProject || undefined
      });
      toast.success('Вітаємо! Фокус-сесія успішно завершена. Час відпочити! 🧘');
      handleModeChange('shortBreak');
    } else {
      toast.info('Перерву завершено! Час повертатися до роботи ⚡');
      handleModeChange('focus');
    }
  };

  // WEB AUDIO SYNTHESIZER ENGINE
  const startAmbientSynthesis = (type: string) => {
    stopAmbientSynthesis();

    if (type === 'none') return;

    try {
      // Lazy initialization of AudioContext
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const nodes: any[] = [];

      if (type === 'cyber_drone') {
        // Deep cyber space synth drone
        // Low Frequency Carrier Osc 1
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
        
        // Lowpass filter to make it cozy and warm
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);
        filter.Q.setValueAtTime(3, ctx.currentTime);

        // Slow LFO for organic volume pulsing
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 0.2Hz pulse
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.08, ctx.currentTime);

        // Modulate filter cutoff with LFO
        lfo.connect(filter.frequency);
        
        osc1.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);

        osc1.start();
        lfo.start();

        nodes.push(osc1, lfo, filter, mainGain);

      } else if (type === 'white_noise') {
        // Safe analog-sounding noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();

        nodes.push(whiteNoise, filter, gainNode);

      } else if (type === 'cosmic_rain') {
        // Cosmic digital raindrop generator
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        // High resonance bandpass filter for metallic droplets
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        filter.Q.setValueAtTime(8, ctx.currentTime);

        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.02, ctx.currentTime);

        // Custom LFO rain rate modulator
        const rainLFO = ctx.createOscillator();
        rainLFO.frequency.setValueAtTime(2.5, ctx.currentTime); // Drop speed rate
        
        const rainLFOGain = ctx.createGain();
        rainLFOGain.gain.setValueAtTime(300, ctx.currentTime);

        rainLFO.connect(rainLFOGain);
        rainLFOGain.connect(filter.frequency);

        noise.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);

        noise.start();
        rainLFO.start();

        nodes.push(noise, filter, mainGain, rainLFO);
      }

      activeNodesRef.current = nodes;
    } catch (e) {
      console.error('Web Audio API not supported or error:', e);
    }
  };

  const stopAmbientSynthesis = () => {
    try {
      activeNodesRef.current.forEach(node => {
        if (node.stop) {
          node.stop();
        }
        if (node.disconnect) {
          node.disconnect();
        }
      });
      activeNodesRef.current = [];
    } catch (e) {
      console.error('Error stopping synth:', e);
    }
  };

  const playSuccessChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5 note
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5 note
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6 note

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (e) {
      // fallback
    }
  };

  // Sound switch handler
  const handleSoundChange = (sound: typeof ambientSound) => {
    setAmbientSound(sound);
    if (isRunning && sound !== 'none') {
      startAmbientSynthesis(sound);
    } else {
      stopAmbientSynthesis();
    }
  };

  // Sync synthesizer state with running timer state
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      startAmbientSynthesis(ambientSound);
    } else {
      stopAmbientSynthesis();
    }
    return () => stopAmbientSynthesis();
  }, [isRunning]);

  // Formatter helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circle progress math
  const maxTime = MODES[mode].duration * 60;
  const progressPercent = ((maxTime - timeLeft) / maxTime) * 100;
  const strokeDashoffset = 282.7 - (282.7 * progressPercent) / 100;

  // Streak calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = focusSessions.filter(s => s.date === todayStr);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans text-xs">
      
      {/* LEFT COLUMN: TIMER DECK */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Main interactive card */}
        <Card className="p-6 border border-border-accent/15 bg-hover-bg/5 flex flex-col items-center justify-center space-y-6 text-center relative overflow-hidden">
          
          {/* Neon background light effect */}
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-accent-purple/5 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-accent-purple/5 blur-3xl rounded-full" />

          {/* Mode Switch Tab Bar */}
          <div className="flex bg-[#12101C]/60 p-1.5 rounded-xl border border-border-accent/20 shrink-0 z-10">
            {(Object.keys(MODES) as TimerMode[]).map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                  mode === m 
                    ? 'bg-accent-purple text-white shadow-xs' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Graphical Clock Dial Component */}
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            {/* SVG Ring Dial */}
            <svg className="absolute w-full h-full -rotate-90">
              {/* Underlay */}
              <circle 
                cx="96" 
                cy="96" 
                r="75" 
                className="stroke-border-accent/10 fill-none" 
                strokeWidth="5" 
              />
              {/* Active animated layer */}
              <circle 
                cx="96" 
                cy="96" 
                r="75" 
                className="stroke-accent-purple fill-none transition-all duration-300" 
                strokeWidth="5.5" 
                strokeDasharray="471.2"
                strokeDashoffset={471.2 - (471.2 * progressPercent) / 100}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px var(--color-accent-purple-glow))' }}
              />
            </svg>

            {/* Inner text values */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold tracking-tight text-text-primary">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#8B879E] mt-1 font-bold">
                {isRunning ? 'Іде Робота' : 'Пауза'}
              </span>
            </div>
          </div>

          {/* Primary Clock Buttons Controls */}
          <div className="flex items-center gap-3.5 z-10">
            <Button
              onClick={handleReset}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-border-accent/20 bg-[#1E1B2E] text-text-secondary hover:text-white transition-all cursor-pointer"
              title="Перезапустити таймер"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant="primary"
              className="h-12 px-6 rounded-full flex items-center gap-2 text-xs cursor-pointer shadow-md shadow-accent-purple/10"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Призупинити
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Запустити фокус
                </>
              )}
            </Button>
          </div>

        </Card>

        {/* Ambient audio deck controller */}
        <Card className="p-4 border border-border-accent/15 bg-hover-bg/5 space-y-4">
          <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Music className="w-4 h-4 text-accent-purple" />
              Ембієнт та Саундскейпи
            </h3>
            {ambientSound !== 'none' ? (
              <Badge className="bg-status-success/15 text-status-success border-status-success/30 px-1.5 text-[8px] font-mono uppercase">
                Синтез Активний
              </Badge>
            ) : (
              <Badge className="bg-hover-bg border-border-accent/30 text-text-tertiary px-1.5 text-[8px] font-mono uppercase">
                Без звуку
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'none', label: 'Вимкнути звук', icon: VolumeX, desc: 'Тиша' },
              { id: 'cyber_drone', label: 'Cyber Drone', icon: Volume2, desc: 'Космічний гул 55Hz' },
              { id: 'white_noise', label: 'White Noise', icon: Volume2, desc: 'Аналоговий статик' },
              { id: 'cosmic_rain', label: 'Cosmic Rain', icon: Volume2, desc: 'Металевий дощ' },
            ].map(snd => {
              const Icon = snd.icon;
              const isSel = ambientSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => handleSoundChange(snd.id as any)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSel 
                      ? 'bg-accent-purple/10 border-accent-purple shadow-xs' 
                      : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-accent-purple' : 'text-text-secondary'}`} />
                    <div>
                      <span className="text-[10px] font-semibold text-text-primary block leading-normal">{snd.label}</span>
                      <span className="text-[8px] text-text-tertiary block leading-none">{snd.desc}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

      </div>

      {/* RIGHT COLUMN: HISTORY & LINKING */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Project association selector */}
        <Card className="p-4 border border-border-accent/15 bg-hover-bg/5 space-y-3">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Folder className="w-4 h-4 text-accent-purple" />
            Прив'язка до Проєкту
          </h3>
          <p className="text-[10px] text-text-secondary">Оберіть проєкт над яким працюєте, щоб зафіксувати часові витрати.</p>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full text-xs font-medium"
          >
            <option value="">Без прив'язки до проєкту</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </Select>
        </Card>

        {/* Stats and history tracker */}
        <Card className="p-4 border border-border-accent/15 bg-hover-bg/5 space-y-4">
          <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Flame className="w-4 h-4 text-accent-purple animate-pulse" />
              Сьогоднішня Статистика
            </h3>
            <span className="text-[10px] font-mono text-accent-purple font-bold">
              {todaySessions.length} сесій
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#1E1B2E]/30 rounded-xl border border-border-accent/10 text-center">
              <span className="text-[10px] text-text-secondary block">Фокус за день</span>
              <span className="text-base font-bold text-text-primary font-mono block mt-1">
                {todaySessions.reduce((acc, curr) => acc + curr.duration, 0)} хв
              </span>
            </div>

            <div className="p-3 bg-[#1E1B2E]/30 rounded-xl border border-border-accent/10 text-center">
              <span className="text-[10px] text-text-secondary block">Тижневий темп</span>
              <span className="text-base font-bold text-text-primary font-mono block mt-1">
                {focusSessions.length} сесій
              </span>
            </div>
          </div>

          {/* History logs rendering */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Історія сесій</span>
            
            <div className="space-y-1.5 overflow-y-auto max-h-36 custom-scrollbar pr-1">
              {focusSessions.slice(0, 5).map((sess) => {
                const proj = projects.find(p => p.id === sess.projectId);
                return (
                  <div 
                    key={sess.id}
                    className="p-2 rounded-lg bg-[#0F0D1A]/60 border border-border-accent/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 w-[85%]">
                      <Clock className="w-3.5 h-3.5 text-accent-purple shrink-0" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-text-primary">{sess.duration} хв фокусу</span>
                          {proj && (
                            <Badge variant="outline" className="text-[8px] font-mono text-accent-purple border-accent-purple/20 truncate">
                              {proj.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[8px] text-text-tertiary font-mono block leading-none mt-0.5">{sess.date}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold text-status-success shrink-0 font-mono">100%</span>
                  </div>
                );
              })}

              {focusSessions.length === 0 && (
                <div className="text-center py-6 text-text-tertiary italic text-[10px]">
                  Немає записаних сесій за останній час
                </div>
              )}
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
};
