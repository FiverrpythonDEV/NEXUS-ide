import React, { useState, useEffect } from 'react';
import { FSNode } from '../../core/filesystem/types';
import { fileSystemService } from '../../core/filesystem/FileSystemService';
import { editorService } from '../../core/editor/EditorService';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileCode, 
  FileText, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  ChevronDown,
  HardDriveUpload,
  MoreVertical
} from 'lucide-react';

interface Props {
  onOpenFile?: (node: FSNode) => void;
}

export const FileExplorer: React.FC<Props> = ({ onOpenFile }) => {
  const [tree, setTree] = useState<FSNode>(fileSystemService.getTree());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'dir' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const unsubscribe = fileSystemService.subscribe(() => {
      setTree({ ...fileSystemService.getTree() });
    });
    return unsubscribe;
  }, []);

  const handleSelectNode = (node: FSNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedNodeId(node.id);

    if (node.type === 'directory') {
      fileSystemService.toggleDirectoryExpanded(node.id);
    } else {
      editorService.openFile(node);
      if (onOpenFile) onOpenFile(node);
    }
  };

  const handleCreateNew = () => {
    if (!newItemName.trim() || !creatingType) return;
    const targetParentId = selectedNodeId || 'root';

    if (creatingType === 'file') {
      const created = fileSystemService.createFile(targetParentId, newItemName.trim());
      if (created) editorService.openFile(created);
    } else {
      fileSystemService.createDirectory(targetParentId, newItemName.trim());
    }

    setCreatingType(null);
    setNewItemName('');
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      fileSystemService.renameNode(id, editName.trim());
    }
    setEditingNodeId(null);
    setEditName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Ви дійсно бажаєте видалити цей елемент з workspace?')) {
      fileSystemService.deleteNode(id);
      editorService.closeTab(id);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <span className="text-blue-400 font-bold text-xs">TS</span>;
      case 'js':
      case 'jsx':
        return <span className="text-yellow-400 font-bold text-xs">JS</span>;
      case 'py':
        return <span className="text-emerald-400 font-bold text-xs">PY</span>;
      case 'html':
        return <span className="text-orange-400 font-bold text-xs">HTML</span>;
      case 'css':
        return <span className="text-cyan-400 font-bold text-xs">CSS</span>;
      case 'json':
        return <span className="text-amber-300 font-bold text-xs">JSON</span>;
      case 'md':
        return <FileText className="w-3.5 h-3.5 text-purple-300" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const renderTree = (node: FSNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;

    if (node.id === 'root') {
      return (
        <div key={node.id} className="space-y-0.5">
          {node.children && node.children.map((child) => renderTree(child, depth + 1))}
        </div>
      );
    }

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => handleSelectNode(node, e)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs cursor-pointer group transition-colors ${
            isSelected
              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 font-medium'
              : 'hover:bg-white/5 text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {node.type === 'directory' ? (
              <>
                {node.isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                )}
                {node.isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                )}
              </>
            ) : (
              <span className="shrink-0 flex items-center justify-center w-4 h-4">
                {getFileIcon(node.name)}
              </span>
            )}

            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRenameSubmit(node.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(node.id)}
                autoFocus
                className="bg-black/60 text-white px-1 py-0.5 border border-purple-500 rounded text-xs outline-none w-28"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingNodeId(node.id);
                setEditName(node.name);
              }}
              title="Перейменувати"
              className="p-1 hover:text-purple-300 text-gray-400 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleDelete(node.id, e)}
              title="Видалити"
              className="p-1 hover:text-red-400 text-gray-400 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {node.type === 'directory' && node.isExpanded && node.children && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 select-none">
      {/* Header Controls */}
      <div className="p-3 border-b border-purple-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-400 tracking-wider uppercase flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5" /> Explorer
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreatingType('file')}
            title="Створити новий файл"
            className="p-1 hover:bg-purple-600/30 hover:text-purple-300 text-gray-400 rounded transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreatingType('dir')}
            title="Створити нову папку"
            className="p-1 hover:bg-purple-600/30 hover:text-purple-300 text-gray-400 rounded transition"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileSystemService.openNativeDirectory()}
            title="Відкрити папку з ПК (File System Access API)"
            className="p-1 hover:bg-purple-600/30 hover:text-purple-300 text-gray-400 rounded transition"
          >
            <HardDriveUpload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Creation Input */}
      {creatingType && (
        <div className="p-2 border-b border-purple-500/30 bg-purple-950/40 flex items-center gap-2">
          <span className="text-xs text-purple-300 font-semibold">
            {creatingType === 'file' ? 'Файл:' : 'Папка:'}
          </span>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
            placeholder={creatingType === 'file' ? 'app.tsx' : 'components'}
            autoFocus
            className="bg-black/60 text-white text-xs px-2 py-1 border border-purple-500 rounded outline-none flex-1"
          />
          <button
            onClick={handleCreateNew}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded font-medium"
          >
            ОК
          </button>
          <button
            onClick={() => setCreatingType(null)}
            className="text-xs text-gray-400 hover:text-white"
          >
            X
          </button>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-900/40">
        {renderTree(tree)}
      </div>

      {/* Open Directory Action Banner */}
      <div className="p-2 border-t border-purple-900/30 bg-[#090712]/80">
        <button
          onClick={() => fileSystemService.openNativeDirectory()}
          className="w-full py-1.5 px-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/30 text-purple-300 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition"
        >
          <HardDriveUpload className="w-3.5 h-3.5 text-purple-400" />
          Відкрити папку з ПК
        </button>
      </div>
    </div>
  );
};
