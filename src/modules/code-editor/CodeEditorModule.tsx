import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { storage } from '../../utils/storage';
import { useTranslation } from '../../i18n/translations';
import { executePythonCode } from '../../utils/pythonRunner';
import { 
  stripTypeScript, 
  executeCCode, 
  executeJavaCode, 
  executeRustCode, 
  executeGoCode, 
  executeSqlQueries, 
  executeShellScript, 
  executeJsonValidation 
} from '../../utils/polyglotRunner';
import { PythonIdleModal } from '../../components/PythonIdleModal';
import { UniversalIdleModal } from '../../components/UniversalIdleModal';
import { initVimMode } from 'monaco-vim';
import { 
  FileCode2, 
  Plus, 
  Copy, 
  Code2, 
  Trash2, 
  Link2,
  FolderOpen,
  Briefcase,
  Settings,
  X,
  Columns,
  Play,
  Eye,
  EyeOff,
  AlignLeft,
  ChevronRight,
  Info,
  Maximize2,
  Search,
  RefreshCw,
  Clock,
  Share2,
  Download,
  Upload,
  Keyboard,
  Terminal,
  Wand2,
  BarChart2,
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';
import { CodeFile } from '../../types';

const DEFAULT_FILES: CodeFile[] = [
  {
    id: 'file-1',
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NEXUS Live Preview</title>
</head>
<body>
  <div class="card">
    <h1>Вітаємо в NEXUS! ⚡</h1>
    <p>Редагуйте HTML, CSS та JS файли, і спостерігайте зміни миттєво у правій панелі.</p>
    <button id="btn" class="interactive-btn">Клікни мене</button>
  </div>
</body>
</html>`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'file-2',
    name: 'styles.css',
    language: 'css',
    content: `body {
  background-color: #0d0a16;
  color: #eedbf5;
  font-family: 'Inter', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
.card {
  background: rgba(255, 255, 255, 0.03);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  text-align: center;
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.15);
}
h1 {
  margin-top: 0;
  color: #8b5cf6;
}
.interactive-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}
.interactive-btn:hover {
  background: #a78bfa;
  transform: translateY(-2px);
}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'file-3',
    name: 'script.js',
    language: 'javascript',
    content: `// Ласкаво просимо до Інтерактивного Скрипта!
const btn = document.getElementById('btn');
btn.addEventListener('click', () => {
  btn.style.background = '#10b981';
  btn.innerText = 'Працює! 🎉';
  console.log('Кнопку натиснуто!');
});`,
    updatedAt: new Date().toISOString(),
  }
];

const CODE_TEMPLATES = [
  {
    id: 'react-component',
    name: 'React 18 Component (TSX)',
    language: 'typescript',
    filename: 'CustomWidget.tsx',
    description: 'Компонент з хендлерами, станом, ефектом та стилями Tailwind CSS',
    content: `import React, { useState, useEffect } from 'react';

interface Props {
  title?: string;
  onAction?: (data: string) => void;
}

export const CustomWidget: React.FC<Props> = ({ title = 'NEXUS Widget', onAction }) => {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    console.log('Widget initialized. Current count:', count);
  }, [count]);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    setStatus('Updated');
    if (onAction) onAction(\`Count is now \${count + 1}\`);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#15131F] border border-purple-500/30 shadow-xl max-w-md mx-auto text-white">
      <h2 className="text-lg font-bold text-purple-400 mb-2">{title}</h2>
      <p className="text-xs text-gray-400 mb-4">Статус: {status}</p>
      
      <div className="flex items-center justify-between bg-[#1E1B2E] p-4 rounded-xl mb-4">
        <span className="text-sm font-medium">Лічильник:</span>
        <span className="text-2xl font-mono font-bold text-purple-300">{count}</span>
      </div>

      <button
        onClick={handleIncrement}
        className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
      >
        Збільшити значення
      </button>
    </div>
  );
};
`
  },
  {
    id: 'js-async-fetch',
    name: 'JavaScript Async API Client',
    language: 'javascript',
    filename: 'apiClient.js',
    description: 'Асинхронні запити з таймаутом, заголовками та обробкою помилок',
    content: `// Асинхронний HTTP Клієнт для запитів до REST API
async function fetchApiData(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    console.log(\`[API] Надсилаємо запит до \${endpoint}...\`);
    
    const response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(\`HTTP Помилка \${response.status}: \${response.statusText}\`);
    }

    const data = await response.json();
    console.log('[API] Отримано відповідь:', data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[API] Запит скасовано за таймаутом!');
    } else {
      console.error('[API] Помилка виконання:', error.message);
    }
    throw error;
  }
}

// Приклад використання:
// fetchApiData('https://api.github.com/zen');
`
  },
  {
    id: 'html5-canvas',
    name: 'HTML5 Interactive Canvas',
    language: 'html',
    filename: 'canvas_demo.html',
    description: 'Анімаційне полотно HTML5 з частинками та інтерактивним слідом миші',
    content: `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Canvas Particle Nexus</title>
  <style>
    body { margin: 0; overflow: hidden; background: #0b0914; color: #fff; font-family: sans-serif; }
    canvas { display: block; }
    .info { position: absolute; top: 15px; left: 15px; font-size: 12px; opacity: 0.8; pointer-events: none; }
  </style>
</head>
<body>
  <div class="info">⚡ Рухайте мишкою по екрану для взаємодії з частинками</div>
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const mouse = { x: width / 2, y: height / 2 };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouse.x, mouse.y));
      }
    });

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = \`hsla(\${Math.random() * 60 + 260}, 80%, 65%, 0.8)\`;
        this.life = 100;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1.5;
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      ctx.fillStyle = 'rgba(11, 9, 20, 0.2)';
      ctx.fillRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
      }
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>
`
  },
  {
    id: 'python-script',
    name: 'Python Data Processor',
    language: 'python',
    filename: 'data_processor.py',
    description: 'Оборобка структур даних, генерація статистики та аналіз даних',
    content: `# Python Скрипт Аналізу Даних
import math

class DataAnalyzer:
    def __init__(self, data_series):
        self.data = [x for x in data_series if isinstance(x, (int, float))]

    def mean(self):
        return sum(self.data) / len(self.data) if self.data else 0

    def median(self):
        if not self.data:
            return 0
        sorted_data = sorted(self.data)
        n = len(sorted_data)
        mid = n // 2
        return sorted_data[mid] if n % 2 != 0 else (sorted_data[mid - 1] + sorted_data[mid]) / 2

    def summary(self):
        return {
            "count": len(self.data),
            "sum": sum(self.data),
            "mean": round(self.mean(), 2),
            "median": self.median(),
            "min": min(self.data) if self.data else None,
            "max": max(self.data) if self.data else None,
        }

# Приклад виклику:
sample_data = [42, 18, 95, 23, 67, 88, 104, 50, 72]
analyzer = DataAnalyzer(sample_data)
stats = analyzer.summary()

print("=== Результати Аналізу Даних ===")
for key, value in stats.items():
    print(f"{key.capitalize()}: {value}")
`
  },
  {
    id: 'css-grid-vars',
    name: 'Modern CSS Variables & Grid',
    language: 'css',
    filename: 'styles.css',
    description: 'Гнучка CSS сітка з кастомними змінними та темною тему',
    content: `:root {
  --primary-accent: #a855f7;
  --bg-dark: #0f0d1a;
  --panel-bg: rgba(30, 27, 46, 0.6);
  --border-color: rgba(168, 85, 247, 0.2);
  --text-main: #f3f0ff;
  --text-sub: #a19bb8;
}

body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: 'Inter', system-ui, sans-serif;
  padding: 2rem;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-accent);
}
`
  },
  {
    id: 'c-program',
    name: 'C/C++ Algorithm Template',
    language: 'cpp',
    filename: 'main.cpp',
    description: 'Шаблон C/C++ програми з введенням/виведенням даних та обчисленнями',
    content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "⚡ Ласкаво просимо до C/C++ у NEXUS!" << std::endl;
    
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    double avg = static_cast<double>(sum) / numbers.size();

    std::cout << "Сума елементів: " << sum << std::endl;
    std::cout << "Середнє значення: " << avg << std::endl;

    return 0;
}
`
  },
  {
    id: 'java-class',
    name: 'Java Main Application',
    language: 'java',
    filename: 'Main.java',
    description: 'Шаблон классу Java з головним методом main та обробкою даних',
    content: `public class Main {
    public static void main(String[] args) {
        System.out.println("☕ Java 21 Application Running in NEXUS");
        
        int[] scores = {95, 88, 100, 72, 84};
        int max = scores[0];
        
        for (int score : scores) {
            if (score > max) max = score;
        }
        
        System.out.println("Максимальний бал у системі: " + max);
    }
}
`
  },
  {
    id: 'rust-script',
    name: 'Rust Binary Application',
    language: 'rust',
    filename: 'main.rs',
    description: 'Шаблон Rust з функціями, структурами та форматованим виведенням',
    content: `fn main() {
    println!("🦀 Rust High-Performance Engine");

    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let even_sum: i32 = numbers.iter().filter(|&&x| x % 2 == 0).sum();

    println!("Сума парних чисел: {}", even_sum);
}
`
  },
  {
    id: 'go-app',
    name: 'Go App (Golang)',
    language: 'go',
    filename: 'main.go',
    description: 'Шаблон пакета main у Go з форматованим виводом fmt.Println',
    content: `package main

import "fmt"

func main() {
    fmt.Println("🐹 Hello from Go Microservice!")

    users := map[string]string{
        "admin": "Active",
        "guest": "Pending",
    }

    for user, status := range users {
        fmt.Printf("Користувач: %s, Статус: %s\\n", user, status)
    }
}
`
  },
  {
    id: 'sql-query',
    name: 'SQL Database Script',
    language: 'sql',
    filename: 'queries.sql',
    description: 'Запити SELECT, CREATE TABLE та INSERT для виконання в база даних',
    content: `-- Створення таблиці користувачів
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    role VARCHAR(30),
    score INT
);

