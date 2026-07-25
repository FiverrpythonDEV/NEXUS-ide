import React, { useState, useEffect } from 'react';
import { settingsService, NexusSettingsJson } from '../../core/settings/SettingsService';
import { Settings, Save, RotateCcw, FileJson } from 'lucide-react';

export const SettingsJsonEditor: React.FC = () => {
  const [jsonText, setJsonText] = useState(settingsService.getJsonString());
  const [settings, setSettings] = useState<NexusSettingsJson>(settingsService.getSettings());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = settingsService.subscribe(() => {
      setJsonText(settingsService.getJsonString());
      setSettings(settingsService.getSettings());
    });
    return unsubscribe;
  }, []);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    const valid = settingsService.updateFromJsonString(val);
    if (!valid) {
      setError('Помилка синтаксису JSON');
    } else {
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
          <FileJson className="w-4 h-4 text-purple-400" /> settings.json Config
        </div>
        {error && <span className="text-[10px] text-red-400 font-bold">{error}</span>}
      </div>

      {/* Quick Visual Controls */}
      <div className="grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-lg border border-purple-900/30 text-xs">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">Font Size:</label>
          <input
            type="number"
            value={settings['editor.fontSize']}
            onChange={(e) => settingsService.updateSetting('editor.fontSize', parseInt(e.target.value) || 14)}
            className="w-full bg-black/60 border border-purple-500/30 text-white p-1 rounded outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">Tab Size:</label>
          <input
            type="number"
            value={settings['editor.tabSize']}
            onChange={(e) => settingsService.updateSetting('editor.tabSize', parseInt(e.target.value) || 2)}
            className="w-full bg-black/60 border border-purple-500/30 text-white p-1 rounded outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">Minimap:</label>
          <button
            onClick={() => settingsService.updateSetting('editor.minimap', !settings['editor.minimap'])}
            className={`w-full py-1 rounded font-semibold ${
              settings['editor.minimap'] ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {settings['editor.minimap'] ? 'ON' : 'OFF'}
          </button>
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">Word Wrap:</label>
          <button
            onClick={() =>
              settingsService.updateSetting('editor.wordWrap', settings['editor.wordWrap'] === 'on' ? 'off' : 'on')
            }
            className={`w-full py-1 rounded font-semibold ${
              settings['editor.wordWrap'] === 'on' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {settings['editor.wordWrap'] === 'on' ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Raw JSON Config Editor */}
      <div className="flex-1 flex flex-col space-y-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Пряме редагування settings.json
        </span>
        <textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={12}
          className="flex-1 w-full bg-black/70 border border-purple-500/30 text-xs font-mono text-purple-200 p-2.5 rounded-lg outline-none focus:border-purple-400 resize-none scrollbar-thin scrollbar-thumb-purple-900"
        />
      </div>
    </div>
  );
};
