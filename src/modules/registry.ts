import React from 'react';
import { 
  LayoutDashboard, 
  Braces, 
  Layers, 
  HardDrive, 
  BookOpen, 
  Settings as SettingsIcon,
  Code2,
  Terminal,
  Clock,
  Bookmark,
  Compass
} from 'lucide-react';
import { ModuleId } from '../types';

const DashboardModule = React.lazy(() => import('./dashboard/DashboardModule').then(m => ({ default: m.DashboardModule })));
const CodeToolsModule = React.lazy(() => import('./code-tools/CodeToolsModule').then(m => ({ default: m.CodeToolsModule })));
const ProjectTrackerModule = React.lazy(() => import('./project-tracker/ProjectTrackerModule').then(m => ({ default: m.ProjectTrackerModule })));
const GadgetInventoryModule = React.lazy(() => import('./gadget-inventory/GadgetInventoryModule').then(m => ({ default: m.GadgetInventoryModule })));
const KnowledgeBaseModule = React.lazy(() => import('./knowledge-base/KnowledgeBaseModule').then(m => ({ default: m.KnowledgeBaseModule })));
const SettingsModule = React.lazy(() => import('./settings/SettingsModule').then(m => ({ default: m.SettingsModule })));
const CodeEditorModule = React.lazy(() => import('./code-editor/CodeEditorModule').then(m => ({ default: m.CodeEditorModule })));
const SnippetsLibraryModule = React.lazy(() => import('./snippets-library/SnippetsLibraryModule').then(m => ({ default: m.SnippetsLibraryModule })));
const FocusTimerModule = React.lazy(() => import('./focus-timer/FocusTimerModule').then(m => ({ default: m.FocusTimerModule })));
const CheatsheetModule = React.lazy(() => import('./cheatsheet/CheatsheetModule').then(m => ({ default: m.CheatsheetModule })));
const BookmarksModule = React.lazy(() => import('./bookmarks/BookmarksModule').then(m => ({ default: m.BookmarksModule })));
const DocsModule = React.lazy(() => import('./docs/DocsModule').then(m => ({ default: m.DocsModule })));

export interface ModuleEntry {
  id: ModuleId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

export const MODULE_REGISTRY: ModuleEntry[] = [
  {
    id: 'dashboard',
    name: 'Дашборд',
    icon: LayoutDashboard,
    description: 'Загальний огляд вашого робочого простору, системна діагностика та гарячі новини.',
    component: DashboardModule,
  },
  {
    id: 'code-tools',
    name: 'Dev Tools',
    icon: Braces,
    description: 'Шестикомпонентний хаб розробника з JSON форматерами, Regex і колірними палітрами.',
    component: CodeToolsModule,
  },
  {
    id: 'code-editor',
    name: 'Редактор',
    icon: Code2,
    description: 'Повноцінний редактор коду Monaco з автозбереженням та прив\'язкою до проєктів.',
    component: CodeEditorModule,
  },
  {
    id: 'snippets-library',
    name: 'Сніппети',
    icon: Braces,
    description: 'Бібліотека кастомних сніппетів із функцією швидкого пошуку та копіювання.',
    component: SnippetsLibraryModule,
  },
  {
    id: 'focus-timer',
    name: 'Фокус-таймер',
    icon: Clock,
    description: 'Помодоро таймер для роботи зі звуковими фоновими шумами синтезованими на Web Audio.',
    component: FocusTimerModule,
  },
  {
    id: 'cheatsheet',
    name: 'Шпаргалка',
    icon: Terminal,
    description: 'Швидкий довідник термінальних команд розробника з кліком для копіювання.',
    component: CheatsheetModule,
  },
  {
    id: 'bookmarks',
    name: 'Закладки',
    icon: Bookmark,
    description: 'Каталог корисних вебресурсів, інструментів та посилань розробника.',
    component: BookmarksModule,
  },
  {
    id: 'docs',
    name: 'Документація',
    icon: Compass,
    description: 'Браузер офіційної документації через DevDocs для 100+ технологій.',
    component: DocsModule,
  },
  {
    id: 'project-tracker',
    name: 'Проєкти',
    icon: Layers,
    description: 'Канбан-трекер з прогрес-барами та деплой-посиланнями.',
    component: ProjectTrackerModule,
  },
  {
    id: 'gadget-inventory',
    name: 'Техніка',
    icon: HardDrive,
    description: 'Централізований каталог комп\'ютерів, моніторів та аксесуарів.',
    component: GadgetInventoryModule,
  },
  {
    id: 'knowledge-base',
    name: 'База знань',
    icon: BookOpen,
    description: 'Обсидіан-стиль Markdown блокнот з тегами та живим рендером.',
    component: KnowledgeBaseModule,
  },
  {
    id: 'settings',
    name: 'Налаштування',
    icon: SettingsIcon,
    description: 'Налаштування акцентного світіння, компактності панелей та бекапів.',
    component: SettingsModule,
  },
];
