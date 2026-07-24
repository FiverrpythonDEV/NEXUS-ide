import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/translations';
import { Search, ExternalLink, BookOpen, Terminal, Globe, HelpCircle } from 'lucide-react';

const POPULAR_TECHS = [
  { id: 'javascript', name: 'JavaScript', category: 'Frontend' },
  { id: 'typescript', name: 'TypeScript', category: 'Frontend' },
  { id: 'react', name: 'React', category: 'Frontend' },
  { id: 'node', name: 'Node.js', category: 'Backend' },
  { id: 'python', name: 'Python', category: 'Backend' },
  { id: 'go', name: 'Go', category: 'Backend' },
  { id: 'rust', name: 'Rust', category: 'Backend' },
  { id: 'cpp', name: 'C++', category: 'Backend' },
  { id: 'php', name: 'PHP', category: 'Backend' },
  { id: 'ruby', name: 'Ruby', category: 'Backend' },
  { id: 'postgres', name: 'PostgreSQL', category: 'Database' },
  { id: 'sqlite', name: 'SQLite', category: 'Database' },
  { id: 'docker', name: 'Docker', category: 'DevOps' },
  { id: 'css', name: 'CSS', category: 'Frontend' },
  { id: 'html', name: 'HTML', category: 'Frontend' },
];

export const DocsModule: React.FC = () => {
  const { t } = useTranslation();
  
  const [selectedTech, setSelectedTech] = useState<string>(() => {
    return localStorage.getItem('nexus_docs_last_tech') || 'javascript';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return localStorage.getItem('nexus_docs_last_query') || '';
  });

  const [inputVal, setInputVal] = useState<string>(searchQuery);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('nexus_docs_last_tech', selectedTech);
  }, [selectedTech]);

  useEffect(() => {
    localStorage.setItem('nexus_docs_last_query', searchQuery);
  }, [searchQuery]);

  // Construct iframe URL
  const getIframeUrl = () => {
    if (searchQuery.trim()) {
      return `https://devdocs.io/#q=${encodeURIComponent(searchQuery)}`;
    }
    return `https://devdocs.io/${selectedTech}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputVal);
  };

  const handleTechSelect = (techId: string) => {
    setSelectedTech(techId);
    setSearchQuery('');
    setInputVal('');
  };

  const handleOpenNewTab = () => {
    const url = getIframeUrl();
    window.open(url, '_blank');
  };

  return (
    <div id="docs-module-root" className="flex flex-col h-full bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden backdrop-blur-md">
      {/* Search and Action Bar */}
      <div id="docs-toolbar" className="flex flex-col md:flex-row gap-4 p-4 border-b border-white/5 bg-slate-950/60 items-center justify-between">
        <form id="docs-search-form" onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            id="docs-search-input"
            type="text"
            className="w-full bg-slate-900/80 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            placeholder={t('docs.search_placeholder')}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          {inputVal && (
            <button
              type="submit"
              className="absolute right-2 top-1.5 px-2 py-0.5 bg-violet-600 hover:bg-violet-500 text-xs text-white rounded font-medium transition-colors"
            >
              {t('console.run')}
            </button>
          )}
        </form>

        <div id="docs-actions" className="flex gap-2 w-full md:w-auto justify-end">
          <button
            id="docs-new-tab-btn"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 rounded-lg hover:text-white transition-all shadow-sm shadow-black/40 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
            <span>{t('docs.open_new_tab')}</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div id="docs-main-layout" className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Side: Popular Technologies */}
        <div id="docs-sidebar" className="w-full lg:w-64 p-4 border-r lg:border-b-0 border-b border-white/5 bg-slate-950/20 overflow-y-auto flex flex-col gap-3 min-w-[240px]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-1">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>{t('docs.popular_tech')}</span>
          </div>

          <div id="docs-tech-list" className="flex lg:flex-col flex-row flex-wrap gap-1">
            {POPULAR_TECHS.map((tech) => {
              const isActive = selectedTech === tech.id && !searchQuery;
              return (
                <button
                  key={tech.id}
                  id={`tech-btn-${tech.id}`}
                  onClick={() => handleTechSelect(tech.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left w-auto lg:w-full cursor-pointer ${
                    isActive
                      ? 'bg-violet-600/25 border border-violet-500/35 text-violet-300 shadow-sm shadow-violet-500/10'
                      : 'hover:bg-white/5 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80" />
                    <span>{tech.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 opacity-0 lg:opacity-100 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">
                    {tech.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: IFrame container */}
        <div id="docs-viewport-container" className="flex-1 flex flex-col bg-slate-950/80 relative">
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-slate-900/95 border border-white/10 text-[10px] text-slate-400 flex items-center gap-1 shadow-md">
            <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>devdocs.io</span>
          </div>
          
          <iframe
            id="docs-iframe"
            key={getIframeUrl()} // Force reload iframe on URL change
            src={getIframeUrl()}
            className="w-full flex-1 min-h-[500px] bg-slate-900"
            sandbox="allow-scripts allow-same-origin allow-popups"
            title="DevDocs Browser"
          />
        </div>
      </div>
    </div>
  );
};
