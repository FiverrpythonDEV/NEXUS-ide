import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { MODULE_REGISTRY } from '../modules/registry';
import { useTranslation } from '../i18n/translations';
import { useToast } from './ui/Toast';
import { VoiceControl } from './VoiceControl';
import { Search, Wifi, WifiOff, Clock, Terminal, Sparkles, FileCode, CheckSquare, Globe } from 'lucide-react';

export const Header: React.FC = React.memo(() => {
  const { activeModule, projects, settings, updateSettings } = useAppContext();
  const { t, lang } = useTranslation();
  const toast = useToast();
  
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fileCount, setFileCount] = useState(0);

  // Keep track of file counts in the system
  useEffect(() => {
    const updateFileCount = () => {
      try {
        const saved = localStorage.getItem('nexus_code_files');
        if (saved) {
          const parsed = JSON.parse(saved);
          setFileCount(parsed.length);
        } else {
          setFileCount(3); // Default standard files count
        }
      } catch {
        setFileCount(3);
      }
    };
    updateFileCount();
    window.addEventListener('storage', updateFileCount);
    const interval = setInterval(updateFileCount, 2500);
    return () => {
      window.removeEventListener('storage', updateFileCount);
      clearInterval(interval);
    };
  }, []);

  // Online/Offline Listener with Toast Notifications
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(lang === 'uk' ? 'Мережевий статус: ОНЛАЙН ⚡' : 'Network status: ONLINE ⚡');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(lang === 'uk' ? 'Мережевий статус: ОФЛАЙН ⚠️' : 'Network status: OFFLINE ⚠️');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lang, toast]);

  // Real-time Header Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short', 
      });
      const timeStr = now.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentDateStr(`${dateStr}, ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  // Programmatically trigger Command Palette (Ctrl+K) on click
  const triggerPalette = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  }, []);

  const activeModMeta = useMemo(() => {
    return MODULE_REGISTRY.find(m => m.id === activeModule);
  }, [activeModule]);

  const searchPlaceholderText = useMemo(() => {
    return lang === 'uk' 
      ? 'Швидкий пошук команд та утиліт...' 
      : 'Quick search for commands & utilities...';
  }, [lang]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter(p => p.status !== 'completed').length;
  }, [projects]);

  const toggleLanguage = useCallback(() => {
    const nextLang = lang === 'en' ? 'uk' : 'en';
    updateSettings({ language: nextLang });
    toast.info(nextLang === 'en' ? 'Language switched to English' : 'Мову змінено на Українську');
  }, [lang, updateSettings, toast]);

  return (
    <header id="app-header" className="glass-panel border-b border-border-accent/40 bg-panel-bg/75 h-16 px-6 flex items-center justify-between shrink-0 z-30 font-sans">
      
      {/* Left: Breadcrumbs / Module Indicator */}
      <div className="flex items-center gap-3 select-none">
        <span className="text-[10px] font-mono text-text-tertiary tracking-wider uppercase hidden sm:inline">
          {t('app.workspace')}
        </span>
        <span className="text-text-tertiary hidden sm:inline font-mono text-xs">/</span>
        <div className="flex items-center gap-2">
          {activeModMeta && (
            <>
              <activeModMeta.icon className="w-4 h-4 text-accent-purple" />
              <h2 className="font-sans font-semibold text-xs sm:text-sm text-text-primary tracking-tight">
                {t(`module.${activeModMeta.id}`)}
              </h2>
            </>
          )}
        </div>
      </div>

      {/* Middle: Command Palette Search Bar Trigger */}
      <div 
        id="header-search-trigger"
        onClick={triggerPalette}
        className="mx-4 flex-1 max-w-sm bg-hover-bg/30 hover:bg-hover-bg/60 border border-border-accent/40 rounded-xl px-4 py-2 flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-accent-purple/30 group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Search className="w-4 h-4 text-text-tertiary group-hover:text-accent-purple transition-colors shrink-0" />
          <span className="text-xs text-text-tertiary select-none truncate">
            {searchPlaceholderText}
          </span>
        </div>
        <span className="hidden sm:inline text-[9px] font-mono text-text-tertiary bg-hover-bg/70 px-2 py-0.5 border border-border-accent/20 rounded">
          Ctrl K
        </span>
      </div>

      {/* Right: Diagnosis Indicators & User Profile */}
      <div className="flex items-center gap-3">
        
        {/* Real Online/Offline Network Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-hover-bg/30 border border-border-accent/20 rounded-lg select-none">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wide uppercase">
                ONLINE
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-rose-500 tracking-wide uppercase">
                OFFLINE
              </span>
            </>
          )}
        </div>

        {/* Workspace Metrics: Open Files Count */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-hover-bg/25 border border-border-accent/15 rounded-lg text-text-secondary select-none text-[10px] font-mono">
          <FileCode className="w-3.5 h-3.5 text-accent-purple" />
          <span>Files: <strong className="text-text-primary">{fileCount}</strong></span>
        </div>

        {/* Workspace Metrics: Active Projects Count */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-hover-bg/25 border border-border-accent/15 rounded-lg text-text-secondary select-none text-[10px] font-mono">
          <CheckSquare className="w-3.5 h-3.5 text-accent-purple" />
          <span>Projects: <strong className="text-text-primary">{activeProjectsCount}</strong></span>
        </div>

        {/* Calendar & Clock chip */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-hover-bg/30 border border-border-accent/20 rounded-lg text-text-secondary select-none">
          <Clock className="w-3.5 h-3.5 text-accent-purple shrink-0" />
          <span className="text-[10px] font-mono uppercase tracking-wide">
            {currentDateStr}
          </span>
        </div>

        {/* Language Switcher ENG / UA */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 bg-hover-bg/30 border border-border-accent/20 hover:border-accent-purple/40 rounded-lg text-text-secondary hover:text-accent-purple transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
          title={lang === 'en' ? 'Switch to Ukrainian' : 'Перемикнути на англійську'}
        >
          <Globe className="w-3.5 h-3.5 text-accent-purple" />
          <span>{lang === 'en' ? 'ENG' : 'UA'}</span>
        </button>

        {/* Voice Control (Speech API) */}
        <VoiceControl />

        {/* Console Panel Toggle Trigger Button */}
        <button
          id="header-toggle-console"
          onClick={() => window.dispatchEvent(new Event('toggle-console-runner'))}
          className="p-2 bg-hover-bg/30 border border-border-accent/20 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-bg/70 transition-all cursor-pointer flex items-center justify-center"
          title={`${t('console.title')} (Ctrl + ~)`}
        >
          <Terminal className="w-4 h-4 text-accent-purple animate-pulse" />
        </button>

        {/* Gemini AI Assistant Drawer Toggle Trigger Button */}
        <button
          id="header-toggle-gemini"
          onClick={() => window.dispatchEvent(new Event('toggle-gemini-assistant'))}
          className="p-2 bg-hover-bg/30 border border-border-accent/20 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-bg/70 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          title={t('ai.title')}
        >
          <Sparkles className="w-4 h-4 text-accent-purple" />
        </button>

        {/* Profile Element */}
        <div className="flex items-center gap-2.5 border-l border-border-accent/20 pl-4 select-none">
          <div className="relative h-8 w-8 rounded-xl bg-accent-purple/10 border border-accent-purple/30 text-accent-purple flex items-center justify-center font-sans font-bold text-xs shrink-0">
            {(settings.userName || 'stasukilla296').charAt(0).toUpperCase()}
            {/* Online pulsing indicator */}
            <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'} ring-2 ring-panel-bg animate-pulse`} />
          </div>
          <div className="hidden xl:block text-left overflow-hidden">
            <div className="text-xs font-semibold text-text-primary leading-none truncate">
              {settings.userName || 'stasukilla296'}
            </div>
            <div className="text-[9px] font-mono text-text-tertiary mt-0.5 leading-none">
              Developer
            </div>
          </div>
        </div>

      </div>

    </header>
  );
});

