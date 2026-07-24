import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { MODULE_REGISTRY } from '../modules/registry';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ui/Toast';
import { 
  Search, 
  Terminal, 
  Compass, 
  Settings, 
  Plus, 
  Palette, 
  BookOpen, 
  Layers,
  Code2,
  Braces,
  Bookmark
} from 'lucide-react';
import { ModuleId } from '../types';

interface CommandItem {
  id: string;
  category: 'Навігація' | 'Швидкі Дії' | 'Тема & Налаштування';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { 
    setModule, 
    addNote, 
    updateSettings, 
    projects, 
    notes, 
    snippets, 
    cheatsheets, 
    bookmarks 
  } = useAppContext();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle Command Palette on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Load editor workspace files dynamically from localStorage
  const editorFiles = useMemo(() => {
    try {
      const saved = localStorage.getItem('nexus_code_files');
      if (saved) {
        return JSON.parse(saved) as any[];
      }
    } catch (e) {
      // ignore
    }
    return [];
  }, [isOpen]); // reload files when palette is opened

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Navigation items from registry
    MODULE_REGISTRY.forEach((mod) => {
      list.push({
        id: `nav-${mod.id}`,
        category: 'Навігація',
        title: `Перейти: ${mod.name}`,
        subtitle: mod.description,
        icon: mod.icon,
        action: () => {
          setModule(mod.id);
          toast.info(`Перехід: ${mod.name}`);
        },
      });
    });

    // 2. Global search over Projects
    projects.forEach((proj) => {
      list.push({
        id: `search-proj-${proj.id}`,
        category: 'Проєкти' as any,
        title: `Проєкт: ${proj.name}`,
        subtitle: `Статус: ${proj.status} • ${proj.description}`,
        icon: Layers,
        action: () => {
          setModule('project-tracker');
          toast.info(`Відкрито трекер: ${proj.name}`);
        }
      });
    });

