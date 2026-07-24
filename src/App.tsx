import { useEffect, useState, Suspense } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { MODULE_REGISTRY } from './modules/registry';
import { LandingPage } from './components/LandingPage';
import { ConsoleRunner } from './components/ConsoleRunner';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SetupWizard } from './components/SetupWizard';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ShortcutsModal } from './components/ShortcutsModal';
import { MatrixBackground } from './components/MatrixBackground';

function hexToRgb(hex: string) {
  if (!hex) return { r: 139, g: 92, b: 246 };
  const namedColors: Record<string, string> = {
    purple: '#8B5CF6',
    violet: '#7C3AED',
    fuchsia: '#D946EF',
    indigo: '#6366F1',
  };
  const targetHex = namedColors[hex] || hex;
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = targetHex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 139, g: 92, b: 246 };
}

function AppContent() {
  const { activeModule, settings, viewMode } = useAppContext();
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(() => {
    return localStorage.getItem('nexus_onboarded') === 'true';
  });

  // Load global keyboard shortcuts
  useKeyboardShortcuts();

  // Load Google Fonts dynamically
  useEffect(() => {
    const fontId = 'dynamic-google-fonts';
    let link = document.getElementById(fontId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const sansStr = encodeURIComponent(settings.interfaceFont || 'Inter');
    const monoStr = encodeURIComponent(settings.codeFont || 'JetBrains Mono');
    link.href = `https://fonts.googleapis.com/css2?family=${sansStr}:wght@300;400;500;600;700&family=${monoStr}:wght@400;500;600;700&display=swap`;
  }, [settings.interfaceFont, settings.codeFont]);

  // Root style binding for real-time accent customization
  useEffect(() => {
    const root = document.documentElement;
    const { r, g, b } = hexToRgb(settings.accentColor);
    const glowOpacity = (settings.neonIntensity ?? 50) / 200; // max 0.5 opacity
    
    root.style.setProperty('--color-accent-purple', `rgb(${r}, ${g}, ${b})`);
    root.style.setProperty('--color-accent-purple-glow', `rgba(${r}, ${g}, ${b}, ${glowOpacity})`);
    
    // Border Radius
    root.style.setProperty('--ui-border-radius', `${settings.borderRadius ?? 12}px`);
    
    // Density settings
    const paddingVal = settings.density === 'compact' ? '8px' : settings.density === 'spacious' ? '24px' : '16px';
    const gapVal = settings.density === 'compact' ? '8px' : settings.density === 'spacious' ? '24px' : '16px';
    root.style.setProperty('--ui-density-padding', paddingVal);
    root.style.setProperty('--ui-density-gap', gapVal);

    // Font family bindings
    root.style.setProperty('--ui-font-sans', `"${settings.interfaceFont || 'Inter'}", sans-serif`);
    root.style.setProperty('--ui-font-mono', `"${settings.codeFont || 'JetBrains Mono'}", monospace`);

    // Glassmorphism & border opacity
    root.style.setProperty('--ui-backdrop-blur', `${settings.backdropBlur ?? 12}px`);
    root.style.setProperty('--ui-border-opacity', `${(settings.cardBorderOpacity ?? 20) / 100}`);
  }, [
    settings.accentColor,
    settings.neonIntensity,
    settings.borderRadius,
    settings.density,
    settings.interfaceFont,
    settings.codeFont,
    settings.backdropBlur,
    settings.cardBorderOpacity
  ]);

  // Auto-theme (Dark/Light/System)
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.themeMode || 'dark';

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.remove('light');
      } else {
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [settings.themeMode]);

  // Global custom event listeners for panels
  useEffect(() => {
    const handleToggleConsole = () => setIsConsoleOpen(prev => !prev);
    const handleToggleAi = () => setIsAiOpen(prev => !prev);

    window.addEventListener('toggle-console-runner', handleToggleConsole);
    window.addEventListener('toggle-gemini-assistant', handleToggleAi);

    return () => {
      window.removeEventListener('toggle-console-runner', handleToggleConsole);
      window.removeEventListener('toggle-gemini-assistant', handleToggleAi);
    };
  }, []);

  if (!isOnboarded) {
    return <SetupWizard onComplete={() => setIsOnboarded(true)} />;
  }

  if (viewMode === 'landing') {
    return <LandingPage />;
  }

  const activeModMeta = MODULE_REGISTRY.find((m) => m.id === activeModule);
  const ActiveComponent = activeModMeta ? activeModMeta.component : () => null;

  const bgClass = 
    settings.bgTexture === 'clean' 
      ? 'bg-mesh-clean' 
      : settings.bgTexture === 'noise' 
        ? 'bg-mesh-noise' 
        : 'bg-mesh-gradient';

  const rowDirection = settings.sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row';

  const liquidGlassClass = settings.liquidGlassMode ? 'liquid-glass' : '';

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-base-bg text-text-primary ${bgClass} ${rowDirection} ${liquidGlassClass} relative`}>
      {/* Live Custom CSS Injector */}
      {settings.customCss && <style id="nexus-custom-css">{settings.customCss}</style>}

      {/* Custom Image Wallpaper */}
      {settings.customWallpaper && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 transition-all duration-500"
            style={{
              backgroundImage: `url(${settings.customWallpaper})`,
              filter: `blur(${settings.customWallpaperBlur ?? 5}px)`,
            }}
          />
          <div
            className="absolute inset-0 bg-[#0B0A12]"
            style={{ opacity: (settings.customWallpaperDim ?? 40) / 100 }}
          />
        </div>
      )}

      {/* Matrix Digital Rain Animation */}
      {settings.matrixRainEffect && <MatrixBackground />}

      {/* Decorative Background Glows */}
      {!settings.customWallpaper && settings.bgTexture !== 'clean' && (
        <>
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent-purple opacity-[0.03] rounded-full blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#6D5FE0] opacity-[0.02] rounded-full blur-[100px] pointer-events-none z-0"></div>
        </>
      )}

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0D0B16]/20 z-10">
        {/* Header toolbar */}
        <Header />

        {/* Dynamic active workspace panel view */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full gap-3.5">
              <div className="w-8 h-8 rounded-full border-2 border-accent-purple/30 border-t-accent-purple animate-spin" />
              <span className="text-xs text-text-secondary animate-pulse">Завантаження модуля...</span>
            </div>
          }>
            <ActiveComponent />
          </Suspense>
        </main>
      </div>

      {/* Global overlay panels */}
      <CommandPalette />
      <ShortcutsModal />
      
      {/* Dynamic bottom Console Runner panel */}
      <ConsoleRunner isOpen={isConsoleOpen} onClose={() => setIsConsoleOpen(false)} />

      {/* Dynamic right sliding Gemini AI Assistant drawer */}
      <GeminiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
