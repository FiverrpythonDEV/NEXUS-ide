import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Bookmark as BookmarkIcon, 
  Search, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Link2, 
  BookOpen, 
  Settings, 
  Wrench, 
  Feather,
  Compass
} from 'lucide-react';
import { Bookmark } from '../../types';

const PRESET_BOOKMARKS: Bookmark[] = [
  { id: 'bm-preset-1', title: 'React Documentation', url: 'https://react.dev', tag: 'Docs', note: 'Офіційна документація React, хуки, гайди та бест-практіс' },
  { id: 'bm-preset-2', title: 'Tailwind CSS Docs', url: 'https://tailwindcss.com', tag: 'Docs', note: 'Опис утилітарних класів Tailwind, кастомізація та конфігурація' },
  { id: 'bm-preset-3', title: 'Vite Bundler', url: 'https://vite.dev', tag: 'Tools', note: 'Швидкий бандлер проєктів з підтримкою HMR та TypeScript' },
  { id: 'bm-preset-4', title: 'Lucide React Icons', url: 'https://lucide.dev/icons', tag: 'Design', note: 'Великий набір красивих та масштабованих контурних іконок' },
  { id: 'bm-preset-5', title: 'Shadcn UI', url: 'https://ui.shadcn.com', tag: 'Design', note: 'Копійовані компоненти на базі Radix UI та Tailwind CSS' }
];

