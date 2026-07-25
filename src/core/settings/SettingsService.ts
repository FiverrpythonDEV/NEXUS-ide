export interface NexusSettingsJson {
  'editor.fontSize': number;
  'editor.tabSize': number;
  'editor.minimap': boolean;
  'editor.wordWrap': 'on' | 'off';
  'editor.lineNumbers': 'on' | 'off' | 'relative';
  'editor.fontFamily': string;
  'editor.formatOnSave': boolean;
  'editor.autoSave': 'off' | 'afterDelay' | 'onFocusChange';
  'workbench.theme': string;
  'workbench.sideBarPosition': 'left' | 'right';
  'terminal.fontSize': number;
  'terminal.fontFamily': string;
}

const SETTINGS_STORAGE_KEY = 'nexus_settings_json_v2';

export const DEFAULT_NEXUS_SETTINGS: NexusSettingsJson = {
  'editor.fontSize': 14,
  'editor.tabSize': 2,
  'editor.minimap': true,
  'editor.wordWrap': 'on',
  'editor.lineNumbers': 'on',
  'editor.fontFamily': "'JetBrains Mono', 'Fira Code', monospace",
  'editor.formatOnSave': true,
  'editor.autoSave': 'afterDelay',
  'workbench.theme': 'NEXUS Cyberpunk Dark',
  'workbench.sideBarPosition': 'left',
  'terminal.fontSize': 13,
  'terminal.fontFamily': "'JetBrains Mono', monospace"
};

export class SettingsService {
  private settings: NexusSettingsJson;
  private listeners: Array<() => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveSettings();
    this.listeners.forEach((l) => l());
  }

  public getSettings(): NexusSettingsJson {
    return this.settings;
  }

  public getJsonString(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  public updateSetting<K extends keyof NexusSettingsJson>(key: K, value: NexusSettingsJson[K]) {
    this.settings[key] = value;
    this.notify();
  }

  public updateFromJsonString(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      this.settings = { ...DEFAULT_NEXUS_SETTINGS, ...parsed };
      this.notify();
      return true;
    } catch (e) {
      console.warn('Invalid settings JSON:', e);
      return false;
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings JSON:', e);
    }
  }

  private loadSettings(): NexusSettingsJson {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_NEXUS_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load settings JSON:', e);
    }
    return DEFAULT_NEXUS_SETTINGS;
  }
}

export const settingsService = new SettingsService();
