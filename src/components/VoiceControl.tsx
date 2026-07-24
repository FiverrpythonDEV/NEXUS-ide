import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Terminal, 
  Sparkles, 
  FileCode, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  Play, 
  FileText, 
  LayoutDashboard, 
  CheckSquare, 
  HardDrive, 
  Search, 
  Moon, 
  Globe
} from 'lucide-react';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export const VoiceControl: React.FC = () => {
  const { setModule, updateSettings, settings } = useAppContext();
  const toast = useToast();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'uk-UA' | 'en-US'>('uk-UA');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check Web Speech API Availability
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    }
  }, []);

  // Initialize Speech Recognition
  const toggleListening = () => {
    if (!isSupported) {
      toast.error('Browser SpeechRecognition API is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setLastCommand(null);
        toast.info(speechLang === 'uk-UA' ? '🎙️ Голосове керування активовано. Говоріть команду...' : '🎙️ Voice control active. Listening for commands...');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          currentTranscript += item[0].transcript;
          if (item.isFinal) {
            processCommand(item[0].transcript.toLowerCase().trim());
          }
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error(speechLang === 'uk-UA' ? 'Доступ до мікрофона відхилено.' : 'Microphone permission denied.');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Silent non-critical timeout
        } else if (event.error !== 'aborted') {
          toast.warning(`Голосовий ввід: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user intends it to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    toast.info(speechLang === 'uk-UA' ? '🎙️ Голосовий мікрофон вимкнено' : '🎙️ Microphone stopped');
  };

  // Re-start recognition if language switches while listening
  const handleLanguageChange = (newLang: 'uk-UA' | 'en-US') => {
    setSpeechLang(newLang);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.lang = newLang;
      toast.info(newLang === 'uk-UA' ? 'Мову розпізнавання змінено на Українську' : 'Recognition language set to English');
    }
  };

  // Execute recognized voice action
  const processCommand = (phrase: string) => {
    setLastCommand(phrase);

    // 1. Run / Execute project or code
    if (
      phrase.includes('run project') || 
      phrase.includes('run code') || 
      phrase.includes('run') || 
      phrase.includes('запусти') || 
      phrase.includes('запустити') || 
      phrase.includes('виконати код')
    ) {
      setModule('code-editor');
      setTimeout(() => {
        window.dispatchEvent(new Event('execute-code-file'));
      }, 150);
      toast.success(speechLang === 'uk-UA' ? '⚡ Команда прийнята: Запуск проєкту / коду' : '⚡ Command triggered: Run Project');
      return;
    }

    // 2. Open / Toggle Console
    if (
      phrase.includes('console') || 
      phrase.includes('консоль') || 
      phrase.includes('термінал')
    ) {
      window.dispatchEvent(new Event('toggle-console-runner'));
      toast.success(speechLang === 'uk-UA' ? '🖥️ Команда прийнята: Консоль розробника' : '🖥️ Command triggered: Open Console');
      return;
    }

    // 3. Open / Save Notes
    if (
      phrase.includes('notes') || 
      phrase.includes('нотатки') || 
      phrase.includes('замітки') || 
      phrase.includes('знання')
    ) {
      setModule('knowledge-base');
      toast.success(speechLang === 'uk-UA' ? '📝 Команда прийнята: Відкрити нотатки' : '📝 Command triggered: Open Notes');
      return;
    }

    // 4. Open Dashboard
    if (phrase.includes('dashboard') || phrase.includes('дашборд') || phrase.includes('робочий стіл')) {
      setModule('dashboard');
      toast.success(speechLang === 'uk-UA' ? '📊 Відкрито Дашборд' : '📊 Dashboard Opened');
      return;
    }

    // 5. Open Code Editor
    if (phrase.includes('editor') || phrase.includes('редактор') || phrase.includes('код')) {
      setModule('code-editor');
      toast.success(speechLang === 'uk-UA' ? '💻 Відкрито Редактор коду' : '💻 Code Editor Opened');
      return;
    }

    // 6. Open Projects
    if (phrase.includes('project') || phrase.includes('проект') || phrase.includes('проєкт')) {
      setModule('project-tracker');
      toast.success(speechLang === 'uk-UA' ? '📁 Відкрито Проєкти' : '📁 Project Tracker Opened');
      return;
    }

    // 7. Open Gadgets / Devices
    if (phrase.includes('device') || phrase.includes('gadget') || phrase.includes('гаджет') || phrase.includes('технік')) {
      setModule('gadget-inventory');
      toast.success(speechLang === 'uk-UA' ? '🔌 Відкрито Облік пристроїв' : '🔌 Device Inventory Opened');
      return;
    }

    // 8. Open Settings
    if (phrase.includes('setting') || phrase.includes('налаштування') || phrase.includes('опції')) {
      setModule('settings');
      toast.success(speechLang === 'uk-UA' ? '⚙️ Відкрито Налаштування' : '⚙️ Settings Opened');
      return;
    }

    // 9. Open AI Assistant
    if (phrase.includes('ai') || phrase.includes('assistant') || phrase.includes('асистент') || phrase.includes('штучний')) {
      window.dispatchEvent(new Event('toggle-gemini-assistant'));
      toast.success(speechLang === 'uk-UA' ? '✨ Відкрито Gemini AI' : '✨ Opened Gemini AI');
      return;
    }

    // 10. Toggle Theme
    if (phrase.includes('theme') || phrase.includes('тема') || phrase.includes('темна') || phrase.includes('світла')) {
      const currentTheme = settings.themeMode || 'dark';
      updateSettings({ themeMode: currentTheme === 'dark' ? 'light' : 'dark' });
      toast.success(speechLang === 'uk-UA' ? '🎨 Тему переключено' : '🎨 Theme Toggled');
      return;
    }

    // 11. Toggle Sidebar
    if (phrase.includes('sidebar') || phrase.includes('панель') || phrase.includes('меню') || phrase.includes('згорнути')) {
      updateSettings({ isSidebarCompact: !settings.isSidebarCompact });
      toast.success(speechLang === 'uk-UA' ? '↔️ Сайдбар згорнуто/розгорнуто' : '↔️ Sidebar Toggled');
      return;
    }

    // 12. Open Search / Command Palette
    if (phrase.includes('search') || phrase.includes('пошук') || phrase.includes('палітр')) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      toast.success(speechLang === 'uk-UA' ? '🔍 Палітра команд' : '🔍 Command Palette');
      return;
    }

    // 13. Help / Voice Guide
    if (phrase.includes('help') || phrase.includes('допомог') || phrase.includes('команд')) {
      setIsHelpOpen(true);
      return;
    }
  };

  const commandCatalog = [
    {
      category: speechLang === 'uk-UA' ? '🚀 Виконання та Код' : '🚀 Execution & Code',
      icon: Play,
      items: [
        { phrase: speechLang === 'uk-UA' ? '"запусти проєкт" / "run project"' : '"run project"', action: speechLang === 'uk-UA' ? 'Запускає поточний файл коду у песочниці' : 'Executes active code file in playground' },
        { phrase: speechLang === 'uk-UA' ? '"виконати код" / "run code"' : '"run code"', action: speechLang === 'uk-UA' ? 'Компілює та виводить результати' : 'Compiles and renders code output' },
      ]
    },
    {
      category: speechLang === 'uk-UA' ? '🖥️ Консоль та AI' : '🖥️ Console & AI',
      icon: Terminal,
      items: [
        { phrase: speechLang === 'uk-UA' ? '"відкрити консоль" / "open console"' : '"open console"', action: speechLang === 'uk-UA' ? 'Переключає висувну консоль логів' : 'Toggles bottom developer console' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити асистент" / "open ai"' : '"open ai"', action: speechLang === 'uk-UA' ? 'Викликає розширеного штучного інтелекта Gemini' : 'Opens Gemini AI assistant drawer' },
      ]
    },
    {
      category: speechLang === 'uk-UA' ? '📝 Знання та Нотатки' : '📝 Knowledge & Notes',
      icon: FileText,
      items: [
        { phrase: speechLang === 'uk-UA' ? '"зберегти нотатки" / "save notes"' : '"save notes"', action: speechLang === 'uk-UA' ? 'Переходить у модуль знань та зберігає запис' : 'Navigates to Knowledge Base notes' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити нотатки" / "open notes"' : '"open notes"', action: speechLang === 'uk-UA' ? 'Швидкий доступ до бази знань NEXUS' : 'Quick access to code documentation' },
      ]
    },
    {
      category: speechLang === 'uk-UA' ? '🧭 Модулі Навігації' : '🧭 Module Navigation',
      icon: LayoutDashboard,
      items: [
        { phrase: speechLang === 'uk-UA' ? '"відкрити дашборд"' : '"open dashboard"', action: speechLang === 'uk-UA' ? 'Головна аналітична панель' : 'Main analytics view' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити редактор"' : '"open editor"', action: speechLang === 'uk-UA' ? 'Повнофункціональний Monaco / Code editor' : 'Monaco Code Editor' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити проекти"' : '"open projects"', action: speechLang === 'uk-UA' ? 'Керування задачами та спринтами' : 'Sprint and project tracker' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити гаджети"' : '"open devices"', action: speechLang === 'uk-UA' ? 'Облік техніки та пристроїв' : 'Hardware inventory' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити налаштування"' : '"open settings"', action: speechLang === 'uk-UA' ? 'Конфігурація інтерфейсу та теми' : 'Theme & editor configuration' },
      ]
    },
    {
      category: speechLang === 'uk-UA' ? '🎨 Інтерфейс' : '🎨 Interface Controls',
      icon: Moon,
      items: [
        { phrase: speechLang === 'uk-UA' ? '"переключити тему"' : '"toggle theme"', action: speechLang === 'uk-UA' ? 'Зміна темного/світлого режимів' : 'Switch dark / light mode' },
        { phrase: speechLang === 'uk-UA' ? '"згорнути меню"' : '"toggle sidebar"', action: speechLang === 'uk-UA' ? 'Згортання бічної панелі сайдбару' : 'Collapses sidebar to compact' },
        { phrase: speechLang === 'uk-UA' ? '"відкрити пошук"' : '"open search"', action: speechLang === 'uk-UA' ? 'Швидка палітра команд Ctrl+K' : 'Triggers Command Palette' },
      ]
    }
  ];

  return (
    <>
      {/* Topbar Microphone Trigger Toggle */}
      <div className="relative inline-flex items-center">
        <button
          id="header-voice-control-trigger"
          onClick={toggleListening}
          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center relative ${
            isListening 
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-lg shadow-rose-500/20 animate-pulse' 
              : 'bg-hover-bg/30 border-border-accent/20 text-text-secondary hover:text-text-primary hover:bg-hover-bg/70'
          }`}
          title={isListening 
            ? (speechLang === 'uk-UA' ? 'Вимкнути голосове керування' : 'Stop voice listening') 
            : (speechLang === 'uk-UA' ? 'Увімкнути голосове керування (Speech API)' : 'Start voice control')}
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </>
          ) : (
            <Mic className="w-4 h-4 text-accent-purple" />
          )}
        </button>
      </div>

      {/* Floating Active Voice Bar when Microphone is active */}
      {isListening && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#120f1d]/95 backdrop-blur-md border border-rose-500/40 shadow-2xl rounded-2xl px-5 py-3 max-w-lg w-full flex items-center justify-between gap-4 font-sans animate-fade-in">
          
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Audio Wave Visualizer Simulation */}
            <div className="flex items-center gap-1 shrink-0 h-4">
              <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3"></span>
              <span className="w-1 bg-rose-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-4"></span>
              <span className="w-1 bg-rose-500 rounded-full animate-[bounce_0.6s_infinite_200ms] h-2"></span>
              <span className="w-1 bg-rose-300 rounded-full animate-[bounce_0.6s_infinite_400ms] h-3.5"></span>
            </div>

            <div className="overflow-hidden text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  {speechLang === 'uk-UA' ? 'Слухаю:' : 'Listening:'}
                </span>
                {lastCommand && (
                  <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                    {speechLang === 'uk-UA' ? 'Команду розпізнано' : 'Command matched'}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-text-primary truncate mt-0.5">
                {transcript || (speechLang === 'uk-UA' ? 'Говоріть команду (напр. "запусти проєкт", "відкрити консоль")...' : 'Speak command (e.g. "run project", "open console")...')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => handleLanguageChange(speechLang === 'uk-UA' ? 'en-US' : 'uk-UA')}
              className="px-2 py-1 bg-hover-bg/60 border border-border-accent/30 rounded-lg text-[10px] font-mono text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1"
              title="Переключити мову голосового вводу"
            >
              <Globe className="w-3 h-3 text-accent-purple" />
              <span>{speechLang === 'uk-UA' ? 'UK' : 'EN'}</span>
            </button>

            {/* Help modal button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 bg-hover-bg/60 border border-border-accent/30 rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              title="Список всіх голосових команд"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Close / Stop Mic */}
            <button
              onClick={stopListening}
              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-rose-300 transition-all cursor-pointer"
              title="Зупинити мікрофон"
            >
              <MicOff className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Voice Commands Cheat-Sheet Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={speechLang === 'uk-UA' ? '🎙️ Довідник голосових команд (Speech API)' : '🎙️ Voice Commands Guide (Speech API)'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#151322] p-3 rounded-xl border border-border-accent/20">
            <p className="text-xs text-text-secondary">
              {speechLang === 'uk-UA'
                ? 'Ви можете віддавати голосові розпорядження без використання миші чи клавіатури. Просто активуйте мікрофон і скажіть фрази нижче.'
                : 'Trigger common developer operations hands-free within NEXUS interface using natural voice input.'}
            </p>

            <div className="flex items-center gap-1.5 shrink-0 ml-4">
              <Button
                variant={speechLang === 'uk-UA' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('uk-UA')}
                className="text-[10px] py-1 px-2 h-7 cursor-pointer"
              >
                Українська
              </Button>
              <Button
                variant={speechLang === 'en-US' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('en-US')}
                className="text-[10px] py-1 px-2 h-7 cursor-pointer"
              >
                English
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto custom-scrollbar p-1">
            {commandCatalog.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-[#14121F] border border-border-accent/20 space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-border-accent/15 pb-2">
                    <IconComp className="w-4 h-4 text-accent-purple" />
                    <h4 className="text-xs font-semibold text-text-primary">{cat.category}</h4>
                  </div>

                  <div className="space-y-2">
                    {cat.items.map((item, itemIdx) => (
                      <div 
                        key={itemIdx} 
                        onClick={() => {
                          const triggerPhrase = item.phrase.replace(/"/g, '').split('/')[0].trim();
                          processCommand(triggerPhrase);
                          setIsHelpOpen(false);
                        }}
                        className="p-2 rounded-lg bg-[#0E0C17] border border-border-accent/10 hover:border-accent-purple/40 transition-all cursor-pointer group flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-accent-purple group-hover:text-purple-300">
                            {item.phrase}
                          </span>
                          <span className="text-[9px] text-text-tertiary group-hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                            {speechLang === 'uk-UA' ? 'Тестувати' : 'Test'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary">
                          {item.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border-accent/15 flex justify-between items-center">
            <span className="text-[10px] text-text-tertiary font-mono">
              Вимоги: браузер із підтримкою Web Speech API (Chrome, Edge, Safari, Opera).
            </span>
            <Button variant="outline" onClick={() => setIsHelpOpen(false)} className="cursor-pointer">
              {speechLang === 'uk-UA' ? 'Закрити' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
