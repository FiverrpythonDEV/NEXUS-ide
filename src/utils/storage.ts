import { Project, Note, Gadget, AppSettings, Snippet, FocusSession, CheatsheetCommand, Bookmark } from '../types';

const KEYS = {
  PROJECTS: 'nexus_projects',
  NOTES: 'nexus_notes',
  GADGETS: 'nexus_gadgets',
  SETTINGS: 'nexus_settings',
  SNIPPETS: 'nexus_snippets',
  FOCUS_SESSIONS: 'nexus_focus_sessions',
  CHEATSHEETS: 'nexus_cheatsheets',
  BOOKMARKS: 'nexus_bookmarks',
};

const DEFAULT_SETTINGS: AppSettings = {
  accentColor: '#8B5CF6',
  isSidebarCompact: false,
  neonIntensity: 50,
  density: 'normal',
  borderRadius: 12,
  interfaceFont: 'Inter',
  codeFont: 'JetBrains Mono',
  bgTexture: 'gradient',
  sidebarPosition: 'left',
  language: (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('uk')) ? 'uk' : 'en',
  geminiApiKey: '',
  userName: '',
  aiProvider: 'gemini',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3',
  themeMode: 'system',
  autoSave: true,
  editorMinimap: true,
  editorWordWrap: true,
  editorFontSize: 14,
  editorTabSize: 2,
  weatherEnabled: true,
  soundProfile: 'cyber',
  soundVolume: 30,
  backdropBlur: 12,
  cardBorderOpacity: 20,
  presetTheme: 'purple',
  showLiveClock: true,
  showSystemPing: true,
  customCss: '',
  customWallpaper: '',
  customWallpaperBlur: 5,
  customWallpaperDim: 40,
  liquidGlassMode: false,
  liquidGlassReflection: true,
  matrixRainEffect: false,
  extractedPalette: [],
};

const SEED_PROJECTS: Project[] = [];
const SEED_NOTES: Note[] = [];
const SEED_GADGETS: Gadget[] = [];

