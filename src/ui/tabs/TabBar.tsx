import React, { useState, useEffect } from 'react';
import { editorService, TabItem } from '../../core/editor/EditorService';
import { X, Save, Columns, FileCode, CheckCircle2 } from 'lucide-react';

interface Props {
  onToggleSplitPreview?: () => void;
  isSplitPreviewOpen?: boolean;
}

export const TabBar: React.FC<Props> = ({ onToggleSplitPreview, isSplitPreviewOpen }) => {
  const [tabs, setTabs] = useState<TabItem[]>(editorService.getTabs());
  const [activeTabId, setActiveTabId] = useState<string | null>(editorService.getActiveTabId());

  useEffect(() => {
    const unsubscribe = editorService.subscribe(() => {
      setTabs([...editorService.getTabs()]);
      setActiveTabId(editorService.getActiveTabId());
    });
    return unsubscribe;
  }, []);

  if (tabs.length === 0) {
    return (
      <div className="h-10 bg-[#090712] border-b border-purple-900/30 flex items-center px-4 text-xs text-gray-500">
        Немає відкритих файлів. Оберіть файл в Explorer.
      </div>
    );
  }

  return (
    <div className="h-10 bg-[#0a0815] border-b border-purple-900/30 flex items-center justify-between px-2 select-none overflow-x-auto scrollbar-none">
      {/* Scrollable Tabs Container */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 py-1">
        {tabs.map((tab) => {
          const isActive = tab.fileId === activeTabId;
          return (
            <div
              key={tab.fileId}
              onClick={() => editorService.setActiveTab(tab.fileId)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t-2 text-xs font-mono cursor-pointer transition-all shrink-0 max-w-[200px] ${
                isActive
                  ? 'bg-[#130f24] border-purple-500 text-purple-200 shadow-lg shadow-purple-950/50'
                  : 'bg-[#0a0815]/80 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
              
              <span className="truncate">
                {tab.name}
                {tab.isDirty && <span className="text-purple-400 font-bold ml-1">*</span>}
              </span>

              {tab.isDirty ? (
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 group-hover:hidden" />
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editorService.closeTab(tab.fileId);
                }}
                title="Закрити вкладку"
                className={`p-0.5 rounded hover:bg-purple-800/40 text-gray-400 hover:text-white shrink-0 ${
                  tab.isDirty ? 'group-hover:block hidden' : 'block'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Controls Right */}
      <div className="flex items-center gap-1 pl-2 border-l border-purple-900/30 shrink-0">
        <button
          onClick={() => editorService.saveActiveTab()}
          title="Зберегти файл (Ctrl+S)"
          className="p-1.5 hover:bg-purple-900/40 text-purple-300 hover:text-white rounded transition flex items-center gap-1 text-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Зберегти</span>
        </button>

        {onToggleSplitPreview && (
          <button
            onClick={onToggleSplitPreview}
            title="Переключити Live Preview / Split View"
            className={`p-1.5 rounded transition flex items-center gap-1 text-xs ${
              isSplitPreviewOpen
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'hover:bg-purple-900/40 text-gray-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        )}
      </div>
    </div>
  );
};
