import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, X, Play, RefreshCw, Trash2, Download, CornerDownLeft, 
  Sparkles, Maximize2, Minimize2, Settings, Code2, Database,
  Cpu, Layers, Copy, Check, Sliders, Monitor
} from 'lucide-react';
import { loadSkulpt } from '../utils/pythonRunner';
import { 
  executeCCode, 
  executeJavaCode, 
  executeRustCode, 
  executeGoCode, 
  executeSqlQueries, 
  executeShellScript, 
  stripTypeScript 
} from '../utils/polyglotRunner';

export type IdleLanguage = 'python' | 'javascript' | 'typescript' | 'c' | 'cpp' | 'java' | 'rust' | 'go' | 'sql' | 'shell' | 'html';

export interface UniversalIdleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  filename?: string;
  language?: IdleLanguage | string;
  lang?: 'uk' | 'en';
}

interface OutputLine {
  id: string;
  type: 'system' | 'output' | 'input' | 'error' | 'prompt' | 'info';
  text: string;
}

const LANGUAGE_CONFIG: Record<IdleLanguage, { name: string; icon: string; version: string; prompt: string; banner: string }> = {
  python: {
    name: 'Python 3.10 IDLE Shell',
    icon: '🐍',
    version: 'Python 3.10.0 (tags/v3.10.0:b491f52) [Skulpt Engine]',
    prompt: '>>> ',
    banner: 'Type "help", "copyright", "credits" or "license" for more information.'
  },
  javascript: {
    name: 'Node.js V8 JS REPL',
    icon: '⚡',
    version: 'Node.js v20.11.0 (V8 11.3.244) [NEXUS JS Engine]',
    prompt: 'js> ',
    banner: 'Interactive JavaScript V8 Shell. Global scope persistent.'
  },
  typescript: {
    name: 'TypeScript Interactive Studio',
    icon: '📘',
    version: 'TypeScript v5.3.3 [NEXUS Polyglot Transpiler]',
    prompt: 'ts> ',
    banner: 'TypeScript REPL with automatic type stripping & evaluation.'
  },
  c: {
    name: 'GCC C Interactive REPL',
    icon: '⚙️',
    version: 'GCC 13.2.0 (x86_64-linux-gnu C17)',
    prompt: 'c> ',
    banner: 'C Interpreter with live printf/puts evaluation.'
  },
  cpp: {
    name: 'GCC C++20 Studio Shell',
    icon: '⚙️',
    version: 'g++ 13.2.0 (x86_64-linux-gnu C++20)',
    prompt: 'cpp> ',
    banner: 'C++20 REPL with std::cout & expression evaluation.'
  },
  java: {
    name: 'OpenJDK JShell 21',
    icon: '☕',
    version: 'OpenJDK 21.0.2 JShell REPL',
    prompt: 'jshell> ',
    banner: 'Java Interactive Shell. Class & snippet evaluation.'
  },
  rust: {
    name: 'Rust Cargo Studio REPL',
    icon: '🦀',
    version: 'rustc 1.76.0 (07dca489a 2024-02-04)',
    prompt: 'rust> ',
    banner: 'Rust interactive playground & expression evaluator.'
  },
  go: {
    name: 'Go 1.22 Interactive Shell',
    icon: '🐹',
    version: 'go version go1.22.0 linux/amd64',
    prompt: 'go> ',
    banner: 'Go interactive runner with fmt package support.'
  },
  sql: {
    name: 'SQLite 3 SQL Database Shell',
    icon: '🗄️',
    version: 'SQLite 3.45.1 Memory Database Engine',
    prompt: 'sqlite> ',
    banner: 'In-Memory Relational Database. Execute DDL & DML queries.'
  },
  shell: {
    name: 'NEXUS Virtual Bash Terminal',
    icon: '🐚',
    version: 'GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)',
    prompt: 'bash-5.2$ ',
    banner: 'Virtual Linux Shell. Commands: ls, cat, echo, grep, date, help.'
  },
  html: {
    name: 'DOM Sandbox & HTML Inspector',
    icon: '🌐',
    version: 'NEXUS Web Canvas DOM Engine v2.0',
    prompt: 'dom> ',
    banner: 'Live Web DOM REPL & HTML Element Inspector.'
  }
};

