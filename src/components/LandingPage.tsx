import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Cpu, 
  Battery, 
  Shield, 
  Download, 
  ArrowRight, 
  Sparkles, 
  Code2, 
  Layers, 
  BookOpen, 
  HardDrive, 
  Braces, 
  LayoutDashboard, 
  ExternalLink, 
  Github, 
  Check, 
  X, 
  Menu,
  ChevronRight,
  ShieldCheck,
  Terminal,
  Activity,
  Zap,
  Apple,
  Laptop,
  Globe
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getDesktopAppData, launchDesktopWindowMode } from '../utils/downloadDesktopApp';

// Custom SVG silhouettes for OS logos
const WindowsLogoSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const AppleLogoSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
  </svg>
);

const LinuxLogoSVG: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C9.5 2 8 3.8 8 6.5c0 .6.1 1.2.3 1.7C7.3 9.4 6.5 11 6.5 13c0 2.5.8 4.2 1.5 5l-.5.5c-.6.6-.4 1.5.5 1.5 2.2 0 4-.5 4-.5s1.8.5 4 .5c.9 0 1.1-.9.5-1.5l-.5-.5c.7-.8 1.5-2.5 1.5-5 0-2-.8-3.6-1.8-4.8.2-.5.3-1.1.3-1.7C16 3.8 14.5 2 12 2zm-2.5 5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm5 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm-2.5 5.5c1.4 0 2 .5 2 .5s-.5.8-2 .8-2-.8-2-.8.6-.5 2-.5z" />
  </svg>
);

