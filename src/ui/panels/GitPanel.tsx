import React, { useState, useEffect } from 'react';
import { gitService, GitChange, GitCommit } from '../../services/git/GitService';
import { editorService } from '../../core/editor/EditorService';
import { 
  GitBranch, 
  GitCommit as GitCommitIcon, 
  GitPullRequest, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Layers, 
  History,
  FileCode
} from 'lucide-react';

interface Props {
  onOpenDiff?: (change: GitChange) => void;
}

export const GitPanel: React.FC<Props> = ({ onOpenDiff }) => {
  const [changes, setChanges] = useState<GitChange[]>(gitService.getChanges());
  const [commitMsg, setCommitMsg] = useState('');
  const [currentBranch, setCurrentBranch] = useState(gitService.getBranch());
  const [branches, setBranches] = useState(gitService.getBranches());
  const [commits, setCommits] = useState<GitCommit[]>(gitService.getCommits());
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);

  useEffect(() => {
    const unsubscribe = gitService.subscribe(() => {
      setChanges(gitService.getChanges());
      setCurrentBranch(gitService.getBranch());
      setBranches(gitService.getBranches());
      setCommits([...gitService.getCommits()]);
    });
    return unsubscribe;
  }, []);

  const handleCommit = () => {
    if (!commitMsg.trim()) {
      alert('Будь ласка, вкажіть повідомлення комміту');
      return;
    }
    const success = gitService.commit(commitMsg);
    if (success) {
      setCommitMsg('');
    } else {
      alert('Для комміту необхідно спочатку додати файли у Stage (+)');
    }
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      gitService.createBranch(newBranchName.trim());
      setNewBranchName('');
      setShowNewBranchInput(false);
    }
  };

  const stagedChanges = changes.filter((c) => c.status === 'staged');
  const unstagedChanges = changes.filter((c) => c.status !== 'staged');

  return (
    <div className="flex flex-col h-full bg-[#0d0a18]/90 border-r border-purple-900/30 text-gray-300 p-3 space-y-3">
      {/* Header & Branch Info */}
      <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Source Control</span>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-1">
          <select
            value={currentBranch}
            onChange={(e) => gitService.switchBranch(e.target.value)}
            className="bg-black/60 border border-purple-500/30 text-xs text-purple-200 px-2 py-0.5 rounded outline-none"
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewBranchInput(!showNewBranchInput)}
            title="Створити гілку"
            className="p-1 hover:bg-purple-900/40 text-purple-300 rounded"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showNewBranchInput && (
        <div className="flex gap-1 bg-purple-950/40 p-1.5 rounded border border-purple-500/30">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="feature/new-module"
            className="bg-black/60 text-xs text-white px-2 py-0.5 border border-purple-500/40 rounded outline-none flex-1"
          />
          <button
            onClick={handleCreateBranch}
            className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded font-medium"
          >
            ОК
          </button>
        </div>
      )}

      {/* Commit Message Controls */}
      <div className="space-y-2">
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Повідомлення комміту (feat: add new feature)..."
          rows={2}
          className="w-full bg-black/60 border border-purple-500/30 text-xs text-white p-2 rounded-lg outline-none focus:border-purple-400 resize-none font-mono"
        />
        <button
          onClick={handleCommit}
          className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-900/30"
        >
          <GitCommitIcon className="w-3.5 h-3.5" /> Створити Комміт ({stagedChanges.length})
        </button>
      </div>

      {/* Staged Changes */}
      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-purple-900">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            <span>Staged Changes ({stagedChanges.length})</span>
            {stagedChanges.length > 0 && (
              <button
                onClick={() => gitService.unstageAll()}
                className="hover:text-purple-200 text-gray-500 font-normal"
              >
                Unstage All
              </button>
            )}
          </div>

          {stagedChanges.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic p-1">Немає підготовлених файлів</p>
          ) : (
            stagedChanges.map((change) => (
              <div
                key={change.fileId}
                className="flex items-center justify-between p-1.5 bg-purple-950/20 hover:bg-purple-900/30 rounded border border-purple-900/30 text-xs group"
              >
                <span
                  onClick={() => onOpenDiff && onOpenDiff(change)}
                  className="truncate cursor-pointer hover:text-purple-300 font-mono flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {change.fileName}
                </span>
                <button
                  onClick={() => gitService.unstageFile(change.fileId)}
                  className="p-1 hover:text-red-400 text-gray-400"
                  title="Unstage"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Unstaged Changes */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Changes ({unstagedChanges.length})</span>
            {unstagedChanges.length > 0 && (
              <button
                onClick={() => gitService.stageAll()}
                className="hover:text-purple-300 text-gray-500 font-normal"
              >
                Stage All
              </button>
            )}
          </div>

          {unstagedChanges.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic p-1">Робоче дерево чисте</p>
          ) : (
            unstagedChanges.map((change) => (
              <div
                key={change.fileId}
                className="flex items-center justify-between p-1.5 bg-black/40 hover:bg-white/5 rounded border border-white/5 text-xs group"
              >
                <span
                  onClick={() => onOpenDiff && onOpenDiff(change)}
                  className="truncate cursor-pointer hover:text-purple-300 font-mono flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {change.fileName}
                  <span className="text-[10px] text-amber-400 uppercase">({change.status})</span>
                </span>
                <button
                  onClick={() => gitService.stageFile(change.fileId)}
                  className="p-1 hover:text-purple-300 text-gray-400"
                  title="Stage File"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Recent Commits Log */}
        <div className="pt-2 border-t border-purple-900/30 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <History className="w-3 h-3 text-purple-400" /> Commit History
          </span>
          {commits.map((c) => (
            <div key={c.hash} className="p-2 bg-black/50 border border-purple-900/20 rounded text-[11px] space-y-1">
              <div className="flex justify-between font-mono text-purple-300">
                <span className="font-semibold">{c.hash}</span>
                <span className="text-gray-500">{c.branch}</span>
              </div>
              <p className="text-gray-300 font-mono truncate">{c.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
