import React, { useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { MODULE_REGISTRY } from '../modules/registry';
import { useTranslation } from '../i18n/translations';
import { Terminal, ChevronLeft, ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = React.memo(() => {
  const { activeModule, setModule, settings, updateSettings, setViewMode } = useAppContext();
  const { t } = useTranslation();

  const toggleCompact = useCallback(() => {
    updateSettings({ isSidebarCompact: !settings.isSidebarCompact });
  }, [settings.isSidebarCompact, updateSettings]);

  const handleSetLanding = useCallback(() => {
    setViewMode('landing');
  }, [setViewMode]);

  const modulesList = useMemo(() => {
    return MODULE_REGISTRY.map((mod) => {
      const IconComp = mod.icon;
      const isActive = activeModule === mod.id;
      const translatedName = t(`module.${mod.id}`);

      return (
        <button
          key={mod.id}
          id={`sidebar-link-${mod.id}`}
          onClick={() => setModule(mod.id)}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer relative border ${
            isActive
              ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/25 shadow-[0_0_15px_rgba(139,92,246,0.12)]'
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/40 border-transparent'
          }`}
          title={translatedName}
        >
          {/* Highlight bar on active */}
          {isActive && (
            <span className="absolute left-0 top-3 bottom-3 w-1 bg-accent-purple rounded-r-lg" />
          )}

          <IconComp className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-accent-purple' : 'text-text-secondary'}`} />
          
          {!settings.isSidebarCompact && (
            <span className="truncate tracking-wide">{translatedName}</span>
          )}
        </button>
      );
    });
  }, [activeModule, settings.isSidebarCompact, setModule, t]);

  return (
    <aside
      id="app-sidebar"
      className={`glass-panel border-r border-border-accent/40 bg-panel-bg/85 h-screen flex flex-col justify-between transition-all duration-300 z-40 relative shrink-0 ${
        settings.isSidebarCompact ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Brand Logo */}
      <div id="sidebar-header" className="p-5 border-b border-border-accent/20 flex items-center justify-between shrink-0 h-16 bg-[#0D0B16]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-[#6D5FE0] rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--color-accent-purple-glow)] text-white shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          {!settings.isSidebarCompact && (
            <span className="font-sans font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">
              {t('app.name')}
            </span>
          )}
        </div>

        {!settings.isSidebarCompact && (
          <button
            id="sidebar-toggle-collapse"
            onClick={toggleCompact}
            className="hidden sm:block p-1 bg-hover-bg/40 border border-border-accent/10 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-bg transition-colors cursor-pointer"
            title={t('settings.sidebar_compact')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation List */}
      <nav id="sidebar-navigation" className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 pt-6">
        {modulesList}
      </nav>

      {/* 3. Footer Control Bar */}
      <div id="sidebar-footer" className="p-4 border-t border-border-accent/20 shrink-0">
        {settings.isSidebarCompact ? (
          <div className="flex flex-col gap-2">
            <button
              id="sidebar-landing-compact-btn"
              onClick={handleSetLanding}
              className="w-full flex justify-center p-2.5 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 rounded-xl text-accent-purple transition-all cursor-pointer font-mono text-[9px] font-bold"
              title={t('app.back_to_landing')}
            >
              LND
            </button>
            <button
              id="sidebar-toggle-expand"
              onClick={toggleCompact}
              className="w-full flex justify-center p-2.5 bg-hover-bg/30 hover:bg-hover-bg/70 border border-border-accent/10 rounded-xl text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              title={t('settings.sidebar_compact')}
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-[#15131F] p-3 rounded-lg border border-[rgba(168,130,255,0.08)]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#5C5870] font-bold">Storage Info</span>
                <span className="text-[10px] font-mono text-[#7DD3A8]">LOCAL</span>
              </div>
              <div className="w-full bg-[#0B0A12] h-1 rounded-full overflow-hidden">
                <div className="bg-accent-purple h-full shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>

            <button
              id="sidebar-landing-btn"
              onClick={handleSetLanding}
              className="w-full py-2 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple border border-accent-purple/20 text-[10px] font-mono rounded-lg transition-all font-bold cursor-pointer"
            >
              ➔ {t('app.back_to_landing').toUpperCase()}
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7DD3A8] animate-pulse shrink-0" />
                <span className="text-[10px] font-mono text-[#5C5870]">{t('console.status_online')}</span>
              </div>
              <span className="text-[9px] font-mono text-[#5C5870]">v1.0.5</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
});