const IDLE_THEMES = [
  { id: 'nexus-dark', name: 'Nexus Dark Cyber', bg: '#0A0910', headerBg: '#13111C', termBg: '#07060B', border: 'rgba(139, 92, 246, 0.3)', text: '#F3F0FF' },
  { id: 'python-classic', name: 'Classic Python IDLE', bg: '#FDFCF7', headerBg: '#EAE6D9', termBg: '#FFFFFF', border: '#C5BDAB', text: '#1E1B18' },
  { id: 'matrix-crt', name: 'Matrix Green Phosphor', bg: '#020D04', headerBg: '#051808', termBg: '#010803', border: '#10B981', text: '#34D399' },
  { id: 'amber-retro', name: 'Amber Terminal CRT', bg: '#0F0900', headerBg: '#1C1200', termBg: '#080500', border: '#F59E0B', text: '#FBBF24' },
  { id: 'dracula-studio', name: 'Dracula Studio', bg: '#181524', headerBg: '#211D32', termBg: '#141220', border: '#BD93F9', text: '#F8F8F2' },
  { id: 'cyberpunk', name: 'Neon Cyberpunk', bg: '#080112', headerBg: '#14022A', termBg: '#05000A', border: '#EC4899', text: '#F472B6' }
];

export const UniversalIdleModal: React.FC<UniversalIdleModalProps> = React.memo(({
  isOpen,
  onClose,
  initialCode = '',
  filename = 'script.py',
  language: initialLangProp,
  lang = 'uk',
}) => {
  // Normalize language prop
  const detectLanguage = (name: string, langProp?: string): IdleLanguage => {
    if (langProp && langProp in LANGUAGE_CONFIG) return langProp as IdleLanguage;
    const lower = (name || '').toLowerCase();
    if (lower.endsWith('.py')) return 'python';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
    if (lower.endsWith('.cpp') || lower.endsWith('.hpp') || lower.endsWith('.cc')) return 'cpp';
    if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';
    if (lower.endsWith('.java')) return 'java';
    if (lower.endsWith('.rs')) return 'rust';
    if (lower.endsWith('.go')) return 'go';
    if (lower.endsWith('.sql')) return 'sql';
    if (lower.endsWith('.sh') || lower.endsWith('.bash')) return 'shell';
    if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.css')) return 'html';
    return 'python';
  };

  const [activeLang, setActiveLang] = useState<IdleLanguage>(() => detectLanguage(filename, initialLangProp));
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [userInputValue, setUserInputValue] = useState<string>('');
  const [replInputValue, setReplInputValue] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('nexus-dark');
  const [fontSize, setFontSize] = useState<number>(12);
  const [copiedLog, setCopiedLog] = useState(false);

  // Command History Navigation
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Persistent Scope for JS/TS
  const jsScopeRef = useRef<Record<string, any>>({});
  const replHistoryRef = useRef<string[]>([]);
  const inputResolveRef = useRef<((val: string) => void) | null>(null);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const replFieldRef = useRef<HTMLInputElement>(null);

  const currentTheme = IDLE_THEMES.find(t => t.id === activeThemeId) || IDLE_THEMES[0];
  const langConfig = LANGUAGE_CONFIG[activeLang] || LANGUAGE_CONFIG.python;

  // Sync language when props change
  useEffect(() => {
    if (isOpen) {
      setActiveLang(detectLanguage(filename, initialLangProp));
    }
  }, [isOpen, filename, initialLangProp]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, waitingForInput]);

  // Focus input when waiting
  useEffect(() => {
    if (waitingForInput) {
      setTimeout(() => inputFieldRef.current?.focus(), 100);
    }
  }, [waitingForInput]);

  const addLine = useCallback((type: OutputLine['type'], text: string) => {
    setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type, text }]);
  }, []);

  // Python runner via Skulpt
  const runPythonCode = async (codeToRun: string, isRepl = false, isStatement = false) => {
    setIsRunning(true);
    setWaitingForInput(false);

    let Sk;
    try {
      Sk = await loadSkulpt();
    } catch (err: any) {
      addLine('error', '✖ Помилка завантаження Skulpt Engine (перевірте мережеве з’єднання).');
      setIsRunning(false);
      return;
    }

    let outputBuffer = '';

    Sk.configure({
      output: (text: string) => {
        outputBuffer += text;
        const parts = outputBuffer.split('\n');
        outputBuffer = parts.pop() ?? '';
        for (const part of parts) {
          setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type: 'output', text: part }]);
        }
      },
      inputfun: (promptText: string) => {
        return new Promise<string>((resolve) => {
          if (outputBuffer) {
            setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type: 'output', text: outputBuffer }]);
            outputBuffer = '';
          }
          setInputPrompt(promptText || 'Введіть значення: ');
          setWaitingForInput(true);
          inputResolveRef.current = resolve;
        });
      },
      read: (x: string) => {
        if (Sk.builtinFiles !== undefined && Sk.builtinFiles['files'][x] !== undefined) {
          return Sk.builtinFiles['files'][x];
        }
        try {
          const stored = localStorage.getItem('nexus_code_files');
          if (stored) {
            const files = JSON.parse(stored);
            const cleanName = x.replace(/^src\/(lib|builtin)\//, '').replace(/\.py$/, '').replace(/\/__init__$/, '');
            const match = files.find((f: any) => {
              const fname = (f.name || '').replace(/\.py$/, '');
              return fname === cleanName || f.name === cleanName || f.name === x;
            });
            if (match && match.content !== undefined) return match.content;
          }
        } catch (_) {}
        throw new Error(`File not found: '${x}'`);
      },
      __future__: Sk.python3,
    });

    try {
      const promise = Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, codeToRun, true));
      await promise;
      if (outputBuffer.length > 0) {
        setLines((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, type: 'output', text: outputBuffer }]);
      }
      if (!isRepl) {
        addLine('system', `>>> [${lang === 'uk' ? 'Програму виконано успішно' : 'Program executed successfully'}]`);
      }
    } catch (err: any) {
      if (isRepl && isStatement) replHistoryRef.current.pop();
      addLine('error', `✖ ${err?.toString ? err.toString() : String(err)}`);
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
    }
  };

  // JS/TS runner
  const runJSCode = (codeToRun: string, isTS = false) => {
    setIsRunning(true);
    try {
      const cleanCode = isTS ? stripTypeScript(codeToRun) : codeToRun;
      
      let loggedOutput = false;
      const customConsole = {
        log: (...args: any[]) => {
          loggedOutput = true;
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          addLine('output', text);
        },
        warn: (...args: any[]) => {
          loggedOutput = true;
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          addLine('output', `⚠️ [WARN] ${text}`);
        },
        error: (...args: any[]) => {
          loggedOutput = true;
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          addLine('error', `✖ [ERROR] ${text}`);
        },
        info: (...args: any[]) => {
          loggedOutput = true;
          const text = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          addLine('info', `ℹ️ ${text}`);
        }
      };

      // Execute code with custom console & evaluation
      const keys = Object.keys(jsScopeRef.current);
      const vals = Object.values(jsScopeRef.current);

      const fn = new Function('console', 'print', ...keys, `
        try {
          const result = (function() {
            ${cleanCode.includes('return') ? cleanCode : `return (${cleanCode})`}
          })();
          return result;
        } catch (e) {
          return eval(${JSON.stringify(cleanCode)});
        }
      `);

      const res = fn(customConsole, customConsole.log, ...vals);

      if (res !== undefined && !loggedOutput) {
        if (typeof res === 'object') {
          addLine('output', JSON.stringify(res, null, 2));
        } else {
          addLine('output', String(res));
        }
      }
    } catch (err: any) {
      addLine('error', `✖ Syntax/Runtime Error: ${err?.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Polyglot Runner for C/C++, Java, Rust, Go, SQL, Shell
  const runPolyglotCode = (codeToRun: string, targetLang: IdleLanguage) => {
    setIsRunning(true);
    try {
      let result;
      if (targetLang === 'c' || targetLang === 'cpp') {
        result = executeCCode(codeToRun);
      } else if (targetLang === 'java') {
        result = executeJavaCode(codeToRun);
      } else if (targetLang === 'rust') {
        result = executeRustCode(codeToRun);
      } else if (targetLang === 'go') {
        result = executeGoCode(codeToRun);
      } else if (targetLang === 'sql') {
        result = executeSqlQueries(codeToRun);
      } else if (targetLang === 'shell') {
        result = executeShellScript(codeToRun);
      } else if (targetLang === 'html') {
        addLine('output', `🌐 HTML DOM Render Inspector:\n${codeToRun.slice(0, 300)}...`);
        return;
      }

      if (result) {
        result.logs.forEach(l => addLine(l.type === 'error' ? 'error' : 'output', l.text));
      }
    } catch (err: any) {
      addLine('error', `✖ Execution failed: ${err?.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Main execution dispatcher
  const executeCodeInIdle = (codeToRun: string, isRepl = false, isStatement = false) => {
    if (activeLang === 'python') {
      runPythonCode(codeToRun, isRepl, isStatement);
    } else if (activeLang === 'javascript' || activeLang === 'typescript') {
      runJSCode(codeToRun, activeLang === 'typescript');
    } else {
      runPolyglotCode(codeToRun, activeLang);
    }
  };

  // Setup IDLE window when opened or language switched
  const initIdleSession = useCallback((targetLang: IdleLanguage) => {
    const cfg = LANGUAGE_CONFIG[targetLang] || LANGUAGE_CONFIG.python;
    setLines([
      { id: '1', type: 'system', text: `${cfg.icon} ${cfg.name} - ${cfg.version}` },
      { id: '2', type: 'system', text: cfg.banner },
      { id: '3', type: 'system', text: `${cfg.prompt}==== NEXUS IDLE STUDIO SESSION INITIALIZED [${filename}] ====` },
    ]);

    replHistoryRef.current = [];
    jsScopeRef.current = {};

    if (initialCode) {
      setTimeout(() => executeCodeInIdle(initialCode, false), 300);
    }
  }, [filename, initialCode]);

  useEffect(() => {
    if (isOpen) {
      initIdleSession(activeLang);
    }
  }, [isOpen, activeLang]);

  // Handle REPL Submission
  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInputValue.trim() || isRunning) return;

    const rawCmd = replInputValue.trim();
    setReplInputValue('');
    
    // Add to history
    setCmdHistory(prev => [...prev, rawCmd]);
    setHistoryIndex(-1);

    const cfg = LANGUAGE_CONFIG[activeLang];
    addLine('prompt', `${cfg.prompt}${rawCmd}`);

    if (activeLang === 'python') {
      const isStatement = /^(import|from|def|class|for|while|if|try|with|raise|pass|return|assert|del|break|continue)\b/.test(rawCmd) ||
                          (rawCmd.includes('=') && !rawCmd.includes('==') && !rawCmd.includes('<=') && !rawCmd.includes('>=') && !rawCmd.includes('!='));

      let codeToExec = rawCmd;
      if (!isStatement && !rawCmd.startsWith('print(')) {
        codeToExec = `print(repr(${rawCmd}))`;
      }
      const fullCode = [...replHistoryRef.current, codeToExec].join('\n');
      if (isStatement) replHistoryRef.current.push(rawCmd);
      executeCodeInIdle(fullCode, true, isStatement);
    } else {
      executeCodeInIdle(rawCmd, true);
    }
  };

  // Handle Input Prompt Answer
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitingForInput || !inputResolveRef.current) return;

    const val = userInputValue;
    addLine('input', `${inputPrompt}${val}`);
    setUserInputValue('');
    setWaitingForInput(false);

    const resolveFn = inputResolveRef.current;
    inputResolveRef.current = null;
    resolveFn(val);
  };

  // REPL History Keyboard Navigation
  const handleReplKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (cmdHistory.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setReplInputValue(cmdHistory[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(-1);
        setReplInputValue('');
      } else {
        setHistoryIndex(nextIdx);
        setReplInputValue(cmdHistory[nextIdx]);
      }
    }
  };

  const handleClear = () => {
    setLines([{ id: '1', type: 'system', text: `>>> [${lang === 'uk' ? 'Консоль IDLE очищено' : 'IDLE console cleared'}]` }]);
  };

  const handleCopyLog = () => {
    const textContent = lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(textContent);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleExport = () => {
    const textContent = lines.map((l) => l.text).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_idle_${activeLang}_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className={`w-full flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border ${
          isMaximized ? 'h-full max-w-none' : 'max-w-5xl h-[88vh]'
        }`}
        style={{
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
          boxShadow: `0 0 40px ${currentTheme.border}33`,
        }}
      >
        {/* IDLE Window Standalone Desktop Titlebar */}
        <div 
          className="flex items-center justify-between px-4 py-2.5 border-b select-none shrink-0"
          style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}
        >
          {/* Left: Window Dots & Title & Language Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition cursor-pointer" title="Close Window" />
              <button onClick={() => setIsMaximized(!isMaximized)} className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition cursor-pointer" title="Maximize / Restore" />
              <button className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition cursor-pointer" title="Active Status" />
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <Terminal className="w-4 h-4 text-accent-purple" />
              <span className="text-xs font-bold text-text-primary tracking-wide hidden sm:inline">
                NEXUS Polyglot IDLE Studio
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <select
              value={activeLang}
              onChange={(e) => setActiveLang(e.target.value as IdleLanguage)}
              className="bg-black/30 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-white focus:outline-none cursor-pointer"
            >
              {Object.entries(LANGUAGE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-[#12101D] text-white">
                  {cfg.icon} {cfg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Theme Picker, Font Controls, Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <select
              value={activeThemeId}
              onChange={(e) => setActiveThemeId(e.target.value)}
              className="hidden md:block bg-black/30 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-text-secondary focus:outline-none cursor-pointer"
              title="Change IDLE Theme"
            >
              {IDLE_THEMES.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#12101D] text-white">
                  🎨 {t.name}
                </option>
              ))}
            </select>

            {/* Font Size Adjuster */}
            <div className="hidden lg:flex items-center gap-1 bg-black/30 border border-white/15 rounded-lg px-1.5 py-0.5 text-[11px] font-mono">
              <button onClick={() => setFontSize(f => Math.max(10, f - 1))} className="px-1 text-text-secondary hover:text-white cursor-pointer" title="Decrease Font Size">-</button>
              <span className="text-text-primary px-1">{fontSize}px</span>
              <button onClick={() => setFontSize(f => Math.min(18, f + 1))} className="px-1 text-text-secondary hover:text-white cursor-pointer" title="Increase Font Size">+</button>
            </div>

            {/* Restart Session Button */}
            <button
              onClick={() => initIdleSession(activeLang)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/30 transition cursor-pointer disabled:opacity-50"
              title={lang === 'uk' ? 'Перезапустити сесію' : 'Restart Session'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{lang === 'uk' ? 'Перезапустити' : 'Restart'}</span>
            </button>

            {/* Clear Console */}
            <button
              onClick={handleClear}
              className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Copy Log */}
            <button
              onClick={handleCopyLog}
              className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Copy Output"
            >
              {copiedLog ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download Log */}
            <button
              onClick={handleExport}
              className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Download Session Log"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Maximize Toggle */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-text-secondary hover:text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Screen Container */}
        <div 
          className="flex-1 p-4 overflow-y-auto font-mono leading-relaxed space-y-1 select-text transition-all"
          style={{ 
            backgroundColor: currentTheme.termBg, 
            fontSize: `${fontSize}px`,
            color: currentTheme.text 
          }}
        >
          {lines.map((line) => {
            if (line.type === 'system') {
              return (
                <div key={line.id} className="opacity-70 italic py-0.5 border-b border-white/5">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'input') {
              return (
                <div key={line.id} className="text-emerald-400 font-bold flex items-center gap-1">
                  <span>{line.text}</span>
                </div>
              );
            }
            if (line.type === 'error') {
              return (
                <div key={line.id} className="text-red-400 font-medium bg-red-500/10 p-2 rounded border border-red-500/20 my-1">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'prompt') {
              return (
                <div key={line.id} className="text-sky-400 font-bold pt-1">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'info') {
              return (
                <div key={line.id} className="text-amber-300 font-medium py-0.5">
                  {line.text}
                </div>
              );
            }
            return (
              <div key={line.id} className="whitespace-pre-wrap">
                {line.text}
              </div>
            );
          })}

          {/* Active Waiting for Input Line */}
          {waitingForInput && (
            <form onSubmit={handleInputSubmit} className="flex items-center gap-2 pt-2 animate-pulse">
              <span className="text-emerald-400 font-bold shrink-0">{inputPrompt || '>>> '}</span>
              <input
                ref={inputFieldRef}
                type="text"
                value={userInputValue}
                onChange={(e) => setUserInputValue(e.target.value)}
                placeholder={lang === 'uk' ? 'Введіть відповідь і натисніть Enter...' : 'Type response and press Enter...'}
                className="flex-1 bg-black/40 border border-emerald-500/50 rounded px-2.5 py-1 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400"
                style={{ fontSize: `${fontSize}px` }}
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-xs font-sans font-semibold flex items-center gap-1 hover:bg-emerald-500/30 cursor-pointer"
              >
                <span>Enter</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Footer REPL Command Bar */}
        <div 
          className="p-3 border-t flex items-center gap-2.5 shrink-0"
          style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.border }}
        >
          <span className="text-accent-purple font-mono font-bold text-sm shrink-0">
            {langConfig.prompt}
          </span>
          <form onSubmit={handleReplSubmit} className="flex-1 flex items-center gap-2">
            <input
              ref={replFieldRef}
              type="text"
              value={replInputValue}
              onChange={(e) => setReplInputValue(e.target.value)}
              onKeyDown={handleReplKeyDown}
              disabled={isRunning || waitingForInput}
              placeholder={
                waitingForInput
                  ? (lang === 'uk' ? 'Очікується введення у програмі...' : 'Waiting for program input...')
                  : (lang === 'uk' ? `Введіть ${langConfig.name} команду... (клавіші ↑/↓ для історії)` : `Type ${langConfig.name} command... (Up/Down for history)`)
              }
              className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-accent-purple transition disabled:opacity-50"
              style={{ fontSize: `${fontSize}px` }}
            />
            <button
              type="submit"
              disabled={isRunning || waitingForInput || !replInputValue.trim()}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-accent-purple/90 transition cursor-pointer disabled:opacity-40 shrink-0 font-bold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">{lang === 'uk' ? 'Виконати' : 'Run'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
});