const SEED_CHEATSHEETS: CheatsheetCommand[] = [
  // Git
  { id: 'git-1', command: 'git init', description: 'Ініціалізувати новий локальний репозиторій Git', category: 'Git' },
  { id: 'git-2', command: 'git clone <url>', description: 'Клонувати віддалений репозиторій у поточну папку', category: 'Git' },
  { id: 'git-3', command: 'git status', description: 'Показати стан робочого дерева (змінені, нові, проіндексовані файли)', category: 'Git' },
  { id: 'git-4', command: 'git add .', description: 'Додати всі змінені та нові файли до індексу (підготувати до коміту)', category: 'Git' },
  { id: 'git-5', command: 'git commit -m "опис"', description: 'Зафіксувати підготовлені зміни новим комітом з описом', category: 'Git' },
  { id: 'git-6', command: 'git push origin <branch>', description: 'Надіслати локальні коміти у віддалений репозиторій на вказану гілку', category: 'Git' },
  { id: 'git-7', command: 'git pull', description: 'Отримати останні зміни з віддаленого сервера та злити їх з поточними', category: 'Git' },
  { id: 'git-8', command: 'git checkout -b <branch-name>', description: 'Створити нову гілку та одразу перемкнутися на неї', category: 'Git' },
  { id: 'git-9', command: 'git branch -a', description: 'Показати список усіх локальних та віддалених гілок', category: 'Git' },
  { id: 'git-10', command: 'git log --oneline', description: 'Показати історію комітів у скороченому однорядковому форматі', category: 'Git' },
  { id: 'git-11', command: 'git stash', description: 'Тимчасово зберегти незакомічені зміни та очистити робочу директорію', category: 'Git' },
  { id: 'git-12', command: 'git stash pop', description: 'Відновити останні тимчасово збережені зміни із стешу', category: 'Git' },
  { id: 'git-13', command: 'git reset --hard HEAD', description: 'Скасувати всі локальні зміни у робочій папці до стану останнього коміту', category: 'Git' },
  
  // Docker
  { id: 'docker-1', command: 'docker build -t <tag> .', description: 'Зібрати Docker-образ на основі Dockerfile у поточній папці', category: 'Docker' },
  { id: 'docker-2', command: 'docker run -d -p 8080:80 <image>', description: 'Запустити контейнер у фоновому режимі з прокиданням портів', category: 'Docker' },
  { id: 'docker-3', command: 'docker ps', description: 'Показати список усіх активних запущених контейнерів', category: 'Docker' },
  { id: 'docker-4', command: 'docker ps -a', description: 'Показати список взагалі усіх контейнерів (включаючи зупинені)', category: 'Docker' },
  { id: 'docker-5', command: 'docker stop <container-id>', description: 'Зупинити роботу запущеного контейнера', category: 'Docker' },
  { id: 'docker-6', command: 'docker rm <container-id>', description: 'Видалити контейнер із системи', category: 'Docker' },
  { id: 'docker-7', command: 'docker images', description: 'Показати список усіх завантажених та зібраних образів', category: 'Docker' },
  { id: 'docker-8', command: 'docker rmi <image-id>', description: 'Видалити Docker-образ', category: 'Docker' },
  { id: 'docker-9', command: 'docker logs -f <container-id>', description: 'Стрімити логи конкретного контейнера в реальному часі', category: 'Docker' },
  { id: 'docker-10', command: 'docker-compose up -d', description: 'Запустити групу контейнерів, описану в docker-compose.yml, у фоні', category: 'Docker' },
  { id: 'docker-11', command: 'docker-compose down', description: 'Зупинити та повністю видалити контейнери й мережі docker-compose', category: 'Docker' },

  // Linux/Bash
  { id: 'linux-1', command: 'ls -la', description: 'Показати вміст поточної папки докладним списком разом із прихованими файлами', category: 'Linux' },
  { id: 'linux-2', command: 'cd <directory>', description: 'Перейти до вказаної папки', category: 'Linux' },
  { id: 'linux-3', command: 'pwd', description: 'Показати повний шлях до поточної робочої директорії', category: 'Linux' },
  { id: 'linux-4', command: 'mkdir -p <path>', description: 'Створити дерево папок (ігнорує помилку, якщо папка вже є)', category: 'Linux' },
  { id: 'linux-5', command: 'rm -rf <file-or-dir>', description: 'Рекурсивно та примусово видалити файл чи цілу папку без підтвердження', category: 'Linux' },
  { id: 'linux-6', command: 'cp -r <src> <dest>', description: 'Рекурсивно скопіювати папку чи окремий файл у нове місце', category: 'Linux' },
  { id: 'linux-7', command: 'mv <src> <dest>', description: 'Перемістити або перейменувати файл чи теку', category: 'Linux' },
  { id: 'linux-8', command: 'cat <file>', description: 'Показати вміст текстового файлу в терміналі', category: 'Linux' },
  { id: 'linux-9', command: 'grep -rnw "." -e "pattern"', description: 'Рекурсивно знайти вказаний рядок у всіх файлах у поточній папці', category: 'Linux' },
  { id: 'linux-10', command: 'chmod +x <file>', description: 'Зробити файл виконуваним (додати прапорець виконання)', category: 'Linux' },
  { id: 'linux-11', command: 'chown -R user:group <dir>', description: 'Рекурсивно змінити власника та групу для папки', category: 'Linux' },
  { id: 'linux-12', command: 'df -h', description: 'Показати інформацію про вільне місце на всіх змонтованих дисках у зручному форматі', category: 'Linux' },
  { id: 'linux-13', command: 'free -h', description: 'Показати кількість вільної та використаної оперативної пам\'яті', category: 'Linux' },
  { id: 'linux-14', command: 'ps aux', description: 'Показати детальний зріз усіх запущених процесів у системі', category: 'Linux' },
  { id: 'linux-15', command: 'kill -9 <pid>', description: 'Примусово завершити процес за його ідентифікатором (PID)', category: 'Linux' },

  // npm/Yarn
  { id: 'npm-1', command: 'npm init -y', description: 'Швидко ініціалізувати проект з дефолтним файлом package.json', category: 'npm' },
  { id: 'npm-2', command: 'npm install <package-name>', description: 'Встановити пакет та записати його у dependencies', category: 'npm' },
  { id: 'npm-3', command: 'npm i -D <package-name>', description: 'Встановити пакет як залежність для розробки (devDependencies)', category: 'npm' },
  { id: 'npm-4', command: 'npm install', description: 'Встановити всі залежності, перелічені у файлі package.json', category: 'npm' },
  { id: 'npm-5', command: 'npm run <script>', description: 'Запустити вказаний скрипт із розділу "scripts" у package.json', category: 'npm' },
  { id: 'npm-6', command: 'npm uninstall <package-name>', description: 'Видалити пакет із проекту та з package.json', category: 'npm' },
  { id: 'npm-7', command: 'npm outdated', description: 'Перевірити реєстр npm на наявність оновлень для встановлених пакетів', category: 'npm' },
  { id: 'npm-8', command: 'npm update', description: 'Оновити всі пакети до останньої дозволеної версії за semver', category: 'npm' },
  { id: 'npm-9', command: 'npm cache clean --force', description: 'Примусово повністю очистити локальний кеш інсталятора npm', category: 'npm' },
  { id: 'npm-10', command: 'npx <command>', description: 'Завантажити та виконати команду без її перманентного встановлення глобально', category: 'npm' },
];

export function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded for key:', key);
      window.dispatchEvent(new CustomEvent('nexus-storage-quota-exceeded'));
    }
    return false;
  }
}