-- Запит на вибір розробників з високим рейтингом
SELECT id, name, role, score 
FROM users 
WHERE score >= 90 
ORDER BY score DESC;
`
  }
];

export const CodeEditorModule: React.FC = () => {
  const { projects, settings, addProject, deleteProject, updateSettings } = useAppContext();
  const toast = useToast();
  const { lang } = useTranslation();

  const [files, setFiles] = useState<CodeFile[]>(() => {
    try {
      // Check first if there's a LiveShare payload in the hash
      if (window.location.hash.startsWith('#share=')) {
        const base64 = window.location.hash.replace('#share=', '');
        const decoded = JSON.parse(decodeURIComponent(escape(atob(base64))));
        if (decoded && Array.isArray(decoded.files)) {
          const loadedFiles: CodeFile[] = decoded.files.map((f: any, idx: number) => ({
            id: `shared-file-${idx}`,
            name: f.name || 'file.txt',
            language: f.language || 'javascript',
            content: f.content || '',
            updatedAt: new Date().toISOString()
          }));
          localStorage.setItem('nexus_code_files', JSON.stringify(loadedFiles));
          toast.success(lang === 'uk' ? 'Спільні файли успішно імпортовано з посилання!' : 'Shared files successfully imported from URL!');
          // Clear hash to prevent reloading on next refresh
          window.location.hash = '';
          return loadedFiles;
        }
      }

      const saved = localStorage.getItem('nexus_code_files');
      return saved ? JSON.parse(saved) : DEFAULT_FILES;
    } catch {
      return DEFAULT_FILES;
    }
  });

  // Tabs list
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    return files.slice(0, 3).map(f => f.id);
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return openTabIds[0] || files[0]?.id || '';
  });

  // Split View States
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [splitFileId, setSplitFileId] = useState<string>('');

  // Editor Settings states
  const [editorTheme, setEditorTheme] = useState<'nexus-dark' | 'vs-dark' | 'light' | 'monokai'>('nexus-dark');

  const editorOptions = useMemo(() => ({
    minimap: { 
      enabled: settings.editorMinimap ?? true,
      renderCharacters: false,
      maxColumn: 120,
    },
    wordWrap: (settings.editorWordWrap ?? true) ? 'on' : 'off' as 'on' | 'off',
    fontSize: settings.editorFontSize ?? 14,
    tabSize: settings.editorTabSize ?? 2,
    lineNumbers: (settings.editorLineNumbers ?? true) ? 'on' : 'off' as 'on' | 'off',
    automaticLayout: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    fontLigatures: true,
    renderWhitespace: 'selection' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
      highlightActiveIndentation: true,
    },
    formatOnPaste: true,
    formatOnType: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    suggestOnTriggerCharacters: true,
    scrollBeyondLastLine: false,
    renderValidationDecorations: 'editable' as const,
    fastScrollSensitivity: 5,
    linkedEditing: true,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    snippetSuggestions: 'top' as const,
    hover: { enabled: true, delay: 300 },
  }), [settings.editorMinimap, settings.editorWordWrap, settings.editorFontSize, settings.editorTabSize, settings.editorLineNumbers]);

  // Vim Mode State
  const [isVimEnabled, setIsVimEnabled] = useState(() => {
    return localStorage.getItem('nexus_vim_enabled') === 'true';
  });

  // Diff Mode Viewer State
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffOriginalText, setDiffOriginalText] = useState('// Paste original code snippet here...');
  const [diffModifiedText, setDiffModifiedText] = useState('// Paste modified code snippet here...');

  // Version History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<{ timestamp: string; content: string }[]>([]);

  // Search and Replace Sidebar State
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ fileId: string; fileName: string; line: number; text: string }[]>([]);

  // Playground Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Python IDLE Interactive Shell Modal State
  const [isPythonIdleOpen, setIsPythonIdleOpen] = useState(false);

  // Active files info
  const activeFile = files.find(f => f.id === activeFileId);
  const splitFile = files.find(f => f.id === splitFileId);

  const [editorContent, setEditorContent] = useState(activeFile?.content || '');
  const [splitEditorContent, setSplitEditorContent] = useState(splitFile?.content || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Stats
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Modal form states
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<'web' | 'mobile' | 'backend' | 'ai' | 'other'>('web');

  // Feature modals state
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const editorInstanceRef = useRef<any>(null);
  const vimModeRef = useRef<any>(null);
  const editorContentRef = useRef(editorContent);

  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);

  // Console Log State
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState<{ id: string; type: 'log' | 'warn' | 'error' | 'result' | 'info'; text: string }[]>([]);

  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: (e.data.logType || 'log') as 'log' | 'warn' | 'error' | 'result' | 'info',
          text: String(e.data.data || '')
        };
        setConsoleLogs(prev => [...prev.slice(-100), newLog]);
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Load editor content on switching tabs
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      editorContentRef.current = activeFile.content;
      setSaveStatus('idle');
    }
  }, [activeFileId]);

  useEffect(() => {
    if (splitFile) {
      setSplitEditorContent(splitFile.content);
    }
  }, [splitFileId]);

  // Synchronize active file details to localStorage for access by other modules (like Gemini AI Assistant)
  useEffect(() => {
    if (activeFile) {
      localStorage.setItem('nexus_current_active_file_id', activeFile.id);
      localStorage.setItem('nexus_current_active_file_name', activeFile.name);
      const timer = setTimeout(() => {
        localStorage.setItem('nexus_current_active_file_content', editorContent);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      localStorage.removeItem('nexus_current_active_file_id');
      localStorage.removeItem('nexus_current_active_file_name');
      localStorage.removeItem('nexus_current_active_file_content');
    }
  }, [activeFileId, editorContent, activeFile]);

  // Cleanup orphaned project IDs in files if project was deleted
  useEffect(() => {
    const validProjectIds = new Set(projects.map(p => p.id));
    let hasOrphans = false;
    const cleanedFiles = files.map(f => {
      if (f.projectId && !validProjectIds.has(f.projectId)) {
        hasOrphans = true;
        return { ...f, projectId: undefined };
      }
      return f;
    });

    if (hasOrphans) {
      setFiles(cleanedFiles);
      localStorage.setItem('nexus_code_files', JSON.stringify(cleanedFiles));
    }
  }, [projects]);

  // Debounced auto-save for primary editor
  useEffect(() => {
    if (!activeFileId) return;
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;

    if (file.content !== editorContent) {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        const currentContent = editorContentRef.current;
        setFiles(prevFiles => {
          const fileExists = prevFiles.some(f => f.id === activeFileId);
          if (!fileExists) return prevFiles;
          const updatedFiles = prevFiles.map(f => 
            f.id === activeFileId ? { ...f, content: currentContent, updatedAt: new Date().toISOString() } : f
          );
          localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
          return updatedFiles;
        });
        storage.logActivity();
        setSaveStatus('saved');
        setPreviewKey(k => k + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [editorContent, activeFileId]);

  // Debounced auto-save for split editor
  useEffect(() => {
    if (!splitFileId) return;
    const file = files.find(f => f.id === splitFileId);
    if (!file) return;

    if (file.content !== splitEditorContent) {
      const timer = setTimeout(() => {
        setFiles(prevFiles => {
          const fileExists = prevFiles.some(f => f.id === splitFileId);
          if (!fileExists) return prevFiles;
          const updatedFiles = prevFiles.map(f => 
            f.id === splitFileId ? { ...f, content: splitEditorContent, updatedAt: new Date().toISOString() } : f
          );
          localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
          return updatedFiles;
        });
        storage.logActivity();
        setPreviewKey(k => k + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [splitEditorContent, splitFileId]);

  // Keep openTabIds and activeFileId synchronized with existing files list
  useEffect(() => {
    if (files.length === 0) return;
    const validFileIds = new Set(files.map(f => f.id));
    const validTabs = openTabIds.filter(tid => validFileIds.has(tid));

    if (validTabs.length !== openTabIds.length || validTabs.length === 0) {
      const nextTabs = validTabs.length > 0 ? validTabs : [files[0].id];
      setOpenTabIds(nextTabs);
      if (!validFileIds.has(activeFileId)) {
        const nextActive = nextTabs[0];
        setActiveFileId(nextActive);
        const nextF = files.find(f => f.id === nextActive);
        if (nextF) setEditorContent(nextF.content);
      }
    } else if (!validFileIds.has(activeFileId)) {
      const nextActive = validTabs[0] || files[0].id;
      setActiveFileId(nextActive);
      const nextF = files.find(f => f.id === nextActive);
      if (nextF) setEditorContent(nextF.content);
    }
  }, [files]);

  // Auto-Save Snapshot History effect (runs every 5 minutes)
  useEffect(() => {
    if (!activeFileId || !editorContent) return;

    const interval = setInterval(() => {
      const historyKey = `nexus_file_history_${activeFileId}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Save snapshot if history is empty OR file content changed since last snapshot
      if (existingHistory.length === 0 || existingHistory[0].content !== editorContent) {
        const updated = [{ timestamp: new Date().toISOString(), content: editorContent }, ...existingHistory].slice(0, 20);
        localStorage.setItem(historyKey, JSON.stringify(updated));
        setHistoryList(updated);
        toast.info(lang === 'uk' ? 'Створено знімок історії коду (Session Snapshot)' : 'Code session history snapshot auto-saved');
      }
    }, 300000); // 5 minutes (300,000 ms)

    return () => clearInterval(interval);
  }, [activeFileId, editorContent, lang]);

  // Load active file's history list
  useEffect(() => {
    if (activeFileId) {
      const historyKey = `nexus_file_history_${activeFileId}`;
      const savedList = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistoryList(savedList);
    } else {
      setHistoryList([]);
    }
  }, [activeFileId]);

  // VIM Mode Initialization / Cleanup
  useEffect(() => {
    if (!editorInstanceRef.current) return;

    if (isVimEnabled) {
      const statusEl = document.getElementById('vim-status-bar');
      if (statusEl) {
        statusEl.innerHTML = ''; // Reset
        try {
          vimModeRef.current = initVimMode(editorInstanceRef.current, statusEl);
        } catch (err) {
          console.error('Error binding Vim Mode:', err);
        }
      }
    } else {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    }

    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    };
  }, [isVimEnabled, activeFileId]);

  const toggleVimMode = () => {
    const nextState = !isVimEnabled;
    setIsVimEnabled(nextState);
    localStorage.setItem('nexus_vim_enabled', String(nextState));
    toast.success(nextState 
      ? (lang === 'uk' ? 'Режим Vim активовано. Спробуйте клавіші h, j, k, l та :w' : 'Vim Mode activated. Feel free to use h, j, k, l or :w')
      : (lang === 'uk' ? 'Режим Vim вимкнено.' : 'Vim Mode disabled.')
    );
  };

  // Global Search logic
  const handleGlobalSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results: { fileId: string; fileName: string; line: number; text: string }[] = [];
    files.forEach(file => {
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            line: idx + 1,
            text: lineText.trim()
          });
        }
      });
    });
    setSearchResults(results);
    toast.success(lang === 'uk' ? `Знайдено ${results.length} збігів.` : `Found ${results.length} search results.`);
  };

  // Global Replace logic
  const handleGlobalReplace = () => {
    if (!searchQuery.trim()) return;
    let count = 0;
    const updatedFiles = files.map(file => {
      if (file.content.includes(searchQuery)) {
        // Replace all occurrences of query in this file
        const regex = new RegExp(searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        const nextContent = file.content.replace(regex, replaceQuery);
        count += (file.content.match(regex) || []).length;
        
        // If it's the active file, update active editor content
        if (file.id === activeFileId) {
          setEditorContent(nextContent);
        }
        return { ...file, content: nextContent, updatedAt: new Date().toISOString() };
      }
      return file;
    });

    setFiles(updatedFiles);
    localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
    setSearchResults([]);
    setSearchQuery('');
    setReplaceQuery('');
    toast.success(lang === 'uk' ? `Замінено ${count} збігів у файлах!` : `Successfully replaced ${count} matches in files!`);
  };

  // Export workspace files as JSON configuration file
  const handleExportWorkspace = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(files, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `nexus-workspace-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(lang === 'uk' ? 'Резервну копію успішно завантажено!' : 'Workspace backup JSON downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  // Import files from JSON backup
  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0 && imported[0].name && imported[0].content) {
          setFiles(imported);
          localStorage.setItem('nexus_code_files', JSON.stringify(imported));
          setOpenTabIds(imported.map(f => f.id));
          setActiveFileId(imported[0].id);
          toast.success(lang === 'uk' ? 'Файли успішно відновлено з копії!' : 'Workspace files successfully restored!');
        } else {
          toast.error('Invalid backup format');
        }
      } catch {
        toast.error('Failed to parse backup JSON');
      }
    };
    reader.readAsText(file);
  };

  // LiveShare link generation (Read-only / offline parsing)
  const handleLiveShare = () => {
    try {
      const shareData = {
        files: files.map(f => ({ name: f.name, language: f.language, content: f.content }))
      };
      const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#share=${base64}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success(lang === 'uk' ? 'Посилання для перегляду копійовано в буфер!' : 'Read-only link copied to clipboard!');
    } catch {
      toast.error('LiveShare Link generation failed');
    }
  };

  // Restore specified snapshot from history
  const handleRestoreHistory = (historyContent: string) => {
    setEditorContent(historyContent);
    toast.success(lang === 'uk' ? 'Версію відновлено. Не забудьте перевірити код!' : 'Version snapshot restored successfully!');
    setIsHistoryOpen(false);
  };

  // Compare active file with historic snapshot
  const handleCompareHistory = (historyContent: string) => {
    setDiffOriginalText(historyContent);
    setDiffModifiedText(editorContent);
    setIsDiffMode(true);
    setIsHistoryOpen(false);
    toast.success(lang === 'uk' ? 'Порівняння активовано у вкладці Diff' : 'Historic difference loaded inside Diff tab');
  };

  // Tab management helpers
  const openTab = (id: string) => {
    if (!openTabIds.includes(id)) {
      setOpenTabIds([...openTabIds, id]);
    }
    setActiveFileId(id);
    setIsDiffMode(false);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = openTabIds.filter(tid => tid !== id);
    setOpenTabIds(updated);

    if (activeFileId === id && updated.length > 0) {
      setActiveFileId(updated[updated.length - 1]);
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (!name) {
      toast.warning(lang === 'uk' ? 'Будь ласка, вкажіть ім\'я файлу' : 'Please specify a filename');
      return;
    }

    const newFile: CodeFile = {
      id: `file-${Math.random().toString(36).substring(2, 9)}`,
      name,
      language: newFileLanguage,
      content: newFileLanguage === 'html' ? DEFAULT_FILES[0].content : `// Новий файл ${name}\n`,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...files, newFile];
    setFiles(updated);
    localStorage.setItem('nexus_code_files', JSON.stringify(updated));
    openTab(newFile.id);
    setIsNewFileModalOpen(false);
    setNewFileName('');
    toast.success(lang === 'uk' ? `Файл "${name}" успішно створено!` : `File "${name}" created!`);
  };

  const handleDeleteProject = (projId: string, projName: string) => {
    if (window.confirm(lang === 'uk'
      ? `Ви дійсно бажаєте видалити проєкт "${projName}"? Файли редактора залишаться.`
      : `Are you sure you want to delete project "${projName}"? Editor files will remain.`
    )) {
      deleteProject(projId);
      const updatedFiles = files.map(f => f.projectId === projId ? { ...f, projectId: undefined } : f);
      setFiles(updatedFiles);
      localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
      toast.success(lang === 'uk' ? 'Проєкт успішно видалено!' : 'Project deleted successfully!');
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    addProject({
      name,
      category: newProjectCategory,
      status: 'active',
      progress: 0,
      tags: ['Code Editor'],
      description: lang === 'uk' ? 'Створено в Редакторі' : 'Created in Editor',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    toast.success(lang === 'uk' ? `Проєкт "${name}" створено!` : `Project "${name}" created!`);
  };

  const handleDeleteFile = (id: string, name: string) => {
    let updated = files.filter(f => f.id !== id);
    if (updated.length === 0) {
      const defaultFile: CodeFile = {
        id: `file-${Date.now()}`,
        name: 'main.js',
        language: 'javascript',
        content: '// New File\nconsole.log("Hello NEXUS!");\n',
        updatedAt: new Date().toISOString()
      };
      updated = [defaultFile];
    }
    setFiles(updated);
    localStorage.setItem('nexus_code_files', JSON.stringify(updated));
    
    let updatedTabs = openTabIds.filter(tid => tid !== id);

    if (activeFileId === id || !updated.some(f => f.id === activeFileId)) {
      const nextActiveId = updatedTabs[0] || (updated[0] ? updated[0].id : '');
      if (nextActiveId && !updatedTabs.includes(nextActiveId)) {
        updatedTabs = [...updatedTabs, nextActiveId];
      }
      setActiveFileId(nextActiveId);
      const nextFile = updated.find(f => f.id === nextActiveId);
      if (nextFile) {
        setEditorContent(nextFile.content);
      }
    }
    setOpenTabIds(updatedTabs.length > 0 ? updatedTabs : [updated[0].id]);

    if (splitFileId === id) {
      setSplitFileId('');
      setIsSplitEnabled(false);
    }
    toast.success(lang === 'uk' ? `Файл "${name}" успішно видалено!` : `File "${name}" deleted!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    toast.success(lang === 'uk' ? 'Вміст файлу копійовано!' : 'File content copied!');
  };

  // Extract exact line and column numbers from JavaScript errors
  const getJSErrorLocation = (err: any, code: string) => {
    let line: number | null = null;
    let col: number | null = null;

    if (err && err.stack) {
      const stackStr = String(err.stack);
      const matches = Array.from(stackStr.matchAll(/(?:<anonymous>|eval|Function|blob:?|at\s+eval\s+.*?):(\d+):(\d+)/g));
      if (matches.length > 0) {
        for (const match of matches) {
          const rawLine = parseInt(match[1], 10);
          const rawCol = parseInt(match[2], 10);
          if (!isNaN(rawLine) && rawLine > 0) {
            line = rawLine;
            col = rawCol;
            break;
          }
        }
      }
    }

    if (line === null && typeof err?.lineNumber === 'number') {
      line = err.lineNumber;
      if (typeof err?.columnNumber === 'number') {
        col = err.columnNumber;
      }
    }

    // Fallback line search for SyntaxError
    if (line === null && (err instanceof SyntaxError || err?.name === 'SyntaxError')) {
      const codeLines = code.split('\n');
      for (let i = 0; i < codeLines.length; i++) {
        try {
          new Function('console', 'print', codeLines.slice(0, i + 1).join('\n'));
        } catch (testErr: any) {
          if (testErr?.name === 'SyntaxError') {
            line = i + 1;
            break;
          }
        }
      }
      if (line === null && codeLines.length > 0) {
        line = codeLines.length;
      }
    }

    return { line, col };
  };

  // Execute active file code and send logs to console
  const handleExecuteCurrentFile = async () => {
    if (!activeFile) return;
    setIsConsoleOpen(true);

    // Always extract exact live code directly from Monaco model or ref
    const liveContent = (editorInstanceRef.current ? editorInstanceRef.current.getValue() : editorContentRef.current) || editorContent || activeFile.content || '';

    // Synchronize editorContent state, ref, and files array
    setEditorContent(liveContent);
    editorContentRef.current = liveContent;

    setFiles(prevFiles => {
      const updatedFiles = prevFiles.map(f => 
        f.id === activeFile.id ? { ...f, content: liveContent, updatedAt: new Date().toISOString() } : f
      );
      localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
      return updatedFiles;
    });

    const logsToSet: { id: string; type: 'log' | 'warn' | 'error' | 'result' | 'info'; text: string }[] = [];

    const addLog = (type: 'log' | 'warn' | 'error' | 'result' | 'info', text: string) => {
      logsToSet.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${logsToSet.length}`,
        type,
        text
      });
    };

    const langLower = (activeFile?.language || '').toLowerCase();
    const fileNameLower = (activeFile?.name || '').toLowerCase();

    const hasPythonSyntax = /^\s*(import\s+(json|sys|math|os|random|re|datetime|time|collections|itertools|functools|[a-zA-Z0-9_]+)|from\s+[a-zA-Z0-9_]+\s+import|def\s+\w+|print\s*\(|class\s+\w+|elif\s+|if\s+__name__\s*==)/m.test(liveContent);
    const hasJSSyntax = /\b(const|let|var|function|console\.log|export|import\s+.*from)\b/.test(liveContent);

    const isPython = 
      langLower === 'python' || 
      fileNameLower.endsWith('.py') || 
      (hasPythonSyntax && !hasJSSyntax);

    const isHTML = langLower === 'html' || fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm');
    const isCSS = langLower === 'css' || fileNameLower.endsWith('.css');
    const isC = langLower === 'c' || langLower === 'cpp' || fileNameLower.endsWith('.c') || fileNameLower.endsWith('.cpp') || fileNameLower.endsWith('.h') || fileNameLower.endsWith('.hpp');
    const isJava = langLower === 'java' || fileNameLower.endsWith('.java');
    const isRust = langLower === 'rust' || fileNameLower.endsWith('.rs');
    const isGo = langLower === 'go' || fileNameLower.endsWith('.go');
    const isSQL = langLower === 'sql' || fileNameLower.endsWith('.sql');
    const isShell = langLower === 'shell' || langLower === 'bash' || fileNameLower.endsWith('.sh') || fileNameLower.endsWith('.bash');
    const isJSON = langLower === 'json' || fileNameLower.endsWith('.json');
    const isMarkdown = langLower === 'markdown' || fileNameLower.endsWith('.md');

    const isJS = !isPython && !isHTML && !isC && !isJava && !isRust && !isGo && !isSQL && !isShell && !isJSON && (
      langLower === 'javascript' || 
      langLower === 'typescript' || 
      fileNameLower.endsWith('.js') || 
      fileNameLower.endsWith('.ts') ||
      fileNameLower.endsWith('.jsx') ||
      fileNameLower.endsWith('.tsx')
    );

    if (isPython) {
      setIsPythonIdleOpen(true);
      addLog('info', lang === 'uk' ? '🐍 Інтерактивне вікно Python IDLE відкрито.' : '🐍 Interactive Python IDLE Shell opened.');

      try {
        const pyResult = await executePythonCode(liveContent, lang);
        pyResult.logs.forEach(l => {
          addLog(l.type, l.text);
        });
      } catch (err: any) {
        addLog('error', `✖ Python execution failed: ${err?.message || String(err)}`);
      }
    } else if (isC) {
      addLog('info', lang === 'uk' ? '⚡ Виконання C/C++ коду...' : '⚡ Executing C/C++ program...');
      const res = executeCCode(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isJava) {
      addLog('info', lang === 'uk' ? '☕ Виконання Java коду...' : '☕ Executing Java bytecode...');
      const res = executeJavaCode(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isRust) {
      addLog('info', lang === 'uk' ? '🦀 Виконання Rust коду...' : '🦀 Executing Rust program...');
      const res = executeRustCode(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isGo) {
      addLog('info', lang === 'uk' ? '🐹 Виконання Go коду...' : '🐹 Executing Go application...');
      const res = executeGoCode(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isSQL) {
      addLog('info', lang === 'uk' ? '🗄️ Виконання SQL запиту...' : '🗄️ Executing SQL queries...');
      const res = executeSqlQueries(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isShell) {
      addLog('info', lang === 'uk' ? '🐚 Виконання Shell скрипта...' : '🐚 Executing Shell script...');
      const res = executeShellScript(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isJSON) {
      addLog('info', lang === 'uk' ? '📋 Валідація JSON...' : '📋 Validating JSON document...');
      const res = executeJsonValidation(liveContent);
      res.logs.forEach(l => addLog(l.type, l.text));
    } else if (isMarkdown) {
      addLog('info', lang === 'uk' ? '📝 Markdown файл. Для перегляду використовуйте Live Preview.' : '📝 Markdown file. Use Live Preview for full rendering.');
    } else if (isJS) {
      try {
        let loggedCount = 0;
        const customConsole = {
          log: (...args: any[]) => {
            loggedCount++;
            const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            addLog('log', str);
          },
          warn: (...args: any[]) => {
            loggedCount++;
            const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            addLog('warn', str);
          },
          error: (...args: any[]) => {
            loggedCount++;
            const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            addLog('error', str);
          },
          info: (...args: any[]) => {
            loggedCount++;
            const str = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            addLog('info', str);
          }
        };

        const print = customConsole.log;

        // Strip TS annotations if TypeScript file
        const codeToRun = (langLower === 'typescript' || fileNameLower.endsWith('.ts') || fileNameLower.endsWith('.tsx'))
          ? stripTypeScript(liveContent)
          : liveContent;

        // Try standard Function execution
        let evalResult: any;
        let fnExecutedSuccessfully = false;

        try {
          const runnableFn = new Function('console', 'print', codeToRun);
          evalResult = runnableFn(customConsole, print);
          fnExecutedSuccessfully = true;
        } catch (fnErr: any) {
          if (fnErr instanceof SyntaxError || fnErr?.name === 'SyntaxError') {
            throw fnErr;
          }
        }

        if (fnExecutedSuccessfully && evalResult === undefined && loggedCount === 0) {
          try {
            const evalFn = new Function('console', 'print', `
              return (function() {
                return eval(${JSON.stringify(codeToRun)});
              })();
            `);
            evalResult = evalFn(customConsole, print);
          } catch (_) {
            // Ignore eval fallback errors
          }
        }

        if (evalResult && typeof evalResult === 'object' && typeof evalResult.then === 'function') {
          evalResult = await evalResult;
        }

        if (evalResult !== undefined) {
          addLog('result', typeof evalResult === 'object' ? JSON.stringify(evalResult, null, 2) : String(evalResult));
        } else if (loggedCount === 0) {
          addLog('info', lang === 'uk' ? '✓ Код виконано успішно (без виводу).' : '✓ Code executed successfully (no output).');
        }
      } catch (err: any) {
        const loc = getJSErrorLocation(err, liveContent);
        const errType = err?.name || 'Error';
        const errMsg = err?.message || String(err);
        
        let formattedError = '';
        if (loc.line) {
          const lineStr = lang === 'uk' ? `Рядок ${loc.line}` : `Line ${loc.line}`;
          const colStr = loc.col ? (lang === 'uk' ? `, Колонка ${loc.col}` : `, Col ${loc.col}`) : '';
          formattedError = `✖ [${lineStr}${colStr}] ${errType}: ${errMsg}`;
        } else {
          formattedError = `✖ ${errType}: ${errMsg}`;
        }
        
        addLog('error', formattedError);
      }
    } else if (isHTML || isCSS) {
      setIsPreviewOpen(true);
      setPreviewKey(k => k + 1);
      addLog('info', lang === 'uk' ? 'Файл запущено в Live Sandbox Playground.' : 'File launched in Live Sandbox Playground.');
    } else {
      addLog('info', lang === 'uk' ? `Виконано для ${activeFile?.language}.` : `Executed for ${activeFile?.language}.`);
    }

    setConsoleLogs(logsToSet);
  };

  // Voice Command Event Listener for Execute Code File
  useEffect(() => {
    const handleVoiceExec = () => {
      handleExecuteCurrentFile();
    };
    window.addEventListener('execute-code-file', handleVoiceExec);
    return () => window.removeEventListener('execute-code-file', handleVoiceExec);
  }, [activeFile, editorContent, files, lang]);

  // Compile Playground Sandbox URL
  const compilePlaygroundHtml = () => {
    const liveText = (editorInstanceRef.current ? editorInstanceRef.current.getValue() : editorContentRef.current) || editorContent;
    const html = files.find(f => f.language === 'html' || f.name.endsWith('.html'))?.content || '<h1>Sandbox Playground</h1>';
    const css = files.find(f => f.language === 'css' || f.name.endsWith('.css'))?.content || '';
    const js = activeFile && (activeFile.language === 'javascript' || activeFile.name.endsWith('.js'))
      ? liveText
      : (files.find(f => f.language === 'javascript' || f.name.endsWith('.js'))?.content || liveText || '');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            function formatArg(arg) {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg, null, 2); } catch(e) { return String(arg); }
              }
              return String(arg);
            }

            function emitLog(logType, ...args) {
              const text = args.map(formatArg).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', logType, data: text }, '*');
            }

            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;

            console.log = function(...args) {
              originalLog(...args);
              emitLog('log', ...args);
            };
            console.warn = function(...args) {
              originalWarn(...args);
              emitLog('warn', ...args);
            };
            console.error = function(...args) {
              originalError(...args);
              emitLog('error', ...args);
            };

            // Support pythonic / simple print("...") alias
            window.print = function(...args) {
              console.log(...args);
            };

            window.onerror = function(msg, url, line) {
              emitLog('error', 'Uncaught Error: ' + msg + ' (line ' + line + ')');
              return false;
            };

            try {
              ${js}
            } catch(e) {
              emitLog('error', 'Runtime Error: ' + e.message);
              document.body.innerHTML += '<div style="color: #ef4444; background: rgba(239,68,68,0.1); padding: 12px; border: 1px solid #ef4444; margin-top: 15px; border-radius: 6px; font-family: monospace;">Error: ' + e.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;
  };

  // Advanced Code Formatting
  const formatCode = () => {
    if (!editorContent) return;
    try {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.getAction('editor.action.formatDocument')?.run();
      }

      if (activeFile?.language === 'json') {
        const parsed = JSON.parse(editorContent);
        setEditorContent(JSON.stringify(parsed, null, 2));
        toast.success(lang === 'uk' ? 'Код JSON успішно відформатовано!' : 'JSON formatted!');
      } else {
        const lines = editorContent.split('\n');
        let indentLevel = 0;
        const indentStr = '  ';
        const formatted = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          const res = indentStr.repeat(indentLevel) + trimmed;
          if (
            (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(') || (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && trimmed.includes('>'))) &&
            !trimmed.startsWith('//')
          ) {
            indentLevel++;
          }
          return res;
        }).join('\n');
        setEditorContent(formatted);
        toast.success(lang === 'uk' ? 'Форматування коду завершено!' : 'Code formatted!');
      }
    } catch (e) {
      toast.error(lang === 'uk' ? 'Помилка форматування' : 'Formatting error');
    }
  };

  // Export active code file
  const handleExportSingleFile = () => {
    if (!activeFile) return;
    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(lang === 'uk' ? `Файл "${activeFile.name}" успішно скачано!` : `File ${activeFile.name} downloaded!`);
  };

  // Import code file(s) from computer
  const handleImportCodeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const importedFileList = e.target.files;
    if (!importedFileList || importedFileList.length === 0) return;

    Array.from(importedFileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        
        let language = 'javascript';
        if (['ts', 'tsx'].includes(ext)) language = 'typescript';
        else if (['html', 'htm'].includes(ext)) language = 'html';
        else if (['css', 'scss', 'less'].includes(ext)) language = 'css';
        else if (['json'].includes(ext)) language = 'json';
        else if (['py'].includes(ext)) language = 'python';
        else if (['md', 'markdown'].includes(ext)) language = 'markdown';
        else if (['sh', 'bash'].includes(ext)) language = 'shell';

        const newFileObj: CodeFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          language,
          content,
          updatedAt: new Date().toISOString()
        };

        setFiles(prev => {
          const updated = [...prev, newFileObj];
          localStorage.setItem('nexus_code_files', JSON.stringify(updated));
          return updated;
        });

        setOpenTabIds(prev => prev.includes(newFileObj.id) ? prev : [...prev, newFileObj.id]);
        setActiveFileId(newFileObj.id);
        toast.success(lang === 'uk' ? `Файл "${file.name}" імпортовано!` : `Imported ${file.name}`);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Apply template
  const handleApplyTemplate = (tmpl: typeof CODE_TEMPLATES[0]) => {
    const newFileObj: CodeFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: tmpl.filename,
      language: tmpl.language,
      content: tmpl.content,
      updatedAt: new Date().toISOString()
    };

    setFiles(prev => {
      const updated = [...prev, newFileObj];
      localStorage.setItem('nexus_code_files', JSON.stringify(updated));
      return updated;
    });

    setOpenTabIds(prev => [...prev, newFileObj.id]);
    setActiveFileId(newFileObj.id);
    setIsTemplatesModalOpen(false);
    toast.success(lang === 'uk' ? `Шаблон "${tmpl.name}" створено як новий файл!` : `Created template ${tmpl.name}!`);
  };

  // Compute Code Stats
  const getCodeStats = () => {
    const text = editorContent || '';
    const lines = text.split('\n');
    const totalLines = lines.length;
    const blankLines = lines.filter(l => l.trim() === '').length;
    const commentLines = lines.filter(l => {
      const t = l.trim();
      return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('<!--');
    }).length;
    const codeLines = totalLines - blankLines - commentLines;

    const totalChars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    const functionsCount = (text.match(/(function\s+\w+|const\s+\w+\s*=\s*\(|\bdef\s+\w+|\bclass\s+\w+)/g) || []).length;
    const importsCount = (text.match(/(\bimport\s+|\brequire\(|\bfrom\s+)/g) || []).length;

    const sizeInBytes = new Blob([text]).size;
    const sizeKb = (sizeInBytes / 1024).toFixed(2);
    const estReadingMinutes = Math.max(1, Math.ceil(words / 150));

    return {
      totalLines,
      codeLines,
      blankLines,
      commentLines,
      totalChars,
      charsNoSpaces,
      words,
      functionsCount,
      importsCount,
      sizeKb,
      sizeInBytes,
      estReadingMinutes
    };
  };

  const handleLinkProject = (projectId: string) => {
    if (!activeFileId) return;
    const updated = files.map(f => 
      f.id === activeFileId ? { ...f, projectId: projectId || undefined } : f
    );
    setFiles(updated);
    localStorage.setItem('nexus_code_files', JSON.stringify(updated));
    toast.success(projectId 
      ? (lang === 'uk' ? 'Файл прив\'язано до проєкту!' : 'File successfully linked to project!')
      : (lang === 'uk' ? 'Прив\'язку знято.' : 'Project unlinked.')
    );
  };

  const handleLanguageChange = (language: string) => {
    if (!activeFileId) return;
    const updated = files.map(f => 
      f.id === activeFileId ? { ...f, language } : f
    );
    setFiles(updated);
    localStorage.setItem('nexus_code_files', JSON.stringify(updated));
    toast.success(`Мову змінено на ${language}`);
  };

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'text-yellow-400';
      case 'typescript': return 'text-blue-400';
      case 'python': return 'text-emerald-400';
      case 'html': return 'text-orange-400';
      case 'css': return 'text-teal-400';
      case 'json': return 'text-fuchsia-400';
      case 'markdown': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  const setupTheme = (monaco: any) => {
    // Custom Nexus cyber-purple dark theme
    monaco.editor.defineTheme('nexus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7A758F', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A855F7', fontWeight: 'bold' },
        { token: 'string', foreground: '7DD3A8' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'regexp', foreground: 'EC4899' },
        { token: 'type', foreground: '6D5FE0' },
      ],
      colors: {
        'editor.background': '#13111C',
        'editor.foreground': '#EDEBF5',
        'editorCursor.foreground': '#A855F7',
        'editor.lineHighlightBackground': '#1A1829',
        'editorLineNumber.foreground': '#5C5870',
        'editorLineNumber.activeForeground': '#A855F7',
        'editor.selectionBackground': '#A855F733',
        'editorWidget.background': '#15131F',
        'editorWidget.border': '#A855F722',
      }
    });

    // Custom retro Monokai
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F92672', fontWeight: 'bold' },
        { token: 'string', foreground: 'E6DB74' },
        { token: 'number', foreground: 'AE81FF' },
        { token: 'type', foreground: '66D9EF' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#F8F8F2',
        'editorCursor.foreground': '#F8F8F0',
        'editor.lineHighlightBackground': '#3E3D32',
        'editorLineNumber.foreground': '#90908A',
        'editor.selectionBackground': '#49483E',
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 select-none relative font-sans">
      
      {/* 1. Left Sidebar: Explorer / Global Search / Options */}
      <div className="w-64 bg-[#15131F]/30 border border-border-accent/40 rounded-xl p-3 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          
          {/* Explorer: Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border-accent/15 pb-1.5 mb-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#8B879E] flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-accent-purple" />
                {lang === 'uk' ? 'Провідник Файлів' : 'File Explorer'}
              </span>
              <Button 
                type="button"
                onClick={() => setIsNewFileModalOpen(true)}
                className="p-1 h-5 w-5 bg-accent-purple/10 hover:bg-accent-purple/25 text-accent-purple rounded flex items-center justify-center border border-accent-purple/20 transition-all cursor-pointer"
                title={lang === 'uk' ? 'Новий файл' : 'New File'}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar pr-0.5">
              {files.map(file => {
                const isSelected = file.id === activeFileId && !isDiffMode;
                return (
                  <div
                    key={file.id}
                    onClick={() => openTab(file.id)}
                    className={`group flex items-center justify-between p-1.5 px-2 rounded-lg cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-accent-purple/10 text-[#EDEBF5] border-accent-purple/30 shadow-[0_0_12px_var(--color-accent-purple-glow)]' 
                        : 'border-transparent text-[#8B879E] hover:text-[#EDEBF5] hover:bg-[#1E1B2E]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden w-[78%] pr-1">
                      <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${getLanguageColor(file.language)}`} />
                      <span className="text-[11px] font-medium truncate">{file.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteFile(file.id, file.name);
                      }}
                      className="p-1 text-red-400/80 hover:text-red-400 hover:bg-red-500/20 rounded transition-all shrink-0 cursor-pointer"
                      title={lang === 'uk' ? `Видалити файл "${file.name}"` : `Delete file "${file.name}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Search & Replace (Ctrl+Shift+F equivalent panel) */}
          <div className="border-t border-border-accent/15 pt-3">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#8B879E] flex items-center gap-1.5 mb-2">
              <Search className="w-3.5 h-3.5 text-accent-purple" />
              {lang === 'uk' ? 'Пошук та Заміна' : 'Search & Replace'}
            </span>
            <div className="space-y-2">
              <input
                type="text"
                placeholder={lang === 'uk' ? 'Шукати...' : 'Find text...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121019] border border-border-accent/20 rounded-md text-[10px] p-1.5 text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
              />
              <input
                type="text"
                placeholder={lang === 'uk' ? 'Замінити на...' : 'Replace with...'}
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="w-full bg-[#121019] border border-border-accent/20 rounded-md text-[10px] p-1.5 text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
              />

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleGlobalSearch}
                  className="bg-accent-purple/10 border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/20 transition-all rounded py-1 text-[10px] font-bold cursor-pointer"
                >
                  {lang === 'uk' ? 'Знайти' : 'Find'}
                </button>
                <button
                  type="button"
                  onClick={handleGlobalReplace}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded py-1 text-[10px] font-bold cursor-pointer"
                >
                  {lang === 'uk' ? 'Замінити все' : 'Replace All'}
                </button>
              </div>

              {/* Search Results list */}
              {searchResults.length > 0 && (
                <div className="max-h-[110px] overflow-y-auto border border-border-accent/15 rounded-md p-1.5 space-y-1 bg-[#121019] custom-scrollbar text-[9px] font-mono">
                  {searchResults.map((res, rIdx) => (
                    <div
                      key={rIdx}
                      onClick={() => {
                        openTab(res.fileId);
                        // Jump editor position can be accomplished on the active state
                      }}
                      className="p-1 hover:bg-[#1E1B2E] rounded cursor-pointer text-text-secondary truncate"
                      title={`${res.fileName}:${res.line} - ${res.text}`}
                    >
                      <span className="text-accent-purple font-bold">{res.fileName}:{res.line}</span> {res.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Workspace Configurations Sidebar Footer */}
        <div className="bg-[#1E1B2E]/30 p-2.5 rounded-lg border border-border-accent/10 space-y-2">
          <div className="flex items-center gap-1.5 border-b border-border-accent/10 pb-1.5">
            <Settings className="w-3 h-3 text-accent-purple" />
            <span className="text-[9px] font-bold text-[#8B879E] uppercase tracking-wider">
              {lang === 'uk' ? 'Налаштування' : 'Preferences'}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Theme selector */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-text-tertiary">Monaco:</span>
              <select
                value={editorTheme}
                onChange={(e: any) => setEditorTheme(e.target.value)}
                className="bg-[#121019] border border-border-accent/20 rounded-md text-[9px] font-mono p-1 text-text-secondary cursor-pointer focus:outline-hidden"
              >
                <option value="nexus-dark">Nexus Dark</option>
                <option value="vs-dark">VS Code Dark</option>
                <option value="light">VS Code Light</option>
                <option value="monokai">Monokai Retro</option>
              </select>
            </div>

            {/* Minimap toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary">{lang === 'uk' ? 'Міні-карта:' : 'Minimap:'}</span>
              <input 
                type="checkbox" 
                checked={settings.editorMinimap !== false} 
                onChange={(e) => updateSettings({ editorMinimap: e.target.checked })}
                className="w-3 h-3 rounded bg-base-bg border-border-accent cursor-pointer accent-accent-purple"
              />
            </div>

            {/* Word wrap toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-tertiary">{lang === 'uk' ? 'Перенос рядків:' : 'Word Wrap:'}</span>
              <button 
                onClick={() => updateSettings({ editorWordWrap: settings.editorWordWrap !== false ? false : true })}
                className="text-[9px] font-mono font-bold text-accent-purple cursor-pointer hover:underline"
              >
                {(settings.editorWordWrap !== false) ? (lang === 'uk' ? 'ВКЛ' : 'ON') : (lang === 'uk' ? 'ВИКЛ' : 'OFF')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Central central Workspace */}
      <div className="flex-1 flex flex-col bg-[#15131F]/30 border border-border-accent/40 rounded-xl overflow-hidden relative">
        
        {/* Workspace Central Header Tabs Row */}
        <div className="flex bg-[#0A0812] border-b border-border-accent/15 overflow-x-auto justify-between items-center pr-3">
          <div className="flex items-center overflow-x-auto custom-scrollbar flex-1">
            
            {/* Diff View Tab */}
            <button
              onClick={() => setIsDiffMode(true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs border-r border-border-accent/15 cursor-pointer select-none transition-all font-bold ${
                isDiffMode 
                  ? 'bg-[#13111C] text-accent-purple border-b border-b-accent-purple font-extrabold' 
                  : 'text-text-secondary hover:text-text-primary bg-[#0d0b16]/40'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
              <span>Diff Viewer</span>
            </button>

            {openTabIds.map(tid => {
              const file = files.find(f => f.id === tid);
              if (!file) return null;
              const isActive = tid === activeFileId && !isDiffMode;
              return (
                <div
                  key={tid}
                  onClick={() => openTab(file.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs border-r border-border-accent/15 cursor-pointer select-none transition-all ${
                    isActive 
                      ? 'bg-[#13111C] text-text-primary border-b border-b-accent-purple' 
                      : 'text-text-secondary hover:text-text-primary bg-[#0d0b16]/40'
                  }`}
                >
                  <FileCode2 className={`w-3.5 h-3.5 ${getLanguageColor(file.language)}`} />
                  <span className="font-mono text-[11px] truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={(e) => closeTab(e, tid)}
                    className="p-0.5 rounded-full hover:bg-hover-bg/60 text-text-tertiary hover:text-status-error transition-all cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {openTabIds.length === 0 && !isDiffMode && (
              <span className="text-[10px] text-text-tertiary px-3 italic">Немає відкритих файлів</span>
            )}
          </div>

          {/* central actions toolbar panel */}
          <div className="flex items-center gap-2 py-1">
            
            {/* Version History Button */}
            {activeFile && !isDiffMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(true)}
                className="p-1 h-7 text-[10px] px-2 flex items-center gap-1 bg-hover-bg/20 border-border-accent/20 text-text-secondary hover:text-text-primary cursor-pointer"
                title="Історія версій"
              >
                <Clock className="w-3.5 h-3.5 text-accent-purple" />
                <span>{lang === 'uk' ? 'Історія' : 'History'}</span>
              </Button>
            )}

            {/* LiveShare Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLiveShare}
              className="p-1 h-7 text-[10px] px-2 flex items-center gap-1 bg-hover-bg/20 border-border-accent/20 text-text-secondary hover:text-text-primary cursor-pointer"
              title="Share workspace read-only code link"
            >
              <Share2 className="w-3.5 h-3.5 text-accent-purple" />
              <span>Share</span>
            </Button>

            {/* Export backup */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWorkspace}
              className="p-1 h-7 w-7 bg-hover-bg/20 border-border-accent/15 text-text-secondary hover:text-text-primary cursor-pointer"
              title={lang === 'uk' ? 'Експортувати резервну копію' : 'Export JSON backup'}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            {/* Import Backup */}
            <label
              className="p-1.5 h-7 w-7 bg-hover-bg/20 border border-border-accent/15 text-text-secondary hover:text-text-primary rounded-lg flex items-center justify-center cursor-pointer transition-all"
              title={lang === 'uk' ? 'Імпортувати резервну копію' : 'Import JSON backup'}
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportWorkspace}
                className="hidden"
              />
            </label>

            {/* Live sandbox button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className={`p-1 h-7 text-[10px] px-2 flex items-center gap-1 bg-accent-purple/10 border-accent-purple/20 text-accent-purple hover:bg-accent-purple/20 transition-all cursor-pointer ${
                isPreviewOpen ? 'bg-accent-purple/20 border-accent-purple' : ''
              }`}
            >
              {isPreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>Sandbox</span>
            </Button>

            {/* Split screen button */}
            {!isDiffMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isSplitEnabled) {
                    const remaining = files.find(f => f.id !== activeFileId);
                    setSplitFileId(remaining?.id || '');
                    setIsSplitEnabled(true);
                  } else {
                    setIsSplitEnabled(false);
                  }
                }}
                className="p-1 h-7 w-7 bg-hover-bg/40 border-border-accent/15 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                title="Розділити екран"
              >
                <Columns className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Top Control Bar (Only rendered if in diff mode OR an active file exists) */}
        {!isDiffMode && activeFile && (
          <div className="p-2 border-b border-border-accent/10 bg-[#0F0D1A]/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-[#1E1B2E] border border-border-accent/30 rounded-lg px-2 py-0.5">
                <span className="text-[9px] font-mono text-text-tertiary uppercase">Мова:</span>
                <select
                  value={activeFile.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-0 text-[10px] font-mono text-accent-purple focus:outline-hidden cursor-pointer"
                >
                  <option value="javascript" className="bg-[#15131F]">JavaScript</option>
                  <option value="typescript" className="bg-[#15131F]">TypeScript</option>
                  <option value="python" className="bg-[#15131F]">Python</option>
                  <option value="html" className="bg-[#15131F]">HTML</option>
                  <option value="css" className="bg-[#15131F]">CSS</option>
                  <option value="json" className="bg-[#15131F]">JSON</option>
                  <option value="markdown" className="bg-[#15131F]">Markdown</option>
                  <option value="shell" className="bg-[#15131F]">Bash</option>
                </select>
              </div>

              {/* Link Project selector */}
              <div className="flex items-center gap-1 bg-[#1E1B2E] border border-border-accent/30 rounded-lg px-2 py-0.5">
                <Link2 className="w-3 h-3 text-text-tertiary shrink-0" />
                <select
                  value={activeFile.projectId || ''}
                  onChange={(e) => handleLinkProject(e.target.value)}
                  className="bg-transparent border-0 text-[10px] font-mono text-text-secondary focus:outline-hidden cursor-pointer max-w-[120px]"
                >
                  <option value="" className="bg-[#15131F] text-text-tertiary">Проєкт...</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id} className="bg-[#15131F] text-[#EDEBF5]">{proj.name}</option>
                  ))}
                </select>
              </div>

              {activeFile.projectId && (
                <button
                  type="button"
                  onClick={() => {
                    const targetProjId = activeFile.projectId;
                    if (!targetProjId) return;
                    const proj = projects.find(p => p.id === targetProjId);
                    const projName = proj ? proj.name : (lang === 'uk' ? 'Цей проєкт' : 'This project');
                    if (window.confirm(lang === 'uk'
                      ? `Видалити проєкт "${projName}"? Файли редактора залишаться.`
                      : `Delete project "${projName}"? Editor files won't be deleted.`
                    )) {
                      deleteProject(targetProjId);
                      const updatedFiles = files.map(f => f.projectId === targetProjId ? { ...f, projectId: undefined } : f);
                      setFiles(updatedFiles);
                      localStorage.setItem('nexus_code_files', JSON.stringify(updatedFiles));
                      toast.success(lang === 'uk' ? 'Проєкт видалено' : 'Project deleted');
                    }
                  }}
                  className="ml-1 p-0.5 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors cursor-pointer"
                  title={lang === 'uk' ? 'Видалити проєкт' : 'Delete project'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {/* Vim Mode Quick Toggle on Toolbar */}
              <Button
                onClick={toggleVimMode}
                variant="outline"
                size="sm"
                className={`py-1 px-2.5 text-[10px] h-6 flex items-center gap-1 transition-all cursor-pointer ${
                  isVimEnabled 
                    ? 'bg-accent-purple/20 border-accent-purple text-text-primary shadow-[0_0_8px_var(--color-accent-purple-glow)]' 
                    : 'bg-hover-bg/30 border-border-accent/20 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{isVimEnabled ? 'Vim Active' : 'Enable Vim'}</span>
              </Button>

              {/* Format button */}
              <Button
                onClick={formatCode}
                variant="outline"
                size="sm"
                className="py-1 px-2 text-[10px] h-6 bg-hover-bg/30 border-border-accent/20 text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1"
                title={lang === 'uk' ? 'Форматувати код' : 'Format Code'}
              >
                <Wand2 className="w-3 h-3 text-accent-purple" />
                <span>{lang === 'uk' ? 'Форматувати' : 'Format'}</span>
              </Button>

              {/* Boilerplate Templates button */}
              <Button
                onClick={() => setIsTemplatesModalOpen(true)}
                variant="outline"
                size="sm"
                className="py-1 px-2 text-[10px] h-6 bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                title={lang === 'uk' ? 'Шаблони та плагіни коду' : 'Code Templates'}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{lang === 'uk' ? 'Шаблони' : 'Templates'}</span>
              </Button>

              {/* Code Statistics button */}
              <Button
                onClick={() => setIsStatsModalOpen(true)}
                variant="outline"
                size="sm"
                className="py-1 px-2 text-[10px] h-6 bg-teal-500/10 border-teal-500/20 text-teal-300 hover:bg-teal-500/20 transition-all cursor-pointer flex items-center gap-1"
                title={lang === 'uk' ? 'Аналітика та статистика коду' : 'Code Statistics'}
              >
                <BarChart2 className="w-3 h-3 text-teal-400" />
                <span>{lang === 'uk' ? 'Аналітика' : 'Stats'}</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Import Code File */}
              <label
                className="py-1 px-2 text-[10px] h-6 bg-hover-bg/30 border border-border-accent/20 text-text-secondary hover:text-text-primary rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                title={lang === 'uk' ? 'Імпортувати файл коду з комп\'ютера' : 'Import code file from computer'}
              >
                <Upload className="w-3 h-3" />
                <span>{lang === 'uk' ? 'Імпорт' : 'Import'}</span>
                <input
                  type="file"
                  multiple
                  accept=".js,.ts,.tsx,.jsx,.html,.css,.json,.py,.md,.txt,.sh"
                  onChange={handleImportCodeFiles}
                  className="hidden"
                />
              </label>

              {/* Download File button */}
              <Button 
                onClick={handleExportSingleFile}
                variant="outline"
                size="sm"
                className="py-1 px-2 text-[10px] h-6 bg-hover-bg/30 border-border-accent/20 text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1"
                title={lang === 'uk' ? 'Завантажити поточний файл' : 'Download current file'}
              >
                <FileText className="w-3 h-3" />
                <span>{lang === 'uk' ? 'Скачати' : 'Download'}</span>
              </Button>

              <Button
                onClick={() => setIsPythonIdleOpen(true)}
                variant="outline"
                size="sm"
                className="py-1 px-2.5 text-[10px] h-6 font-semibold bg-accent-purple/20 border-accent-purple/40 text-accent-purple hover:bg-accent-purple/30 flex items-center gap-1 shadow-[0_0_8px_var(--color-accent-purple-glow)] transition-all cursor-pointer"
                title={lang === 'uk' ? 'Автономне десктопне вікно IDLE Studio для всіх мов' : 'Standalone Polyglot IDLE Studio Window'}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>IDLE Studio</span>
              </Button>

              <Button
                onClick={handleExecuteCurrentFile}
                variant="primary"
                size="sm"
                className="py-1 px-3 text-[10px] h-6 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                title={lang === 'uk' ? 'Запустити код та вивести лог' : 'Run code & view output log'}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'uk' ? 'Запустити' : 'Run'}</span>
              </Button>

              <Button 
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="py-1 px-2 text-[10px] h-6 bg-[#1E1B2E] border-border-accent/30 text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                <Copy className="w-3 h-3 mr-1" />
                {lang === 'uk' ? 'Копіювати' : 'Copy'}
              </Button>
            </div>
          </div>
        )}

        {/* Code Editors Central Container Panel */}
        <div className="flex-1 flex overflow-hidden bg-[#13111C]">
          
          {isDiffMode ? (
            /* Built-in GitHub style Git Diff viewer screen */
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0812]">
              <div className="p-3 bg-slate-950/80 border-b border-border-accent/15 flex flex-col gap-2.5 select-none">
                <span className="text-[10px] font-mono text-accent-purple uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <Columns className="w-4 h-4 animate-pulse text-accent-purple" />
                  GitHub-Style Code Diff Visualizer
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-text-tertiary block mb-1">ORIGINAL (LEFT)</span>
                    <textarea
                      value={diffOriginalText}
                      onChange={(e) => setDiffOriginalText(e.target.value)}
                      placeholder="Paste your original code snippet..."
                      rows={3}
                      className="w-full bg-[#121019] border border-border-accent/20 rounded-lg p-1.5 font-mono text-[10px] text-text-primary placeholder:text-text-tertiary resize-none focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-text-tertiary block mb-1">MODIFIED (RIGHT)</span>
                    <textarea
                      value={diffModifiedText}
                      onChange={(e) => setDiffModifiedText(e.target.value)}
                      placeholder="Paste your modified code snippet..."
                      rows={3}
                      className="w-full bg-[#121019] border border-border-accent/20 rounded-lg p-1.5 font-mono text-[10px] text-text-primary placeholder:text-text-tertiary resize-none focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[220px]">
                <DiffEditor
                  theme={editorTheme}
                  original={diffOriginalText}
                  modified={diffModifiedText}
                  language={activeFile?.language || 'javascript'}
                  options={{
                    fontFamily: settings.codeFont ? `"${settings.codeFont}", monospace` : '"JetBrains Mono", Fira Code, monospace',
                    fontSize: settings.editorFontSize ?? 14,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    renderSideBySide: true,
                  }}
                />
              </div>
            </div>
          ) : activeFile ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Primary central pane */}
              <div className="flex-1 h-full min-w-0 flex flex-col">
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={editorContent}
                  theme={editorTheme}
                  onChange={(val) => setEditorContent(val || '')}
                  beforeMount={setupTheme}
                  onMount={(editor) => {
                    editorInstanceRef.current = editor;
                    editor.onDidChangeCursorPosition((e) => {
                      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                    });
                  }}
                  options={{
                    ...editorOptions,
                    fontFamily: settings.codeFont ? `"${settings.codeFont}", monospace` : '"JetBrains Mono", Fira Code, monospace',
                    lineHeight: (settings.editorFontSize ?? 14) + 6,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    padding: { top: 12, bottom: 12 },
                    
                    // Multi-cursor and Column selections requirements
                    multiCursorModifier: 'ctrlCmd',
                    columnSelection: true,
                    foldStyle: 'simple',
                    folding: true,
                    breadcrumbs: { enabled: true },
                    
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    }
                  }}
                />
              </div>

              {/* Split Secondary Pane */}
              {isSplitEnabled && (
                <div className="flex-1 h-full border-l border-border-accent/30 min-w-0 flex flex-col">
                  {/* Split Tab Header */}
                  <div className="p-1 bg-[#0A0812] border-b border-border-accent/15 flex items-center justify-between px-3">
                    <select
                      value={splitFileId}
                      onChange={(e) => setSplitFileId(e.target.value)}
                      className="bg-transparent text-[10px] font-mono text-accent-purple border-0 cursor-pointer focus:outline-hidden"
                    >
                      <option value="" className="bg-[#15131F]">{lang === 'uk' ? 'Оберіть файл...' : 'Select file...'}</option>
                      {files.map(f => (
                        <option key={f.id} value={f.id} className="bg-[#15131F] text-[#EDEBF5]">{f.name}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => setIsSplitEnabled(false)}
                      className="text-text-tertiary hover:text-status-error cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {splitFile ? (
                    <Editor
                      height="100%"
                      language={splitFile.language}
                      value={splitEditorContent}
                      theme={editorTheme}
                      onChange={(val) => setSplitEditorContent(val || '')}
                      beforeMount={setupTheme}
                      options={{
                        ...editorOptions,
                        fontFamily: settings.codeFont ? `"${settings.codeFont}", monospace` : '"JetBrains Mono", Fira Code, monospace',
                        fontSize: (settings.editorFontSize ?? 14) - 1,
                        lineHeight: (settings.editorFontSize ?? 14) + 5,
                        minimap: { enabled: false },
                        
                        // Multi-cursor requirements
                        multiCursorModifier: 'ctrlCmd',
                        columnSelection: true,
                        
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          verticalScrollbarSize: 5,
                          horizontalScrollbarSize: 5,
                        }
                      }}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <Columns className="w-8 h-8 text-text-tertiary mb-2 animate-pulse" />
                      <span className="text-[11px] text-text-secondary">{lang === 'uk' ? 'Оберіть файл у меню вище' : 'Select a file above'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#13111C]">
              <Code2 className="w-12 h-12 text-[#5C5870] mb-3 animate-pulse" />
              <h4 className="font-semibold text-sm text-text-primary">{lang === 'uk' ? 'Файл не відкрито' : 'No active file opened'}</h4>
              <p className="text-xs text-text-secondary max-w-sm mt-1">
                {lang === 'uk' ? 'Створити новий файл за допомогою кнопки "+" або виберіть файл у провіднику ліворуч.' : 'Create a new file using the "+" button or pick an existing file from the explorer.'}
              </p>
            </div>
          )}

          {/* Playground Real-time Side Sandbox View */}
          {isPreviewOpen && (
            <div className="w-[36%] border-l border-border-accent/40 bg-base-bg flex flex-col h-full z-20 shrink-0">
              <div className="p-2 bg-[#0C0B12] border-b border-border-accent/15 flex justify-between items-center px-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-accent-purple flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-status-success animate-pulse" />
                  Live Sandbox Playground
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setPreviewKey(k => k + 1)} 
                    className="p-1 bg-[#1A1629] text-[9px] px-2 font-mono text-text-secondary border border-border-accent/20 rounded-md cursor-pointer hover:text-white hover:bg-accent-purple/20 transition-all"
                  >
                    Оновити
                  </button>
                  <button 
                    onClick={() => setIsPreviewOpen(false)} 
                    className="text-text-tertiary hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Web Sandbox Screen */}
              <div className="flex-1 bg-white relative">
                <iframe
                  key={previewKey}
                  title="Playground Sandbox"
                  srcDoc={compilePlaygroundHtml()}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full border-0 bg-white"
                />
              </div>

              {/* Console log monitor simulation */}
              <div className="h-28 bg-[#09080E] border-t border-border-accent/20 p-2 overflow-y-auto custom-scrollbar font-mono text-[9px] text-[#7DD3A8]">
                <div className="flex justify-between text-text-tertiary border-b border-border-accent/10 pb-1 mb-1 font-bold">
                  <span>СИСТЕМНИЙ ЛОГ PLAYGROUND</span>
                  <span>[LIVE]</span>
                </div>
                <div>➔ Консоль активна. Запустіть HTML-проєкт для моніторингу подій...</div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONSOLE LOG OUTPUT PANEL */}
        {!isDiffMode && activeFile && isConsoleOpen && (
          <div className="h-36 border-t border-border-accent/30 bg-[#08070E] flex flex-col shrink-0 font-mono text-[11px] z-10">
            {/* Console Header */}
            <div className="h-7 px-3 bg-[#110F1C] border-b border-border-accent/20 flex items-center justify-between text-[#8B879E] select-none">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase text-accent-purple">
                <Terminal className="w-3.5 h-3.5 text-accent-purple" />
                <span>{lang === 'uk' ? 'Вивід' : 'Output'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteCurrentFile}
                  className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
                  title={lang === 'uk' ? 'Запустити код' : 'Run code'}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{lang === 'uk' ? 'Запустити' : 'Run'}</span>
                </button>

                <button
                  onClick={() => setConsoleLogs([])}
                  className="p-1 text-text-tertiary hover:text-white hover:bg-[#1E1B2E] rounded transition-all cursor-pointer"
                  title={lang === 'uk' ? 'Очистити' : 'Clear'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-1 text-text-tertiary hover:text-white hover:bg-[#1E1B2E] rounded transition-all cursor-pointer"
                  title={lang === 'uk' ? 'Згорнути' : 'Close'}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Console Log Content Area */}
            <div className="flex-1 p-2.5 overflow-y-auto custom-scrollbar font-mono text-[12px] leading-relaxed space-y-1 bg-[#06050B]">
              {consoleLogs.length === 0 ? (
                <div className="text-text-tertiary/60 italic text-center py-2 text-[11px]">
                  {lang === 'uk' ? 'Немає виводу. Натисніть "Запустити" для виконання коду.' : 'No output. Click "Run" to execute code.'}
                </div>
              ) : (
                consoleLogs.map((log) => {
                  const isErr = log.type === 'error';
                  const isWarn = log.type === 'warn';
                  return (
                    <div
                      key={log.id}
                      className={`font-mono text-[12px] whitespace-pre-wrap break-all ${
                        isErr ? 'text-red-400' : isWarn ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {log.text}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* BOTTOM ACTIVE WORKSPACE STATUS BAR */}
        {!isDiffMode && activeFile && (
          <div className="h-6 bg-[#09080E] border-t border-border-accent/15 flex items-center justify-between px-3 text-[10px] font-mono text-text-tertiary select-none shrink-0 z-10">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-accent-purple" />
                Ряд {cursorPos.line}, Слв {cursorPos.col}
              </span>
              <span>•</span>
              <span className="uppercase text-text-secondary font-bold">{activeFile.language}</span>
              <span>•</span>
              <span>{editorContent.length} символів</span>

              <button
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                  isConsoleOpen ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'hover:bg-white/5 text-text-tertiary'
                }`}
                title={lang === 'uk' ? 'Переключити консоль виводу' : 'Toggle output console'}
              >
                <Terminal className="w-3 h-3 text-accent-purple" />
                <span>{lang === 'uk' ? 'Консоль' : 'Console'}</span>
                {consoleLogs.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
              
              {/* Vim Active mode Indicator */}
              {isVimEnabled && (
                <>
                  <span>•</span>
                  <span id="vim-status-bar" className="text-accent-purple font-bold tracking-widest bg-accent-purple/10 px-2 rounded" />
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[9px]">
                {saveStatus === 'saving' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-status-warning rounded-full animate-pulse" />
                    <span>Збереження...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <span className="h-1.5 w-1.5 bg-status-success rounded-full" />
                    <span className="text-[#7DD3A8]">Автоматично збережено</span>
                  </>
                )}
                {saveStatus === 'idle' && (
                  <span>Автозбереження</span>
                )}
              </span>
              <span>|</span>
              <span className="text-[9px]">UTC</span>
            </div>
          </div>
        )}
      </div>

      {/* New File Modal */}
      <Modal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        title="Створити новий файл"
        size="sm"
      >
        <form onSubmit={handleCreateFile} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ім'я файлу *</Label>
            <Input 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Наприклад, index.html або styles.css"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Мова підсвітки</Label>
            <Select 
              value={newFileLanguage}
              onChange={(e) => setNewFileLanguage(e.target.value)}
            >
              <option value="javascript" className="bg-[#15131F]">JavaScript</option>
              <option value="typescript" className="bg-[#15131F]">TypeScript</option>
              <option value="python" className="bg-[#15131F]">Python</option>
              <option value="html" className="bg-[#15131F]">HTML</option>
              <option value="css" className="bg-[#15131F]">CSS</option>
              <option value="json" className="bg-[#15131F]">JSON</option>
              <option value="markdown" className="bg-[#15131F]">Markdown</option>
              <option value="shell" className="bg-[#15131F]">Bash / Shell</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsNewFileModalOpen(false)} className="cursor-pointer">
              Скасувати
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              Створити файл
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={lang === 'uk' ? 'Створити новий проєкт' : 'Create New Project'}
        size="sm"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{lang === 'uk' ? 'Назва проєкту *' : 'Project Name *'}</Label>
            <Input 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Наприклад, NEXUS App або Landing Page"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{lang === 'uk' ? 'Категорія' : 'Category'}</Label>
            <Select 
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value as any)}
            >
              <option value="web" className="bg-[#15131F]">Web Application</option>
              <option value="mobile" className="bg-[#15131F]">Mobile App</option>
              <option value="backend" className="bg-[#15131F]">Backend Service</option>
              <option value="ai" className="bg-[#15131F]">AI / ML</option>
              <option value="other" className="bg-[#15131F]">Other</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsNewProjectModalOpen(false)} className="cursor-pointer">
              {lang === 'uk' ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" className="cursor-pointer">
              {lang === 'uk' ? 'Створити проєкт' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Version History Modal/Drawer */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={lang === 'uk' ? 'Історія версій / Snapshot Sessions' : 'Code History Snapshots'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            {lang === 'uk' 
              ? 'Тут зберігаються останні 20 автозбережених знімків цього файлу. Ви можете порівняти їх у Diff-редакторі або відновити будь-яку версію.'
              : 'Here are the last 20 automatic snapshots of this file. You can load any into the Diff editor to visually compare differences or restore instantly.'}
          </p>

          <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border-accent/15 rounded-xl p-2.5 bg-[#0C0A14] custom-scrollbar">
            {historyList.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-tertiary font-mono italic">
                {lang === 'uk' ? 'Немає збережених знімків. Автозбереження кожні 5 хвилин.' : 'No snapshots saved yet. Auto-saves run every 5 minutes.'}
              </div>
            ) : (
              historyList.map((hist, hIdx) => {
                const formattedDate = new Date(hist.timestamp).toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short'
                });
                return (
                  <div key={hIdx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#14121F] border border-white/5 hover:border-accent-purple/20 transition-all text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-text-tertiary">#{historyList.length - hIdx}</span>
                      <span className="text-text-primary font-medium">{formattedDate}</span>
                      <span className="text-[10px] text-text-tertiary">({hist.content.length} B)</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompareHistory(hist.content)}
                        className="bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-[10px] font-bold px-2.5 py-1 rounded-md hover:bg-accent-purple/20 transition-all cursor-pointer"
                      >
                        {lang === 'uk' ? 'Різниця (Diff)' : 'Diff'}
                      </button>
                      <button
                        onClick={() => handleRestoreHistory(hist.content)}
                        className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-md hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >
                        {lang === 'uk' ? 'Відновити' : 'Restore'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-border-accent/15 flex justify-end">
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="cursor-pointer">
              {lang === 'uk' ? 'Закрити' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Code Boilerplate Templates Modal */}
      <Modal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title={lang === 'uk' ? 'Шаблони та заготовки коду' : 'Code Templates & Boilerplates'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            {lang === 'uk' 
              ? 'Готові архітектурні шаблони та заготовки для швидкого старту. Оберіть потрібний шаблон, щоб створити новий файл.' 
              : 'Production-ready code templates. Select a snippet below to instantly create a new editor tab.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto custom-scrollbar p-1">
            {CODE_TEMPLATES.map((tmpl) => (
              <div 
                key={tmpl.id}
                className="p-3.5 rounded-xl bg-[#14121F] border border-border-accent/20 hover:border-accent-purple/50 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-accent-purple transition-colors flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {tmpl.name}
                    </span>
                    <Badge variant="purple">{tmpl.language}</Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {tmpl.description}
                  </p>
                  <span className="text-[10px] font-mono text-text-tertiary block">
                    Файл: <strong className="text-accent-purple">{tmpl.filename}</strong>
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="w-full text-xs py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'uk' ? 'Використати шаблон' : 'Use Template'}
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border-accent/15 flex justify-end">
            <Button variant="outline" onClick={() => setIsTemplatesModalOpen(false)} className="cursor-pointer">
              {lang === 'uk' ? 'Закрити' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Code Statistics Modal */}
      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        title={lang === 'uk' ? `Аналітика файлу: ${activeFile?.name || 'Code Stats'}` : `Code Statistics: ${activeFile?.name || 'Code Stats'}`}
        size="md"
      >
        {(() => {
          const stats = getCodeStats();
          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#14121F] border border-border-accent/20 text-center">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono block">Всього рядків</span>
                  <span className="text-lg font-mono font-bold text-accent-purple mt-0.5 block">{stats.totalLines}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#14121F] border border-border-accent/20 text-center">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono block">Рядків коду</span>
                  <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">{stats.codeLines}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#14121F] border border-border-accent/20 text-center">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono block">Порожні / Коментарі</span>
                  <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">{stats.blankLines + stats.commentLines}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#14121F] border border-border-accent/20 text-center">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono block">Розмір Файлу</span>
                  <span className="text-lg font-mono font-bold text-cyan-400 mt-0.5 block">{stats.sizeKb} KB</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0B16] border border-border-accent/15 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
                  <span className="text-text-secondary">Символів (з пробілами):</span>
                  <span className="text-text-primary font-bold">{stats.totalChars.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
                  <span className="text-text-secondary">Символів (без пробілів):</span>
                  <span className="text-text-primary font-bold">{stats.charsNoSpaces.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
                  <span className="text-text-secondary">Кількість слів:</span>
                  <span className="text-text-primary font-bold">{stats.words.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
                  <span className="text-text-secondary">Функції / Класи:</span>
                  <span className="text-accent-purple font-bold">{stats.functionsCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-accent/10 pb-2">
                  <span className="text-text-secondary">Імпорти (import/require):</span>
                  <span className="text-accent-purple font-bold">{stats.importsCount}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-secondary">Приблизний час аналізу:</span>
                  <span className="text-amber-300 font-bold">~{stats.estReadingMinutes} хв</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border-accent/15 flex justify-end">
                <Button variant="outline" onClick={() => setIsStatsModalOpen(false)} className="cursor-pointer">
                  {lang === 'uk' ? 'Закрити' : 'Close'}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Universal Polyglot IDLE Studio Window Modal */}
      <UniversalIdleModal
        isOpen={isPythonIdleOpen}
        onClose={() => setIsPythonIdleOpen(false)}
        initialCode={editorContent}
        filename={activeFile?.name || 'script.py'}
        language={activeFile?.language}
        lang={lang}
      />

    </div>
  );
};
