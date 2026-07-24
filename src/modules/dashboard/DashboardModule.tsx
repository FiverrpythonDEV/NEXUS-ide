import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { storage } from '../../utils/storage';
import { useDeviceInfo } from '../../utils/useDeviceInfo';
import { useTranslation } from '../../i18n/translations';
import { 
  Terminal, 
  Plus, 
  Cpu, 
  HardDrive, 
  Layers, 
  ChevronRight, 
  BookOpen, 
  Wrench, 
  Flame, 
  RefreshCw,
  Clock,
  Settings,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Sliders,
  HelpCircle,
  X,
  Copy,
  Check
} from 'lucide-react';
import { PRESET_COMMANDS } from '../cheatsheet/CheatsheetModule';

interface WidgetConfig {
  id: string;
  visible: boolean;
  nameUk: string;
  nameEn: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'banner', visible: true, nameUk: 'Привітання та Годинник', nameEn: 'Welcome & Clock' },
  { id: 'activity', visible: true, nameUk: 'Інтенсивність Розробки', nameEn: 'Development Activity' },
  { id: 'stats', visible: true, nameUk: 'Статистика NEXUS', nameEn: 'NEXUS Statistics' },
  { id: 'cheatsheet', visible: true, nameUk: 'Швидкий пошук команд', nameEn: 'Quick Command Search' },
  { id: 'device', visible: true, nameUk: 'Характеристики цього пристрою', nameEn: 'Device Diagnostics' },
  { id: 'projects', visible: true, nameUk: 'Активні проєкти', nameEn: 'Active Projects' },
  { id: 'notes', visible: true, nameUk: 'Швидкі нотатки', nameEn: 'Quick Notes' },
  { id: 'gadgets', visible: true, nameUk: 'Облік техніки та гаджетів', nameEn: 'Gadgets Register' },
  { id: 'focus', visible: true, nameUk: 'Фокус-таймер (Pomodoro)', nameEn: 'Focus Timer (Pomodoro)' },
  { id: 'actions', visible: true, nameUk: 'Швидкі дії', nameEn: 'Quick Actions' }
];

