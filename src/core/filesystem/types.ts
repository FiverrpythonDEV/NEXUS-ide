export type FSNodeType = 'file' | 'directory';

export interface FSNode {
  id: string;
  name: string;
  path: string;
  type: FSNodeType;
  content?: string;
  language?: string;
  children?: FSNode[];
  isExpanded?: boolean;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  parentId?: string | null;
  updatedAt?: string;
  isDirty?: boolean;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  rootPath: string;
  recentFiles: string[];
  activeFileId: string | null;
  openTabIds: string[];
}
