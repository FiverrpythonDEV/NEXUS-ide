import { commandRegistry } from '../commands/CommandRegistry';

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  icon?: string;
  enabled?: boolean;
  contributes?: {
    commands?: Array<{ id: string; title: string; category?: string }>;
    languages?: Array<{ id: string; extensions: string[] }>;
    themes?: Array<{ id: string; label: string; uiTheme: string }>;
    panels?: Array<{ id: string; title: string; icon: string }>;
  };
}

export interface ExtensionApi {
  registerCommand: (id: string, title: string, handler: () => void) => void;
  registerLanguage: (id: string, extensions: string[]) => void;
  registerTheme: (id: string, label: string) => void;
  registerPanel: (id: string, title: string, icon: string) => void;
  showInformationMessage: (msg: string) => void;
}

export interface RegisteredPanel {
  id: string;
  title: string;
  icon: string;
}

export class ExtensionEngine {
  private extensions: Map<string, ExtensionManifest> = new Map();
  private panels: Map<string, RegisteredPanel> = new Map();
  private themes: Map<string, string> = new Map();
  private languages: Map<string, string[]> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadBuiltinExtensions();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getApi(extensionId: string): ExtensionApi {
    return {
      registerCommand: (id, title, handler) => {
        commandRegistry.registerCommand({
          id,
          title,
          category: extensionId,
          handler
        });
      },
      registerLanguage: (id, extensions) => {
        this.languages.set(id, extensions);
        this.notify();
      },
      registerTheme: (id, label) => {
        this.themes.set(id, label);
        this.notify();
      },
      registerPanel: (id, title, icon) => {
        this.panels.set(id, { id, title, icon });
        this.notify();
      },
      showInformationMessage: (msg: string) => {
        console.log(`[Extension: ${extensionId}] ${msg}`);
      }
    };
  }

  public registerExtension(manifest: ExtensionManifest, initFn?: (api: ExtensionApi) => void) {
    manifest.enabled = manifest.enabled ?? true;
    this.extensions.set(manifest.id, manifest);

    if (manifest.enabled && initFn) {
      const api = this.getApi(manifest.id);
      initFn(api);
    }
    this.notify();
  }

  public toggleExtension(id: string) {
    const ext = this.extensions.get(id);
    if (ext) {
      ext.enabled = !ext.enabled;
      this.notify();
    }
  }

  public getExtensions(): ExtensionManifest[] {
    return Array.from(this.extensions.values());
  }

  public getPanels(): RegisteredPanel[] {
    return Array.from(this.panels.values());
  }

  private loadBuiltinExtensions() {
    // Builtin 1: Cyberpunk Theme Pack
    this.registerExtension({
      id: 'nexus.cyberpunk-theme',
      name: 'NEXUS Cyberpunk Synth Theme',
      version: '1.2.0',
      publisher: 'NEXUS Core Team',
      description: 'Ultra-violet high contrast neon editor skin for Monaco',
      icon: 'Palette',
      enabled: true,
      contributes: {
        themes: [{ id: 'cyberpunk-neon', label: 'NEXUS Cyberpunk Neon', uiTheme: 'vs-dark' }]
      }
    }, (api) => {
      api.registerTheme('cyberpunk-neon', 'NEXUS Cyberpunk Neon');
      api.registerCommand('nexus.theme.toggleGlow', 'Toggle Neon Glow Effect', () => {
        console.log('Neon Glow toggled!');
      });
    });

    // Builtin 2: Code Metrics & Complexity Analyzer
    this.registerExtension({
      id: 'nexus.code-analyzer',
      name: 'NEXUS Real-Time Code Inspector',
      version: '2.0.1',
      publisher: 'NEXUS AI',
      description: 'Deep AST analysis and complexity scoring for active files',
      icon: 'Activity',
      enabled: true,
      contributes: {
        commands: [{ id: 'nexus.analyzer.run', title: 'Run Code Complexity Check', category: 'Analyzer' }]
      }
    }, (api) => {
      api.registerCommand('nexus.analyzer.run', 'Run Code Complexity Check', () => {
        alert('⚡ NEXUS Code Analyzer: File health is 98/100 (Clean modular structure)');
      });
    });

    // Builtin 3: AI Code Assistant Extension
    this.registerExtension({
      id: 'nexus.ai-assistant',
      name: 'NEXUS AI Copilot Engine',
      version: '3.1.0',
      publisher: 'Google DeepMind',
      description: 'Generative AI code completion, refactoring & documentation helper',
      icon: 'Bot',
      enabled: true,
      contributes: {
        commands: [{ id: 'nexus.ai.explain', title: 'Explain Selected Code', category: 'AI Copilot' }]
      }
    }, (api) => {
      api.registerCommand('nexus.ai.explain', 'Explain Selected Code', () => {
        console.log('AI Explanation triggered');
      });
    });
  }
}

export const extensionEngine = new ExtensionEngine();