    // 3. Global search over Notes (Knowledge Base)
    notes.forEach((note) => {
      list.push({
        id: `search-note-${note.id}`,
        category: 'Нотатки' as any,
        title: `Нотатка: ${note.title}`,
        subtitle: note.content.replace(/[#*`\n]/g, ' ').substring(0, 90) + '...',
        icon: BookOpen,
        action: () => {
          setModule('knowledge-base');
          toast.info(`Перехід до нотатки: ${note.title}`);
        }
      });
    });

    // 4. Global search over Code Workspace Files
    editorFiles.forEach((file) => {
      list.push({
        id: `search-file-${file.id}`,
        category: 'Файли Редактора' as any,
        title: `Файл коду: ${file.name}`,
        subtitle: `Мова: ${file.language} • Перегляд / редагування коду`,
        icon: Code2,
        action: () => {
          setModule('code-editor');
          toast.info(`Відкрито файл: ${file.name}`);
        }
      });
    });

    // 5. Global search over Snippets
    snippets.forEach((snip) => {
      list.push({
        id: `search-snip-${snip.id}`,
        category: 'Сніппети' as any,
        title: `Сніппет: ${snip.title}`,
        subtitle: `Мова: ${snip.language} • ${snip.tags.join(', ')}`,
        icon: Braces,
        action: () => {
          // copy to clipboard instantly for convenience, then switch
          navigator.clipboard.writeText(snip.code);
          setModule('snippets-library');
          toast.success(`Код сніппету "${snip.title}" скопійовано!`);
        }
      });
    });

    // 6. Global search over Cheatsheets
    cheatsheets.forEach((cmd) => {
      list.push({
        id: `search-cheat-${cmd.id}`,
        category: 'Шпаргалки' as any,
        title: `Шпаргалка: ${cmd.command}`,
        subtitle: `${cmd.description} [${cmd.category}]`,
        icon: Terminal,
        action: () => {
          navigator.clipboard.writeText(cmd.command);
          setModule('cheatsheet');
          toast.success(`Команду скопійовано: ${cmd.command}`);
        }
      });
    });

    // 7. Global search over Bookmarks
    bookmarks.forEach((bm) => {
      list.push({
        id: `search-bm-${bm.id}`,
        category: 'Закладки' as any,
        title: `Закладка: ${bm.title}`,
        subtitle: `${bm.note || 'Корисне посилання'} (${bm.url})`,
        icon: Bookmark,
        action: () => {
          window.open(bm.url, '_blank');
          toast.success(`Відкриваємо: ${bm.title}`);
        }
      });
    });

    // 8. Quick actions
    list.push({
      id: 'action-new-note',
      category: 'Швидкі Дії',
      title: 'Дія: Створити нову нотатку',
      subtitle: 'Миттєво додає нову Markdown нотатку у базу знань',
      icon: BookOpen,
      action: () => {
        addNote({
          title: 'Швидка нотатка',
          content: '# Нова нотатка\n\nСтворено через Командну палітру.',
          tags: ['CommandPalette'],
        });
        setModule('knowledge-base');
        toast.success('Нову нотатку додано у базу!');
      },
    });

    list.push({
      id: 'action-new-proj',
      category: 'Швидкі Дії',
      title: 'Дія: Запустити трекер проєктів',
      subtitle: 'Переходить на Канбан-дошку для роботи з розробкою',
      icon: Layers,
      action: () => {
        setModule('project-tracker');
      },
    });

    // 9. Theme Accents
    const colors = [
      { id: 'purple', label: 'Nexus Purple' },
      { id: 'violet', label: 'Dark Violet' },
      { id: 'fuchsia', label: 'Cyber Fuchsia' },
      { id: 'indigo', label: 'Indigo Dream' },
    ] as const;

    colors.forEach((col) => {
      list.push({
        id: `theme-${col.id}`,
        category: 'Тема & Налаштування',
        title: `Тема: Змінити акцент на ${col.label}`,
        subtitle: `Встановити колір ${col.id} для підсвітки системи`,
        icon: Palette,
        action: () => {
          updateSettings({ accentColor: col.id });
          toast.success(`Встановлено тему: ${col.label}`);
        },
      });
    });

    return list;
  }, [setModule, addNote, updateSettings, toast, projects, notes, snippets, cheatsheets, bookmarks, editorFiles]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [search, commands]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Arrow navigation & Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Auto-scroll list when navigating with arrows
  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (activeEl && listRef.current) {
      const container = listRef.current;
      const elTop = activeEl.offsetTop;
      const elHeight = activeEl.offsetHeight;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      if (elTop < containerScrollTop) {
        container.scrollTop = elTop;
      } else if (elTop + elHeight > containerScrollTop + containerHeight) {
        container.scrollTop = elTop + elHeight - containerHeight;
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0B0A12]/85 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-2xl glass-panel rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[500px]"
          >
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-accent/40 bg-panel-bg/40">
              <Search className="w-5 h-5 text-accent-purple shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Шукайте команди, розділи або теми (напр. 'проєкт', 'тема' або 'нотатка')..."
                className="w-full bg-transparent border-0 outline-hidden text-sm text-text-primary placeholder:text-text-tertiary focus:ring-0"
              />
              <span className="text-[10px] font-mono text-text-tertiary px-2 py-0.5 border border-border-accent/30 rounded bg-hover-bg">
                ESC
              </span>
            </div>

            {/* List Row */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[350px]"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  Команд або розділів за запитом "{search}" не знайдено.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-accent-purple/15 text-accent-purple' 
                          : 'hover:bg-hover-bg/30 text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-1.5 rounded-md border ${
                          isSelected 
                            ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple' 
                            : 'bg-hover-bg border-border-accent/10 text-text-tertiary'
                        }`}>
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="overflow-hidden">
                          <div className={`text-xs font-semibold ${isSelected ? 'text-text-primary' : 'text-text-primary/95'}`}>
                            {cmd.title}
                          </div>
                          <div className="text-[10px] text-text-secondary/75 truncate mt-0.5">
                            {cmd.subtitle}
                          </div>
                        </div>
                      </div>

                      {/* Right metadata badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-hover-bg/40 border border-border-accent/10 shrink-0">
                          {cmd.category}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-accent-purple shrink-0">
                            ↵
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom help bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border-accent/15 bg-hover-bg/10 text-[9px] font-mono text-text-tertiary">
              <div className="flex items-center gap-4">
                <span>↑↓ для навігації</span>
                <span>Enter для вибору</span>
              </div>
              <span>NEXUS Command Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
