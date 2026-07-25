import { fileSystemService } from '../../core/filesystem/FileSystemService';
import { FSNode } from '../../core/filesystem/types';

export interface GitChange {
  fileId: string;
  filePath: string;
  fileName: string;
  status: 'modified' | 'untracked' | 'deleted' | 'staged';
  originalContent: string;
  currentContent: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  branch: string;
}

export class GitService {
  private branch: string = 'main';
  private branches: string[] = ['main', 'feature/nexus-lsp', 'fix/ui-layout'];
  private stagedFileIds: Set<string> = new Set();
  private commits: GitCommit[] = [
    {
      hash: '22af6c6',
      message: 'feat: initialize NEXUS IDE kernel architecture',
      author: 'FiverrpythonDEV <dev@nexus.ide>',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      branch: 'main'
    }
  ];
  private initialFileSnapshots: Map<string, string> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.takeInitialSnapshots();
    fileSystemService.subscribe(() => this.notify());
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

  private takeInitialSnapshots() {
    const files = fileSystemService.getAllFiles();
    files.forEach((f) => {
      if (!this.initialFileSnapshots.has(f.id)) {
        this.initialFileSnapshots.set(f.id, f.content || '');
      }
    });
  }

  public getChanges(): GitChange[] {
    const changes: GitChange[] = [];
    const currentFiles = fileSystemService.getAllFiles();

    currentFiles.forEach((file) => {
      const orig = this.initialFileSnapshots.get(file.id);
      if (orig === undefined) {
        changes.push({
          fileId: file.id,
          filePath: file.path,
          fileName: file.name,
          status: this.stagedFileIds.has(file.id) ? 'staged' : 'untracked',
          originalContent: '',
          currentContent: file.content || ''
        });
      } else if (orig !== file.content) {
        changes.push({
          fileId: file.id,
          filePath: file.path,
          fileName: file.name,
          status: this.stagedFileIds.has(file.id) ? 'staged' : 'modified',
          originalContent: orig,
          currentContent: file.content || ''
        });
      }
    });

    return changes;
  }

  public stageFile(fileId: string) {
    this.stagedFileIds.add(fileId);
    this.notify();
  }

  public unstageFile(fileId: string) {
    this.stagedFileIds.delete(fileId);
    this.notify();
  }

  public stageAll() {
    const changes = this.getChanges();
    changes.forEach((c) => this.stagedFileIds.add(c.fileId));
    this.notify();
  }

  public unstageAll() {
    this.stagedFileIds.clear();
    this.notify();
  }

  public commit(message: string): boolean {
    if (!message.trim() || this.stagedFileIds.size === 0) return false;

    const commitObj: GitCommit = {
      hash: Math.random().toString(16).substr(2, 7),
      message,
      author: 'NEXUS Developer <user@nexus-ide.local>',
      timestamp: new Date().toISOString(),
      branch: this.branch
    };

    this.commits.unshift(commitObj);

    // Update snapshots for staged files
    const currentFiles = fileSystemService.getAllFiles();
    this.stagedFileIds.forEach((fileId) => {
      const f = currentFiles.find((item) => item.id === fileId);
      if (f) {
        this.initialFileSnapshots.set(f.id, f.content || '');
      }
    });

    this.stagedFileIds.clear();
    this.notify();
    return true;
  }

  public getBranch(): string {
    return this.branch;
  }

  public getBranches(): string[] {
    return this.branches;
  }

  public switchBranch(newBranch: string) {
    this.branch = newBranch;
    this.notify();
  }

  public createBranch(branchName: string) {
    if (branchName && !this.branches.includes(branchName)) {
      this.branches.push(branchName);
      this.branch = branchName;
      this.notify();
    }
  }

  public getCommits(): GitCommit[] {
    return this.commits;
  }
}

export const gitService = new GitService();