export const DashboardModule: React.FC = () => {
  const { projects, notes, snippets, bookmarks, gadgets, cheatsheets, setModule, addNote, addProject, settings } = useAppContext();
  const toast = useToast();
  const deviceInfo = useDeviceInfo();
  const { t, lang } = useTranslation();
  
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteTitle, setQuickNoteTitle] = useState('');

  // Cheatsheet quick search states
  const [cheatsheetSearch, setCheatsheetSearch] = useState('');
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);
  
  // Widget Customization state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_dashboard_widgets');
      if (saved) {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        const missing = DEFAULT_WIDGETS.filter(dw => !parsed.some(pw => pw.id === dw.id));
        return [...parsed, ...missing];
      }
      return DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  // Pomodoro Focus Timer State
  const [pomoTimeLeft, setPomoTimeLeft] = useState(1500); // 25 min default
  const [pomoIsActive, setPomoIsActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');

  // Onboarding Modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return localStorage.getItem('nexus_onboarded_completed') !== 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown Pomodoro Effect
  useEffect(() => {
    let interval: any = null;
    if (pomoIsActive && pomoTimeLeft > 0) {
      interval = setInterval(() => {
        setPomoTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (pomoTimeLeft === 0) {
      setPomoIsActive(false);
      if (pomoMode === 'focus') {
        toast.success(lang === 'uk' ? '⏰ Час фокусу закінчився! Зробіть коротку перерву.' : '⏰ Focus time completed! Take a short break.');
        setPomoMode('break');
        setPomoTimeLeft(300); // 5 mins break
      } else {
        toast.success(lang === 'uk' ? '⏰ Перерва завершена! Повертаємось до кодування.' : '⏰ Break completed! Time to code again.');
        setPomoMode('focus');
        setPomoTimeLeft(1500); // 25 mins focus
      }
    }
    return () => clearInterval(interval);
  }, [pomoIsActive, pomoTimeLeft, pomoMode, lang]);

  const togglePomo = () => {
    setPomoIsActive(!pomoIsActive);
  };

  const resetPomo = () => {
    setPomoIsActive(false);
    setPomoMode('focus');
    setPomoTimeLeft(1500);
  };

  const formatPomoTime = () => {
    const mins = Math.floor(pomoTimeLeft / 60);
    const secs = pomoTimeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle.trim()) {
      toast.warning(lang === 'uk' ? 'Будь ласка, вкажіть заголовок нотатки' : 'Please specify a title for the note');
      return;
    }
    (addNote as any)({
      id: Date.now().toString(),
      title: quickNoteTitle,
      content: quickNoteText || (lang === 'uk' ? 'Текст нотатки...' : 'Note text...'),
      tags: [],
      updatedAt: new Date().toISOString()
    });
    toast.success(lang === 'uk' ? 'Нотатку збережено' : 'Note saved');
    setQuickNoteTitle('');
    setQuickNoteText('');
  };

  // Generate real contribution grid data (7 rows, 24 columns) mapped to calendar dates
  const generateRealContributionData = () => {
    const logs = storage.getActivityLogs();
    const logsMap = new Map<string, number>();
    logs.forEach(log => {
      logsMap.set(log.date, log.count);
    });

    const days = lang === 'uk' ? ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = new Date();
    
    const currentDayOfWeek = today.getDay(); 
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - currentDayOfWeek);
    currentSunday.setHours(0, 0, 0, 0);

    const data = [];
    for (let r = 0; r < 7; r++) {
      const row = [];
      const datesRow: string[] = [];
      for (let c = 0; c < 24; c++) {
        const weeksOffset = c - 23;
        const daysOffset = weeksOffset * 7 + r;
        
        const cellDate = new Date(currentSunday);
        cellDate.setDate(currentSunday.getDate() + daysOffset);
        
        const dateStr = cellDate.toISOString().split('T')[0];
        datesRow.push(dateStr);

        const count = logsMap.get(dateStr) || 0;
        let level = 0;
        if (count > 0) {
          if (count <= 2) level = 1;
          else if (count <= 4) level = 2;
          else if (count <= 8) level = 3;
          else level = 4;
        }
        row.push(level);
      }
      data.push({ day: days[r], levels: row, dates: datesRow });
    }
    return data;
  };

  const [contributionGraph, setContributionGraph] = useState(generateRealContributionData());

  useEffect(() => {
    setContributionGraph(generateRealContributionData());
  }, [projects, notes, gadgets, lang]);

  const handleContributionClick = (dateStr: string, level: number) => {
    const logs = storage.getActivityLogs();
    const entry = logs.find(log => log.date === dateStr);
    const count = entry ? entry.count : 0;
    
    let formattedDate = dateStr;
    try {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {}

    toast.info(`${formattedDate}: ${lang === 'uk' ? `зафіксовано ${count} дій розробника.` : `recorded ${count} developer events.`}`);
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-hover-bg/40 border border-border-accent/10';
      case 1: return 'bg-accent-purple/20 border border-accent-purple/10';
      case 2: return 'bg-accent-purple/40 border border-accent-purple/20';
      case 3: return 'bg-accent-purple/65 border border-accent-purple/30';
      case 4: return 'bg-accent-purple border border-accent-purple/40 shadow-[0_0_8px_rgba(139,92,246,0.4)]';
      default: return 'bg-hover-bg';
    }
  };

  // Move widget up
  const moveWidgetUp = (index: number) => {
    if (index === 0) return;
    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setWidgets(updated);
    localStorage.setItem('nexus_dashboard_widgets', JSON.stringify(updated));
    toast.success(lang === 'uk' ? 'Макет змінено' : 'Layout updated');
  };

  // Move widget down
  const moveWidgetDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setWidgets(updated);
    localStorage.setItem('nexus_dashboard_widgets', JSON.stringify(updated));
    toast.success(lang === 'uk' ? 'Макет змінено' : 'Layout updated');
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setWidgets(updated);
    localStorage.setItem('nexus_dashboard_widgets', JSON.stringify(updated));
    toast.success(lang === 'uk' ? 'Видимість змінено' : 'Visibility updated');
  };

  const activeProjects = projects.filter(p => p.status !== 'completed').slice(0, 3);
  const activeGadgets = gadgets.slice(0, 3);

  // Complete onboarding
  const completeOnboarding = () => {
    localStorage.setItem('nexus_onboarded_completed', 'true');
    setIsOnboardingOpen(false);
    toast.success(lang === 'uk' ? '⚡ Вітаємо на борту NEXUS!' : '⚡ Welcome aboard NEXUS!');
  };

  return (
    <div className="space-y-6 pb-12 select-none relative font-sans">
      
      {/* Dynamic Widget customizer / configuration toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-accent/15 pb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {lang === 'uk' ? 'Робочий стіл NEXUS' : 'NEXUS Workspace'}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {lang === 'uk' ? 'Персоналізований хаб моніторингу та швидких утиліт.' : 'Personalized workspace monitoring & utilities hub.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`p-1.5 px-3 flex items-center gap-1.5 text-xs transition-all cursor-pointer border ${
              isCustomizing ? 'bg-accent-purple/20 border-accent-purple text-text-primary' : 'bg-[#15131F]/40 border-border-accent/20 text-text-secondary hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'uk' ? 'Налаштування' : 'Widgets Settings'}</span>
          </Button>

          <button
            onClick={() => {
              setOnboardingStep(0);
              setIsOnboardingOpen(true);
            }}
            className="p-1.5 px-3 bg-hover-bg/30 hover:bg-hover-bg/60 border border-border-accent/20 rounded-xl text-text-secondary hover:text-white text-xs flex items-center gap-1.5 cursor-pointer"
            title={lang === 'uk' ? 'Довідка інтеграції' : 'Help center'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-accent-purple" />
            <span>{lang === 'uk' ? 'Довідка' : 'Onboarding'}</span>
          </button>
        </div>
      </div>

      {/* Widget Settings expansion panel */}
      {isCustomizing && (
        <Card className="bg-[#12101C]/65 border border-accent-purple/20 p-4 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-purple flex items-center gap-1.5">
              <Settings className="w-4 h-4 animate-spin-slow" />
              {lang === 'uk' ? 'Керування віджетами та розташуванням' : 'Widgets visibility & arrangement'}
            </span>
            <button onClick={() => setIsCustomizing(false)} className="text-text-tertiary hover:text-white text-xs font-bold cursor-pointer">
              {lang === 'uk' ? 'Закрити' : 'Close'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {widgets.map((widget, idx) => {
              const widgetName = lang === 'uk' ? widget.nameUk : widget.nameEn;
              return (
                <div key={widget.id} className="p-2.5 rounded-lg bg-[#09080E] border border-white/5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <input 
                      type="checkbox"
                      checked={widget.visible}
                      onChange={() => toggleWidgetVisibility(widget.id)}
                      className="rounded bg-base-bg border-border-accent cursor-pointer accent-accent-purple shrink-0 h-3.5 w-3.5"
                    />
                    <span className={`font-medium truncate ${widget.visible ? 'text-text-primary' : 'text-text-tertiary line-through'}`}>
                      {widgetName}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button 
                      onClick={() => moveWidgetUp(idx)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-white/5 text-text-tertiary hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => moveWidgetDown(idx)}
                      disabled={idx === widgets.length - 1}
                      className="p-1 hover:bg-white/5 text-text-tertiary hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Dynamic Grid layout rendering of visible widgets */}
      <div className="space-y-6">
        {widgets.map((widget, wIdx) => {
          if (!widget.visible) return null;

          switch (widget.id) {
            case 'banner':
              return (
                <div key="banner" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Welcome Card */}
                  <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between p-6 bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl min-h-[175px]">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-light mb-1">
                        {lang === 'uk' ? 'Привіт, ' : 'Hello, '}<span className="font-bold text-[#EDEBF5]">stasukilla296</span>.
                      </h2>
                      <p className="text-[#8B879E] text-sm">
                        {lang === 'uk' 
                          ? `Сьогодні ${currentTime.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}. Ваші проєкти очікують на розвиток.`
                          : `Today is ${currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}. Let's make something amazing.`}
                      </p>
                    </div>
                    
                    <div className="flex gap-2.5 mt-4">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium shadow-[0_0_20px_var(--color-accent-purple-glow)] hover:shadow-[0_0_30px_var(--color-accent-purple-glow)] transition-all cursor-pointer"
                        onClick={() => setModule('project-tracker')}
                      >
                        {lang === 'uk' ? 'Створити проєкт' : 'New Project'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-4 py-2 bg-[#1E1B2E] border border-[rgba(168,130,255,0.2)] rounded-lg text-sm font-medium cursor-pointer"
                        onClick={() => setModule('knowledge-base')}
                      >
                        {lang === 'uk' ? 'Нотатка' : 'New Note'}
                      </Button>
                    </div>

                    <div className="mt-6 pt-3 border-t border-border-accent/15 flex flex-wrap gap-4 text-[10px] text-text-secondary font-mono">
                      <div>
                        <span className="text-text-tertiary">HOST:</span> <span className="text-text-primary">localhost:3000</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">USER:</span> <span className="text-text-primary">stasukilla296</span>
                      </div>
                      <div>
                        <span className="text-text-tertiary">STATUS:</span> <span className="text-status-success">ACTIVE</span>
                      </div>
                    </div>
                  </Card>

                  {/* Real-time Clock Card */}
                  <Card className="flex flex-col justify-between p-6 bg-gradient-to-br from-panel-bg to-hover-bg/30 border border-[rgba(168,130,255,0.12)] shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#5C5870] font-bold">
                        {lang === 'uk' ? 'Локальний Час' : 'Local Time'}
                      </span>
                      <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
                    </div>
                    <div className="my-3 space-y-1">
                      <div className="text-3xl font-semibold font-mono tracking-tight text-accent-purple">
                        {currentTime.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-xs text-text-secondary font-mono">
                        {currentTime.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-text-tertiary border-t border-border-accent/20 pt-3">
                      UTC {currentTime.getTimezoneOffset() / -60 >= 0 ? '+' : ''}{currentTime.getTimezoneOffset() / -60} // DST Active
                    </div>
                    {settings.weatherEnabled !== false && (
                      <div className="mt-3 pt-3 border-t border-border-accent/15 flex items-center justify-between text-xs text-text-secondary">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="text-sm">☁️</span>
                          <span>+18°C, {lang === 'uk' ? 'Київ' : 'Kyiv'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary">{lang === 'uk' ? 'Переважно хмарно' : 'Partly Cloudy'}</span>
                      </div>
                    )}
                  </Card>
                </div>
              );

            case 'stats':
              return (
                <div key="stats" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 flex flex-col justify-between p-5 bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl" key="stats-card">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                        <Layers className="w-4 h-4 text-accent-purple" />
                        {lang === 'uk' ? 'Статистика NEXUS' : 'NEXUS Statistics'}
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Projects */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">{projects.length}</span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Проєкти' : 'Projects'}</span>
                        </div>

                        {/* Notes */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">{notes.length}</span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Нотатки' : 'Notes'}</span>
                        </div>

                        {/* Files */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">
                            {(() => {
                              try {
                                const raw = localStorage.getItem('nexus_code_files');
                                return raw ? JSON.parse(raw).length : 3;
                              } catch { return 3; }
                            })()}
                          </span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Файли в редакторі' : 'Editor Files'}</span>
                        </div>

                        {/* Snippets */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">{snippets ? snippets.length : 0}</span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Сніпети' : 'Snippets'}</span>
                        </div>

                        {/* Bookmarks */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">{bookmarks ? bookmarks.length : 0}</span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Закладки' : 'Bookmarks'}</span>
                        </div>

                        {/* Storage usage */}
                        <div className="p-3.5 rounded-xl bg-hover-bg/15 border border-border-accent/15 flex flex-col justify-between">
                          <span className="text-2xl font-bold font-mono text-accent-purple">
                            {(() => {
                              try {
                                const totalBytes = Object.keys(localStorage)
                                  .filter(k => k.startsWith('nexus_'))
                                  .reduce((acc, key) => {
                                    const val = localStorage.getItem(key) || '';
                                    return acc + (key.length + val.length) * 2;
                                  }, 0);
                                return (totalBytes / 1024).toFixed(1);
                              } catch { return '0.0'; }
                            })()} KB
                          </span>
                          <span className="text-[10px] text-text-secondary mt-1">{lang === 'uk' ? 'Розмір даних' : 'Data Size'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            case 'cheatsheet':
              const allCheatsheets = [...(PRESET_COMMANDS || []), ...(cheatsheets || [])];
              const searchedCheatsheets = cheatsheetSearch.trim() === ''
                ? []
                : allCheatsheets.filter(c =>
                    c.command.toLowerCase().includes(cheatsheetSearch.toLowerCase()) ||
                    c.description.toLowerCase().includes(cheatsheetSearch.toLowerCase())
                  ).slice(0, 3);

              return (
                <div key="cheatsheet" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 p-5 bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl" key="cheatsheet-card">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-accent-purple" />
                          {t('dashboard.quick_search')}
                        </h3>
                        <button 
                          onClick={() => setModule('cheatsheet')}
                          className="text-xs text-accent-purple hover:underline cursor-pointer flex items-center gap-1"
                        >
                          {t('dashboard.more_commands')}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="git commit..."
                          value={cheatsheetSearch}
                          onChange={(e) => setCheatsheetSearch(e.target.value)}
                          className="w-full bg-[#1E1B2E] border border-border-accent/30 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
                        />
                      </div>

                      {cheatsheetSearch.trim() !== '' && (
                        <div className="space-y-2 mt-2">
                          {searchedCheatsheets.length === 0 ? (
                            <p className="text-xs text-text-tertiary text-center py-2">
                              {t('dashboard.no_results')}
                            </p>
                          ) : (
                            searchedCheatsheets.map((cmd) => (
                              <div 
                                key={cmd.id} 
                                className="flex items-center justify-between p-2.5 rounded-lg bg-hover-bg/25 border border-border-accent/10 hover:border-border-accent/30 transition-all gap-4"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <code className="text-xs font-mono text-accent-purple block truncate select-all" title={cmd.command}>
                                    {cmd.command}
                                  </code>
                                  <span className="text-[10px] text-text-secondary block truncate" title={cmd.description}>
                                    {cmd.description}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cmd.command);
                                    setCopiedCmdId(cmd.id);
                                    toast.success(t('dashboard.cmd_copied'));
                                    setTimeout(() => setCopiedCmdId(null), 1500);
                                  }}
                                  className="p-1.5 hover:bg-hover-bg rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer shrink-0"
                                  title={t('console.copy')}
                                >
                                  {copiedCmdId === cmd.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );

            case 'activity':
              return (
                <div key="activity" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Widget: Diagnostics Toggle */}
                  {widgets.find(w => w.id === 'device')?.visible ? null : (
                    <div className="hidden md:block" />
                  )}

                  {/* Shared logs activity map */}
                  <Card className="md:col-span-3 space-y-3" key="activity-map">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                        <Layers className="w-4 h-4 text-accent-purple" />
                        {lang === 'uk' ? 'Інтенсивність Розробки (Спільний лог)' : 'Development intensity (Shared activity log)'}
                      </h3>
                      <span className="text-[10px] font-mono text-text-tertiary">{lang === 'uk' ? 'Останні 24 тижні' : 'Last 24 weeks'}</span>
                    </div>

                    <div className="overflow-x-auto select-none pt-2">
                      <div className="min-w-[450px] space-y-1.5">
                        {contributionGraph.map((row, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-1.5">
                            <span className="w-5 text-[10px] text-text-tertiary font-mono text-right mr-1">{row.day}</span>
                            <div className="flex gap-1.5">
                              {row.levels.map((level, cIdx) => (
                                <div
                                  key={cIdx}
                                  onClick={() => handleContributionClick(row.dates[cIdx], level)}
                                  className={`w-3.5 h-3.5 rounded-xs transition-colors duration-150 cursor-pointer ${getCellColor(level)}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-2 border-t border-border-accent/10">
                      <span>{lang === 'uk' ? 'Клацайте по клітинках для перевірки логів' : 'Click cells to check system logs'}</span>
                      <div className="flex items-center gap-1.5">
                        <span>{lang === 'uk' ? 'Меньше' : 'Less'}</span>
                        <div className="w-2.5 h-2.5 bg-hover-bg/40 border border-border-accent/10 rounded-xs" />
                        <div className="w-2.5 h-2.5 bg-accent-purple/20 border border-accent-purple/10 rounded-xs" />
                        <div className="w-2.5 h-2.5 bg-accent-purple/40 border border-accent-purple/20 rounded-xs" />
                        <div className="w-2.5 h-2.5 bg-accent-purple/65 border border-accent-purple/30 rounded-xs" />
                        <div className="w-2.5 h-2.5 bg-accent-purple border border-accent-purple/40 rounded-xs" />
                        <span>{lang === 'uk' ? 'Більше' : 'More'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            case 'device':
              return (
                <div key="device" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {!deviceInfo.isAllowed ? (
                    <Card className="bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl p-5 flex flex-col justify-between min-h-[220px]">
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase text-[#5C5870] font-bold tracking-widest flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-accent-purple" />
                          {lang === 'uk' ? 'ЦЕЙ ПРИСТРІЙ' : 'DEVICE ENVIRONMENT'}
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {lang === 'uk' 
                            ? 'Дозволити визначення характеристик цього пристрою (кількість ядер CPU, ОЗУ, батарея, мережевий статус, GPU та ОС).'
                            : 'Enable diagnostics to detect CPU cores, RAM, battery charging status, GPU and OS to optimize environment performance.'}
                        </p>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full text-xs py-2 bg-accent-purple text-white font-sans font-medium rounded-lg mt-4 cursor-pointer"
                        onClick={() => {
                          deviceInfo.allowDiagnostics();
                          toast.success(lang === 'uk' ? 'Діагностика пристрою активована!' : 'Device diagnostics enabled!');
                        }}
                      >
                        {lang === 'uk' ? 'Визначити характеристики пристрою' : 'Identify device characteristics'}
                      </Button>
                    </Card>
                  ) : (
                    <Card className="bg-[#15131F] border border-[rgba(168,130,255,0.12)] shadow-xl p-5 flex flex-col justify-between min-h-[220px]">
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs uppercase text-[#5C5870] font-bold tracking-widest flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-accent-purple animate-pulse" />
                            {lang === 'uk' ? 'ЦЕЙ ПРИСТРІЙ (АКТИВНО)' : 'DEVICE DIAGNOSTICS (LIVE)'}
                          </h3>
                          <span className={`h-2 w-2 rounded-full ${deviceInfo.online ? 'bg-[#7DD3A8]' : 'bg-status-error'} animate-pulse`} />
                        </div>

                        <div className="space-y-2 font-mono text-[11px] text-text-secondary">
                          <div className="flex justify-between border-b border-border-accent/10 pb-1">
                            <span>ОС:</span>
                            <span className="text-text-primary font-medium">{deviceInfo.os || 'Невідомо'}</span>
                          </div>
                          <div className="flex justify-between border-b border-border-accent/10 pb-1">
                            <span>Браузер:</span>
                            <span className="text-text-primary font-medium max-w-[140px] truncate" title={deviceInfo.browser || ''}>{deviceInfo.browser || 'Невідомо'}</span>
                          </div>
                          <div className="flex justify-between border-b border-border-accent/10 pb-1">
                            <span>Процесор:</span>
                            <span className="text-accent-purple font-medium">{deviceInfo.cores ? `${deviceInfo.cores} Cores` : 'Невідомо'}</span>
                          </div>
                          {deviceInfo.memory && (
                            <div className="flex justify-between border-b border-border-accent/10 pb-1">
                              <span>ОЗУ (RAM):</span>
                              <span className="text-accent-purple font-medium">~{deviceInfo.memory} GB</span>
                            </div>
                          )}
                          {deviceInfo.gpu && (
                            <div className="flex justify-between border-b border-border-accent/10 pb-1">
                              <span>GPU:</span>
                              <span className="text-text-primary font-medium max-w-[140px] truncate" title={deviceInfo.gpu}>
                                {deviceInfo.gpu.replace(/ANGLE \((.*)\)/, '$1')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-accent/10 flex justify-between items-center text-[10px] font-mono text-text-tertiary">
                        <span>Статус: ONLINE</span>
                        <span className="text-status-success flex items-center gap-1">
                          <span className="h-1 w-1 bg-[#7DD3A8] rounded-full" />
                          {lang === 'uk' ? 'Локальне оточення' : 'Local Sandbox'}
                        </span>
                      </div>
                    </Card>
                  )}
                </div>
              );

            case 'projects':
              return (
                <div key="projects" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Projects Card */}
                  <Card className="flex flex-col justify-between" key="projects-card">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                          <Flame className="w-4 h-4 text-status-warning animate-pulse" />
                          {lang === 'uk' ? 'Активні Проєкти' : 'Active Projects'}
                        </h3>
                        <Button variant="outline" size="sm" className="!text-xs py-1 cursor-pointer" onClick={() => setModule('project-tracker')}>
                          {lang === 'uk' ? 'Всі' : 'All'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>

                      {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 px-3 border border-dashed border-border-accent/20 rounded-xl bg-hover-bg/15 text-center space-y-2.5">
                          <Flame className="w-7 h-7 text-accent-purple/60 animate-pulse" />
                          <div>
                            <p className="text-xs font-semibold text-text-primary">
                              {lang === 'uk' ? 'Видумані проєкти вилучено' : 'Mock projects removed'}
                            </p>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              {lang === 'uk' 
                                ? 'Додайте свої реальні проєкти, над якими ви працюєте зараз' 
                                : 'Add your actual real-world projects'}
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1.5 px-3 bg-accent-purple text-white cursor-pointer hover:bg-accent-purple/80 transition-all"
                            onClick={() => setModule('project-tracker')}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            {lang === 'uk' ? 'Додати свій проєкт' : 'Add Real Project'}
                          </Button>
                        </div>
                      ) : activeProjects.length === 0 ? (
                        <div className="py-6 px-3 text-center text-xs text-text-tertiary border border-dashed border-border-accent/20 rounded-xl flex flex-col items-center justify-center gap-2.5 bg-hover-bg/15">
                          <span>{lang === 'uk' ? 'Немає активних проєктів (всі завершені).' : 'All projects are completed.'}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[11px] py-1 px-3 cursor-pointer"
                            onClick={() => setModule('project-tracker')}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            {lang === 'uk' ? 'Створити новий проєкт' : 'Create new project'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeProjects.map(proj => (
                            <div 
                              key={proj.id} 
                              onClick={() => setModule('project-tracker')}
                              className="p-3 rounded-lg bg-hover-bg/30 hover:bg-hover-bg/60 border border-border-accent/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-sans font-medium text-xs text-text-primary group-hover:text-accent-purple transition-colors">
                                  {proj.name}
                                </span>
                                <Badge variant={
                                  proj.status === 'in_progress' ? 'primary' : 
                                  proj.status === 'testing' ? 'warning' : 'neutral'
                                }>
                                  {proj.status === 'in_progress' ? (lang === 'uk' ? 'В роботі' : 'Working') : 'Test'}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-text-secondary line-clamp-1 mb-2">
                                {proj.description}
                              </p>
                              <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                                <span>{lang === 'uk' ? 'Прогрес' : 'Progress'}</span>
                                <span>{proj.progress}%</span>
                              </div>
                              <div className="w-full bg-hover-bg rounded-full h-1 mt-1 overflow-hidden">
                                <div 
                                  className="bg-accent-purple h-1 animate-pulse" 
                                  style={{ width: `${proj.progress}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => setModule('project-tracker')}
                    >
                      <Plus className="w-4 h-4" /> {lang === 'uk' ? 'Додати Проєкт' : 'New Project'}
                    </Button>
                  </Card>
                </div>
              );

            case 'notes':
              return (
                <div key="notes" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Notes Card */}
                  <Card className="flex flex-col justify-between" key="notes-card">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent-purple" />
                        {lang === 'uk' ? 'Швидкі Нотатки' : 'Quick Notes'}
                      </h3>

                      <form onSubmit={handleQuickNoteSubmit} className="space-y-3">
                        <input
                          type="text"
                          placeholder={lang === 'uk' ? 'Заголовок...' : 'Title...'}
                          value={quickNoteTitle}
                          onChange={(e) => setQuickNoteTitle(e.target.value)}
                          className="w-full bg-hover-bg/40 border border-border-accent/30 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
                        />
                        <textarea
                          placeholder={lang === 'uk' ? 'Текст нотатки...' : 'Note text...'}
                          rows={3}
                          value={quickNoteText}
                          onChange={(e) => setQuickNoteText(e.target.value)}
                          className="w-full bg-hover-bg/40 border border-border-accent/30 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40 resize-none"
                        />
                        <Button type="submit" variant="primary" size="sm" className="w-full text-xs cursor-pointer">
                          {lang === 'uk' ? 'Зберегти Нотатку' : 'Save Note'}
                        </Button>
                      </form>

                      <div className="border-t border-border-accent/20 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-text-tertiary uppercase">{lang === 'uk' ? 'Останні Нотатки' : 'Recent notes'}</span>
                          <Button variant="outline" size="sm" className="!text-[10px] !py-0.5 !px-1.5 cursor-pointer" onClick={() => setModule('knowledge-base')}>
                            {lang === 'uk' ? 'Всі' : 'All'}
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          {notes.length === 0 ? (
                            <div className="py-4 text-center text-xs text-text-tertiary flex flex-col items-center justify-center gap-1.5">
                              <p className="text-[11px] text-text-tertiary text-center">
                                {lang === 'uk' ? 'Нотаток ще немає. Створи першу!' : 'No notes yet. Create your first!'}
                              </p>
                              <button type="button" onClick={() => setModule('knowledge-base')} className="text-[11px] text-accent-purple hover:underline cursor-pointer">
                                {lang === 'uk' ? '→ База знань' : '→ Knowledge base'}
                              </button>
                            </div>
                          ) : (
                            notes.slice(0, 2).map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => setModule('knowledge-base')}
                                className="flex justify-between items-center p-1.5 rounded hover:bg-hover-bg/30 cursor-pointer text-xs"
                              >
                                <span className="text-text-secondary truncate max-w-[150px]">{n.title}</span>
                                <span className="text-[9px] font-mono text-text-tertiary">
                                  {new Date(n.updatedAt).toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { month: '2-digit', day: '2-digit' })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            case 'gadgets':
              return (
                <div key="gadgets" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gadget Tracker Card */}
                  <Card className="flex flex-col justify-between" key="gadgets-card">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-accent-purple animate-pulse" />
                          {lang === 'uk' ? 'Техніка та Гаджети' : 'Tech Registry'}
                        </h3>
                        <Button variant="outline" size="sm" className="!text-xs py-1 cursor-pointer" onClick={() => setModule('gadget-inventory')}>
                          {lang === 'uk' ? 'Реєстр' : 'Register'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>

                      {activeGadgets.length === 0 ? (
                        <div className="py-8 text-center text-xs text-text-tertiary border border-dashed border-border-accent/20 rounded-xl flex flex-col items-center justify-center gap-3">
                          <span>{lang === 'uk' ? 'У вас поки немає зареєстрованих гаджетів.' : 'No devices registered.'}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[11px] py-1 px-3 cursor-pointer"
                            onClick={() => setModule('gadget-inventory')}
                          >
                            {lang === 'uk' ? 'Додати пристрій' : 'Add device'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeGadgets.map(g => (
                            <div 
                              key={g.id}
                              onClick={() => setModule('gadget-inventory')}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-hover-bg/30 border border-border-accent/20 hover:bg-hover-bg/50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="p-1.5 rounded-md bg-hover-bg text-accent-purple border border-border-accent/30 shrink-0">
                                  <HardDrive className="w-3.5 h-3.5" />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="text-xs text-text-primary font-sans font-medium truncate">{g.name}</div>
                                  <div className="text-[10px] text-text-tertiary font-mono truncate">{g.specs}</div>
                                </div>
                              </div>
                              <Badge variant={g.status === 'active' ? 'success' : 'warning'}>
                                {g.status === 'active' ? 'OK' : 'MNT'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => setModule('gadget-inventory')}
                    >
                      {lang === 'uk' ? 'Керувати Обліком' : 'Manage Register'}
                    </Button>
                  </Card>
                </div>
              );

            case 'focus':
              return (
                <div key="focus" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Focus Timer / Pomodoro Widget */}
                  <Card className="flex flex-col justify-between border-accent-purple/20 shadow-md relative overflow-hidden" key="focus-card">
                    {/* Pulsing visual halo when active */}
                    {pomoIsActive && (
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-purple/5 rounded-full blur-xl animate-pulse" />
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold tracking-tight text-text-primary flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent-purple animate-pulse" />
                          <span>{lang === 'uk' ? 'Фокус-таймер (Pomodoro)' : 'Focus Timer (Pomodoro)'}</span>
                        </h3>
                        <Badge variant={pomoMode === 'focus' ? 'primary' : 'success'}>
                          {pomoMode === 'focus' ? (lang === 'uk' ? 'ФОКУСУВАННЯ' : 'FOCUS MODE') : (lang === 'uk' ? 'ПЕРЕРВА' : 'BREAK TIME')}
                        </Badge>
                      </div>

                      <div className="py-4 text-center">
                        <div className="text-4xl font-mono font-bold tracking-tight text-text-primary">
                          {formatPomoTime()}
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-1.5 font-mono">
                          {pomoIsActive 
                            ? (lang === 'uk' ? '➔ КАНАЛ КОНЦЕНТРАЦІЇ АКТИВНИЙ' : '➔ CONCENTRATION STREAM ACTIVE')
                            : (lang === 'uk' ? '⏸️ ТАЙМЕР НА ПАУЗІ' : '⏸️ TIMER ON PAUSE')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={pomoIsActive ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={togglePomo}
                          className="w-full text-xs cursor-pointer"
                        >
                          {pomoIsActive ? (lang === 'uk' ? 'Пауза' : 'Pause') : (lang === 'uk' ? 'Запустити' : 'Start')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetPomo}
                          className="w-full text-xs cursor-pointer"
                        >
                          {lang === 'uk' ? 'Скинути' : 'Reset'}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-accent/15 mt-3 text-[9px] text-text-tertiary font-mono text-center">
                      {lang === 'uk' ? 'Рекомендовано: 25 хв фокусу / 5 хв перерви' : 'Recommendation: 25m Focus / 5m Break'}
                    </div>
                  </Card>
                </div>
              );

            case 'actions':
              return (
                <div key="actions">
                  {/* Quick Actions Hub */}
                  <Card className="p-4 bg-hover-bg/20 border border-border-accent/30" key="actions-card">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple border border-accent-purple/20">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono">
                            {lang === 'uk' ? 'Швидкий доступ до утиліт' : 'Quick Utilities Access'}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {lang === 'uk' ? 'Інструменти кодування, форматування та перетворення в один клік' : 'Formatter and tester tools ready with one click.'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                        <Button variant="secondary" size="sm" className="!text-xs cursor-pointer" onClick={() => setModule('code-tools')}>
                          JSON Форматер
                        </Button>
                        <Button variant="secondary" size="sm" className="!text-xs cursor-pointer" onClick={() => setModule('code-tools')}>
                          Regex Тестер
                        </Button>
                        <Button variant="secondary" size="sm" className="!text-xs cursor-pointer" onClick={() => setModule('code-tools')}>
                          Markdown Live
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Onboarding welcome modal */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-bg/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#0F0D1A] border border-accent-purple/40 shadow-2xl rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            {/* Visual ambient circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-900/20 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-accent-purple uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent-purple animate-pulse" />
                NEXUS Developer Workspace Onboarding
              </span>
              <button 
                onClick={completeOnboarding} 
                className="text-text-tertiary hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Content */}
            <div className="my-6 space-y-4 flex-1">
              {onboardingStep === 0 && (
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-bold text-text-primary">
                    {lang === 'uk' ? 'Вітаємо в NEXUS IDE! ⚡' : 'Welcome to NEXUS IDE! ⚡'}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lang === 'uk' 
                      ? 'NEXUS — це інтелектуальний повноцінний робочий кабінет розробника. Тут зібрано всі утиліти, які потрібні вам щодня: редактор коду з підсвіткою та live-прев\'ю, розумний асистент Gemini, система управління проєктами, термінал, нотатки та діагностика обладнання.'
                      : 'NEXUS is an intelligent, full-stack developer cabin. It embeds everything you need daily: a robust code editor with live preview, Gemini smart assistant, project tracker, offline shell emulation terminal, and tech diagnostics.'}
                  </p>
                  <p className="text-xs text-accent-purple font-mono pt-1">
                    {lang === 'uk' ? '➔ Крок 1 з 4: Початок знайомства' : '➔ Step 1 of 4: Workspace setup'}
                  </p>
                </div>
              )}

              {onboardingStep === 1 && (
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-bold text-text-primary">
                    {lang === 'uk' ? 'Редактор коду та Живий Sandbox' : 'Code Editor & Live Sandbox'}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lang === 'uk' 
                      ? 'Наш редактор підтримує багатокурсорне редагування (Alt+Click), виділення колонок (Alt+Shift+Drag), вбудовану систему порівняння Git Diff, Emmet для швидкої верстки, а також повну підтримку Vim-клавіатури (Normal/Insert/Visual режими).'
                      : 'Our editor supports multi-cursor edits (Alt+Click), column selections (Alt+Shift+Drag), built-in side-by-side Git Diff visualizer, Emmet expansions, and complete integrated Vim bindings (Normal/Insert/Visual).'}
                  </p>
                  <p className="text-xs text-accent-purple font-mono pt-1">
                    {lang === 'uk' ? '➔ Крок 2 з 4: Потужне кодування' : '➔ Step 2 of 4: Elite coding power'}
                  </p>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-bold text-text-primary">
                    {lang === 'uk' ? 'Вбудований Термінал та Python Runner' : 'Shell Terminal & Python Runner'}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lang === 'uk' 
                      ? 'Внизу розташовано Console Runner. Окрім JS, ви можете виконувати Python код у реальному часі за допомогою технології Pyodide, а також запускати вбудований псевдо-термінал із підтримкою корисних команд: help, ls, cat, calc, node.'
                      : 'Below is the Console Runner panel. Aside from Javascript, you can run native Python scripts right inside your browser using Pyodide CDN, and access a retro purple shell emulator supporting help, ls, cat, node, calc.'}
                  </p>
                  <p className="text-xs text-accent-purple font-mono pt-1">
                    {lang === 'uk' ? '➔ Крок 3 з 4: Інструменти виконання' : '➔ Step 3 of 4: Real execution engines'}
                  </p>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-bold text-text-primary">
                    {lang === 'uk' ? 'Підключення розумного ШІ' : 'Connect Smart AI Assistant'}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lang === 'uk' 
                      ? 'Для активації розумного асистента NEXUS AI (інтегрована кнопка Sparkles у верхній панелі або Ctrl + ~) обов\'язково додайте ваш Gemini API Key в меню "Налаштування". Ключ зберігається виключно локально у вашому браузері.'
                      : 'To fully unlock NEXUS AI Assistant (pulsing Sparkles button or Ctrl + ~), provide your personal Gemini API Key inside Settings. Your key is securely saved locally in your own browser localStorage.'}
                  </p>
                  <p className="text-xs text-emerald-400 font-mono pt-1">
                    {lang === 'uk' ? '➔ Крок 4 з 4: Розумний асистент готовий' : '➔ Step 4 of 4: AI enablement'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={onboardingStep === 0}
                onClick={() => setOnboardingStep(prev => Math.max(0, prev - 1))}
                className="cursor-pointer"
              >
                {lang === 'uk' ? 'Назад' : 'Back'}
              </Button>

              <div className="flex gap-1.5">
                {onboardingStep < 3 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setOnboardingStep(prev => prev + 1)}
                    className="cursor-pointer"
                  >
                    {lang === 'uk' ? 'Далі' : 'Next'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={completeOnboarding}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold cursor-pointer"
                  >
                    {lang === 'uk' ? 'Готово!' : 'Get Started!'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
