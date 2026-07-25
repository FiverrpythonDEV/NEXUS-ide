import React, { useState, useEffect } from 'react';
import { fileSystemService } from '../../core/filesystem/FileSystemService';
import { editorService } from '../../core/editor/EditorService';
import { FSNode } from '../../core/filesystem/types';
import { Search, FileCode, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickOpenModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FSNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const all = fileSystemService.getAllFiles();
      setFiles(all);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.path.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredFiles.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredFiles.length) % (filteredFiles.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        editorService.openFile(filteredFiles[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#120e24] border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-purple-900/40 flex items-center gap-2 bg-[#0a0815]">
          <Search className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Введіть ім'я файлу для швидкого переходу (Ctrl+P)..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          <button onClick={onClose} className="p-1 hover:text-purple-300 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-900">
          {filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">Файлів за запитом не знайдено</div>
          ) : (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    editorService.openFile(file);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileCode className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                    {file.path}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <div className="p-2 border-t border-purple-900/30 bg-[#080612] text-[10px] text-gray-500 flex justify-between">
          <span>↑↓ Навігація • Enter Відкрити</span>
          <span>Esc Закрити</span>
        </div>
      </div>
    </div>
  );
};
