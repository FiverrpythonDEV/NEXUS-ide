import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Terminal, 
  Layers, 
  Grid 
} from 'lucide-react';
import { CheatsheetCommand } from '../../types';

export const PRESET_COMMANDS: CheatsheetCommand[] = [
  // Git
  { id: 'git-1', command: 'git commit -m "commit message"', description: 'Комміт відстежуваних файлів з коментарем', category: 'Git' },
  { id: 'git-2', command: 'git checkout -b <branch-name>', description: 'Створити нову гілку та перейти на неї', category: 'Git' },
  { id: 'git-3', command: 'git merge <branch-name>', description: 'Злити вказану гілку в активну гілку', category: 'Git' },
  { id: 'git-4', command: 'git pull origin <branch-name>', description: 'Отримати та злити останні зміни з віддаленого сервера', category: 'Git' },
  { id: 'git-5', command: 'git log --oneline --graph --decorate', description: 'Красиве графічне дерево історії коммітів', category: 'Git' },

  // Docker
  { id: 'dock-1', command: 'docker ps -a', description: 'Список усіх запущених та зупинених контейнерів', category: 'Docker' },
  { id: 'dock-2', command: 'docker run -d -p <host-port>:<container-port> <image>', description: 'Запустити контейнер у фоновому режимі з портами', category: 'Docker' },
  { id: 'dock-3', command: 'docker exec -it <container-id> bash', description: 'Увійти всередину працюючого контейнера в термінал', category: 'Docker' },
  { id: 'dock-4', command: 'docker-compose up -d', description: 'Запустити всі сервіси docker-compose у фоновому режимі', category: 'Docker Compose' },
  { id: 'dock-5', command: 'docker system prune -a --volumes', description: 'Глибока чистка застарілих іміджів, мереж та волюмів', category: 'Docker' },

  // Linux Bash
  { id: 'linux-1', command: 'df -h', description: 'Показати вільне місце на дисках у зрозумілому форматі', category: 'Linux' },
  { id: 'linux-2', command: 'sudo lsof -i :3000', description: 'Знайти який процес займає порт 3000', category: 'Linux' },
  { id: 'linux-3', command: 'kill -9 <PID>', description: 'Примусово закрити процес за його PID', category: 'Linux' },
  { id: 'linux-4', command: 'tar -czvf archive.tar.gz /path/to/dir', description: 'Архівація директорії в .tar.gz архів', category: 'Linux' },
  { id: 'linux-5', command: 'chmod +x script.sh', description: 'Дозволити файлу виконуватись як скрипту', category: 'Linux' },

  // SQL
  { id: 'sql-1', command: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10;', description: 'Отримати останні 10 зареєстрованих користувачів', category: 'SQL' },
  { id: 'sql-2', command: 'UPDATE users SET status = \'active\' WHERE id = 1;', description: 'Оновити статус користувача за ID', category: 'SQL' },
  { id: 'sql-3', command: 'ALTER TABLE users ADD COLUMN age INT;', description: 'Додати нову колонку у таблицю users', category: 'SQL' },
];

export const CheatsheetModule: React.FC = () => {
  const { cheatsheets, addCheatsheet, deleteCheatsheet } = useAppContext();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCommand, setNewCommand] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Git');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Команду скопійовано! ⚡');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommand.trim() || !newDesc.trim()) {
      toast.warning('Будь ласка, заповніть усі обов\'язкові поля');
      return;
    }

    addCheatsheet({
      command: newCommand.trim(),
      description: newDesc.trim(),
      category: newCategory,
    });

    setNewCommand('');
    setNewDesc('');
    setIsAddOpen(false);
    toast.success('Спеціальну команду додано!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Ви впевнені, що хочете видалити цю кастомну команду?')) {
      deleteCheatsheet(id);
      toast.success('Команду видалено');
    }
  };

  // Merge presets with custom cheatsheets from context
  const allCommands = [...PRESET_COMMANDS, ...cheatsheets];

  // Get unique categories
  const categories = Array.from(new Set(allCommands.map(c => c.category)));

  // Filter list
  const filteredCommands = allCommands.filter(c => {
    const matchesSearch = c.command.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? c.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 select-none font-sans text-xs">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent-purple" />
            Інтерактивна Шпаргалка Команд
          </h2>
          <p className="text-xs text-text-secondary">Зручний довідник термінальних команд. Клікніть по будь-якій, щоб скопіювати в буфер.</p>
        </div>

        <Button 
          onClick={() => setIsAddOpen(true)}
          variant="primary" 
          size="sm" 
          className="flex items-center gap-1.5 cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" /> Своя Команда
        </Button>
      </div>

      {/* 2. Filter Deck */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Швидкий пошук за командою чи описом..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl pl-10 pr-4 py-2 text-xs text-text-primary focus:outline-hidden focus:border-accent-purple/60 placeholder:text-text-tertiary font-medium"
          />
        </div>

        {/* Category switcher */}
        <div className="md:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#15131F]/40 border border-border-accent/20 rounded-xl px-3.5 py-2 text-xs text-text-secondary focus:outline-hidden focus:border-accent-purple/60 cursor-pointer font-medium"
          >
            <option value="">Всі Категорії ({categories.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#15131F]">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Horizontal category quick pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        <span 
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all border ${
            !selectedCategory 
              ? 'bg-accent-purple text-white border-accent-purple shadow-xs' 
              : 'bg-hover-bg/10 text-text-secondary border-border-accent/20 hover:text-text-primary'
          }`}
        >
          Усі
        </span>
        {categories.map(cat => (
          <span 
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all border ${
              selectedCategory === cat 
                ? 'bg-accent-purple text-white border-accent-purple shadow-xs' 
                : 'bg-hover-bg/10 text-text-secondary border-border-accent/20 hover:text-text-primary'
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* 4. Command Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <Card 
              key={item.id}
              onClick={() => handleCopy(item.id, item.command)}
              className="group border border-border-accent/15 hover:border-accent-purple/35 hover:shadow-[0_0_12px_var(--color-accent-purple-glow)] transition-all p-4 flex flex-col justify-between cursor-pointer space-y-3 bg-[#0E0C16]/50"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-[8px] border-border-accent/35 font-mono px-1 font-bold text-accent-purple">
                    {item.category}
                  </Badge>
                  
                  {/* Delete button only for custom added commands */}
                  {item.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 hover:text-status-error hover:bg-hover-bg/30 rounded transition-all cursor-pointer"
                      title="Видалити команду"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-text-secondary line-clamp-2 min-h-7 leading-tight font-medium">
                  {item.description}
                </p>
              </div>

              {/* Code command block */}
              <div className="bg-[#09080E] border border-border-accent/10 rounded-lg p-2.5 font-mono text-[10px] text-[#A78BFA] flex items-center justify-between overflow-hidden">
                <span className="truncate pr-2">{item.command}</span>
                <span className="shrink-0 text-text-tertiary group-hover:text-accent-purple transition-colors">
                  {isCopied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
              </div>
            </Card>
          );
        })}

        {filteredCommands.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-border-accent/15 rounded-2xl bg-hover-bg/5">
            <Terminal className="w-10 h-10 text-text-tertiary animate-pulse mx-auto mb-3" />
            <h4 className="text-xs font-semibold text-text-primary">Жодної команди не знайдено</h4>
            <span className="text-[10px] text-text-tertiary block mt-0.5">Спробуйте змінити пошуковий запит чи скинути категорію.</span>
          </div>
        )}
      </div>

      {/* 5. Add Custom Command Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Додати свою команду"
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
          <div className="space-y-1.5">
            <Label>Команда *</Label>
            <Input
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Наприклад: npm run dev"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Короткий опис *</Label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Наприклад: Запустити Node лок. сервер розробки"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Категорія</Label>
            <Select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="Git">Git</option>
              <option value="Docker">Docker</option>
              <option value="Linux">Linux Bash</option>
              <option value="SQL">SQL</option>
              <option value="NPM">NPM / Packages</option>
              <option value="Custom">Власна категорія</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)} className="cursor-pointer">
              Скасувати
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              Додати
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
