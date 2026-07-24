import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslation } from '../i18n/translations';
import { useToast } from './ui/Toast';
import { Terminal as TermIcon, Play, Trash2, Copy, Check, AlertCircle, Info, X, Sparkles, RefreshCw } from 'lucide-react';
import { TerminalTab } from './TerminalTab';

interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'result';
  text: string;
  timestamp: string;
}

interface ConsoleRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsoleRunner: React.FC<ConsoleRunnerProps> = React.memo(({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const [activeConsoleTab, setActiveConsoleTab] = useState<'runner' | 'terminal'>('runner');
  const [runnerLang, setRunnerLang] = useState<'javascript' | 'python'>('javascript');
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  
  // Monaco values
  const [jsCode, setJsCode] = useState<string>(`// JS Console Runner\nconsole.log("Hello from Nexus!");\n\nconst add = (a, b) => a + b;\nreturn add(5, 7);`);
  const [pyCode, setPyCode] = useState<string>(`# Python Snippet Runner\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Nexus Developer"))\n`);

  const code = runnerLang === 'javascript' ? jsCode : pyCode;
  const setCode = runnerLang === 'javascript' ? setJsCode : setPyCode;

  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const handleClear = () => {
      setLogs([]);
    };
    window.addEventListener('clear-console-runner', handleClear);
    return () => {
      window.removeEventListener('clear-console-runner', handleClear);
    };
  }, []);

  useEffect(() => {
    const lastError = logs.filter(l => l.type === 'error').pop();
    if (lastError) {
      localStorage.setItem('nexus_last_console_error', lastError.text);
    }
  }, [logs]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Add keybinding for Ctrl+Enter within Monaco Editor
    editor.addCommand(2048 | 3, () => { // 2048 is Ctrl, 3 is Enter
      executeCode();
    });
  };

  const loadPyodideScript = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).loadPyodide) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide'));
      document.head.appendChild(script);
    });
  };

  const executePythonCode = async () => {
    if (!pyCode.trim()) return;
    setIsLoadingPyodide(true);
    const getTimestamp = () => new Date().toLocaleTimeString();

    try {
      await loadPyodideScript();
      let pyInstance = (window as any)._pyodideInstance;
      if (!pyInstance) {
        pyInstance = await (window as any).loadPyodide();
        (window as any)._pyodideInstance = pyInstance;
      }

      // Buffer prints
      const printedLines: string[] = [];
      let stdoutBuffer = '';

      pyInstance.setStdout({
        write: (text: string) => {
          stdoutBuffer += text;
          const lines = stdoutBuffer.split('\n');
          for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i] !== '') printedLines.push(lines[i]);
          }
          stdoutBuffer = lines[lines.length - 1];
        },
      });

      const result = await pyInstance.runPythonAsync(pyCode);
      if (stdoutBuffer) printedLines.push(stdoutBuffer); // flush залишку

      const capturedLogs: ConsoleLog[] = [];
      if (printedLines.length > 0) {
        printedLines.forEach(line => {
          capturedLogs.push({
            id: `py-print-${Math.random().toString(36).substring(2, 9)}`,
            type: 'log',
            text: line,
            timestamp: getTimestamp(),
          });
        });
      }

      const isResultNone = result === undefined || result === null || String(result) === 'None';
      if (printedLines.length === 0 && isResultNone) {
        capturedLogs.push({
          id: `py-empty-${Math.random().toString(36).substring(2, 9)}`,
          type: 'result',
          text: lang === 'uk' ? '✓ Виконано без виводу' : '✓ Executed with no output',
          timestamp: getTimestamp(),
        });
      } else if (!isResultNone) {
        capturedLogs.push({
          id: `py-res-${Math.random().toString(36).substring(2, 9)}`,
          type: 'result',
          text: `→ ${String(result)}`,
          timestamp: getTimestamp(),
        });
      }

      setLogs(prev => [...prev, ...capturedLogs]);
    } catch (err: any) {
      const errMsg = err.message || String(err);
      const firstLine = errMsg.split('\n')[0];
      toast.error(firstLine);

      setLogs(prev => [...prev, {
        id: `py-err-${Math.random().toString(36).substring(2, 9)}`,
        type: 'error',
        text: errMsg,
        timestamp: getTimestamp(),
      }]);
    } finally {
      setIsLoadingPyodide(false);
    }
  };

  const executeCode = () => {
    if (runnerLang === 'python') {
      executePythonCode();
      return;
    }

    if (!jsCode.trim()) return;

    // Capture original console methods
    const originalConsole = {
      log: window.console.log,
      warn: window.console.warn,
      error: window.console.error,
    };

    const capturedLogs: ConsoleLog[] = [];
    const getTimestamp = () => new Date().toLocaleTimeString();

    // Custom interceptors
    window.console.log = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      capturedLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        type: 'log',
        text,
        timestamp: getTimestamp(),
      });
      originalConsole.log(...args);
    };

    window.console.warn = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      capturedLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        type: 'warn',
        text,
        timestamp: getTimestamp(),
      });
      originalConsole.warn(...args);
    };

    window.console.error = (...args) => {
      const text = args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      capturedLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        type: 'error',
        text,
        timestamp: getTimestamp(),
      });
      originalConsole.error(...args);
    };

    let result: any;
    let executeError: any = null;

    try {
      // Execute as a function body
      const fn = new Function(jsCode);
      result = fn();
    } catch (err: any) {
      executeError = err;
    } finally {
      // Restore console
      window.console.log = originalConsole.log;
      window.console.warn = originalConsole.warn;
      window.console.error = originalConsole.error;
    }

    // Process errors
    if (executeError) {
      const errMsg = executeError.message || String(executeError);
      const firstLine = errMsg.split('\n')[0];
      toast.error(firstLine);

      capturedLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        type: 'error',
        text: `${executeError.name}: ${executeError.message}${executeError.stack ? '\n' + executeError.stack : ''}`,
        timestamp: getTimestamp(),
      });
    } else if (result !== undefined) {
      // Process successful return value
      let resultText = '';
      if (typeof result === 'object') {
        try { resultText = JSON.stringify(result, null, 2); } catch { resultText = String(result); }
      } else {
        resultText = String(result);
      }

      capturedLogs.push({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        type: 'result',
        text: resultText,
        timestamp: getTimestamp(),
      });
    }

    // Append to existing logs
    setLogs(prev => [...prev, ...capturedLogs]);
  };

  const clearOutput = () => {
    setLogs([]);
  };

  const copyLastOutput = () => {
    if (logs.length === 0) return;
    const lastLog = logs[logs.length - 1];
    navigator.clipboard.writeText(lastLog.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="console-runner-panel"
      className="fixed bottom-0 left-0 right-0 h-96 bg-[#0B0914] border-t border-accent-purple/30 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-all duration-300"
    >
      {/* Header Tabs */}
      <div id="console-runner-header" className="flex items-center justify-between px-4 py-1.5 border-b border-white/5 bg-[#0D0B16] select-none">
        
        {/* Tab switchers on left */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveConsoleTab('runner')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeConsoleTab === 'runner'
                ? 'bg-accent-purple/20 text-text-primary border border-accent-purple/30'
                : 'text-text-secondary hover:text-white hover:bg-hover-bg/30 border border-transparent'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-accent-purple" />
            <span>Runner</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('terminal')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeConsoleTab === 'terminal'
                ? 'bg-accent-purple/20 text-text-primary border border-accent-purple/30'
                : 'text-text-secondary hover:text-white hover:bg-hover-bg/30 border border-transparent'
            }`}
          >
            <TermIcon className="w-3.5 h-3.5 text-accent-purple" />
            <span>Terminal</span>
          </button>
        </div>

        {/* Dynamic Controls based on tab */}
        {activeConsoleTab === 'runner' ? (
          <div className="flex items-center gap-3">
            {/* Language Selector JS/Python */}
            <div className="flex bg-[#12101C] p-0.5 rounded-lg border border-border-accent/20">
              <button
                onClick={() => setRunnerLang('javascript')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                  runnerLang === 'javascript'
                    ? 'bg-accent-purple text-white shadow-xs'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                JS
              </button>
              <button
                onClick={() => setRunnerLang('python')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                  runnerLang === 'python'
                    ? 'bg-accent-purple text-white shadow-xs'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                Python
              </button>
            </div>

            <button
              onClick={executeCode}
              disabled={isLoadingPyodide}
              className="flex items-center gap-1.5 px-3 py-1 bg-accent-purple hover:bg-accent-purple/80 text-white rounded text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Ctrl + Enter"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{t('console.run')}</span>
            </button>
            
            <button
              onClick={clearOutput}
              className="p-1 hover:bg-white/5 text-slate-400 hover:text-text-primary rounded transition-all cursor-pointer"
              title={t('console.clear')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={copyLastOutput}
              disabled={logs.length === 0}
              className={`p-1 rounded transition-all cursor-pointer ${
                logs.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-white/5 hover:text-text-primary'
              }`}
              title={t('console.copy')}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline uppercase">
              {lang === 'uk' ? 'Режим псевдо-терміналу' : 'Pseudo-shell emulation mode'}
            </span>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeConsoleTab === 'terminal' ? (
          <TerminalTab isOpen={isOpen && activeConsoleTab === 'terminal'} />
        ) : (
          <div id="console-runner-layout" className="w-full h-full flex flex-col md:flex-row overflow-hidden">
            
            {/* Loading spinner overlay for Pyodide */}
            {isLoadingPyodide && (
              <div className="absolute inset-0 bg-[#07050B]/80 z-50 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-accent-purple animate-spin" />
                <span className="font-mono text-xs text-text-secondary">
                  {lang === 'uk' ? 'Завантаження Python середовища (Pyodide ~10MB)...' : 'Loading Python environment (Pyodide ~10MB)...'}
                </span>
              </div>
            )}

            {/* Monaco Editor side */}
            <div id="console-editor-section" className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-white/5 bg-[#090710] flex flex-col">
              <div className="p-1.5 bg-slate-950/80 border-b border-white/5 text-[10px] font-mono text-slate-400 px-3 uppercase tracking-wider flex justify-between items-center select-none">
                <span>{runnerLang === 'javascript' ? 'JavaScript Editor' : 'Python Editor'}</span>
                <span className="text-[9px] text-slate-500">Ctrl+Enter to run</span>
              </div>
              <div className="flex-1 min-h-[120px] relative">
                <Editor
                  height="100%"
                  language={runnerLang}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    automaticLayout: true,
                    padding: { top: 8, bottom: 8 },
                    backgroundColor: '#090710',
                    fontFamily: 'JetBrains Mono',
                    cursorBlinking: 'smooth',
                    tabSize: 2,
                  }}
                />
              </div>
            </div>

            {/* Output log side */}
            <div id="console-output-section" className="flex-1 flex flex-col bg-[#07050B] overflow-hidden">
              <div className="p-1.5 bg-slate-950/80 border-b border-white/5 text-[10px] font-mono text-slate-400 px-3 uppercase tracking-wider select-none">
                <span>Output Log</span>
              </div>

              <div id="console-output-list" className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2 select-text custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic flex items-center justify-center h-full gap-2">
                    <TermIcon className="w-4 h-4 text-slate-700" />
                    <span>{t('console.output_placeholder')}</span>
                  </div>
                ) : (
                  logs.map((log) => {
                    let textClass = 'text-slate-300';
                    let Icon = Info;
                    let iconColor = 'text-blue-400';
                    let bgStyle = 'bg-blue-500/5 border-blue-500/10';

                    if (log.type === 'warn') {
                      textClass = 'text-amber-300';
                      Icon = AlertCircle;
                      iconColor = 'text-amber-400';
                      bgStyle = 'bg-amber-500/5 border-amber-500/10';
                    } else if (log.type === 'error') {
                      textClass = 'text-rose-400 font-medium whitespace-pre-wrap';
                      Icon = X;
                      iconColor = 'text-rose-400';
                      bgStyle = 'bg-rose-500/5 border-rose-500/10';
                    } else if (log.type === 'result') {
                      textClass = 'text-emerald-300 font-semibold';
                      Icon = Check;
                      iconColor = 'text-emerald-400';
                      bgStyle = 'bg-emerald-500/5 border-emerald-500/10';
                    }

                    return (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded border flex gap-2.5 transition-all ${bgStyle}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                        <div className="flex-1 overflow-x-auto">
                          <div className="flex items-center justify-between gap-4 mb-0.5 opacity-50 select-none">
                            <span className="text-[10px] uppercase font-bold text-slate-500">{log.type === 'result' ? 'RETURN VALUE' : log.type}</span>
                            <span className="text-[9px] text-slate-500">{log.timestamp}</span>
                          </div>
                          <pre className={`${textClass} break-all font-mono whitespace-pre-wrap`}>{log.text}</pre>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
});
