import React, { useState, useEffect } from 'react';
import { extensionEngine, ExtensionManifest } from '../../core/extensions/ExtensionEngine';
import { Layers, CheckCircle2, XCircle, Puzzle, ShieldCheck } from 'lucide-react';

export const ExtensionsPanel: React.FC = () => {
  const [extensions, setExtensions] = useState<ExtensionManifest[]>(extensionEngine.getExtensions());

  useEffect(() => {
    const unsubscribe = extensionEngine.subscribe(() => {
      setExtensions(extensionEngine.getExtensions());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 p-3 space-y-3">
      <div className="flex items-center gap-2 border-b border-purple-900/30 pb-2">
        <Puzzle className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
          Extensions Manager ({extensions.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-900">
        {extensions.map((ext) => (
          <div
            key={ext.id}
            className={`p-3 rounded-xl border transition-all ${
              ext.enabled
                ? 'bg-purple-950/20 border-purple-500/30 text-white'
                : 'bg-black/40 border-white/5 text-gray-400'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-200">
                  <span>{ext.name}</span>
                  <span className="text-[10px] text-purple-400 font-mono bg-purple-900/30 px-1.5 py-0.5 rounded">
                    v{ext.version}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2">{ext.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{ext.publisher}</span>
                </div>
              </div>

              <button
                onClick={() => extensionEngine.toggleExtension(ext.id)}
                className={`px-2 py-1 rounded text-xs font-medium transition shrink-0 ${
                  ext.enabled
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {ext.enabled ? 'Увімкнено' : 'Вимкнено'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