export const BookmarksModule: React.FC = () => {
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } = useAppContext();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tag, setTag] = useState('Docs');
  const [note, setNote] = useState('');

  const handleOpenAdd = () => {
    setEditingBookmark(null);
    setTitle('');
    setUrl('');
    setTag('Docs');
    setNote('');
    setIsOpen(true);
  };

  const handleOpenEdit = (bm: Bookmark) => {
    setEditingBookmark(bm);
    setTitle(bm.title);
    setUrl(bm.url);
    setTag(bm.tag);
    setNote(bm.note);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.warning('Будь ласка, заповніть обов\'язкові поля');
      return;
    }

    // Add protocol if missing
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    if (editingBookmark) {
      updateBookmark({
        ...editingBookmark,
        title: title.trim(),
        url: finalUrl,
        tag,
        note: note.trim()
      });
      toast.success('Закладку успішно оновлено!');
    } else {
      addBookmark({
        title: title.trim(),
        url: finalUrl,
        tag,
        note: note.trim()
      });
      toast.success('Закладку успішно збережено!');
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ви впевнені, що бажаєте видалити цю закладку?')) {
      deleteBookmark(id);
      toast.success('Закладку видалено');
    }
  };

  // Merge presets with custom bookmarks
  const allBookmarks = [...PRESET_BOOKMARKS, ...bookmarks];

  // Unique tags
  const tags = Array.from(new Set(allBookmarks.map(b => b.tag)));

  // Filter bookmarks
  const filteredBookmarks = allBookmarks.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || 
                          b.note.toLowerCase().includes(search.toLowerCase()) ||
                          b.url.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? b.tag === selectedTag : true;
    return matchesSearch && matchesTag;
  });

  // Get matching category icons
  const getTagIcon = (category: string) => {
    switch (category) {
      case 'Docs': return BookOpen;
      case 'Tools': return Wrench;
      case 'Design': return Feather;
      case 'Insp': return Compass;
      default: return Link2;
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-xs">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-accent-purple" />
            Колекція Веб-Закладок
          </h2>
          <p className="text-xs text-text-secondary">Зберігайте корисні посилання, офіційні гайди та улюблені ресурси розробника.</p>
        </div>

        <Button 
          onClick={handleOpenAdd}
          variant="primary" 
          size="sm" 
          className="flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" /> Створити Закладку
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Швидкий пошук за посиланням, описом чи назвою..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-hidden focus:border-accent-purple/60 placeholder:text-text-tertiary font-medium"
          />
        </div>

        {/* Tag selection dropdown */}
        <div className="md:col-span-4">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl px-3.5 py-2 text-xs text-text-secondary focus:outline-hidden focus:border-accent-purple/60 cursor-pointer font-medium"
          >
            <option value="">Всі категорії ({tags.length})</option>
            {tags.map(t => (
              <option key={t} value={t} className="bg-[#15131F]">{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Horizontal pill switches */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        <span 
          onClick={() => setSelectedTag('')}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all border ${
            !selectedTag 
              ? 'bg-accent-purple text-white border-accent-purple shadow-xs' 
              : 'bg-hover-bg/10 text-text-secondary border-border-accent/20 hover:text-text-primary'
          }`}
        >
          Усі посилання
        </span>
        {tags.map(t => (
          <span 
            key={t}
            onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all border ${
              selectedTag === t 
                ? 'bg-accent-purple text-white border-accent-purple shadow-xs' 
                : 'bg-hover-bg/10 text-text-secondary border-border-accent/20 hover:text-text-primary'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* 4. Bookmarks Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookmarks.map((bm) => {
          const TagIcon = getTagIcon(bm.tag);
          // Only show delete/edit for custom non-preset ones, or allow all. Let's allow edit/delete for all bookmarks (just check if id starts with preset to warning or just allow cleanly).
          const isPreset = bm.id.startsWith('bm-preset');

          return (
            <Card 
              key={bm.id}
              className="group border border-border-accent/15 hover:border-accent-purple/35 hover:shadow-[0_0_12px_var(--color-accent-purple-glow)] transition-all p-4.5 flex flex-col justify-between bg-[#0E0C16]/50 space-y-3.5 relative overflow-hidden"
            >
              <div className="space-y-2.5">
                
                {/* Header tag and controls */}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-accent-purple font-semibold">
                    <TagIcon className="w-3.5 h-3.5" />
                    <Badge variant="outline" className="text-[8px] font-mono border-border-accent/30 text-text-secondary uppercase px-1.5 font-bold">
                      {bm.tag}
                    </Badge>
                  </span>

                  <div className="flex items-center gap-1">
                    <a 
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-text-tertiary hover:text-white hover:bg-hover-bg/30 rounded transition-all cursor-pointer"
                      title="Відкрити посилання"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleOpenEdit(bm)}
                      className="p-1 text-text-tertiary hover:text-white hover:bg-hover-bg/30 rounded transition-all cursor-pointer"
                      title="Редагувати закладку"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {!isPreset && (
                      <button
                        onClick={() => handleDelete(bm.id)}
                        className="p-1 text-text-tertiary hover:text-status-error hover:bg-status-error/10 rounded transition-all cursor-pointer"
                        title="Видалити"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info and note description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-text-primary block leading-tight">
                    {bm.title}
                  </h4>
                  <p className="text-[10px] text-text-secondary line-clamp-2 leading-snug min-h-[30px]">
                    {bm.note || 'Опис відсутній.'}
                  </p>
                </div>

              </div>

              {/* Bottom anchor button */}
              <div className="pt-2 border-t border-border-accent/10">
                <span className="text-[9px] font-mono text-text-tertiary truncate block leading-none">
                  {bm.url.replace(/^https?:\/\/(www\.)?/i, '')}
                </span>
              </div>

            </Card>
          );
        })}

        {filteredBookmarks.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-border-accent/15 rounded-2xl bg-hover-bg/5">
            <BookmarkIcon className="w-10 h-10 text-text-tertiary animate-pulse mx-auto mb-3" />
            <h4 className="text-xs font-semibold text-text-primary">Жодної закладки не знайдено</h4>
            <span className="text-[10px] text-text-tertiary block mt-0.5">Створіть нову закладку або змініть критерії пошуку.</span>
          </div>
        )}
      </div>

      {/* 5. Add/Edit Bookmark Modal Dialog */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingBookmark ? 'Редагувати закладку' : 'Додати нову закладку'}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
          
          <div className="space-y-1.5">
            <Label>Назва закладки *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: GitHub Repository"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>URL Адреса посилання *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="github.com або https://..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Категорія (Тег)</Label>
            <Select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="Docs">Документація (Docs)</option>
              <option value="Tools">Корисні інструменти (Tools)</option>
              <option value="Design">Дизайн та верстка (Design)</option>
              <option value="Insp">Натхнення / Спільноти (Insp)</option>
              <option value="Others">Інші посилання</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Короткий опис / Нотатки</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Нотатки про цей ресурс..."
              className="w-full h-20 bg-[#09080E] border border-border-accent/20 rounded-xl p-2.5 text-xs text-text-primary focus:outline-hidden focus:border-accent-purple/50 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)} className="cursor-pointer">
              Скасувати
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              Зберегти
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
};