// Simple Custom Fade In Up on Scroll component
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: string }> = ({ children, delay = '0ms' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once it's visible, we don't need to observe it anymore
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const current = domRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: delay }}
      className={`transition-all duration-1000 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { setViewMode, settings, updateSettings } = useAppContext();
  const isEn = settings.language === 'en';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  // OS Detection & Download Section State
  const [detectedOS, setDetectedOS] = useState<'windows' | 'macos' | 'linux' | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const userAgentData = (window.navigator as any).userAgentData;
      
      let platform = '';
      if (userAgentData && userAgentData.platform) {
        platform = userAgentData.platform.toLowerCase();
      }
      
      if (platform.includes('win') || userAgent.includes('win')) {
        setDetectedOS('windows');
      } else if (platform.includes('mac') || userAgent.includes('mac') || userAgent.includes('os x') || userAgent.includes('ipad') || userAgent.includes('iphone')) {
        setDetectedOS('macos');
      } else if (platform.includes('linux') || userAgent.includes('linux')) {
        setDetectedOS('linux');
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDownloadModalOpen(false);
      }
    };
    if (isDownloadModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadModalOpen]);

  const osConfig = {
    windows: {
      name: 'Windows',
      requirements: isEn ? 'Windows 10/11, 64-bit' : 'Windows 10/11, 64-біт',
      logo: WindowsLogoSVG,
    },
    macos: {
      name: 'macOS',
      requirements: 'macOS 12+',
      logo: AppleLogoSVG,
    },
    linux: {
      name: 'Linux',
      requirements: isEn 
        ? 'Script / AppImage, no installation required' 
        : 'Скрипт / AppImage, не потребує встановлення',
      logo: LinuxLogoSVG,
    },
  };

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    setIsAppInstalled(isStandalone);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isAppInstalled) {
      setViewMode('app');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownload = (platform: 'windows' | 'macos' | 'linux' | 'universal') => {
    setIsDownloadModalOpen(false);
    const data = getDesktopAppData(platform);
    const link = document.createElement('a');
    link.href = data.dataUri;
    link.download = data.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#0B0A12] text-[#EDEBF5] font-sans overflow-x-hidden selection:bg-accent-purple/30 selection:text-[#EDEBF5] relative">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#A855F7] opacity-[0.05] rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-[#6D5FE0] opacity-[0.04] rounded-full blur-[180px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[15%] left-[5%] w-[550px] h-[550px] bg-[#A855F7] opacity-[0.03] rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* 1. Header (Sticky & Transparent Blur) */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#0B0A12]/70 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-9 w-9 bg-accent-purple/10 border border-accent-purple/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Code2 className="w-5 h-5 text-accent-purple" />
            </div>
            <span className="font-sans font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-accent-purple to-text-primary">
              NEXUS
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide">
            <button onClick={() => scrollToSection('features')} className="text-[#8B879E] hover:text-[#EDEBF5] transition-colors cursor-pointer">
              {isEn ? 'Features' : 'Можливості'}
            </button>
            <button onClick={() => scrollToSection('workflow')} className="text-[#8B879E] hover:text-[#EDEBF5] transition-colors cursor-pointer">
              {isEn ? 'How It Works' : 'Як це працює'}
            </button>
            <button onClick={() => scrollToSection('privacy')} className="text-[#8B879E] hover:text-[#EDEBF5] transition-colors cursor-pointer">
              {isEn ? 'Privacy' : 'Приватність'}
            </button>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* ENG / UA Language Switcher */}
            <button
              onClick={() => updateSettings({ language: isEn ? 'uk' : 'en' })}
              className="px-2.5 py-1.5 text-xs font-mono font-bold text-accent-purple bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)]"
              title={isEn ? 'Switch to Ukrainian' : 'Перемикнути на англійську'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isEn ? 'ENG' : 'UA'}</span>
            </button>

            <button 
              onClick={() => setViewMode('app')}
              className="text-xs font-mono font-medium text-[#8B879E] hover:text-[#EDEBF5] px-3 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer"
            >
              {isEn ? 'Launch Web ➔' : 'Запустити Web ➔'}
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 text-xs font-semibold bg-accent-purple hover:bg-[#9333EA] text-[#EDEBF5] rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:shadow-[0_0_22px_rgba(168,85,247,0.55)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              {isAppInstalled ? (isEn ? 'Open' : 'Відкрити') : (isEn ? 'Install' : 'Встановити')}
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 text-[#8B879E] hover:text-[#EDEBF5] transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-b border-white/[0.04] bg-[#0D0B16] px-6 py-5 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-xs font-mono text-[#8B879E]">{isEn ? 'Interface Language:' : 'Мова інтерфейсу:'}</span>
              <button
                onClick={() => updateSettings({ language: isEn ? 'uk' : 'en' })}
                className="px-3 py-1 text-xs font-mono font-bold text-accent-purple bg-accent-purple/10 border border-accent-purple/30 rounded-lg flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isEn ? 'ENG (English)' : 'UA (Українська)'}</span>
              </button>
            </div>
            <button 
              onClick={() => scrollToSection('features')} 
              className="block w-full text-left text-sm text-[#8B879E] hover:text-[#EDEBF5] py-1"
            >
              {isEn ? 'Features' : 'Можливості'}
            </button>
            <button 
              onClick={() => scrollToSection('workflow')} 
              className="block w-full text-left text-sm text-[#8B879E] hover:text-[#EDEBF5] py-1"
            >
              {isEn ? 'How It Works' : 'Як це працює'}
            </button>
            <button 
              onClick={() => scrollToSection('privacy')} 
              className="block w-full text-left text-sm text-[#8B879E] hover:text-[#EDEBF5] py-1"
            >
              {isEn ? 'Privacy' : 'Приватність'}
            </button>
            <div className="pt-3 border-t border-white/[0.03] flex flex-col gap-3">
              <button 
                onClick={() => { setIsMenuOpen(false); setViewMode('app'); }}
                className="w-full text-center py-2 text-xs font-mono font-medium text-[#8B879E] hover:text-[#EDEBF5] bg-white/[0.02] rounded-lg"
              >
                {isEn ? 'Launch Web App' : 'Запустити Web-версію'}
              </button>
              <button 
                onClick={(e) => { setIsMenuOpen(false); handleInstallClick(e); }}
                className="w-full text-center py-2.5 text-xs font-semibold bg-accent-purple text-white rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {isAppInstalled ? (isEn ? 'Open NEXUS' : 'Відкрити NEXUS') : (isEn ? 'Install NEXUS' : 'Встановити NEXUS')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero-секція */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-5 text-left space-y-6">
            
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-purple font-bold">
                {isEn ? 'RELEASE v1.0.4 PRIVATE DASHBOARD' : 'РЕЛІЗ v1.0.4 ПРИВАТНИЙ ДАШБОРД'}
              </span>
            </div>

            <h1 className="font-sans font-extrabold text-3xl sm:text-4xl xl:text-5xl tracking-tight leading-[1.1] text-[#EDEBF5]">
              {isEn ? 'Your developer workspace.' : 'Твій робочий простір розробника.'} <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-[#C084FC]">
                {isEn ? 'All in one app.' : 'В одному застосунку.'}
              </span>
            </h1>

            <p className="text-sm md:text-base text-[#8B879E] leading-relaxed max-w-lg">
              {isEn 
                ? 'NEXUS combines critical developer tools, Kanban boards with GitHub sync, code editor, and knowledge base in a single, premium local PWA environment.'
                : 'NEXUS об’єднує критично важливі утиліти, канбан-дошки із синхронізацією GitHub, редактор коду та базу знань в єдиному, преміальному локальному PWA-середовищі розробника.'}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3.5 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3.5 text-xs font-semibold bg-accent-purple hover:bg-[#9333EA] text-white rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_30px_rgba(168,85,247,0.55)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isEn ? 'Download NEXUS' : 'Завантажити NEXUS'}</span>
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="flex items-center gap-1.5 px-5 py-3.5 text-xs font-semibold bg-white/[0.03] hover:bg-white/[0.07] text-[#EDEBF5] border border-white/[0.06] rounded-xl transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Explore Features' : 'Переглянути можливості'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8B879E]" />
                </button>
              </div>

              {/* Requirement indication */}
              <div className="text-[11px] font-mono text-[#8B879E]">
                <span className="text-[#5C5870] font-bold">{isEn ? 'PLATFORMS:' : 'ПЛАТФОРМИ:'}</span> Windows • macOS • Linux
              </div>
            </div>


            {/* Platform labels */}
            <div className="pt-4 flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-[#5C5870] uppercase">{isEn ? 'Supported:' : 'Підтримується:'}</span>
              <div className="flex flex-wrap gap-1.5">
                {['Chrome', 'Safari', 'iOS', 'Android', 'Windows/macOS', isEn ? 'Free' : 'Безкоштовно'].map((os, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 rounded bg-[#15131F] border border-white/[0.04] text-[9px] font-mono text-[#8B879E]"
                  >
                    {os}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Interface Mockup (Beautiful CSS/SVG composition) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-2xl bg-[#0F0D1A]/80 border border-white/[0.07] rounded-xl shadow-[0_20px_50px_rgba(11,10,18,0.8),0_0_30px_rgba(168,85,247,0.06)] overflow-hidden">
              
              {/* MacOS window top panel */}
              <div className="h-10 bg-[#0A0910] border-b border-white/[0.05] px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/40" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/40" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]/40" />
                </div>
                {/* Search Bar Placeholder */}
                <div className="w-64 h-5.5 bg-[#15131F]/90 border border-white/[0.04] rounded-md flex items-center justify-center text-[9px] font-mono text-[#5C5870] gap-1">
                  <Terminal className="w-3 h-3 text-[#5C5870]" />
                  nexus-station://workspace
                </div>
                <div className="w-10" />
              </div>

              {/* Main Visualized Desktop Layout */}
              <div className="h-80 md:h-[380px] flex bg-[#0D0B16]/90 p-4 gap-4 relative overflow-hidden">
                
                {/* Simulated Sidebar */}
                <div className="w-12 md:w-16 bg-[#12101F]/40 border border-white/[0.04] rounded-lg p-2 flex flex-col items-center gap-4 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-accent-purple" />
                  </div>
                  <div className="w-full h-[1px] bg-white/[0.04]" />
                  {/* Sidebar icons placeholders */}
                  <div className="space-y-3">
                    <div className="w-7 h-7 rounded-md bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center"><LayoutDashboard className="w-3.5 h-3.5 text-accent-purple" /></div>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"><Braces className="w-3.5 h-3.5 text-[#5C5870]" /></div>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-[#5C5870]" /></div>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"><HardDrive className="w-3.5 h-3.5 text-[#5C5870]" /></div>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-[#5C5870]" /></div>
                  </div>
                </div>

                {/* Dashboard grid preview */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  
                  {/* Top Bar with System diagnostics */}
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3A8] animate-pulse" />
                      <span className="text-[9px] font-mono text-[#7DD3A8]">SYSTEM_ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1"><Cpu className="w-3 h-3 text-[#5C5870]" /><span className="text-[8px] font-mono text-[#8B879E]">2.4%</span></div>
                      <div className="flex items-center gap-1"><Battery className="w-3 h-3 text-[#5C5870]" /><span className="text-[8px] font-mono text-[#8B879E]">88%</span></div>
                    </div>
                  </div>

                  {/* Cards composition */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    
                    {/* Monaco Code view block */}
                    <div className="bg-[#12101F]/80 border border-white/[0.05] rounded-lg p-3 flex flex-col justify-between overflow-hidden relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-mono text-accent-purple font-semibold">index.ts</span>
                        <span className="text-[7px] font-mono text-[#5C5870]">TSX</span>
                      </div>
                      <div className="font-mono text-[8px] text-[#8B879E] space-y-1 overflow-hidden leading-normal">
                        <div><span className="text-accent-purple">import</span> {'{ GoogleGenAI }'} <span className="text-accent-purple">from</span> <span className="text-[#7DD3A8]">"@google/genai"</span>;</div>
                        <div><span className="text-accent-purple">const</span> <span className="text-blue-400">ai</span> = <span className="text-accent-purple">new</span> <span className="text-amber-400">GoogleGenAI</span>();</div>
                        <div><span className="text-[#5C5870]">// Initialize station</span></div>
                        <div><span className="text-accent-purple">await</span> <span className="text-blue-400">ai</span>.<span className="text-blue-300">connect</span>();</div>
                      </div>
                      {/* Glow inside */}
                      <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-accent-purple/10 rounded-full blur-md" />
                    </div>

                    {/* Tech Inventory block */}
                    <div className="bg-[#12101F]/80 border border-white/[0.05] rounded-lg p-3 flex flex-col gap-2 justify-between">
                      <span className="text-[8px] font-mono text-[#8B879E] font-semibold uppercase tracking-wider">{isEn ? 'Hardware' : 'Гаджети'}</span>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[8px]">
                          <span className="text-[#8B879E] flex items-center gap-1">💻 MacBook Pro</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#7DD3A8] text-[6px]">{isEn ? 'Active' : 'Активний'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[8px]">
                          <span className="text-[#8B879E] flex items-center gap-1">📱 iPad Air</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#7DD3A8] text-[6px]">{isEn ? 'Active' : 'Активний'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[8px]">
                          <span className="text-[#8B879E] flex items-center gap-1">🔌 Dell 27"</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[6px]">{isEn ? 'In Repair' : 'В ремонті'}</span>
                        </div>
                      </div>

                      <div className="w-full bg-[#0B0A12] h-1 rounded-full overflow-hidden">
                        <div className="bg-accent-purple h-full" style={{ width: '70%' }} />
                      </div>
                    </div>

                    {/* Progress Chart block */}
                    <div className="col-span-2 bg-[#12101F]/80 border border-white/[0.05] rounded-lg p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[8px]">
                        <span className="text-[#8B879E] font-medium font-mono">ACTIVITY_METRIC</span>
                        <span className="text-[#7DD3A8] font-mono flex items-center gap-0.5">
                          <Activity className="w-2.5 h-2.5" /> +14.2%
                        </span>
                      </div>
                      
                      {/* Beautiful Fake Graph lines */}
                      <div className="h-10 flex items-end gap-1.5 pt-2">
                        {[25, 45, 30, 60, 50, 85, 40, 75, 90, 65, 80, 100].map((h, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${h}%` }} 
                            className="flex-1 bg-gradient-to-t from-accent-purple/30 to-accent-purple rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.15)] transition-all duration-500"
                          />
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Секція "Можливості" (Bento Grid) */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/[0.03]">
        
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="font-mono text-xs text-accent-purple uppercase tracking-widest font-bold">
              {isEn ? 'MODULAR ECOSYSTEM' : 'МОДУЛЬНА ЕКОСИСТЕМА'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {isEn ? 'Built by developers' : 'Створено розробниками'} <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-[#C084FC]">
                {isEn ? 'for your productivity' : 'для твоєї продуктивності'}
              </span>
            </h2>
            <p className="text-[#8B879E] text-xs sm:text-sm">
              {isEn 
                ? 'Every NEXUS feature is integrated into a unified desktop station. Choose what you need and manage code and tasks easily.'
                : 'Кожна функція NEXUS інтегрована в єдиний робочий стіл. Вибирайте потрібне та керуйте кодом і задачами набагато простіше.'}
            </p>
          </div>
        </ScrollReveal>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          
          {/* Card 1: Dashboard */}
          <div className="md:col-span-3 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center justify-center text-accent-purple group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  {isEn ? 'Dashboard Station' : 'Дашборд Станція'}
                  <span className="px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple font-mono text-[9px]">
                    {isEn ? 'Station' : 'Станція'}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Overview of your digital workspace. Track project progress, computer system diagnostics, keep quick scratchpad notes, and stay up-to-date with fresh tech news.'
                    : 'Загальний огляд вашого цифрового робочого простору. Відстежуйте прогрес проєктів, системну діагностику комп’ютера, тримайте під рукою швидкі нотатки та будьте в курсі свіжих технологічних новин через інтегрований фід.'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 border-t border-white/[0.04] pt-4 flex items-center justify-between text-[11px] font-mono text-[#5C5870]">
              <span>{isEn ? '➔ News & System metrics' : '➔ Новини та системні метрики'}</span>
              <span>{isEn ? 'Offline-First' : 'Працює Offline-First'}</span>
            </div>
          </div>

          {/* Card 2: Dev Tools Hub */}
          <div className="md:col-span-3 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl flex items-center justify-center text-[#7C3AED] group-hover:scale-110 transition-transform">
                <Braces className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  Dev Tools Hub
                  <span className="px-1.5 py-0.5 rounded bg-[#7C3AED]/10 text-[#7C3AED] font-mono text-[9px]">6-in-1</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#8B879E] leading-relaxed">
                  {isEn 
                    ? 'Powerful developer toolkit always at hand. Includes 6 full utilities: JSON Formatter, Regex Tester, Palette Generator, SHA-256 Hasher, Headers Inspector, and Converters.'
                    : 'Потужна добірка інструментів розробника завжди під рукою. Складається з шести повноцінних утиліт: JSON форматер, Regex-тестер для регулярних виразів, генератор колірних палітр, хеш-генератор (SHA-256), інспектор заголовків та корисні конвертери.'}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/[0.04] pt-4 flex items-center justify-between text-[11px] font-mono text-[#5C5870]">
              <span>➔ JSON, Regex, Palettes, Hashes</span>
              <span>{isEn ? 'Unlimited' : 'Безлімітно'}</span>
            </div>
          </div>

          {/* Card 3: Monaco Editor */}
          <div className="md:col-span-2 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{isEn ? 'Monaco Code Editor' : 'Редактор Monaco'}</h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Built-in code editor powered by Monaco engine (same as VS Code). Supports instant auto-save, syntax highlighting (JS, TS, Python, HTML, CSS) and project attachments.'
                    : 'Вбудований професійний редактор коду на базі рушія Monaco (як у VS Code). Підтримує миттєве автозбереження, перемикання мов підсвітки (JavaScript, TS, Python, HTML, CSS) та прив’язку файлів до ваших проєктів.'}
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/[0.04] pt-4 text-[10px] font-mono text-blue-400">
              ⚡ {isEn ? 'Auto-save enabled' : 'Автозбереження активоване'}
            </div>
          </div>

          {/* Card 4: Kanban Projects */}
          <div className="md:col-span-2 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{isEn ? 'Kanban Projects' : 'Канбан-проєкти'}</h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Visual task manager. Create project cards, drag & drop through stages (Idea ➔ In Progress ➔ Testing ➔ Done), and connect public GitHub repos in 1 click.'
                    : 'Візуальний менеджер задач. Створюйте проєктні картки, ведіть їх по стадіях (Ідея ➔ В процесі ➔ Тестування ➔ Готово) за допомогою drag-and-drop та підключайте публічні репозиторії з вашого профілю GitHub за 1 клік.'}
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/[0.04] pt-4 text-[10px] font-mono text-emerald-400">
              🔗 {isEn ? 'GitHub API integration' : 'GitHub API інтеграція'}
            </div>
          </div>

          {/* Card 5: Hardware Catalog */}
          <div className="md:col-span-2 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{isEn ? 'Hardware Inventory' : 'Каталог техніки'}</h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Hardware accounting system. Automatically detects developer system specs (browser, OS, battery, GPU) and lets you catalogue your devices & monitors.'
                    : 'Інтелектуальна система обліку залізяччя. Застосунок автоматично аналізує характеристики пристрою розробника (браузер, ОС, батарея, GPU) та дозволяє зручно каталогізувати власну техніку, монітори та інвентар.'}
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/[0.04] pt-4 text-[10px] font-mono text-amber-400">
              🔋 Auto-diagnostics & Hardware tracking
            </div>
          </div>

          {/* Card 6: Obsidian Knowledge Base */}
          <div className="md:col-span-6 group bg-[#12101F]/30 border border-white/[0.04] hover:border-accent-purple/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="h-10 w-10 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  {isEn ? 'Obsidian-Style Knowledge Base' : 'База знань у стилі Obsidian'}
                  <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-400 font-mono text-[9px]">Markdown</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Full local notepad with Markdown syntax support, live real-time preview, flexible color tags for categorization, and instant search across all your entries.'
                    : 'Повноцінний локальний блокнот із підтримкою Markdown синтаксису, зручним рендерингом у реальному часі, гнучкою системою кольорових тегів для категоризації та миттєвим пошуком по всьому масиву ваших записів.'}
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 bg-[#1A1829] border border-white/[0.05] p-4 rounded-xl font-mono text-[11px] text-[#8B879E]">
              <div className="text-accent-purple mb-1 font-bold"># Obsidian Notes</div>
              <div>- Live Markdown rendering</div>
              <div>- Global tag search</div>
              <div>- Fast state caching</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Секція "Як це працює" (3 кроки) */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/[0.03]">
        
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="font-mono text-xs text-accent-purple uppercase tracking-widest font-bold">
              {isEn ? 'EASY START' : 'ЛЕГКИЙ СТАРТ'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {isEn ? 'Three steps to' : 'Три кроки до'} <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-[#C084FC]">
                {isEn ? 'your ideal workspace' : 'ідеального робочого місця'}
              </span>
            </h2>
            <p className="text-[#8B879E] text-xs sm:text-sm">
              {isEn 
                ? 'No complicated settings, complex server configs, or databases required. Start working right away.'
                : 'Ніяких заплутаних налаштувань, складних серверних конфігурацій чи баз даних. Починайте працювати одразу.'}
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line (Desktop only) */}
          <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-accent-purple/20 via-accent-purple to-accent-purple/20 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="h-20 w-20 rounded-full bg-[#0F0D1A] border-2 border-accent-purple flex items-center justify-center text-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-105 transition-transform">
                <Download className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <span className="text-[10px] font-mono text-accent-purple uppercase tracking-wider font-bold">
                  {isEn ? 'Step 1' : 'Крок 1'}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {isEn ? 'Install the App' : 'Встанови застосунок'}
                </h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Install NEXUS directly in your browser with one click. It will be accessible on your desktop or home screen.'
                    : 'Встановіть NEXUS прямо у вашому браузері за один клік. Він буде доступний на робочому столі або домашньому екрані.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="h-20 w-20 rounded-full bg-[#0F0D1A] border-2 border-accent-purple flex items-center justify-center text-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-105 transition-transform">
                <Github className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <span className="text-[10px] font-mono text-accent-purple uppercase tracking-wider font-bold">
                  {isEn ? 'Step 2' : 'Крок 2'}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {isEn ? 'Connect Your Data' : 'Підключи свої дані'}
                </h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Enter your GitHub username to pull repositories and create local Markdown files.'
                    : 'Введіть свій GitHub-username для підтягування репозиторіїв та створюйте локальні Markdown файли.'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="h-20 w-20 rounded-full bg-[#0F0D1A] border-2 border-accent-purple flex items-center justify-center text-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <span className="text-[10px] font-mono text-accent-purple uppercase tracking-wider font-bold">
                  {isEn ? 'Step 3' : 'Крок 3'}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {isEn ? 'Work Privately' : 'Працюй приватно'}
                </h3>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'Work at your own pace. All your data stays completely under your control on your local drive.'
                    : 'Працюйте у власному темпі. Усі ваші дані залишаються повністю під вашим контролем на локальному диску.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Секція "Приватність" */}
      <section id="privacy" className="py-20 max-w-5xl mx-auto px-6 relative z-10 border-t border-white/[0.03]">
        <div className="bg-gradient-to-r from-[#12101F]/80 to-[#1C182E]/50 border border-white/[0.05] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 shadow-[0_20px_40px_rgba(11,10,18,0.6)]">
          
          <div className="h-20 w-20 shrink-0 bg-accent-purple/10 border border-accent-purple/20 rounded-2xl flex items-center justify-center text-accent-purple">
            <Shield className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
              100% OFFLINE FIRST
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEn ? 'Your privacy is our top priority' : 'Ваша приватність — наш головний пріоритет'}
            </h3>
            <p className="text-xs sm:text-sm text-[#8B879E] leading-relaxed">
              {isEn
                ? 'All NEXUS data (notes, hardware inventory, Monaco editor settings, snippets) is saved strictly in your browser or computer local storage. The app has no remote tracking servers and never transfers your private data to third parties.'
                : 'Усі дані NEXUS (нотатки, додана техніка, конфігурації Monaco-редактора, замітки) зберігаються виключно в локальному сховищі вашого браузера або комп\'ютера. Застосунок не має віддалених серверів для трекінгу і ніколи не передає ваші приватні дані стороннім особам чи сервісам.'}
            </p>
          </div>

        </div>
      </section>

      {/* 6. Фінальна CTA-секція */}
      <section className="py-24 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/[0.03]">
        <div className="text-center space-y-8 max-w-3xl mx-auto py-12 rounded-3xl bg-radial from-accent-purple/[0.08] to-transparent relative overflow-hidden">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20">
            <Sparkles className="w-4 h-4 text-accent-purple" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent-purple font-bold">
              {isEn ? 'NEW DASHBOARD STANDARD' : 'НОВИЙ СТАНДАРТ ДАШБОРДІВ'}
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {isEn ? 'Ready to maximize your' : 'Готовий вивести свій'} <br className="hidden sm:inline"/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple to-[#C084FC]">
              {isEn ? 'workflow to the limit?' : 'робочий процес на максимум?'}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-[#8B879E] leading-relaxed max-w-lg mx-auto">
            {isEn
              ? 'Get total control over your tools, notes, and repositories in one sleek neon hub.'
              : 'Отримайте повний контроль над своїми інструментами, нотатками та репозиторіями в одному розкішному неоновому хабі.'}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-xs font-semibold bg-accent-purple hover:bg-[#9333EA] text-white rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Download NEXUS' : 'Завантажити NEXUS'}</span>
              </button>

              <button
                onClick={() => setViewMode('app')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-xs font-mono font-medium bg-white/[0.03] hover:bg-white/[0.07] text-[#EDEBF5] border border-white/[0.06] rounded-xl transition-all cursor-pointer"
              >
                <span>{isEn ? 'Launch Web Version' : 'Запустити Web-версію'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B879E]" />
              </button>
            </div>

            {/* Platform indication */}
            <div className="space-y-1 text-center">
              <div className="text-[11px] font-mono text-[#8B879E]">
                <span className="text-[#5C5870] font-bold">{isEn ? 'PLATFORMS:' : 'ПЛАТФОРМИ:'}</span> Windows • macOS • Linux
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-[#5C5870]">
            {isEn ? 'Version 1.0.4 • MIT License • Open Source' : 'Версія 1.0.4 • Ліцензія MIT • Відкритий код'}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[#08070F] border-t border-white/[0.04] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-accent-purple/10 border border-accent-purple/20 rounded-lg flex items-center justify-center">
                <Code2 className="w-4 h-4 text-accent-purple" />
              </div>
              <span className="font-sans font-extrabold text-base tracking-wider text-white">NEXUS</span>
            </div>
            <p className="text-xs text-[#8B879E]">
              {isEn 
                ? 'Personal developer command center and dashboard. All tools in a single solution.'
                : 'Персональний командний центр та дашборд розробника. Усі інструменти в єдиному рішенні.'}
            </p>
          </div>

          <div className="md:col-span-5 flex flex-wrap gap-x-8 gap-y-2 text-xs text-[#8B879E]">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
              {isEn ? 'Features' : 'Можливості'}
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-colors cursor-pointer">
              {isEn ? 'How It Works' : 'Як це працює'}
            </button>
            <button onClick={() => scrollToSection('privacy')} className="hover:text-white transition-colors cursor-pointer">
              {isEn ? 'Privacy' : 'Приватність'}
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          <div className="md:col-span-3 text-left md:text-right font-mono text-[10px] text-[#5C5870] space-y-1">
            <div>© {new Date().getFullYear()} NEXUS Station.</div>
            <div>{isEn ? 'Created for developers of the future.' : 'Створено для розробників майбутнього.'}</div>
          </div>

        </div>
      </footer>

      {/* Beautiful Modal: PWA Install instructions */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          
          <div className="w-full max-w-md bg-[#0F0D1A] border border-white/[0.08] rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative">
            
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#8B879E] hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center justify-center text-accent-purple animate-pulse">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {isEn ? 'Installing NEXUS PWA' : 'Встановлення NEXUS PWA'}
                </h3>
                <span className="text-[9px] font-mono text-accent-purple font-bold">
                  {isEn ? 'OFFLINE SUPPORT & CACHING ENABLED' : 'ОФЛАЙН-ПІДТРИМКА ТА КЕШУВАННЯ АКТИВОВАНЕ'}
                </span>
              </div>
            </div>

            {isIos ? (
              <div className="space-y-4 mb-6">
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn 
                    ? 'Your iOS device supports installing NEXUS as a Progressive Web App via Safari:'
                    : 'Ваш iOS-пристрій підтримує встановлення NEXUS як Progressive Web App через Safari:'}
                </p>
                <ol className="text-xs text-[#8B879E] space-y-2.5 list-decimal pl-4">
                  <li>
                    {isEn ? 'Tap the ' : 'Натисніть кнопку '}
                    <span className="text-[#EDEBF5] font-semibold">{isEn ? '"Share"' : '"Поділитися"'}</span>
                    {isEn ? ' button (' : ' (іконка '}
                    <span className="inline-flex items-center px-1 py-0.5 rounded bg-white/5 border border-white/10 text-accent-purple font-bold">↑</span>
                    {isEn ? ' in Safari toolbar).' : ' у нижній або верхній панелі Safari).'}
                  </li>
                  <li>
                    {isEn ? 'Scroll down and select ' : 'Прокрутіть список меню та виберіть '}
                    <span className="text-[#EDEBF5] font-semibold">{isEn ? '"Add to Home Screen"' : '"Додати на початковий екран"'}</span>.
                  </li>
                  <li>
                    {isEn ? 'Tap ' : 'Натисніть кнопку '}
                    <span className="text-accent-purple font-bold">{isEn ? '"Add"' : '"Додати"'}</span>
                    {isEn ? ' in top-right corner to finish.' : ' у правому верхньому кутку для завершення.'}
                  </li>
                </ol>
                <div className="p-3 rounded-lg bg-accent-purple/5 border border-accent-purple/10 text-[10px] text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'NEXUS will appear on your home screen as a full standalone app without browser UI.'
                    : 'NEXUS з\'явиться на вашому домашньому екрані як повноцінний автономний додаток без інтерфейсу браузера.'}
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn ? 'To install NEXUS on computer or Android phone:' : 'Щоб встановити NEXUS на комп\'ютер чи телефон Android:'}
                </p>
                <ol className="text-xs text-[#8B879E] space-y-2.5 list-decimal pl-4">
                  <li>
                    {isEn ? 'Look for ' : 'Знайдіть іконку '}
                    <span className="text-[#EDEBF5] font-semibold">{isEn ? '"Install"' : '"Встановити"'}</span>
                    {isEn ? ' icon in browser address bar.' : ' у правому кутку адресного рядка вашого браузера.'}
                  </li>
                  <li>
                    {isEn ? 'Or open browser menu and select ' : 'Або відкрийте меню налаштувань браузера та оберіть пункт '}
                    <span className="text-[#EDEBF5] font-semibold">{isEn ? '"Install NEXUS"' : '"Встановити додаток NEXUS"'}</span>.
                  </li>
                </ol>
                <p className="text-xs text-[#8B879E] leading-relaxed">
                  {isEn
                    ? 'You can also continue using the web version directly. Built-in Service Worker preserves data locally even offline!'
                    : 'Ви також можете продовжити роботу безпосередньо у Web-версії. Завдяки вбудованому Service Worker ваші дані зберігаються локально й працюють навіть без інтернету!'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setViewMode('app');
                }}
                className="w-full py-3 text-xs font-semibold bg-accent-purple hover:bg-[#9333EA] text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>{isEn ? 'Launch Web Version Now' : 'Запустити Web-версію негайно'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* OS Download Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setIsDownloadModalOpen(false)} />

          <div className="relative w-full max-w-2xl bg-[#0D0B16] border border-[#2B1B4A] rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col gap-6 z-10">
            {/* Close button */}
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#8B879E] hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center justify-center text-accent-purple">
                <Download className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-white uppercase tracking-wider">
                  {isEn ? 'Choose Operating System' : 'Оберіть операційну систему'}
                </h3>
                <p className="text-xs text-[#8B879E]">
                  {isEn 
                    ? 'Select your platform to download the NEXUS desktop app' 
                    : 'Оберіть платформу для завантаження настільного клієнта NEXUS'}
                </p>
              </div>
            </div>

            {/* Grid of OS cards with direct downloadable HTML <a> links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              {(['windows', 'macos', 'linux'] as const).map((osKey) => {
                const config = osConfig[osKey];
                const LogoComponent = config.logo;
                const isRecommended = detectedOS === osKey;
                const appData = getDesktopAppData(osKey);

                return (
                  <a
                    key={osKey}
                    href={appData.dataUri}
                    download={appData.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTimeout(() => setIsDownloadModalOpen(false), 800)}
                    className={`relative group flex flex-col items-center justify-between p-5 rounded-2xl border aspect-square transition-all duration-300 transform hover:-translate-y-1 text-center cursor-pointer no-underline ${
                      isRecommended
                        ? 'bg-accent-purple/[0.05] border-accent-purple/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-accent-purple hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]'
                        : 'bg-white/[0.01] border-white/[0.08] hover:border-accent-purple/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                    }`}
                  >
                    {/* Recommended Tag */}
                    {isRecommended && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent-purple text-[8px] font-mono font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        {isEn ? 'RECOMMENDED' : 'РЕКОМЕНДОВАНО'}
                      </span>
                    )}

                    {/* Logo centered */}
                    <div className="flex-1 flex items-center justify-center mt-3">
                      <LogoComponent className={`w-12 h-12 transition-colors duration-300 ${
                        isRecommended
                          ? 'text-accent-purple group-hover:text-[#C084FC]'
                          : 'text-[#8B879E] group-hover:text-accent-purple'
                      }`} />
                    </div>

                    {/* Name and specs at the bottom */}
                    <div className="text-center w-full mt-4">
                      <div className="text-xs font-semibold text-[#EDEBF5] group-hover:text-white transition-colors flex items-center justify-center gap-1">
                        <span>{config.name}</span>
                        <Download className="w-3 h-3 text-accent-purple shrink-0" />
                      </div>
                      <div className="text-[9px] font-mono text-[#5C5870] mt-1 line-clamp-2 leading-tight">
                        {config.requirements}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Universal Standalone Offline HTML App Bundle */}
            <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-accent-purple shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">
                    {isEn ? 'Universal Offline Desktop App (.html)' : 'Універсальний офлайн десктопний бандл (.html)'}
                  </div>
                  <div className="text-[10px] text-[#8B879E]">
                    {isEn ? 'Runs on any OS without installation or terminal scripts.' : 'Працює на будь-якій ОС без встановлення чи термінальних скриптів.'}
                  </div>
                </div>
              </div>
              
              <a
                href={getDesktopAppData('universal').dataUri}
                download={getDesktopAppData('universal').filename}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => setIsDownloadModalOpen(false), 800)}
                className="px-4 py-2 bg-accent-purple hover:bg-[#9333EA] text-white rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)] transition cursor-pointer shrink-0 no-underline flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? 'Download HTML App' : 'Завантажити HTML Додаток'}</span>
              </a>
            </div>

            {/* Instant Standalone Desktop App Window Launcher */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">
                    {isEn ? 'Launch Standalone Desktop Window' : 'Запустити автономне десктопне вікно'}
                  </div>
                  <div className="text-[10px] text-[#8B879E]">
                    {isEn ? 'Opens NEXUS Station directly in a frameless standalone desktop app window.' : 'Відкриває NEXUS Station безпосередньо в окремому десктопному вікні без рамок.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  launchDesktopWindowMode();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isEn ? 'Launch Window' : 'Запустити Вікно'}</span>
              </button>
            </div>

            <div className="pt-2 text-center text-[10px] font-mono text-[#5C5870] border-t border-white/[0.04]">
              {isEn ? 'You can also directly run the ' : 'Ви також можете запустити безпосередньо '}
              <button 
                onClick={() => { setIsDownloadModalOpen(false); setViewMode('app'); }} 
                className="text-accent-purple hover:underline font-semibold cursor-pointer"
              >
                {isEn ? 'web version in browser' : 'веб-версію у браузері'}
              </button> 
              {isEn ? ' without installation.' : ' без встановлення.'}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
