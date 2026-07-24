import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTranslation } from '../i18n/translations';
import { useAppContext } from '../context/AppContext';
import { executePythonCode } from '../utils/pythonRunner';
import { 
  stripTypeScript, 
  executeCCode, 
  executeJavaCode, 
  executeRustCode, 
  executeGoCode, 
  executeSqlQueries, 
  executeShellScript 
} from '../utils/polyglotRunner';

export const TerminalTab: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { settings } = useAppContext();
  const { lang } = useTranslation();

  // Command state
  const currentLineRef = useRef<string>('');
  const historyIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!isOpen || !terminalContainerRef.current) return;

    // Create terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#07050B',
        foreground: '#E9E3F5',
        cursor: '#A855F7',
        cursorAccent: '#07050B',
        black: '#07050B',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#06B6D4',
        white: '#E9E3F5',
      },
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      fontSize: 12,
      lineHeight: 1.4,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalContainerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial message
    term.writeln('\x1b[1;35m⚡ NEXUS Secure Terminal Emulator v1.2.0\x1b[0m');
    term.writeln(lang === 'uk' ? 'Введіть \x1b[1;36mhelp\x1b[0m для списку доступних команд.\n' : 'Type \x1b[1;36mhelp\x1b[0m to list available commands.\n');

    // Prompt helper
    const promptUser = "nexus@dev:~$ ";
    const writePrompt = () => {
      term.write(`\r\x1b[1;35m${promptUser}\x1b[0m`);
    };
    writePrompt();

    // Key event handling loop
    let currentLine = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      // Carriage return / Enter
      if (data === '\r') {
        term.write('\r\n');
        executeCommand(currentLine.trim(), term);
        currentLine = '';
        currentLineRef.current = '';
        historyIndexRef.current = -1;
        writePrompt();
      }
      // Backspace
      else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          currentLineRef.current = currentLine;
          term.write('\b \b');
        }
      }
      // Arrow keys / Special ANSI
      else if (data === '\x1b[A' || data === '\x1b[B') {
        const history = getCmdHistory();
        if (history.length === 0) return;

        // Clear current characters on screen
        for (let i = 0; i < currentLine.length; i++) {
          term.write('\b \b');
        }

        if (data === '\x1b[A') { // UP
          if (historyIndexRef.current < history.length - 1) {
            historyIndexRef.current++;
          }
        } else { // DOWN
          if (historyIndexRef.current > -1) {
            historyIndexRef.current--;
          }
        }

        const hCmd = historyIndexRef.current === -1 ? '' : history[historyIndexRef.current];
        currentLine = hCmd;
        currentLineRef.current = hCmd;
        term.write(hCmd);
      }
      // Paste, inputs
      else {
        // Prevent typing non-printable characters or control sequences
        if (code >= 32 && data.length === 1) {
          currentLine += data;
          currentLineRef.current = currentLine;
          term.write(data);
        }
      }
    });

    // Handle resizing window
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      } catch (err) {
        // ignore fast transition resizing anomalies
      }
    });
    resizeObserver.observe(terminalContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [isOpen, lang]);

  // Command History getter/setter
  const getCmdHistory = (): string[] => {
    try {
      const h = localStorage.getItem('nexus_terminal_history');
      return h ? JSON.parse(h) : [];
    } catch {
      return [];
    }
  };

  const pushCmdHistory = (cmd: string) => {
    if (!cmd) return;
    try {
      const history = getCmdHistory();
      const updated = [cmd, ...history.filter(c => c !== cmd)].slice(0, 50);
      localStorage.setItem('nexus_terminal_history', JSON.stringify(updated));
    } catch (err) {
      // ignore
    }
  };

  const executeCommand = (fullCmd: string, term: Terminal) => {
    if (!fullCmd) return;
    pushCmdHistory(fullCmd);

    const parts = fullCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        term.writeln(lang === 'uk' ? 'Доступні команди:' : 'Available commands:');
        term.writeln('  \x1b[1;36mhelp\x1b[0m              - ' + (lang === 'uk' ? 'показати цей довідник' : 'show this help'));
        term.writeln('  \x1b[1;36mls\x1b[0m / \x1b[1;36mdir\x1b[0m          - ' + (lang === 'uk' ? 'список файлів з Редактора коду' : 'list files from Code Editor'));
        term.writeln('  \x1b[1;36mcat <file>\x1b[0m          - ' + (lang === 'uk' ? 'переглянути вміст файлу' : 'view file content'));
        term.writeln('  \x1b[1;36mnode <file>\x1b[0m         - ' + (lang === 'uk' ? 'запустити JS / TS файл' : 'execute JS / TS file'));
        term.writeln('  \x1b[1;36mpython <file>\x1b[0m       - ' + (lang === 'uk' ? 'запустити Python файл' : 'execute Python file'));
        term.writeln('  \x1b[1;36mgcc <file>\x1b[0m          - ' + (lang === 'uk' ? 'скомпілювати та виконати C/C++' : 'compile and run C/C++'));
        term.writeln('  \x1b[1;36mjava <file>\x1b[0m         - ' + (lang === 'uk' ? 'виконати Java байткод' : 'execute Java code'));
        term.writeln('  \x1b[1;36mrustc <file>\x1b[0m        - ' + (lang === 'uk' ? 'виконати Rust код' : 'compile and run Rust'));
        term.writeln('  \x1b[1;36mgo run <file>\x1b[0m       - ' + (lang === 'uk' ? 'виконати Go код' : 'execute Go code'));
        term.writeln('  \x1b[1;36mbash <file>\x1b[0m         - ' + (lang === 'uk' ? 'виконати Shell скрипт' : 'execute Shell script'));
        term.writeln('  \x1b[1;36msql <file>\x1b[0m          - ' + (lang === 'uk' ? 'виконати SQL запити' : 'execute SQL queries'));
        term.writeln('  \x1b[1;36mcalc <expr>\x1b[0m         - ' + (lang === 'uk' ? 'обчислити математичний вираз' : 'evaluate math expression'));
        term.writeln('  \x1b[1;36mclear\x1b[0m               - ' + (lang === 'uk' ? 'очистити екран' : 'clear screen'));
        term.writeln('  \x1b[1;36mhistory\x1b[0m             - ' + (lang === 'uk' ? 'останні 50 команд' : 'last 50 command history'));
        break;

      case 'ls':
      case 'dir':
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            if (files.length === 0) {
              term.writeln(lang === 'uk' ? 'Файлів не знайдено.' : 'No files found.');
            } else {
              files.forEach((f: any) => {
                term.writeln(`- \x1b[1;32m${f.name}\x1b[0m  (${f.language})  - ${f.content.length} B`);
              });
            }
          } else {
            term.writeln(lang === 'uk' ? 'Файлів не знайдено.' : 'No files found.');
          }
        } catch {
          term.writeln('\x1b[1;31mError reading file registry\x1b[0m');
        }
        break;

      case 'cat':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть ім\'я файлу (наприклад: cat index.html)' : 'Error: specify filename (e.g. cat index.html)');
          break;
        }
        const targetFile = args[0];
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === targetFile.toLowerCase());
            if (found) {
              term.writeln(found.content);
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${targetFile}\x1b[0m`);
            }
          }
        } catch {
          term.writeln('\x1b[1;31mError accessing storage\x1b[0m');
        }
        break;

      case 'echo':
        term.writeln(args.join(' '));
        break;

      case 'clear':
      case 'cls':
        term.write('\x1b[2J\x1b[0;0H');
        break;

      case 'date':
        term.writeln(new Date().toString());
        break;

      case 'whoami':
        term.writeln(`nexus-user / stasukilla296`);
        break;

      case 'python':
      case 'python3':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть файл .py' : 'Error: specify .py file');
          break;
        }
        (async () => {
          try {
            const filesSaved = localStorage.getItem('nexus_code_files');
            if (filesSaved) {
              const files = JSON.parse(filesSaved);
              const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase() || f.name.toLowerCase() === `${args[0].toLowerCase()}.py`);
              if (found) {
                term.writeln(`\x1b[1;35m[Python3 Executing ${found.name}...]\x1b[0m`);
                const pyRes = await executePythonCode(found.content, lang);
                pyRes.logs.forEach(l => {
                  if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                  else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                  else term.writeln(l.text);
                });
              } else {
                term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
              }
            }
          } catch (err: any) {
            term.writeln(`\x1b[1;31mPython execution error: ${err.message}\x1b[0m`);
          }
        })();
        break;

      case 'gcc':
      case 'g++':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть C/C++ файл' : 'Error: specify C/C++ file');
          break;
        }
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[Compiling & Executing ${found.name}...]\x1b[0m`);
              const cRes = executeCCode(found.content);
              cRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mC/C++ Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'java':
      case 'javac':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть Java файл' : 'Error: specify Java file');
          break;
        }
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[Executing Java Bytecode for ${found.name}...]\x1b[0m`);
              const jRes = executeJavaCode(found.content);
              jRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mJava Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'rustc':
      case 'cargo':
        if (args.length === 0) {
          term.writeln('Error: specify Rust .rs file');
          break;
        }
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[rustc compiling & running ${found.name}...]\x1b[0m`);
              const rRes = executeRustCode(found.content);
              rRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mRust Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'go':
        if (args.length === 0 || (args[0] !== 'run' && !args[0].endsWith('.go'))) {
          term.writeln('Usage: go run <file.go>');
          break;
        }
        const goFileName = args[0] === 'run' ? args[1] : args[0];
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved && goFileName) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === goFileName.toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[go run ${found.name}...]\x1b[0m`);
              const gRes = executeGoCode(found.content);
              gRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${goFileName}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mGo Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'bash':
      case 'sh':
        if (args.length === 0) {
          term.writeln('Usage: bash <file.sh>');
          break;
        }
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[Executing shell script ${found.name}...]\x1b[0m`);
              const shRes = executeShellScript(found.content);
              shRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mShell Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'sql':
      case 'sqlite3':
        if (args.length === 0) {
          term.writeln('Usage: sql <file.sql>');
          break;
        }
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === args[0].toLowerCase());
            if (found) {
              term.writeln(`\x1b[1;35m[Executing SQL queries in ${found.name}...]\x1b[0m`);
              const sqlRes = executeSqlQueries(found.content);
              sqlRes.logs.forEach(l => {
                if (l.type === 'error') term.writeln(`\x1b[1;31m${l.text}\x1b[0m`);
                else if (l.type === 'result') term.writeln(`\x1b[1;32m${l.text}\x1b[0m`);
                else term.writeln(l.text);
              });
            } else {
              term.writeln(`\x1b[1;31mFile not found: ${args[0]}\x1b[0m`);
            }
          }
        } catch (err: any) {
          term.writeln(`\x1b[1;31mSQL Execution Error: ${err.message}\x1b[0m`);
        }
        break;

      case 'node':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть ім\'я JS/TS-файлу (наприклад: node script.js)' : 'Error: specify JS/TS file (e.g. node script.js)');
          break;
        }
        const jsFile = args[0];
        try {
          const filesSaved = localStorage.getItem('nexus_code_files');
          if (filesSaved) {
            const files = JSON.parse(filesSaved);
            const found = files.find((f: any) => f.name.toLowerCase() === jsFile.toLowerCase());
            if (!found) {
              term.writeln(`\x1b[1;31mFile not found: ${jsFile}\x1b[0m`);
            } else {
              term.writeln(`\x1b[1;35mExecuting ${jsFile} in sandboxed context...\x1b[0m`);
              
              const codeToRun = (found.language === 'typescript' || found.name.endsWith('.ts'))
                ? stripTypeScript(found.content)
                : found.content;

              try {
                const fn = new Function(codeToRun);
                const result = fn();
                if (result !== undefined) {
                  term.writeln(`\x1b[1;32mReturn: ${typeof result === 'object' ? JSON.stringify(result) : result}\x1b[0m`);
                } else {
                  term.writeln(`\x1b[1;30m(Executed successfully with undefined return)\x1b[0m`);
                }
              } catch (ex: any) {
                term.writeln(`\x1b[1;31mRuntime Error: ${ex.message}\x1b[0m`);
              }
            }
          }
        } catch {
          term.writeln('\x1b[1;31mError executing node script\x1b[0m');
        }
        break;

      case 'calc':
        if (args.length === 0) {
          term.writeln(lang === 'uk' ? 'Помилка: вкажіть вираз (наприклад: calc 5 * 8)' : 'Error: specify expression (e.g. calc 5 * 8)');
          break;
        }
        const expr = args.join(' ');
        try {
          // Safe evaluation using simple arithmetic sanitizer or math evaluate
          const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
          const result = new Function(`return (${sanitized})`)();
          term.writeln(`= \x1b[1;32m${result}\x1b[0m`);
        } catch (err: any) {
          term.writeln(`\x1b[1;31mError evaluating expression: ${err.message}\x1b[0m`);
        }
        break;

      case 'history':
        const hList = getCmdHistory();
        if (hList.length === 0) {
          term.writeln(lang === 'uk' ? 'Історія порожня.' : 'History is empty.');
        } else {
          hList.reverse().forEach((cmd, idx) => {
            term.writeln(`  ${idx + 1}  ${cmd}`);
          });
        }
        break;

      default:
        term.writeln(`\x1b[1;31mCommand not found: ${command}\x1b[0m`);
    }
  };

  return (
    <div className="w-full h-full bg-[#07050B] overflow-hidden p-2">
      <div 
        ref={terminalContainerRef} 
        className="w-full h-full min-h-[160px]" 
        style={{ outline: 'none' }}
      />
    </div>
  );
};
