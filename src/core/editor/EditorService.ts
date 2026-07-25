import { FSNode } from '../filesystem/types';
import { fileSystemService } from '../filesystem/FileSystemService';

export interface TabItem {
  fileId: string;
  name: string;
  path: string;
  language: string;
  isDirty: boolean;
  content: string;
  savedContent: string;
}

const TABS_STORAGE_KEY = 'nexus_open_tabs_v2';

export class EditorService {
  private tabs: TabItem[] = [];
  private activeTabId: string | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.restoreSession();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveSession();
    this.listeners.forEach((l) => l());
  }

  public getTabs(): TabItem[] {
    return this.tabs;
  }

  public getActiveTabId(): string | null {
    return this.activeTabId;
  }

  public getActiveTab(): TabItem | null {
    if (!this.activeTabId) return null;
    return this.tabs.find((t) => t.fileId === this.activeTabId) || null;
  }

  public openFile(fileNode: FSNode) {
    if (fileNode.type !== 'file') return;

    let existing = this.tabs.find((t) => t.fileId === fileNode.id);
    if (!existing) {
      existing = {
        fileId: fileNode.id,
        name: fileNode.name,
        path: fileNode.path,
        language: fileNode.language || fileSystemService.detectLanguage(fileNode.name),
        isDirty: false,
        content: fileNode.content || '',
        savedContent: fileNode.content || ''
      };
      this.tabs.push(existing);
    }
    this.activeTabId = fileNode.id;
    this.notify();
  }

  public setActiveTab(fileId: string) {
    const tab = this.tabs.find((t) => t.fileId === fileId);
    if (tab) {
      this.activeTabId = fileId;
      this.notify();
    }
  }

  public updateTabContent(fileId: string, newContent: string) {
    const tab = this.tabs.find((t) => t.fileId === fileId);
    if (tab) {
      tab.content = newContent;
      tab.isDirty = tab.content !== tab.savedContent;
      this.notify();
    }
  }

  public saveActiveTab(): boolean {
    const tab = this.getActiveTab();
    if (!tab) return false;

    fileSystemService.updateFileContent(tab.fileId, tab.content);
    tab.savedContent = tab.content;
    tab.isDirty = false;
    this.notify();
    return true;
  }

  public saveAllTabs() {
    this.tabs.forEach((tab) => {
      if (tab.isDirty) {
        fileSystemService.updateFileContent(tab.fileId, tab.content);
        tab.savedContent = tab.content;
        tab.isDirty = false;
      }
    });
    this.notify();
  }

  public closeTab(fileId: string) {
    const index = this.tabs.findIndex((t) => t.fileId === fileId);
    if (index === -1) return;

    this.tabs.splice(index, 1);
    if (this.activeTabId === fileId) {
      if (this.tabs.length > 0) {
        const nextIndex = Math.min(index, this.tabs.length - 1);
        this.activeTabId = this.tabs[nextIndex].fileId;
      } else {
        this.activeTabId = null;
      }
    }
    this.notify();
  }

  public closeOtherTabs(fileId: string) {
    this.tabs = this.tabs.filter((t) => t.fileId === fileId);
    this.activeTabId = fileId;
    this.notify();
  }

  public closeAllTabs() {
    this.tabs = [];
    this.activeTabId = null;
    this.notify();
  }

  private saveSession() {
    try {
      const data = {
        tabs: this.tabs,
        activeTabId: this.activeTabId
      };
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save editor tabs session:', e);
    }
  }

  private restoreSession() {
    try {
      const raw = localStorage.getItem(TABS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tabs)) {
          this.tabs = parsed.tabs;
          this.activeTabId = parsed.activeTabId || (this.tabs[0]?.fileId ?? null);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to restore tabs:', e);
    }

    // Default open index.ts or README.md if available
    const allFiles = fileSystemService.getAllFiles();
    if (allFiles.length > 0) {
      const defaultFile = allFiles.find((f) => f.name === 'index.ts') || allFiles[0];
      this.openFile(defaultFile);
    }
  }
}

export const editorService = new EditorService();
