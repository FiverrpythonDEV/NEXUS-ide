import React, { useState, useEffect } from 'react';
import { debugService, Breakpoint, DebugState } from '../../services/debugger/DebugService';
import { editorService } from '../../core/editor/EditorService';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCw, 
  ArrowRight, 
  CornerDownRight, 
  Bug, 
  Terminal, 
  Layers, 
  Variable,
  Trash2
} from 'lucide-react';

export const DebugPanel: React.FC = () => {
  const [state, setState] = useState<DebugState>(debugService.getState());
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(debugService.getBreakpoints());
  const [variables, setVariables] = useState(debugService.getVariables());
  const [callStack, setCallStack] = useState(debugService.getCallStack());
  const [logs, setLogs] = useState(debugService.getConsoleLogs());

  useEffect(() => {
    const unsubscribe = debugService.subscribe(() => {
      setState(debugService.getState());
      setBreakpoints(debugService.getBreakpoints());
      setVariables(debugService.getVariables());
      setCallStack(debugService.getCallStack());
      setLogs([...debugService.getConsoleLogs()]);
    });
    return unsubscribe;
  }, []);

  const handleStart = () => {
    const activeTab = editorService.getActiveTab();
    if (activeTab) {
      debugService.startDebugging(activeTab.fileId, activeTab.path);
    } else {
      alert('Будь ласка, відкрийте файл у редакторі для запуску відлагоджувача.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 p-3 space-y-3">
      {/* Control Toolbar */}
      <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
          <Bug className="w-4 h-4 text-purple-400" /> Debugger
        </div>

        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-purple-500/30">
          {state === 'stopped' ? (
            <button
              onClick={handleStart}
              title="Запустити відлагоджувач (F5)"
              className="p-1 hover:bg-emerald-600/30 text-emerald-400 rounded"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => debugService.continueExecution()}
                title="Продовжити виконання"
                className="p-1 hover:bg-purple-600/30 text-purple-300 rounded"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => debugService.stepOver()}
                title="Крок з обходом (Step Over)"
                className="p-1 hover:bg-purple-600/30 text-purple-300 rounded"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => debugService.stepInto()}
                title="Крок з заходом (Step Into)"
                className="p-1 hover:bg-purple-600/30 text-purple-300 rounded"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => debugService.stopDebugging()}
                title="Зупинити відлагоджувач"
                className="p-1 hover:bg-red-600/30 text-red-400 rounded"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-purple-900">
        {/* Variables Inspector */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Variable className="w-3 h-3 text-purple-400" /> Variables Panel
          </span>
          <div className="bg-black/50 border border-purple-900/30 rounded p-2 text-xs font-mono space-y-1">
            {variables.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">Немає локальних змінних в даному контексті</p>
            ) : (
              variables.map((v) => (
                <div key={v.name} className="flex justify-between">
                  <span className="text-purple-300 font-semibold">{v.name}:</span>
                  <span className="text-emerald-300 truncate max-w-[150px]">{v.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call Stack */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Call Stack
          </span>
          <div className="bg-black/50 border border-purple-900/30 rounded p-2 text-xs font-mono space-y-1">
            {callStack.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">Стек викликів порожній</p>
            ) : (
              callStack.map((cs, idx) => (
                <div key={idx} className="text-[11px] text-gray-300 flex justify-between">
                  <span className="text-purple-300 font-medium">{cs.functionName}()</span>
                  <span className="text-gray-500">{cs.file}:{cs.line}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Breakpoints */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Bug className="w-3 h-3 text-red-400" /> Breakpoints ({breakpoints.length})
          </span>
          <div className="bg-black/50 border border-purple-900/30 rounded p-2 text-xs font-mono space-y-1">
            {breakpoints.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">Точок зупинки не встановлено</p>
            ) : (
              breakpoints.map((bp) => (
                <div
                  key={bp.id}
                  className="flex items-center justify-between p-1 bg-purple-950/30 rounded border border-purple-900/30"
                >
                  <span className="text-purple-200 truncate">
                    {bp.filePath}:<strong className="text-red-400">{bp.lineNumber}</strong>
                  </span>
                  <button
                    onClick={() => debugService.toggleBreakpoint(bp.fileId, bp.filePath, bp.lineNumber)}
                    className="p-0.5 hover:text-red-400 text-gray-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Console Logs */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-purple-400" /> Debug Console
            </span>
            <button
              onClick={() => debugService.clearLogs()}
              className="text-[10px] text-gray-500 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="bg-black/60 border border-purple-900/30 rounded p-2 text-[11px] font-mono max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-purple-900">
            {logs.map((log, idx) => (
              <div key={idx} className="text-purple-300">
                <span className="text-gray-500">[{log.time}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
