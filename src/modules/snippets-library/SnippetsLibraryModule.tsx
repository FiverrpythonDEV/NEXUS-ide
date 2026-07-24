import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Terminal, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Code, 
  Hash, 
  Calendar,
  Layers
} from 'lucide-react';
import { Snippet } from '../../types';

export const SnippetsLibraryModule: React.FC = () => {
  const { snippets, addSnippet, updateSnippet, deleteSnippet, projects } = useAppContext();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tagsInput, setTagsInput] = useState('');

  const handleOpenAdd = () => {
    setEditingSnippet(null);
    setTitle('');
    setCode('');
    setLanguage('javascript');
    setTagsInput('');
    setIsOpen(true);
  };

  const handleOpenEdit = (snip: Snippet) => {
    setEditingSnippet(snip);
    setTitle(snip.title);
    setCode(snip.code);
    setLanguage(snip.language);
    setTagsInput(snip.tags.join(', '));
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      toast.warning('Будь ласка, заповніть усі обов\'язкові поля');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editingSnippet) {
      updateSnippet({
        ...editingSnippet,
        title,
        code,
        language,
        tags,
      });
      toast.success('Сніппет успішно оновлено!');
    } else {
      addSnippet({
        title,
        code,
        language,
        tags,
      });
      toast.success('Новий сніппет додано до бібліотеки!');
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей сніппет?')) {
      deleteSnippet(id);
      toast.success('Сніппет видалено');
    }
  };

  const handleCopy = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    toast.success('Код скопійовано у буфер обміну!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get all unique tags
  const allTags = Array.from(new Set(snippets.flatMap(s => s.tags)));

  // Filter snippets
  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.code.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag ? s.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent-purple" />
            Бібліотека Сніппетів
          </h2>
          <p className="text-xs text-text-secondary">Зберігайте перевірені часом скрипти, конфіги та корисні шматки коду.</p>
        </div>

        <Button 
          onClick={handleOpenAdd}
          variant="primary" 
          size="sm" 
          className="flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" /> Додати Сніппет
        </Button>
      </div>

      {/* 2. Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Пошук за назвою або вмістом коду..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-hidden focus:border-accent-purple/60 placeholder:text-text-tertiary font-medium"
          />
        </div>

        {/* Tags filtration */}
        <div className="md:col-span-4">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl px-3.5 py-2 text-xs text-text-secondary focus:outline-hidden focus:border-accent-purple/60 cursor-pointer font-medium"
          >
            <option value="">Всі Теги ({allTags.length})</option>
            {allTags.map(tag => (
              <option key={tag} value={tag} className="bg-[#15131F]">{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Snippets list/cards */}
      {filteredSnippets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSnippets.map((snip) => (
            <Card 
              key={snip.id}
              className="group flex flex-col justify-between border border-border-accent/15 bg-hover-bg/5 hover:border-accent-purple/35 transition-all p-4.5 space-y-3 relative overflow-hidden"
            >
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-[75%]">
                  <span className="text-xs font-semibold text-text-primary block truncate leading-tight">
                    {snip.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono border-border-accent/25 uppercase px-1 text-accent-purple font-bold">
                      {snip.language}
                    </Badge>
                    <span className="text-[9px] text-text-tertiary flex items-center gap-1 font-mono">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(snip.updatedAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleCopy(snip.id, snip.code)}
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-[#1A1629] border-border-accent/30 text-text-secondary hover:text-white transition-all cursor-pointer"
                    title="Копіювати код"
                  >
                    {copiedId === snip.id ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    onClick={() => handleOpenEdit(snip)}
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-[#1A1629] border-border-accent/30 text-text-secondary hover:text-white transition-all cursor-pointer"
                    title="Редагувати"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(snip.id)}
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-[#1A1629] border-border-accent/30 text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-all cursor-pointer"
                    title="Видалити"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Code preview block */}
              <div className="bg-[#09080E] border border-border-accent/15 rounded-lg p-3 font-mono text-[10px] text-[#A78BFA] overflow-x-auto max-h-36 custom-scrollbar relative">
                <pre>{snip.code}</pre>
              </div>

              {/* Tags footer */}
              {snip.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {snip.tags.map(tag => (
                    <span 
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer transition-all border ${
                        selectedTag === tag 
                          ? 'bg-accent-purple/20 text-white border-accent-purple/50 font-semibold shadow-xs' 
                          : 'bg-hover-bg/10 text-text-secondary border-border-accent/20 hover:border-border-accent/45'
                      }`}
                    >
                      <Hash className="w-2.5 h-2.5 text-text-tertiary" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-accent/20 bg-hover-bg/5">
          <Code className="w-10 h-10 text-text-tertiary animate-pulse mb-3" />
          <h4 className="text-xs font-semibold text-text-primary">Сніппетів не знайдено</h4>
          <p className="text-[10px] text-text-secondary max-w-xs mt-1">
            {search || selectedTag 
              ? 'Спробуйте скоригувати параметри фільтрації чи ключове слово пошуку.' 
              : 'Ваша бібліотека порожня. Створіть свій перший сніппет, щоб зберегти корисний код!'}
          </p>
        </div>
      )}

      {/* 4. Form Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingSnippet ? 'Редагувати сніппет' : 'Створити новий сніппет'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Назва сніппету *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Наприклад, Express Server Boilerplate"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Мова підсвітки</Label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="yaml">YAML / Config</option>
                <option value="bash">Bash / Shell</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Теги (розділяйте комами)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="backend, api, routing, auth"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Вміст коду *</Label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введіть або вставте сюди код сніппету..."
              className="w-full h-48 bg-[#09080E] border border-border-accent/20 rounded-xl p-3 text-xs font-mono text-[#A78BFA] placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/30 resize-none"
              required
            />
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)} className="cursor-pointer">
              Скасувати
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              {editingSnippet ? 'Зберегти зміни' : 'Створити сніппет'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
