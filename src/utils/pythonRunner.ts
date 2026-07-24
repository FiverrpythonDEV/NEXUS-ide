/**
 * Python execution engine for NEXUS Code Editor & Dev Tools
 * Uses Skulpt (Python 3 in browser) with dynamic CDN loading and a fallback runner.
 */

let isSkulptLoading = false;
let skulptPromise: Promise<any> | null = null;

export function loadSkulpt(): Promise<any> {
  if ((window as any).Sk) {
    return Promise.resolve((window as any).Sk);
  }

  if (skulptPromise) {
    return skulptPromise;
  }

  isSkulptLoading = true;
  skulptPromise = new Promise((resolve, reject) => {
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js';
    script1.crossOrigin = 'anonymous';

    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js';
      script2.crossOrigin = 'anonymous';
      script2.onload = () => {
        isSkulptLoading = false;
        resolve((window as any).Sk);
      };
      script2.onerror = (err) => {
        isSkulptLoading = false;
        reject(err);
      };
      document.body.appendChild(script2);
    };

    script1.onerror = (err) => {
      isSkulptLoading = false;
      reject(err);
    };

    document.body.appendChild(script1);
  });

  return skulptPromise;
}

export interface PythonRunResult {
  logs: { type: 'log' | 'warn' | 'error' | 'result' | 'info'; text: string }[];
  error?: string;
}

