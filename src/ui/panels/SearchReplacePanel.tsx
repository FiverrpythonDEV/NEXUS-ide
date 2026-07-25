import React, { useState } from 'react';
import { fileSystemService } from '../../core/filesystem/FileSystemService';
import { editorService } from '../../core/editor/EditorService';
import { FSNode } from '../../core/filesystem/types';
import { Search, Replace, FileCode, ArrowRight } from 'lucide-react';

interface SearchMatch {
  file: FSNode;
  line: number;
  lineText: string;
}

export const SearchReplacePanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setMatches([]);
      return;
    }

    const allFiles = fileSystemService.getAllFiles();
    const results: SearchMatch[] = [];

    allFiles.forEach((file) => {
      if (!file.content) return;
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            file,
            line: idx + 1,
            lineText: lineText.trim()
          });
        }
      });
    });

    setMatches(results);
  };

  const handleReplaceAll = () => {
    if (!searchTerm.trim() || matches.length === 0) return;

    const allFiles = fileSystemService.getAllFiles();
    allFiles.forEach((file) => {
      if (file.content && file.content.includes(searchTerm)) {
        const newContent = file.content.split(searchTerm).join(replaceTerm);
        fileSystemService.updateFileContent(file.id, newContent);
      }
    });

    editorService.getTabs().forEach((tab) => {
      if (tab.content.includes(searchTerm)) {
        const newContent = tab.content.split(searchTerm).join(replaceTerm);
        editorService.updateTabContent(tab.fileId, newContent);
      }
    });

    alert(`Замінено екземпляри "${searchTerm}" на "${replaceTerm}" у розширеному пошуку.`);
    handleSearch();
  };

  const handleMatchClick = (match: SearchMatch) => {
    editorService.openFile(match.file);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 p-3 space-y-3">
      <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
        <Search className="w-3.5 h-3.5" /> Global Search & Replace (Ctrl+Shift+F)
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Шукати по всьому проєкту..."
            className="w-full bg-black/60 border border-purple-500/40 text-xs text-white p-2 rounded-lg outline-none focus:border-purple-400"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Замінити на..."
            className="w-full bg-black/60 border border-purple-500/40 text-xs text-white p-2 rounded-lg outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition"
          >
            Шукати
          </button>
          <button
            onClick={handleReplaceAll}
            className="flex-1 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 rounded text-xs font-medium transition flex items-center justify-center gap-1"
          >
            <Replace className="w-3.5 h-3.5" /> Замінити все
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-900">
        <div className="text-[11px] text-gray-400 font-mono">
          Знайдено результатів: <span className="text-purple-300 font-bold">{matches.length}</span>
        </div>

        {matches.map((match, idx) => (
          <div
            key={`${match.file.id}-${match.line}-${idx}`}
            onClick={() => handleMatchClick(match)}
            className="p-2 bg-purple-950/20 hover:bg-purple-900/30 border border-purple-900/30 rounded-lg cursor-pointer text-xs space-y-1 transition"
          >
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-mono">
              <span className="flex items-center gap-1 truncate font-semibold">
                <FileCode className="w-3 h-3 text-purple-400 shrink-0" /> {match.file.name}
              </span>
              <span className="text-gray-500">Рядок {match.line}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono truncate bg-black/40 p-1 rounded">
              {match.lineText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