export const storage = {
  getUsageKB(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        total += (key.length + (val ? val.length : 0)) * 2; // UTF-16 characters take 2 bytes
      }
    }
    return Math.round((total / 1024) * 10) / 10; // Round to 1 decimal place
  },

  getProjects(): Project[] {
    const data = localStorage.getItem(KEYS.PROJECTS);
    const fakeNames = ['NEXUS Workspace', 'Synapse AI Search', 'Chronos Mechanical Keyboard'];
    if (!data) {
      safeSet(KEYS.PROJECTS, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((p: Project) => p && p.name && !fakeNames.includes(p.name));
        if (filtered.length !== parsed.length) {
          safeSet(KEYS.PROJECTS, JSON.stringify(filtered));
        }
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveProjects(projects: Project[]) {
    safeSet(KEYS.PROJECTS, JSON.stringify(projects));
  },

  getNotes(): Note[] {
    const data = localStorage.getItem(KEYS.NOTES);
    if (!data) {
      safeSet(KEYS.NOTES, JSON.stringify(SEED_NOTES));
      return SEED_NOTES;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : SEED_NOTES;
    } catch {
      return SEED_NOTES;
    }
  },

  saveNotes(notes: Note[]) {
    safeSet(KEYS.NOTES, JSON.stringify(notes));
  },

  getGadgets(): Gadget[] {
    const data = localStorage.getItem(KEYS.GADGETS);
    if (!data) {
      safeSet(KEYS.GADGETS, JSON.stringify(SEED_GADGETS));
      return SEED_GADGETS;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : SEED_GADGETS;
    } catch {
      return SEED_GADGETS;
    }
  },

  saveGadgets(gadgets: Gadget[]) {
    safeSet(KEYS.GADGETS, JSON.stringify(gadgets));
  },

  getSettings(): AppSettings {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      safeSet(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      // Ensure all fields from default settings are present
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    safeSet(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- SNIPPETS ---
  getSnippets(): Snippet[] {
    const data = localStorage.getItem(KEYS.SNIPPETS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveSnippets(snippets: Snippet[]) {
    safeSet(KEYS.SNIPPETS, JSON.stringify(snippets));
  },

  // --- FOCUS SESSIONS ---
  getFocusSessions(): FocusSession[] {
    const data = localStorage.getItem(KEYS.FOCUS_SESSIONS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveFocusSessions(sessions: FocusSession[]) {
    safeSet(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
  },

  // --- CHEATSHEETS ---
  getCheatsheets(): CheatsheetCommand[] {
    const data = localStorage.getItem(KEYS.CHEATSHEETS);
    if (!data) {
      safeSet(KEYS.CHEATSHEETS, JSON.stringify(SEED_CHEATSHEETS));
      return SEED_CHEATSHEETS;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : SEED_CHEATSHEETS;
    } catch {
      return SEED_CHEATSHEETS;
    }
  },

  saveCheatsheets(commands: CheatsheetCommand[]) {
    safeSet(KEYS.CHEATSHEETS, JSON.stringify(commands));
  },

  // --- BOOKMARKS ---
  getBookmarks(): Bookmark[] {
    const data = localStorage.getItem(KEYS.BOOKMARKS);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveBookmarks(bookmarks: Bookmark[]) {
    safeSet(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  exportBackup(): string {
    const data = {
      projects: this.getProjects(),
      notes: this.getNotes(),
      gadgets: this.getGadgets(),
      settings: this.getSettings(),
      snippets: this.getSnippets(),
      focusSessions: this.getFocusSessions(),
      cheatsheets: this.getCheatsheets(),
      bookmarks: this.getBookmarks(),
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        this.saveProjects(parsed.projects);
      }
      if (parsed.notes && Array.isArray(parsed.notes)) {
        this.saveNotes(parsed.notes);
      }
      if (parsed.gadgets && Array.isArray(parsed.gadgets)) {
        this.saveGadgets(parsed.gadgets);
      }
      if (parsed.settings) {
        this.saveSettings(parsed.settings);
      }
      if (parsed.snippets && Array.isArray(parsed.snippets)) {
        this.saveSnippets(parsed.snippets);
      }
      if (parsed.focusSessions && Array.isArray(parsed.focusSessions)) {
        this.saveFocusSessions(parsed.focusSessions);
      }
      if (parsed.cheatsheets && Array.isArray(parsed.cheatsheets)) {
        this.saveCheatsheets(parsed.cheatsheets);
      }
      if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
        this.saveBookmarks(parsed.bookmarks);
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup data', e);
      return false;
    }
  },

  logActivity() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem('nexus_activity_log');
      let logs: { date: string; count: number }[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(logs)) {
        logs = [];
      }
      const index = logs.findIndex(entry => entry.date === today);
      if (index !== -1) {
        logs[index].count += 1;
      } else {
        logs.push({ date: today, count: 1 });
      }
      safeSet('nexus_activity_log', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  },

  getActivityLogs(): { date: string; count: number }[] {
    try {
      const raw = localStorage.getItem('nexus_activity_log');
      const logs = raw ? JSON.parse(raw) : [];
      return Array.isArray(logs) ? logs : [];
    } catch {
      return [];
    }
  },
};
