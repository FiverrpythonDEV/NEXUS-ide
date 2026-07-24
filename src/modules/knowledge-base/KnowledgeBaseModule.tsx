import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea, Label } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useTranslation } from '../../i18n/translations';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Eye, 
  Hash, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';
import { Note } from '../../types';

export const KnowledgeBaseModule: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useAppContext();
  const toast = useToast();
  const { lang } = useTranslation();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertMarkdown = (syntaxType: 'bold' | 'italic' | 'code' | 'h2' | 'list' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    switch (syntaxType) {
      case 'bold':
        replacement = `**${selectedText || 'жирний'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'курсив'}*`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'код'}\``;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Заголовок 2'}\n`;
        break;
      case 'list':
        replacement = `\n- ${selectedText || 'елемент списку'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'текст посилання'}](url)`;
        break;
      default:
        break;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setFormContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Active note state
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  // Mobile layout state
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

  // Set first note active by default on load
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Sync edit form with active note
  useEffect(() => {
    if (activeNote) {
      setFormTitle(activeNote.title);
      setFormContent(activeNote.content);
      setFormTags(activeNote.tags.join(', '));
      setIsEditing(false); // Default to preview mode on swap
    } else {
      setFormTitle('');
      setFormContent('');
      setFormTags('');
      setIsEditing(false);
    }
  }, [activeNote]);

  // Unique tags for filter sidebar
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || n.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const handleCreateNote = () => {
    const defaultTitle = 'Нова нотатка';
    addNote({
      title: defaultTitle,
      content: '# Нова нотатка\n\nВведіть свій текст сюди...',
      tags: ['Idea'],
    });
    
    // Select the newly added note (which is at index 0 because of unshift)
    setTimeout(() => {
      const allNotes = notes;
      if (allNotes.length > 0) {
        setActiveNoteId(allNotes[0].id);
        setIsEditing(true);
        setMobileShowSidebar(false);
      }
    }, 50);

    toast.success('Нову нотатку створено!');
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;
    if (!formTitle.trim()) {
      toast.warning('Заголовок нотатки не може бути порожнім');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    updateNote({
      id: activeNoteId,
      title: formTitle,
      content: formContent,
      tags: tagsArray,
      updatedAt: new Date().toISOString(),
    });

    setIsEditing(false);
    toast.success('Нотатку успішно збережено');
  };

  const handleDeleteNote = (id: string, title: string) => {
    if (confirm(`Ви впевнені, що бажаєте видалити нотатку "${title}"?`)) {
      deleteNote(id);
      setActiveNoteId(null);
      setMobileShowSidebar(true);
      toast.success('Нотатку видалено');
    }
  };

  // Custom inline markdown compiler
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-text-tertiary">Введіть текст нотатки...</p>;
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Code block parsing
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const block = codeContent.join('\n');
          codeContent = [];
          return (
            <pre key={idx} className="bg-[#0B0A12] border border-border-accent/40 rounded-lg p-3 font-mono text-xs my-3 overflow-x-auto text-accent-purple select-text">
              <code>{block}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Titles
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold font-sans text-text-primary mt-6 mb-3 pb-1 border-b border-border-accent/20 leading-snug">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-semibold font-sans text-text-primary mt-4.5 mb-2.5 pb-1 border-b border-border-accent/10">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-semibold font-sans text-text-primary mt-3.5 mb-2">{line.slice(4)}</h3>;
      }

      // Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="list-disc ml-5 my-0.5 text-text-secondary">{line.slice(2)}</li>;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-accent-purple bg-hover-bg/20 px-3.5 py-2 my-2.5 rounded-r-lg text-text-secondary text-xs font-sans italic">
            {line.slice(2)}
          </blockquote>
        );
      }

      // Space lines
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // inline bold parsing
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-text-primary font-semibold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return <p key={idx} className="text-text-secondary leading-relaxed my-2 text-xs sm:text-sm">{parts.length > 0 ? parts : line}</p>;
    }).filter(el => el !== null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
      
      {/* 1. Left Sidebar: Notes navigation list */}
      <Card className={`md:col-span-1 p-4 flex flex-col gap-4 bg-panel-bg/60 h-full overflow-hidden ${
        mobileShowSidebar ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="flex items-center justify-between gap-2 shrink-0">
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Нотатки</h3>
          <Button variant="outline" size="sm" className="!p-1.5" onClick={handleCreateNote} title="Створити нотатку">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Шукати..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hover-bg/50 border border-border-accent rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
          />
        </div>

        {/* Tag filter cloud */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-2 border-b border-border-accent/15 shrink-0 max-h-20 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wide border cursor-pointer ${
                !selectedTag 
                  ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/30' 
                  : 'bg-hover-bg text-text-secondary border-border-accent/10 hover:text-text-primary'
              }`}
            >
              Всі теги
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wide border cursor-pointer ${
                  selectedTag === t 
                    ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/30' 
                    : 'bg-hover-bg text-text-secondary border-border-accent/10 hover:text-text-primary'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-tertiary border border-dashed border-border-accent/10 rounded-xl">
              Нотаток не знайдено.<br/>Створіть першу нотатку.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setMobileShowSidebar(false);
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  activeNoteId === note.id
                    ? 'bg-hover-bg border-accent-purple/40 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                    : 'bg-hover-bg/20 border-border-accent/20 hover:bg-hover-bg/40'
                }`}
              >
                <h4 className="font-sans font-medium text-xs text-text-primary truncate mb-1">
                  {note.title}
                </h4>
                <p className="text-[10px] text-text-tertiary line-clamp-1 mb-2">
                  {note.content.replace(/[#*`>]/g, '')}
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-text-tertiary" />
                    {new Date(note.updatedAt).toLocaleDateString('uk-UA', { month: '2-digit', day: '2-digit' })}
                  </span>
                  <div className="flex gap-1">
                    {note.tags.slice(0, 1).map((t, i) => (
                      <span key={i} className="text-accent-purple">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 2. Right Pane: Note Viewer or Editor */}
      <Card className={`md:col-span-2 p-5 bg-panel-bg/40 h-full flex flex-col overflow-hidden ${
        mobileShowSidebar ? 'hidden md:flex' : 'flex'
      }`}>
        {!activeNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <BookOpen className="w-12 h-12 text-text-tertiary mb-3 stroke-[1.25]" />
            <h3 className="font-semibold text-sm text-text-primary">Нотатку не вибрано</h3>
            <p className="text-xs text-text-secondary mt-1">Оберіть нотатку у списку ліворуч або створіть нову.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border-accent/15 shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="md:hidden !p-1.5"
                  onClick={() => setMobileShowSidebar(true)}
                  title="Назад до списку"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="font-sans font-semibold text-xs sm:text-sm text-text-primary line-clamp-1">
                    {isEditing ? 'Редагування нотатки' : activeNote.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary mt-0.5">
                    <span>Оновлено: {new Date(activeNote.updatedAt).toLocaleString('uk-UA')}</span>
                  </div>
                </div>
              </div>

              {/* Edit Toolbar Controls */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => setIsEditing(false)}
                    >
                      Скасувати
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="text-xs" 
                      onClick={handleSaveNote}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Зберегти
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="!p-2"
                      onClick={() => setIsEditing(true)}
                      title="Редагувати нотатку"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="!p-2"
                      onClick={() => handleDeleteNote(activeNote.id, activeNote.title)}
                      title="Видалити нотатку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Main content body (scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 select-text">
              {isEditing ? (
                <div className="space-y-4 h-full flex flex-col pb-4">
                  <div className="space-y-1">
                    <Label>Заголовок</Label>
                    <Input 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Заголовок нотатки..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Теги (через кому)</Label>
                    <Input 
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="React, DevOps, QMK"
                    />
                  </div>

                  <div className="space-y-1 flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-1">
                      <Label className="!mb-0">{lang === 'uk' ? 'Текст (Підтримує спрощений Markdown)' : 'Text (Supports basic Markdown)'}</Label>
                      <div className="flex items-center gap-1 bg-[#1E1B2E] border border-border-accent/30 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => insertMarkdown('bold')}
                          className="px-2 py-0.5 text-[10px] font-bold text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Жирний' : 'Bold'}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('italic')}
                          className="px-2 py-0.5 text-[10px] italic text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Курсив' : 'Italic'}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('code')}
                          className="px-2 py-0.5 text-[10px] font-mono text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Код' : 'Code'}
                        >
                          &lt;&gt;
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('h2')}
                          className="px-2 py-0.5 text-[10px] font-medium text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Заголовок H2' : 'H2 Heading'}
                        >
                          #
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('list')}
                          className="px-2 py-0.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Список' : 'List'}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('link')}
                          className="px-2 py-0.5 text-[10px] text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 rounded transition-all cursor-pointer"
                          title={lang === 'uk' ? 'Посилання' : 'Link'}
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                    <Textarea 
                      ref={textareaRef}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="# Введіть заголовок&#10;&#10;Пишіть свій текст нотатки тут..."
                      className="flex-1 font-mono text-xs min-h-[250px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-6">
                  {/* Tag list */}
                  {activeNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeNote.tags.map((t, i) => (
                        <Badge key={i} variant="primary" className="flex items-center gap-0.5">
                          <Hash className="w-2.5 h-2.5 text-accent-purple" />
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Rendered content */}
                  <div className="markdown-body text-text-secondary">
                    {renderMarkdown(activeNote.content)}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </Card>

    </div>
  );
};
