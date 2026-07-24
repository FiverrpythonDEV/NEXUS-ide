import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Plus, 
  Github, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  CheckCircle2,
  Star,
  RefreshCw
} from 'lucide-react';
import { Project } from '../../types';

type ProjectStatus = 'idea' | 'in_progress' | 'testing' | 'completed';

export const ProjectTrackerModule: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useAppContext();
  const { lang } = useTranslation();
  const toast = useToast();

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('idea');
  const [formProgress, setFormProgress] = useState(0);
  const [formTags, setFormTags] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formDeploy, setFormDeploy] = useState('');

  // Drag state
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  // GitHub Integration State
  interface GitHubRepo {
    id: number;
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    updated_at: string;
  }

  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return localStorage.getItem('nexus_github_username') || '';
  });
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_github_repos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  const syncGitHub = async () => {
    const username = githubUsername.trim();
    if (!username) {
      toast.warning("Будь ласка, вкажіть ім'я користувача GitHub");
      return;
    }

    setIsLoadingRepos(true);
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`);
      
      if (res.status === 403) {
        toast.error("Забагато запитів до GitHub API, спробуйте пізніше.");
        setIsLoadingRepos(false);
        return;
      }
      
      if (!res.ok) {
        throw new Error("Користувача не знайдено або виникла помилка.");
      }

      const data: any[] = await res.json();
      
      const parsedRepos: GitHubRepo[] = data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        html_url: repo.html_url,
        updated_at: repo.updated_at,
      }));

      setGithubRepos(parsedRepos);
      localStorage.setItem('nexus_github_username', username);
      localStorage.setItem('nexus_github_repos', JSON.stringify(parsedRepos));
      toast.success(`Успішно синхронізовано ${parsedRepos.length} проєктів з GitHub!`);
    } catch (error: any) {
      toast.error(error.message || 'Помилка завантаження репозиторіїв з GitHub');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const openAddModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormStatus('idea');
    setFormProgress(0);
    setFormTags('');
    setFormGithub('');
    setFormDeploy('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormName(proj.name);
    setFormDesc(proj.description);
    setFormStatus(proj.status);
    setFormProgress(proj.progress);
    setFormTags(proj.tags.join(', '));
    setFormGithub(proj.githubUrl || '');
    setFormDeploy(proj.deployUrl || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.warning('Будь ласка, вкажіть назву проєкту');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const projectData = {
      name: formName,
      description: formDesc,
      status: formStatus,
      progress: Number(formProgress),
      tags: tagsArray,
      githubUrl: formGithub.trim() || undefined,
      deployUrl: formDeploy.trim() || undefined,
    };

    if (editingProject) {
      updateProject({
        ...editingProject,
        ...projectData,
      });
      toast.success(`Проєкт "${formName}" успішно оновлено!`);
    } else {
      addProject(projectData);
      toast.success(`Проєкт "${formName}" успішно створено!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(lang === 'uk' ? `Ви дійсно бажаєте видалити проєкт "${name}"?` : `Are you sure you want to delete "${name}"?`)) {
      deleteProject(id);
      if (editingProject?.id === id) {
        setEditingProject(null);
        setIsModalOpen(false);
      }
      toast.success(lang === 'uk' ? 'Проєкт видалено' : 'Project deleted');
    }
  };

  // Drag & drop logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedProjectId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault();
    if (!draggedProjectId) return;

    const project = projects.find((p) => p.id === draggedProjectId);
    if (project && project.status !== status) {
      // Auto-set progress if dragging to completed
      const finalProgress = status === 'completed' ? 100 : (status === 'idea' ? 0 : project.progress);
      updateProject({
        ...project,
        status,
        progress: finalProgress,
      });
      toast.success(`Переміщено в "${getStatusLabel(status)}"`);
    }
    setDraggedProjectId(null);
  };

  const moveStatus = (proj: Project, direction: 'forward' | 'backward') => {
    const statusOrder: ProjectStatus[] = ['idea', 'in_progress', 'testing', 'completed'];
    const currentIdx = statusOrder.indexOf(proj.status);
    let nextIdx = currentIdx + (direction === 'forward' ? 1 : -1);
    
    if (nextIdx >= 0 && nextIdx < statusOrder.length) {
      const nextStatus = statusOrder[nextIdx];
      const finalProgress = nextStatus === 'completed' ? 100 : (nextStatus === 'idea' ? 0 : proj.progress);
      updateProject({
        ...proj,
        status: nextStatus,
        progress: finalProgress,
      });
      toast.success(`Статус оновлено: ${getStatusLabel(nextStatus)}`);
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'idea': return 'Ідея';
      case 'in_progress': return 'В розробці';
      case 'testing': return 'Тестування';
      case 'completed': return 'Завершено';
    }
  };

  const columns: { id: ProjectStatus; title: string; colorClass: string }[] = [
    { id: 'idea', title: 'Ідеї (Backlog)', colorClass: 'border-t-2 border-t-text-tertiary' },
    { id: 'in_progress', title: 'В Розробці', colorClass: 'border-t-2 border-t-accent-purple' },
    { id: 'testing', title: 'Тестування', colorClass: 'border-t-2 border-t-status-warning' },
    { id: 'completed', title: 'Завершено', colorClass: 'border-t-2 border-t-status-success' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">Project Hub</h2>
          <p className="text-xs text-text-secondary">Керуйте своїми технічними проєктами за допомогою Канбан-дошки.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto text-xs py-2">
          <Plus className="w-4 h-4" /> Додати Новий Проєкт
        </Button>
      </div>

      {/* GitHub Sync Toolbar */}
      <Card className="p-4 bg-panel-bg/40 border border-border-accent/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-hover-bg rounded-lg border border-border-accent/20 text-text-primary">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">GitHub Інтеграція</h3>
            <p className="text-[10px] text-text-tertiary">Імпортуйте свої публічні репозиторії як картки тільки для читання.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="GitHub Username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            className="w-full md:w-48 bg-[#0D0B16] border border-border-accent rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-accent-purple/40"
          />
          <Button 
            onClick={syncGitHub} 
            disabled={isLoadingRepos || !githubUsername.trim()}
            variant="outline"
            className="flex items-center gap-1.5 py-1.5 text-xs shrink-0 bg-[#1E1B2E] border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10"
          >
            {isLoadingRepos ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isLoadingRepos ? 'Синхронізація...' : 'Синхронізувати'}
          </Button>
        </div>
      </Card>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 select-none">
        {columns.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-panel-bg/30 border border-border-accent/40 rounded-xl p-4 min-h-[400px] xl:min-h-[600px] ${col.colorClass}`}
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-accent/20">
                <span className="font-sans font-semibold text-xs tracking-wide text-text-primary uppercase flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    col.id === 'idea' ? 'bg-text-tertiary' :
                    col.id === 'in_progress' ? 'bg-accent-purple' :
                    col.id === 'testing' ? 'bg-status-warning' : 'bg-status-success'
                  }`} />
                  {col.title}
                </span>
                <Badge variant="neutral">{colProjects.length}</Badge>
              </div>

              {/* Project Cards inside column */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[500px] xl:max-h-none">
                {colProjects.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-text-tertiary border border-dashed border-border-accent/10 rounded-xl">
                    Тут порожньо.<br/>Перетягніть картку або створіть нову
                  </div>
                ) : (
                  colProjects.map((proj) => (
                    <div
                      key={proj.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, proj.id)}
                      className="group bg-panel-bg/75 border border-border-accent/60 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-purple/30 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)] cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-sans font-semibold text-xs text-text-primary group-hover:text-accent-purple transition-colors line-clamp-1">
                          {proj.name}
                        </h4>
                        
                        {/* Actions */}
                        <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => openEditModal(proj)}
                            className="text-text-secondary hover:text-text-primary p-0.5 rounded hover:bg-hover-bg/50"
                            title="Редагувати"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDelete(proj.id, proj.name)}
                            className="text-text-secondary hover:text-status-error p-0.5 rounded hover:bg-hover-bg/50"
                            title="Видалити"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-text-secondary line-clamp-2 mb-3">
                        {proj.description || 'Опис відсутній.'}
                      </p>

                      {/* Tags */}
                      {proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {proj.tags.map((tag, idx) => (
                            <Badge key={idx} variant="primary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary">
                          <span>Прогрес</span>
                          <span>{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-hover-bg rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-accent-purple h-1 transition-all duration-500 ease-out" 
                            style={{ width: `${proj.progress}%` }} 
                          />
                        </div>
                      </div>

                      {/* Footer: External links & click navigation */}
                      <div className="mt-3.5 pt-3 border-t border-border-accent/15 flex items-center justify-between">
                        <div className="flex gap-2">
                          {proj.githubUrl && (
                            <a 
                              href={proj.githubUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-text-secondary hover:text-text-primary transition-colors p-1 bg-hover-bg/40 rounded-md border border-border-accent/10"
                              title="GitHub"
                            >
                              <Github className="w-3 h-3" />
                            </a>
                          )}
                          {proj.deployUrl && (
                            <a 
                              href={proj.deployUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-text-secondary hover:text-text-primary transition-colors p-1 bg-hover-bg/40 rounded-md border border-border-accent/10"
                              title="Демо-версія"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Mobile/click navigation buttons */}
                        <div className="flex gap-1.5">
                          {col.id !== 'idea' && (
                            <button
                              onClick={() => moveStatus(proj, 'backward')}
                              className="p-1 bg-hover-bg/40 hover:bg-hover-bg text-text-secondary hover:text-text-primary border border-border-accent/20 rounded-md"
                              title="Попередній стан"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => moveStatus(proj, 'forward')}
                              className="p-1 bg-hover-bg/40 hover:bg-hover-bg text-text-secondary hover:text-text-primary border border-border-accent/20 rounded-md"
                              title="Наступний стан"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* GitHub Column */}
        <div className="flex flex-col bg-panel-bg/30 border border-border-accent/40 rounded-xl p-4 min-h-[400px] xl:min-h-[600px] border-t-2 border-t-[#5F86E0]">
          {/* Column Title */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#5F86E0]/20">
            <span className="font-sans font-semibold text-xs tracking-wide text-text-primary uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F86E0]" />
              GitHub Проєкти
            </span>
            <Badge variant="neutral">{githubRepos.length}</Badge>
          </div>

          {/* Repos list */}
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[500px] xl:max-h-none">
            {githubRepos.length === 0 ? (
              <div className="py-12 px-2 text-center text-[11px] text-text-tertiary border border-dashed border-border-accent/10 rounded-xl">
                Немає синхронізованих репозиторіїв.<br/>Введіть username вгорі та натисніть "Синхронізувати".
              </div>
            ) : (
              githubRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-[#15131F]/90 border border-[rgba(168,130,255,0.08)] rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5F86E0]/30 hover:shadow-[0_0_15px_rgba(95,134,224,0.1)]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-sans font-semibold text-xs text-text-primary line-clamp-1 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span className="truncate" title={repo.name}>{repo.name}</span>
                    </h4>
                    <Badge variant="primary" className="bg-[#1D2136] text-[#7EA6FF] border-[#313D6E] shrink-0 text-[10px]">
                      GitHub
                    </Badge>
                  </div>

                  <p className="text-[11px] text-[#8B879E] line-clamp-2 mb-3">
                    {repo.description || 'Опис репозиторію відсутній.'}
                  </p>

                  {/* Language and Stars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-[10px] text-text-tertiary">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-status-warning fill-status-warning shrink-0" />
                      {repo.stargazers_count}
                    </span>
                  </div>

                  {/* Updated time */}
                  <div className="text-[9px] font-mono text-text-tertiary mb-3">
                    Оновлено: {new Date(repo.updated_at).toLocaleDateString('uk-UA')}
                  </div>

                  {/* External Link */}
                  <div className="pt-2 border-t border-border-accent/15">
                    <a 
                      href={repo.html_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-text-secondary hover:text-text-primary transition-colors p-1 bg-hover-bg/40 rounded-md border border-border-accent/10 inline-flex items-center gap-1.5 text-[10px] w-full justify-center"
                      title="Відкрити на GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Відкрити в GitHub</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Редагувати Проєкт' : 'Додати Новий Проєкт'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Назва проєкту *</Label>
            <Input 
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Наприклад, NEXUS Dashboard"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Короткий опис</Label>
            <Textarea 
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Про що цей проєкт та які завдання він вирішує..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Статус</Label>
              <Select 
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
              >
                <option value="idea" className="bg-panel-bg text-text-primary">Ідея (Backlog)</option>
                <option value="in_progress" className="bg-panel-bg text-text-primary">В роботі</option>
                <option value="testing" className="bg-panel-bg text-text-primary">Тестування</option>
                <option value="completed" className="bg-panel-bg text-text-primary">Завершено</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Прогрес ({formProgress}%)</Label>
              <input 
                type="range"
                min="0"
                max="100"
                step="5"
                value={formProgress}
                onChange={(e) => setFormProgress(Number(e.target.value))}
                className="w-full h-8 bg-transparent accent-accent-purple cursor-pointer focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Теги / Технології (через кому)</Label>
            <Input 
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="React, TypeScript, Tailwind, Docker"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>GitHub URL (необов'язково)</Label>
              <Input 
                value={formGithub}
                onChange={(e) => setFormGithub(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-1">
              <Label>Посилання на деплой (необов'язково)</Label>
              <Input 
                value={formDeploy}
                onChange={(e) => setFormDeploy(e.target.value)}
                placeholder="https://myproject.com"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-accent/20 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Скасувати
            </Button>
            <Button variant="primary" type="submit">
              {editingProject ? 'Зберегти зміни' : 'Створити проєкт'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
