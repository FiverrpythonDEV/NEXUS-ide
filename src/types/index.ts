export type ModuleId = 
  | 'dashboard' 
  | 'code-tools' 
  | 'project-tracker' 
  | 'gadget-inventory' 
  | 'knowledge-base' 
  | 'settings' 
  | 'code-editor'
  | 'snippets-library'
  | 'focus-timer'
  | 'cheatsheet'
  | 'bookmarks'
  | 'docs';

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  projectId?: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'idea' | 'in_progress' | 'testing' | 'completed';
  tags: string[];
  progress: number;
  githubUrl?: string;
  deployUrl?: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface Gadget {
  id: string;
  name: string;
  category: string;
  specs: string;
  purchaseDate: string;
  icon: string;
  status: 'active' | 'maintenance' | 'retired';
}

export interface AppSettings {
  accentColor: string; // Allows hex value or custom named colors
  isSidebarCompact: boolean;
  neonIntensity: number; // 0 to 100
  density: 'compact' | 'normal' | 'spacious';
  borderRadius: number; // in pixels (e.g., 0 to 24)
  interfaceFont: string;
  codeFont: string;
  bgTexture: 'clean' | 'noise' | 'gradient';
  sidebarPosition: 'left' | 'right';
  language: 'uk' | 'en';
  geminiApiKey: string;
  userName?: string;
  aiProvider?: 'gemini' | 'ollama';
  ollamaUrl?: string;
  ollamaModel?: string;
  themeMode?: 'dark' | 'system' | 'light';
  autoSave?: boolean;
  editorMinimap?: boolean;
  editorWordWrap?: boolean;
  editorFontSize?: number;
  editorTabSize?: number;
  weatherEnabled?: boolean;
  soundProfile?: 'off' | 'cyber' | 'classic-click' | 'retro-arcade';
  soundVolume?: number;
  backdropBlur?: number;
  cardBorderOpacity?: number;
  presetTheme?: 'purple' | 'emerald' | 'azure' | 'crimson' | 'gold' | 'magenta' | 'stealth';
  showLiveClock?: boolean;
  showSystemPing?: boolean;
  customCss?: string;
  customWallpaper?: string;
  customWallpaperBlur?: number;
  customWallpaperDim?: number;
  liquidGlassMode?: boolean;
  liquidGlassReflection?: boolean;
  matrixRainEffect?: boolean;
  extractedPalette?: string[];
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  projectId?: string;
}

export interface CheatsheetCommand {
  id: string;
  command: string;
  description: string;
  category: string;
  isCustom?: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  tag: string;
  note: string;
}

export interface SystemModule {
  id: ModuleId;
  name: string;
  icon: string;
  description: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