export async function executePythonCode(code: string, lang: 'uk' | 'en' = 'uk'): Promise<PythonRunResult> {
  const logs: { type: 'log' | 'warn' | 'error' | 'result' | 'info'; text: string }[] = [];

  const addLog = (type: 'log' | 'warn' | 'error' | 'result' | 'info', text: string) => {
    logs.push({ type, text });
  };

  if (!code.trim()) {
    addLog('info', lang === 'uk' ? 'Файл порожній.' : 'File is empty.');
    return { logs };
  }

  // 1. Try Skulpt Engine
  try {
    const Sk = await loadSkulpt();

    let outputBuffer = '';

    Sk.configure({
      output: (text: string) => {
        outputBuffer += text;
        const parts = outputBuffer.split('\n');
        outputBuffer = parts.pop() ?? '';
        for (const part of parts) {
          addLog('log', part);
        }
      },
      read: (x: string) => {
        if (Sk.builtinFiles !== undefined && Sk.builtinFiles['files'][x] !== undefined) {
          return Sk.builtinFiles['files'][x];
        }

        // Search local NEXUS editor files for local imports (e.g., import helper or from utils import ...)
        try {
          const stored = localStorage.getItem('nexus_code_files');
          if (stored) {
            const files = JSON.parse(stored);
            const cleanName = x.replace(/^src\/(lib|builtin)\//, '').replace(/\.py$/, '').replace(/\/__init__$/, '');
            
            const match = files.find((f: any) => {
              const fname = (f.name || '').replace(/\.py$/, '');
              return fname === cleanName || f.name === cleanName || f.name === x;
            });

            if (match && match.content !== undefined) {
              return match.content;
            }
          }
        } catch (_) {}

        throw new Error(`File not found: '${x}'`);
      },
      __future__: Sk.python3,
    });

    const promise = Sk.misceval.asyncToPromise(() => {
      return Sk.importMainWithBody('<stdin>', false, code, true);
    });

    await promise;

    if (outputBuffer.length > 0) {
      addLog('log', outputBuffer);
    }

    if (logs.length === 0) {
      addLog('info', lang === 'uk' ? '✓ Код Python виконано успішно (без виводу).' : '✓ Python code executed successfully (no output).');
    }

    return { logs };
  } catch (skError: any) {
    if (skError && skError.tp$name) {
      // Skulpt Python exception
      const errorStr = skError.toString();
      const lineNum = skError.traceback && skError.traceback.length > 0 ? skError.traceback[0].lineno : null;
      const lineText = lineNum ? (lang === 'uk' ? ` [Рядок ${lineNum}]` : ` [Line ${lineNum}]`) : '';
      addLog('error', `✖ Python Error${lineText}: ${errorStr}`);
      return { logs, error: errorStr };
    }

    // Skulpt CDN load failed or offline fallback
    return executePythonFallback(code, lang);
  }
}

/**
 * Fallback lightweight Python transpiler/runner when offline
 */
function executePythonFallback(code: string, lang: 'uk' | 'en'): PythonRunResult {
  const logs: { type: 'log' | 'warn' | 'error' | 'result' | 'info'; text: string }[] = [];

  const addLog = (type: 'log' | 'warn' | 'error' | 'result' | 'info', text: string) => {
    logs.push({ type, text });
  };

  try {
    // Preprocess Python code to JS
    let jsCode = code;

    // Convert imports
    jsCode = jsCode.replace(/import\s+json/g, 'const json = { dumps: (obj, opts) => JSON.stringify(obj, null, 2), loads: (s) => JSON.parse(s) };');
    jsCode = jsCode.replace(/from\s+json\s+import\s+(.*)/g, 'const json = { dumps: (obj, opts) => JSON.stringify(obj, null, 2), loads: (s) => JSON.parse(s) };');
    jsCode = jsCode.replace(/import\s+math/g, 'const math = Math;');
    jsCode = jsCode.replace(/import\s+random/g, 'const random = { random: Math.random, randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, choice: (arr) => arr[Math.floor(Math.random() * arr.length)] };');
    jsCode = jsCode.replace(/import\s+[a-zA-Z0-9_]+/g, '// import skipped in fallback');

    // Convert booleans / None
    jsCode = jsCode.replace(/\bTrue\b/g, 'true')
                   .replace(/\bFalse\b/g, 'false')
                   .replace(/\bNone\b/g, 'null');

    // Convert print statements
    jsCode = jsCode.replace(/print\s*\((.*?)\)/g, (_, args) => {
      return `__py_print(${args});`;
    });

    // Convert f-strings in backticks or quotes
    jsCode = jsCode.replace(/f(["'])(.*?)\1/g, (_, quote, content) => {
      const converted = content.replace(/\{([^}]+)\}/g, '${$1}');
      return '`' + converted + '`';
    });

    // Convert def function_name(args): -> function function_name(args) {
    jsCode = jsCode.replace(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'function $1($2) {');

    // Convert class ClassName: -> class ClassName {
    jsCode = jsCode.replace(/class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?:/g, 'class $1 {');

    // Convert if/elif/else
    jsCode = jsCode.replace(/elif\s+(.*?):/g, '} else if ($1) {');
    jsCode = jsCode.replace(/if\s+(.*?):/g, 'if ($1) {');
    jsCode = jsCode.replace(/else:/g, '} else {');

    // Convert for var in range(n):
    jsCode = jsCode.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+range\((.*?)\):/g, (_, varName, rangeArgs) => {
      const parts = rangeArgs.split(',').map((p: string) => p.trim());
      if (parts.length === 1) {
        return `for (let ${varName} = 0; ${varName} < ${parts[0]}; ${varName}++) {`;
      } else if (parts.length === 2) {
        return `for (let ${varName} = ${parts[0]}; ${varName} < ${parts[1]}; ${varName}++) {`;
      } else {
        return `for (let ${varName} = ${parts[0]}; ${varName} < ${parts[1]}; ${varName} += ${parts[2]}) {`;
      }
    });

    // Convert for var in list:
    jsCode = jsCode.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+(.*?):/g, 'for (let $1 of $2) {');

    // Convert while expr:
    jsCode = jsCode.replace(/while\s+(.*?):/g, 'while ($1) {');

    // Fix self. in classes
    jsCode = jsCode.replace(/def __init__\(self,?\s*(.*?)\):/g, 'constructor($1) {');
    jsCode = jsCode.replace(/\bself\./g, 'this.');

    // Auto-close open braces for Python indentation blocks
    const lines = jsCode.split('\n');
    let openBraces = 0;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim().endsWith('{')) openBraces++;
      processedLines.push(l);
    }

    for (let b = 0; b < openBraces; b++) {
      processedLines.push('}');
    }

    const finalJs = processedLines.join('\n');

    const printOutputs: string[] = [];
    const customPrint = (...args: any[]) => {
      const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      addLog('log', formatted);
      printOutputs.push(formatted);
    };

    const mathObj = Math;

    const fn = new Function('__py_print', 'math', 'Math', finalJs);
    fn(customPrint, mathObj, mathObj);

    if (logs.length === 0) {
      addLog('info', lang === 'uk' ? '✓ Виконано успішно.' : '✓ Executed successfully.');
    }

    return { logs };
  } catch (err: any) {
    addLog('error', `✖ Fallback Python Runner: ${err?.message || String(err)}`);
    return { logs, error: err?.message };
  }
}
