import { FSNode, FSNodeType, WorkspaceConfig } from './types';

const WORKSPACE_STORAGE_KEY = 'nexus_workspace_tree_v2';
const WORKSPACE_CONFIG_KEY = 'nexus_workspace_config_v2';

export class FileSystemService {
  private root: FSNode;
  private listeners: Array<() => void> = [];

  constructor() {
    this.root = this.loadFromStorage() || this.createDefaultWorkspace();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l());
  }

  public getTree(): FSNode {
    return this.root;
  }

  private createDefaultWorkspace(): FSNode {
    return {
      id: 'root',
      name: 'NEXUS-Workspace',
      path: '/',
      type: 'directory',
      isExpanded: true,
      children: [
        {
          id: 'dir-src',
          name: 'src',
          path: '/src',
          type: 'directory',
          isExpanded: true,
          children: [
            {
              id: 'file-main-ts',
              name: 'index.ts',
              path: '/src/index.ts',
              type: 'file',
              language: 'typescript',
              content: `// NEXUS IDE Kernel Entrypoint
import { initializeKernel } from './kernel';

console.log('⚡ NEXUS IDE Initializing Systems...');
initializeKernel({ version: '2.5.0', mode: 'cyberpunk' });
`,
              updatedAt: new Date().toISOString()
            },
            {
              id: 'file-kernel-ts',
              name: 'kernel.ts',
              path: '/src/kernel.ts',
              type: 'file',
              language: 'typescript',
              content: `export interface KernelConfig {
  version: string;
  mode: string;
}

export function initializeKernel(config: KernelConfig) {
  console.log(\`Kernel \${config.version} running in \${config.mode} mode.\`);
}
`,
              updatedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'file-html',
          name: 'index.html',
          path: '/index.html',
          type: 'file',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>NEXUS Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>NEXUS Cyber Engine ⚡</h1>
    <p>Мощная веб-среда разработки нового поколения.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'file-css',
          name: 'styles.css',
          path: '/styles.css',
          type: 'file',
          language: 'css',
          content: `body {
  background: #090712;
  color: #e0e7ff;
  font-family: 'JetBrains Mono', monospace;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
#app {
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 2rem;
  border-radius: 12px;
  background: rgba(18, 14, 34, 0.8);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
}`,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'file-py',
          name: 'main.py',
          path: '/main.py',
          type: 'file',
          language: 'python',
          content: `# NEXUS Python Engine
def calculate_fibonacci(n: int) -> list[int]:
    fib = [0, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    return fib

if __name__ == '__main__':
    print("Fibonacci sequence:", calculate_fibonacci(10))
`,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'file-readme',
          name: 'README.md',
          path: '/README.md',
          type: 'file',
          language: 'markdown',
          content: `# ⚡ NEXUS IDE - Professional Cloud Code Workspace

Ласкаво просимо до **NEXUS IDE**!

## Можливості:
- 📁 **File Explorer**: Дерево папок, підтримка реальних локальних дирейторій (File System Access API).
- ⚡ **Language Intelligence**: Diagnostics, Autocomplete, Hover Info, Go to Definition.
- 🧩 **Extension Engine**: Системний API розширень.
- 🔀 **Git Source Control**: Diff Viewer, Commits, Branches.
- 🐞 **Debugger Panel**: Точки зупинки, панель змінних та стеку викликів.
- ⚙️ **JSON Settings**: Пряма конфігурація \`settings.json\`.
`,
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }

  // File system access API - Open real directory
  public async openNativeDirectory(): Promise<boolean> {
    if (!('showDirectoryPicker' in window)) {
      alert('Ваш браузер не підтримує File System Access API для прямого відкриття папок на ПК. Використовується вбудоване сховище.');
      return false;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const rootNode: FSNode = {
        id: `native-root-${dirHandle.name}`,
        name: dirHandle.name,
        path: `/${dirHandle.name}`,
        type: 'directory',
        isExpanded: true,
        handle: dirHandle,
        children: []
      };

      await this.readNativeDirectoryRecursive(dirHandle, rootNode);
      this.root = rootNode;
      this.notify();
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening directory:', err);
      }
      return false;
    }
  }

  private async readNativeDirectoryRecursive(dirHandle: FileSystemDirectoryHandle, parentNode: FSNode) {
    parentNode.children = [];
    for await (const entry of (dirHandle as any).values()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const itemPath = `${parentNode.path}/${entry.name}`;
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        const lang = this.detectLanguage(entry.name);
        parentNode.children.push({
          id: `file-${itemPath}`,
          name: entry.name,
          path: itemPath,
          type: 'file',
          handle: fileHandle,
          content: text,
          language: lang,
          parentId: parentNode.id,
          updatedAt: new Date(file.lastModified).toISOString()
        });
      } else if (entry.kind === 'directory') {
        const childDirHandle = entry as FileSystemDirectoryHandle;
        const childNode: FSNode = {
          id: `dir-${itemPath}`,
          name: entry.name,
          path: itemPath,
          type: 'directory',
          handle: childDirHandle,
          children: [],
          parentId: parentNode.id,
          isExpanded: false
        };
        parentNode.children.push(childNode);
        await this.readNativeDirectoryRecursive(childDirHandle, childNode);
      }
    }
  }

  public detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
      case 'scss':
      case 'less':
        return 'css';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'c':
      case 'h':
        return 'c';
      case 'cpp':
      case 'hpp':
      case 'cc':
        return 'cpp';
      case 'rs':
        return 'rust';
      case 'go':
        return 'go';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'sql':
        return 'sql';
      case 'sh':
      case 'bash':
        return 'shell';
      default:
        return 'plaintext';
    }
  }

  public findNodeById(id: string, node: FSNode = this.root): FSNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(id, child);
        if (found) return found;
      }
    }
    return null;
  }

  public findNodeByPath(path: string, node: FSNode = this.root): FSNode | null {
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeByPath(path, child);
        if (found) return found;
      }
    }
    return null;
  }

  public getAllFiles(node: FSNode = this.root): FSNode[] {
    let results: FSNode[] = [];
    if (node.type === 'file') {
      results.push(node);
    } else if (node.children) {
      for (const child of node.children) {
        results = results.concat(this.getAllFiles(child));
      }
    }
    return results;
  }

  public createFile(parentId: string, name: string, content: string = ''): FSNode | null {
    const parent = this.findNodeById(parentId) || this.root;
    if (parent.type !== 'directory') return null;

    const path = `${parent.path === '/' ? '' : parent.path}/${name}`;
    const newFile: FSNode = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      path,
      type: 'file',
      content,
      language: this.detectLanguage(name),
      parentId: parent.id,
      updatedAt: new Date().toISOString()
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newFile);
    parent.isExpanded = true;
    this.notify();
    return newFile;
  }

  public createDirectory(parentId: string, name: string): FSNode | null {
    const parent = this.findNodeById(parentId) || this.root;
    if (parent.type !== 'directory') return null;

    const path = `${parent.path === '/' ? '' : parent.path}/${name}`;
    const newDir: FSNode = {
      id: `dir-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      path,
      type: 'directory',
      children: [],
      parentId: parent.id,
      isExpanded: true
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newDir);
    parent.isExpanded = true;
    this.notify();
    return newDir;
  }

  public updateFileContent(id: string, content: string) {
    const node = this.findNodeById(id);
    if (node && node.type === 'file') {
      node.content = content;
      node.updatedAt = new Date().toISOString();
      this.notify();

      // Write to native file handle if present
      if (node.handle && 'createWritable' in node.handle) {
        (async () => {
          try {
            const writable = await (node.handle as any).createWritable();
            await writable.write(content);
            await writable.close();
          } catch (e) {
            console.warn('Could not write to native file handle:', e);
          }
        })();
      }
    }
  }

  public deleteNode(id: string): boolean {
    if (id === this.root.id) return false;
    
    const removeRecursive = (parent: FSNode): boolean => {
      if (!parent.children) return false;
      const index = parent.children.findIndex((c) => c.id === id);
      if (index !== -1) {
        parent.children.splice(index, 1);
        return true;
      }
      for (const child of parent.children) {
        if (child.type === 'directory' && removeRecursive(child)) {
          return true;
        }
      }
      return false;
    };

    const success = removeRecursive(this.root);
    if (success) this.notify();
    return success;
  }

  public renameNode(id: string, newName: string): boolean {
    const node = this.findNodeById(id);
    if (!node) return false;

    node.name = newName;
    const pathParts = node.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    node.path = pathParts.join('/');

    if (node.type === 'file') {
      node.language = this.detectLanguage(newName);
    }
    this.notify();
    return true;
  }

  public toggleDirectoryExpanded(id: string) {
    const node = this.findNodeById(id);
    if (node && node.type === 'directory') {
      node.isExpanded = !node.isExpanded;
      this.notify();
    }
  }

  private saveToStorage() {
    try {
      // Clean tree before stringifying (remove DOM handles)
      const cleanTree = (n: FSNode): any => ({
        id: n.id,
        name: n.name,
        path: n.path,
        type: n.type,
        content: n.content,
        language: n.language,
        isExpanded: n.isExpanded,
        updatedAt: n.updatedAt,
        children: n.children ? n.children.map(cleanTree) : undefined
      });
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(cleanTree(this.root)));
    } catch (e) {
      console.warn('Failed to save workspace tree to storage:', e);
    }
  }

  private loadFromStorage(): FSNode | null {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load workspace tree:', e);
    }
    return null;
  }
}

export const fileSystemService = new FileSystemService();
