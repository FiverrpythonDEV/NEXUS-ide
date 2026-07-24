import React, { useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../i18n/translations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { storage } from '../../utils/storage';
import { soundEngine } from '../../utils/soundEffects';
import { extractColorsFromImage } from '../../utils/colorExtractor';
import { 
  Settings, 
  Palette, 
  Layout, 
  Download, 
  Upload, 
  RotateCcw, 
  AlertTriangle,
  Sliders,
  Type,
  Sparkles,
  AlignLeft,
  FileJson,
  Volume2,
  VolumeX,
  Code2,
  SlidersHorizontal,
  Layers,
  Wand2,
  ImagePlus,
  Droplets,
  Image as ImageIcon
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings, resetAllData } = useAppContext();
  const { t, lang } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'customization'>('general');

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(lang === 'uk' ? 'Будь ласка, виберіть файл зображення (PNG, JPG, WebP)' : 'Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      toast.info(lang === 'uk' ? 'Аналізуємо кольорову гаму зображення...' : 'Analyzing image color palette...');
      
      const { dominantHex, paletteHex } = await extractColorsFromImage(dataUrl);

      updateSettings({
        customWallpaper: dataUrl,
        accentColor: dominantHex,
        extractedPalette: paletteHex,
      });

      toast.success(
        lang === 'uk'
          ? `Шпалери встановлено! Автоматично підібрано колір теми: ${dominantHex.toUpperCase()}`
          : `Wallpaper set! Auto-picked theme accent color: ${dominantHex.toUpperCase()}`
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWallpaper = () => {
    updateSettings({
      customWallpaper: '',
      extractedPalette: [],
    });
    toast.info(lang === 'uk' ? 'Кастомні шпалери видалено' : 'Custom wallpaper removed');
  };

  const handleAccentChange = (color: string) => {
    updateSettings({ accentColor: color });
    toast.success(`Змінено акцентний колір на ${color.toUpperCase()}`);
  };

  const toggleSidebarCompact = () => {
    updateSettings({ isSidebarCompact: !settings.isSidebarCompact });
    toast.info(settings.isSidebarCompact ? 'Розширене бічне меню' : 'Компактне бічне меню');
  };

  // --- Theme Export/Import ---
  const handleExportTheme = () => {
    try {
      const themeData = {
        type: 'nexus_theme',
        accentColor: settings.accentColor,
        neonIntensity: settings.neonIntensity,
        density: settings.density,
        borderRadius: settings.borderRadius,
        interfaceFont: settings.interfaceFont,
        codeFont: settings.codeFont,
        bgTexture: settings.bgTexture,
        sidebarPosition: settings.sidebarPosition,
        exportedAt: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(themeData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus_theme_${settings.accentColor.replace('#', '')}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Тему успішно експортовано!');
    } catch (e) {
      toast.error('Не вдалося експортувати тему');
    }
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.type === 'nexus_theme' || (parsed.accentColor && parsed.neonIntensity !== undefined)) {
          updateSettings({
            accentColor: parsed.accentColor,
            neonIntensity: parsed.neonIntensity ?? 50,
            density: parsed.density ?? 'normal',
            borderRadius: parsed.borderRadius ?? 12,
            interfaceFont: parsed.interfaceFont ?? 'Inter',
            codeFont: parsed.codeFont ?? 'JetBrains Mono',
            bgTexture: parsed.bgTexture ?? 'gradient',
            sidebarPosition: parsed.sidebarPosition ?? 'left',
          });
          toast.success('Тему завантажено та застосовано!');
        } else {
          toast.error('Неправильний формат файлу теми');
        }
      } catch (err) {
        toast.error('Не вдалося зчитати файл теми');
      }
    };
    reader.readAsText(file);
  };

  const handleResetCustomization = () => {
    updateSettings({
      accentColor: '#8B5CF6',
      neonIntensity: 50,
      density: 'normal',
      borderRadius: 12,
      interfaceFont: 'Inter',
      codeFont: 'JetBrains Mono',
      bgTexture: 'gradient',
      sidebarPosition: 'left',
    });
    toast.success('Налаштування кастомізації скинуто до початкових!');
  };

  // --- Backups Management ---
  const handleExportBackup = () => {
    try {
      const jsonString = storage.exportBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `nexus_backup_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Резервну копію успішно експортовано!');
    } catch (e) {
      toast.error('Не вдалося експортувати резервну копію');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = storage.importBackup(text);
        if (success) {
          toast.success('Дані успішно імпортовано! Оновлюємо робочий простір...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error('Неправильний формат файлу резервної копії');
        }
      } catch (err) {
        toast.error('Не вдалося зчитати файл резервної копії');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Увага! Ця дія видалить всі створені вами проєкти, нотатки, гаджети та поверне початкові налаштування. Продовжити?')) {
      resetAllData();
      toast.success('Робочий простір скинуто до початкового стану!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const colors = [
    { id: '#8B5CF6', name: 'Nexus Violet', label: 'Фіолетовий' },
    { id: '#10B981', name: 'Matrix Emerald', label: 'Смарагдовий' },
    { id: '#3B82F6', name: 'Electric Azure', label: 'Лазурний' },
    { id: '#F43F5E', name: 'Cyber Crimson', label: 'Червоний' },
    { id: '#F59E0B', name: 'Solar Gold', label: 'Золотий' },
    { id: '#D946EF', name: 'Synthwave Fuchsia', label: 'Фуксія' },
    { id: '#06B6D4', name: 'Neo Cyan', label: 'Бірюзовий' },
    { id: '#94A3B8', name: 'Stealth Silver', label: 'Сріблястий' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent-purple" />
            Налаштування системи
          </h2>
          <p className="text-xs text-text-secondary">Персоналізація зовнішнього вигляду, кастомізація та резервне копіювання.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#12101C] p-1 rounded-xl border border-border-accent/20 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'general'
                ? 'bg-accent-purple text-white shadow-xs'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Загальні
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'customization'
                ? 'bg-accent-purple text-white shadow-xs'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Кастомізація
          </button>
        </div>
      </div>

      {activeTab === 'general' ? (
        <div className="space-y-6">
          {/* 1. Interface Options */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Layout className="w-4 h-4 text-accent-purple" />
              {t('settings.appearance')}
            </h3>
            <p className="text-xs text-text-secondary">{lang === 'uk' ? 'Управління відображенням та мовою робочої зони.' : 'Manage system display and language workspace settings.'}</p>

            {/* Sidebar toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{t('settings.sidebar_compact')}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Згортає ліву навігаційну панель до стану іконок.' : 'Collapses the left navigation sidebar to icons only.'}</span>
              </div>
              <button
                type="button"
                onClick={toggleSidebarCompact}
                className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                  settings.isSidebarCompact ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.isSidebarCompact ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Language Toggler */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{t('settings.language')}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Виберіть мову інтерфейсу NEXUS.' : 'Choose the NEXUS interface language.'}</span>
              </div>
              <div className="flex bg-[#12101C] p-1 rounded-lg border border-border-accent/20 shrink-0">
                <button
                  onClick={() => {
                    updateSettings({ language: 'uk' });
                    toast.success('Мову змінено на українську!');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    settings.language === 'uk'
                      ? 'bg-accent-purple text-white shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  UA
                </button>
                <button
                  onClick={() => {
                    updateSettings({ language: 'en' });
                    toast.success('Language changed to English!');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    settings.language === 'en'
                      ? 'bg-accent-purple text-white shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Theme Mode Toggler */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{t('settings.theme')}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Оберіть кольорове оформлення NEXUS.' : 'Choose the NEXUS color scheme.'}</span>
              </div>
              <div className="flex bg-[#12101C] p-1 rounded-lg border border-border-accent/20 shrink-0">
                <button
                  onClick={() => {
                    updateSettings({ themeMode: 'dark' });
                    toast.success(lang === 'uk' ? 'Активовано темну тему' : 'Dark theme activated');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    (settings.themeMode || 'dark') === 'dark'
                      ? 'bg-accent-purple text-white shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {t('settings.theme_dark')}
                </button>
                <button
                  onClick={() => {
                    updateSettings({ themeMode: 'light' });
                    toast.success(lang === 'uk' ? 'Активовано світлу тему' : 'Light theme activated');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    settings.themeMode === 'light'
                      ? 'bg-accent-purple text-white shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {t('settings.theme_light')}
                </button>
                <button
                  onClick={() => {
                    updateSettings({ themeMode: 'system' });
                    toast.success(lang === 'uk' ? 'Активовано системну тему' : 'System theme activated');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    settings.themeMode === 'system'
                      ? 'bg-accent-purple text-white shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {t('settings.theme_system')}
                </button>
              </div>
            </div>

            {/* Weather toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{lang === 'uk' ? 'Погодний віджет' : 'Weather Widget'}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Показувати або ховати погодний інформер на робочому столі.' : 'Show or hide the weather widget on the dashboard.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = settings.weatherEnabled !== false;
                  updateSettings({ weatherEnabled: !val });
                  toast.success(!val ? (lang === 'uk' ? 'Погодний віджет увімкнено' : 'Weather widget enabled') : (lang === 'uk' ? 'Погодний віджет сховано' : 'Weather widget hidden'));
                }}
                className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                  settings.weatherEnabled !== false ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.weatherEnabled !== false ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Code Editor Settings */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent-purple" />
              {lang === 'uk' ? 'Налаштування редактора коду' : 'Code Editor Settings'}
            </h3>
            <p className="text-xs text-text-secondary">
              {lang === 'uk' ? 'Персоналізуйте параметри вбудованого редактора коду.' : 'Customize the built-in code editor parameters.'}
            </p>

            {/* Auto Save Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{lang === 'uk' ? 'Автозбереження' : 'Auto Save'}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Автоматично зберігати зміни у файлах редактора.' : 'Automatically save changes in the editor files.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = settings.autoSave !== false;
                  updateSettings({ autoSave: !val });
                  toast.info(!val ? (lang === 'uk' ? 'Автозбереження увімкнено' : 'Auto save enabled') : (lang === 'uk' ? 'Автозбереження вимкнено' : 'Auto save disabled'));
                }}
                className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                  settings.autoSave !== false ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.autoSave !== false ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Minimap Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{lang === 'uk' ? 'Мінікарта коду' : 'Editor Minimap'}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Показувати мінікарта для швидкої навігації файлом.' : 'Show code minimap for fast file navigation.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = settings.editorMinimap !== false;
                  updateSettings({ editorMinimap: !val });
                  toast.info(!val ? (lang === 'uk' ? 'Мінікарта увімкнена' : 'Minimap enabled') : (lang === 'uk' ? 'Мінікарта вимкнена' : 'Minimap disabled'));
                }}
                className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                  settings.editorMinimap !== false ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.editorMinimap !== false ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Word Wrap Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-hover-bg/20 border border-border-accent/20">
              <div>
                <span className="text-xs font-medium text-text-primary block">{lang === 'uk' ? 'Перенос рядків' : 'Word Wrap'}</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">{lang === 'uk' ? 'Автоматично переносити довгі рядки коду.' : 'Automatically wrap long code lines.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = settings.editorWordWrap !== false;
                  updateSettings({ editorWordWrap: !val });
                  toast.info(!val ? (lang === 'uk' ? 'Перенос рядків увімкнено' : 'Word wrap enabled') : (lang === 'uk' ? 'Перенос рядків вимкнено' : 'Word wrap disabled'));
                }}
                className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                  settings.editorWordWrap !== false ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                }`}
              >
                <span 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    settings.editorWordWrap !== false ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Font Size slider */}
            <div className="p-4 rounded-xl bg-[#1E1B2E]/40 border border-border-accent/20 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-text-primary">
                  {lang === 'uk' ? 'Розмір шрифту в редакторі' : 'Editor Font Size'}
                </span>
                <span className="text-xs font-mono text-accent-purple">{settings.editorFontSize ?? 14}px</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="20" 
                value={settings.editorFontSize ?? 14} 
                onChange={(e) => updateSettings({ editorFontSize: Number(e.target.value) })}
                className="w-full h-1 bg-[#12101C] rounded-lg appearance-none cursor-pointer accent-accent-purple"
              />
              <div className="flex justify-between text-[8px] font-mono text-text-tertiary uppercase">
                <span>12px</span>
                <span>14px (Дефолт)</span>
                <span>20px</span>
              </div>
            </div>

            {/* Tab Size choices */}
            <div className="p-4 rounded-xl bg-[#1E1B2E]/40 border border-border-accent/20 space-y-2.5">
              <span className="text-xs font-semibold text-text-primary block">
                {lang === 'uk' ? 'Розмір табуляції (Tab Size)' : 'Tabulation Size (Tab Size)'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      updateSettings({ editorTabSize: size });
                      toast.info(lang === 'uk' ? `Встановлено розмір таба: ${size}` : `Tab size set to ${size}`);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      (settings.editorTabSize ?? 2) === size 
                        ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                        : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                    }`}
                  >
                    {size === 2 ? (lang === 'uk' ? '2 пробіли' : '2 spaces') : (lang === 'uk' ? '4 пробіли' : '4 spaces')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* 2. Gemini API Key Configuration */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-purple" />
              {t('settings.gemini_key')}
            </h3>
            <p className="text-xs text-text-secondary">
              {t('settings.gemini_key_desc')}
            </p>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="password"
                  value={settings.geminiApiKey || ''}
                  placeholder="AIzaSy..."
                  onChange={(e) => {
                    updateSettings({ geminiApiKey: e.target.value });
                    localStorage.setItem('nexus_gemini_api_key', e.target.value);
                  }}
                  className="flex-1 bg-[#12101C] border border-border-accent/20 hover:border-border-accent/40 rounded-xl px-4 py-2 text-xs font-mono text-accent-purple focus:border-accent-purple focus:outline-hidden"
                />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple hover:bg-accent-purple/20 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <span>{t('ai.get_key')}</span>
                </a>
              </div>
            </div>
          </Card>

          {/* 3. Backups management */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Download className="w-4 h-4 text-accent-purple" />
              {t('settings.backup')}
            </h3>
            <p className="text-xs text-text-secondary">{lang === 'uk' ? 'Створюйте резервні копії ваших даних, щоб запобігти їх випадковій втраті.' : 'Create backups of your data to prevent accidental loss.'}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Export card */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Експорт Даних</span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Збережіть усі дані (нотатки, проєкти, гаджети, таймери) в один JSON файл.</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-2 text-xs py-1.5"
                  onClick={handleExportBackup}
                >
                  <Download className="w-3.5 h-3.5" /> Експортувати в JSON
                </Button>
              </div>

              {/* Import card */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-text-primary block">Імпорт Даних</span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Відновіть свій робочий простір з попереднього файлу бекапу JSON.</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  accept=".json"
                  className="hidden"
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-2 text-xs py-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" /> Імпортувати з JSON
                </Button>
              </div>

            </div>
          </Card>

          {/* 3. Danger Zone */}
          <Card className="border-t-2 border-t-status-error/40 space-y-4">
            <h3 className="text-sm font-semibold text-status-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Зона Ризику (Danger Zone)
            </h3>
            <p className="text-xs text-text-secondary">Незворотні системні операції.</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-status-error/5 border border-status-error/15">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-text-primary block">Скинути всі дані</span>
                <span className="text-[10px] text-text-secondary block">Ця дія очистить всі локальні таблиці в localStorage та повністю скине систему.</span>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                className="flex items-center gap-1.5 shrink-0"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" /> Скинути Систему
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Customization Dashboard */}
          <Card className="space-y-6">
            
            {/* Title */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent-purple" />
                Персоналізація Дизайну та Теми
              </h3>
              <p className="text-xs text-text-secondary">
                Зміни застосовуються миттєво до всього інтерфейсу. Експериментуйте без необхідності збереження!
              </p>
            </div>

            {/* Colors Preset Row */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-text-primary block">Оберіть базовий колір акценту</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAccentChange(c.id)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                      settings.accentColor === c.id
                        ? 'bg-accent-purple/10 border-accent-purple shadow-[0_0_15px_var(--color-accent-purple-glow)]'
                        : 'bg-hover-bg/30 border-border-accent/10 hover:border-border-accent/30'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" 
                      style={{ backgroundColor: c.id }}
                    />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-medium text-text-primary block leading-tight truncate">{c.name}</span>
                      <span className="text-[9px] text-text-secondary block leading-none truncate">{c.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Hex Color Picker */}
            <div className="p-3.5 rounded-xl border bg-hover-bg/15 border-border-accent/15 flex flex-col sm:flex-row justify-between gap-4 items-center">
              <div>
                <span className="text-xs font-semibold text-text-primary block">Власний колір акценту (Hex Color Picker)</span>
                <span className="text-[10px] text-text-secondary block mt-0.5">Встановіть будь-який відтінок з повноцінної палітри кольорів.</span>
              </div>
              <div className="flex items-center gap-3 bg-base-bg/60 px-3 py-2 rounded-xl border border-border-accent/30">
                <input 
                  type="color" 
                  value={settings.accentColor.startsWith('#') ? settings.accentColor : '#8B5CF6'} 
                  onChange={(e) => handleAccentChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent shrink-0"
                />
                <span className="text-xs font-mono text-text-primary uppercase shrink-0">
                  {settings.accentColor.startsWith('#') ? settings.accentColor : '#8B5CF6'}
                </span>
              </div>
            </div>

            {/* Custom Range Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Neon slider */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
                    Інтенсивність світіння (Neon Glow)
                  </span>
                  <span className="text-xs font-mono text-accent-purple">{settings.neonIntensity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.neonIntensity ?? 50} 
                  onChange={(e) => updateSettings({ neonIntensity: Number(e.target.value) })}
                  className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                />
                <div className="flex justify-between text-[8px] font-mono text-text-tertiary uppercase">
                  <span>Вимкнено</span>
                  <span>Звично</span>
                  <span>Максимум</span>
                </div>
              </div>

              {/* Border radius slider */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-accent-purple" />
                    Заокруглення кутів (Border Radius)
                  </span>
                  <span className="text-xs font-mono text-accent-purple">{settings.borderRadius}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="24" 
                  value={settings.borderRadius} 
                  onChange={(e) => updateSettings({ borderRadius: Number(e.target.value) })}
                  className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                />
                <div className="flex justify-between text-[8px] font-mono text-text-tertiary uppercase">
                  <span>Гострі</span>
                  <span>12px (Дефолт)</span>
                  <span>Супер-круглі</span>
                </div>
              </div>

            </div>

            {/* Density and sidebar layouts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Density toggle */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <span className="text-xs font-semibold text-text-primary block">Щільність інтерфейсу (Density)</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateSettings({ density: d })}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        settings.density === d 
                          ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                          : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                      }`}
                    >
                      {d === 'compact' ? 'Компактно' : d === 'spacious' ? 'Просторо' : 'Звично'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar layout position */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <span className="text-xs font-semibold text-text-primary block flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-accent-purple" />
                  Позиція бічної панелі (Sidebar Position)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['left', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateSettings({ sidebarPosition: pos })}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        settings.sidebarPosition === pos 
                          ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                          : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                      }`}
                    >
                      {pos === 'left' ? 'Ліворуч' : 'Праворуч'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Typography Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sans font choice */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-accent-purple" />
                  Шрифт інтерфейсу
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {['Inter', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans'].map((font) => (
                    <button
                      key={font}
                      onClick={() => updateSettings({ interfaceFont: font })}
                      style={{ fontFamily: font }}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border text-center truncate cursor-pointer transition-all ${
                        settings.interfaceFont === font 
                          ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                          : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mono font choice */}
              <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-accent-purple" />
                  Шрифт редактора коду
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono'].map((font) => (
                    <button
                      key={font}
                      onClick={() => updateSettings({ codeFont: font })}
                      style={{ fontFamily: font }}
                      className={`py-2 px-1 rounded-lg text-xs font-mono border text-center truncate cursor-pointer transition-all ${
                        settings.codeFont === font 
                          ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                          : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Background Texture Choice */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-2.5">
              <span className="text-xs font-semibold text-text-primary block">Фонова текстура застосунку</span>
              <div className="grid grid-cols-3 gap-2">
                {(['clean', 'noise', 'gradient'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => updateSettings({ bgTexture: bg })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                      settings.bgTexture === bg 
                        ? 'bg-accent-purple/15 border-accent-purple text-text-primary font-bold' 
                        : 'bg-hover-bg/25 border-border-accent/10 hover:border-border-accent/30 text-text-secondary'
                    }`}
                  >
                    {bg === 'clean' ? 'Чистий фон' : bg === 'noise' ? 'Легкий шум' : 'М\'яка градієнтна пляма'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound FX & Audio Acoustics */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-accent-purple" />
                    Звукові ефекти інтерфейсу (Audio Acoustics)
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Синтезовані футуристичні кліки та звуки зворотного зв'язку через Web Audio API.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextProfile = settings.soundProfile === 'off' ? 'cyber' : 'off';
                    updateSettings({ soundProfile: nextProfile });
                    if (nextProfile !== 'off') soundEngine.play('success', nextProfile, (settings.soundVolume ?? 30) / 100);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    settings.soundProfile !== 'off' 
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' 
                      : 'bg-hover-bg/30 border-border-accent/20 text-text-secondary'
                  }`}
                >
                  {settings.soundProfile !== 'off' ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {settings.soundProfile !== 'off' ? 'Увімкнено' : 'Вимкнено'}
                </button>
              </div>

              {settings.soundProfile !== 'off' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-accent/10">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-text-secondary block">Профіль звуків</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'cyber', label: 'Cyber Synth' },
                        { id: 'classic-click', label: 'Classic Click' },
                        { id: 'retro-arcade', label: 'Retro 8-Bit' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            updateSettings({ soundProfile: p.id as any });
                            soundEngine.play('click', p.id, (settings.soundVolume ?? 30) / 100);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center truncate cursor-pointer transition-all ${
                            settings.soundProfile === p.id
                              ? 'bg-accent-purple/20 border-accent-purple text-white font-bold'
                              : 'bg-hover-bg/20 border-border-accent/10 text-text-secondary hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-medium text-text-secondary">
                      <span>Гучність</span>
                      <span className="font-mono text-accent-purple">{settings.soundVolume ?? 30}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={settings.soundVolume ?? 30}
                        onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                        className="flex-1 h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                      />
                      <button
                        onClick={() => soundEngine.play('run', settings.soundProfile, (settings.soundVolume ?? 30) / 100)}
                        className="px-2 py-1 text-[10px] font-semibold bg-accent-purple/15 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/25 cursor-pointer shrink-0"
                      >
                        Тест
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Image Wallpaper & Palette Extraction */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-accent-purple" />
                    Імпорт зображення як тема (Custom Image Theme & Auto Colors)
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">
                    Завантажте власне зображення. Система автоматично проаналізує пікселі та підлаштує палітру акцентних кольорів.
                  </span>
                </div>
                
                <input
                  type="file"
                  ref={wallpaperInputRef}
                  onChange={handleWallpaperUpload}
                  accept="image/*"
                  className="hidden"
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => wallpaperInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Завантажити зображення
                </Button>
              </div>

              {settings.customWallpaper && (
                <div className="p-3 bg-[#0D0B16] border border-border-accent/20 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={settings.customWallpaper}
                        alt="Wallpaper Preview"
                        className="w-16 h-12 object-cover rounded-lg border border-border-accent/30 shadow-md shrink-0"
                      />
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Активне зображення фону</span>
                        <span className="text-[10px] text-accent-purple block font-mono">
                          Тема: {settings.accentColor.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveWallpaper}
                      className="text-status-error border-status-error/20 hover:bg-status-error/10 text-xs w-full sm:w-auto shrink-0 cursor-pointer"
                    >
                      Видалити фонове зображення
                    </Button>
                  </div>

                  {/* Extracted Color Palette Chips */}
                  {settings.extractedPalette && settings.extractedPalette.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border-accent/10">
                      <span className="text-[10px] font-semibold text-text-secondary block uppercase tracking-wider">
                        Витягнута палітра кольорів з зображення (натисніть для вибору):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {settings.extractedPalette.map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAccentChange(color)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                              settings.accentColor.toLowerCase() === color.toLowerCase()
                                ? 'bg-accent-purple/20 border-accent-purple text-white font-bold ring-1 ring-accent-purple'
                                : 'bg-hover-bg/30 border-border-accent/10 text-text-secondary hover:text-white'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: color }} />
                            <span>{color.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wallpaper Blur & Dim Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-accent/10">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-text-secondary">
                        <span>Розмиття зображення (Blur)</span>
                        <span className="font-mono text-accent-purple">{settings.customWallpaperBlur ?? 5}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={settings.customWallpaperBlur ?? 5}
                        onChange={(e) => updateSettings({ customWallpaperBlur: Number(e.target.value) })}
                        className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-text-secondary">
                        <span>Затемнення фону (Dimness)</span>
                        <span className="font-mono text-accent-purple">{settings.customWallpaperDim ?? 40}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={settings.customWallpaperDim ?? 40}
                        onChange={(e) => updateSettings({ customWallpaperDim: Number(e.target.value) })}
                        className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liquid Glass Mode & Matrix Rain Toggle */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-3">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-accent-purple" />
                Спеціальні Візуальні Режими (Special Visual Modes)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Liquid Glass Mode Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0B16] border border-border-accent/20">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block flex items-center gap-1">
                      Режим Рідкого Скла 💎
                    </span>
                    <span className="text-[10px] text-text-secondary block mt-0.5">
                      Ультраглянцевий ефект з відблисками та динамічним склом.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !settings.liquidGlassMode;
                      updateSettings({ liquidGlassMode: nextVal });
                      toast.success(nextVal ? 'Режим рідкого скла увімкнено!' : 'Режим рідкого скла вимкнено');
                    }}
                    className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                      settings.liquidGlassMode ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        settings.liquidGlassMode ? 'translate-x-[20px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Matrix Digital Rain Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0B16] border border-border-accent/20">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block flex items-center gap-1">
                      Matrix Digital Rain ⚡
                    </span>
                    <span className="text-[10px] text-text-secondary block mt-0.5">
                      Анімований каскад кібер-символів на тлі сайту.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !settings.matrixRainEffect;
                      updateSettings({ matrixRainEffect: nextVal });
                      toast.success(nextVal ? 'Ефект Matrix увімкнено!' : 'Ефект Matrix вимкнено');
                    }}
                    className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center border ${
                      settings.matrixRainEffect ? 'bg-accent-purple border-accent-purple' : 'bg-[#181524] border-border-accent/30'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        settings.matrixRainEffect ? 'translate-x-[20px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Glassmorphic Effects & Backdrop Blur */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-3">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent-purple" />
                Ефекти Glassmorphism та Прозорості
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium text-text-secondary">
                    <span>Розмиття фону (Backdrop Blur)</span>
                    <span className="font-mono text-accent-purple">{settings.backdropBlur ?? 12}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={settings.backdropBlur ?? 12}
                    onChange={(e) => updateSettings({ backdropBlur: Number(e.target.value) })}
                    className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium text-text-secondary">
                    <span>Прозорість рамок (Border Opacity)</span>
                    <span className="font-mono text-accent-purple">{settings.cardBorderOpacity ?? 20}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={settings.cardBorderOpacity ?? 20}
                    onChange={(e) => updateSettings({ cardBorderOpacity: Number(e.target.value) })}
                    className="w-full h-1 bg-hover-bg rounded-lg appearance-none cursor-pointer accent-accent-purple"
                  />
                </div>
              </div>
            </div>

            {/* Custom Live CSS Injector for Hardcore Customization Addicts */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-accent-purple" />
                    Власний CSS код (Custom CSS Injector)
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">Перевизначте будь-які стилі, градієнти чи анімації інтерфейсу NEXUS в реальному часі.</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const snippet = `/* Glowing cards */\n.bg-panel-bg {\n  box-shadow: 0 0 15px rgba(139, 92, 246, 0.15);\n  border-color: rgba(139, 92, 246, 0.3) !important;\n}`;
                      updateSettings({ customCss: (settings.customCss || '') + '\n' + snippet });
                      toast.success('Додано пресет CSS світіння!');
                    }}
                    className="px-2 py-1 text-[10px] bg-hover-bg/50 hover:bg-hover-bg border border-border-accent/20 rounded-lg text-text-secondary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3 text-accent-purple" /> Світіння
                  </button>
                  <button
                    onClick={() => {
                      const snippet = `/* Custom scrollbars */\n::-webkit-scrollbar {\n  width: 6px;\n}\n::-webkit-scrollbar-thumb {\n  background: var(--color-accent-purple);\n  border-radius: 10px;\n}`;
                      updateSettings({ customCss: (settings.customCss || '') + '\n' + snippet });
                      toast.success('Додано пресет скролбарів!');
                    }}
                    className="px-2 py-1 text-[10px] bg-hover-bg/50 hover:bg-hover-bg border border-border-accent/20 rounded-lg text-text-secondary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3 text-accent-purple" /> Скролбари
                  </button>
                </div>
              </div>

              <textarea
                value={settings.customCss || ''}
                onChange={(e) => updateSettings({ customCss: e.target.value })}
                placeholder="/* Напишіть свій CSS код тут... наприклад: .text-accent-purple { color: #00ffcc !important; } */"
                rows={4}
                className="w-full bg-[#0D0B16] border border-border-accent/20 hover:border-border-accent/40 rounded-xl p-3 text-xs font-mono text-accent-purple focus:border-accent-purple focus:outline-hidden custom-scrollbar resize-y"
              />
            </div>

            {/* Theme Export/Import Tools */}
            <div className="p-4 rounded-xl bg-hover-bg/10 border border-border-accent/15 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-t-border-accent/20">
              <div>
                <span className="text-xs font-semibold text-text-primary block flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-accent-purple" />
                  Імпорт / Експорт теми (.json)
                </span>
                <span className="text-[10px] text-text-secondary block mt-0.5">Експортуйте створене оформлення або завантажте тему іншого розробника.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs py-1.5 cursor-pointer"
                  onClick={handleExportTheme}
                >
                  <Download className="w-3.5 h-3.5" /> Експортувати
                </Button>
                
                <input 
                  type="file" 
                  ref={themeFileInputRef}
                  onChange={handleImportTheme}
                  accept=".json"
                  className="hidden"
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs py-1.5 cursor-pointer"
                  onClick={() => themeFileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" /> Імпортувати
                </Button>
              </div>
            </div>

            {/* Reset Customization Button */}
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 text-xs border-status-error/20 text-status-error/80 hover:bg-status-error/10 hover:text-status-error cursor-pointer"
                onClick={handleResetCustomization}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Скинути кастомізацію
              </Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
};
