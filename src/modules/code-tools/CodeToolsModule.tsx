import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Label, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { 
  Code, 
  Braces, 
  Search, 
  Paintbrush, 
  Binary, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  Play, 
  RefreshCw 
} from 'lucide-react';

type ToolTab = 'json' | 'regex' | 'colors' | 'base64' | 'timestamp' | 'markdown';

export const CodeToolsModule: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ToolTab>('json');

  // --- JSON Formatter state ---
  const [jsonInput, setJsonInput] = useState('{\n  "status": "online",\n  "nexus": {\n    "v": 1.04,\n    "modules": ["dashboard", "tracker", "tools"]\n  }\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // --- Regex Tester state ---
  const [regexPattern, setRegexPattern] = useState('\\d+');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('Сьогодні 19 липня 2026 року. Сервер запущено о 11:09.');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  // --- Color Palette Generator state ---
  const [baseColor, setBaseColor] = useState('#8B5CF6');
  const [paletteType, setPaletteType] = useState<'complementary' | 'analogous' | 'triadic' | 'monochromatic'>('analogous');
  interface GeneratedColor { hex: string; name: string; }
  const [generatedColors, setGeneratedColors] = useState<GeneratedColor[]>([]);

  // --- Base64/URL state ---
  const [codecMode, setCodecMode] = useState<'encode' | 'decode'>('encode');
  const [codecType, setCodecType] = useState<'base64' | 'url'>('base64');
  const [codecInput, setCodecInput] = useState('Nexus Tech Workspace');
  const [codecOutput, setCodecOutput] = useState('');

  // --- Timestamp state ---
  const [unixTimestamp, setUnixTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
  const [readableDate, setReadableDate] = useState('');
  const [reverseDateInput, setReverseDateInput] = useState(new Date().toISOString());
  const [reverseUnixOutput, setReverseUnixOutput] = useState('');

  // --- Markdown state ---
  const [markdownInput, setMarkdownInput] = useState(
    `# Заголовок 1\n\n## Підзаголовок 2\n\nЦе робочий простір **NEXUS**.\n\nКорисні елементи:\n- Спідлайн дашборд\n- Інструменти розробника\n- Трекер завдань\n\n\`\`\`javascript\nconst workspace = "NEXUS";\nconsole.log(\`Запуск \${workspace}\`);\n\`\`\``
  );

  // Copy helper
  const copyToClipboard = (text: string, message = 'Скопійовано!') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // --- ACTIONS ---

  // JSON Formatting
  const handleFormatJson = (minify = false) => {
    try {
      if (!jsonInput.trim()) {
        setJsonOutput('');
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(jsonInput);
      const formatted = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      setJsonOutput(formatted);
      setJsonError(null);
      toast.success(minify ? 'Мініфіковано успішно!' : 'Форматовано успішно!');
    } catch (err: any) {
      setJsonError(err.message || 'Помилка валідації JSON');
      setJsonOutput('');
    }
  };

  // Regex Matcher
  useEffect(() => {
    if (!regexPattern) {
      setRegexMatches([]);
      setRegexError(null);
      return;
    }
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches: string[] = [];
      let match;
      
      // Prevent infinite loop if regex is empty/matches empty string
      if (re.test('')) {
        setRegexMatches([regexText]);
        setRegexError(null);
        return;
      }

      const tempRe = new RegExp(regexPattern, regexFlags.includes('g') ? regexFlags : regexFlags + 'g');
      let count = 0;
      while ((match = tempRe.exec(regexText)) !== null && count < 1000) {
        matches.push(match[0]);
        count++;
      }
      setRegexMatches(matches);
      setRegexError(null);
    } catch (err: any) {
      setRegexError(err.message);
      setRegexMatches([]);
    }
  }, [regexPattern, regexFlags, regexText]);

  // Color generator logic
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const getHex = (val: number) => {
      const h = clamp(val).toString(16);
      return h.length === 1 ? '0' + h : h;
    };
    return `#${getHex(r)}${getHex(g)}${getHex(b)}`.toUpperCase();
  };

  const generatePalette = () => {
    try {
      const hex = baseColor;
      if (!/^#[0-9A-F]{6}$/i.test(hex)) return;

      const rgb = hexToRgb(hex);
      const list: GeneratedColor[] = [{ hex: hex.toUpperCase(), name: 'Базовий' }];

      if (paletteType === 'complementary') {
        const compHex = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
        list.push({ hex: compHex, name: 'Комплиментарний' });
        
        // Add tinted/shaded variants of base & comp
        list.push({ hex: rgbToHex(rgb.r * 1.2, rgb.g * 1.2, rgb.b * 1.2), name: 'Світлий базовий' });
        list.push({ hex: rgbToHex(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7), name: 'Темний базовий' });
      } else if (paletteType === 'analogous') {
        // Shift RGB slightly
        list.push({ hex: rgbToHex(rgb.r, rgb.g * 0.8 + 40, rgb.b * 1.2), name: 'Бузковий відтінок' });
        list.push({ hex: rgbToHex(rgb.r * 1.2, rgb.g * 0.8, rgb.b * 0.8 + 30), name: 'Ягідний відтінок' });
        list.push({ hex: rgbToHex(rgb.r * 0.7, rgb.g * 1.1, rgb.b * 1.3), name: 'Морський відтінок' });
      } else if (paletteType === 'triadic') {
        list.push({ hex: rgbToHex(rgb.g, rgb.b, rgb.r), name: 'Тріада 1' });
        list.push({ hex: rgbToHex(rgb.b, rgb.r, rgb.g), name: 'Тріада 2' });
        list.push({ hex: rgbToHex(rgb.r * 0.5 + 50, rgb.g * 1.2, rgb.b * 0.5), name: 'Пастельний контраст' });
      } else if (paletteType === 'monochromatic') {
        list.push({ hex: rgbToHex(rgb.r * 1.3, rgb.g * 1.3, rgb.b * 1.3), name: 'Дуже світлий' });
        list.push({ hex: rgbToHex(rgb.r * 1.15, rgb.g * 1.15, rgb.b * 1.15), name: 'Світлий' });
        list.push({ hex: rgbToHex(rgb.r * 0.75, rgb.g * 0.75, rgb.b * 0.75), name: 'Темний' });
        list.push({ hex: rgbToHex(rgb.r * 0.5, rgb.g * 0.5, rgb.b * 0.5), name: 'Дуже темний' });
      }

      setGeneratedColors(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    generatePalette();
  }, [baseColor, paletteType]);

  // Codec process (Base64/URL)
  const handleCodecProcess = () => {
    try {
      if (codecType === 'base64') {
        if (codecMode === 'encode') {
          setCodecOutput(btoa(codecInput));
        } else {
          setCodecOutput(atob(codecInput));
        }
      } else {
        if (codecMode === 'encode') {
          setCodecOutput(encodeURIComponent(codecInput));
        } else {
          setCodecOutput(decodeURIComponent(codecInput));
        }
      }
    } catch (err: any) {
      setCodecOutput(`Помилка кодека: ${err.message}`);
    }
  };

  useEffect(() => {
    handleCodecProcess();
  }, [codecMode, codecType, codecInput]);

  // Timestamp conversion
  const handleTimestampConvert = () => {
    try {
      const val = parseInt(unixTimestamp);
      if (isNaN(val)) {
        setReadableDate('Невалідний Timestamp');
        return;
      }
      // Check if millisecond epoch
      const dateObj = val > 99999999999 ? new Date(val) : new Date(val * 1000);
      setReadableDate(dateObj.toLocaleString('uk-UA') + ' (UTC: ' + dateObj.toUTCString() + ')');
    } catch (err) {
      setReadableDate('Помилка конвертації');
    }
  };

  const handleReverseTimestampConvert = () => {
    try {
      const d = new Date(reverseDateInput);
      if (isNaN(d.getTime())) {
        setReverseUnixOutput('Невалідна дата');
        return;
      }
      setReverseUnixOutput(Math.floor(d.getTime() / 1000).toString());
    } catch (err) {
      setReverseUnixOutput('Помилка конвертації');
    }
  };

  useEffect(() => {
    handleTimestampConvert();
  }, [unixTimestamp]);

  useEffect(() => {
    handleReverseTimestampConvert();
  }, [reverseDateInput]);

  // Custom live Markdown parser (robust and clean, no dependency headaches)
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const block = codeContent.join('\n');
          codeContent = [];
          return (
            <pre key={idx} className="bg-hover-bg border border-border-accent/40 rounded-lg p-3 font-mono text-xs my-3 overflow-x-auto text-accent-purple">
              <code>{block}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold font-sans text-text-primary mt-4 mb-2 pb-1 border-b border-border-accent/20">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-semibold font-sans text-text-primary mt-3 mb-1.5">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-md font-semibold font-sans text-text-primary mt-2.5 mb-1">{line.slice(4)}</h3>;
      }

      // Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="list-disc ml-5 my-0.5 text-text-secondary">{line.slice(2)}</li>;
      }

      // Plain paragraphs with bold parsing helper
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // inline bold replacement
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-text-primary">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return <p key={idx} className="text-text-secondary leading-relaxed my-1.5 text-xs sm:text-sm">{parts.length > 0 ? parts : line}</p>;
    }).filter(el => el !== null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Sidebar Tool Switcher */}
      <Card className="lg:col-span-1 p-3 flex flex-col gap-1.5 bg-panel-bg/60 h-fit">
        <div className="px-3 py-2 border-b border-border-accent/20 mb-2">
          <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider">Dev Toolbox</h3>
        </div>
        
        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'json' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Braces className="w-4 h-4 shrink-0" />
          JSON Форматер & Валідатор
        </button>

        <button
          onClick={() => setActiveTab('regex')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'regex' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Search className="w-4 h-4 shrink-0" />
          Регулярні Вирази (Regex)
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'colors' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Paintbrush className="w-4 h-4 shrink-0" />
          Генератор Кольорів
        </button>

        <button
          onClick={() => setActiveTab('base64')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'base64' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Binary className="w-4 h-4 shrink-0" />
          Base64 ↔ URL Конвертер
        </button>

        <button
          onClick={() => setActiveTab('timestamp')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'timestamp' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          Timestamp Конвертер
        </button>

        <button
          onClick={() => setActiveTab('markdown')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium font-sans text-left transition-all ${
            activeTab === 'markdown' 
              ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/25' 
              : 'text-text-secondary hover:text-text-primary hover:bg-hover-bg/50 border border-transparent'
          }`}
        >
          <Eye className="w-4 h-4 shrink-0" />
          Markdown Живий Рендер
        </button>
      </Card>

      {/* Main Tools Workspace */}
      <div className="lg:col-span-3 space-y-6">

        {/* 1. JSON Tab */}
        {activeTab === 'json' && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">JSON Formatter & Validator</h2>
              <p className="text-xs text-text-secondary">Форматуйте, валідуйте, стискайте об'єкти JSON із миттєвим пошуком помилок.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Вхідний JSON текст</Label>
                <Textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Вставте JSON сюди..."
                  className="font-mono text-xs h-[300px]"
                />
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleFormatJson(false)}>
                    Форматувати (Beautify)
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleFormatJson(true)}>
                    Мініфікувати (Minify)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Результат</Label>
                <div className="relative">
                  <Textarea 
                    value={jsonOutput}
                    readOnly
                    placeholder="Ваш відформатований результат..."
                    className="font-mono text-xs h-[300px] bg-hover-bg/20"
                  />
                  {jsonOutput && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 !p-1.5"
                      onClick={() => copyToClipboard(jsonOutput, 'Код JSON скопійовано!')}
                      title="Скопіювати в буфер"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {jsonError && (
              <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-xs font-mono text-status-error">
                <strong>Помилка валідації:</strong> {jsonError}
              </div>
            )}
          </Card>
        )}

        {/* 2. REGEX Tab */}
        {activeTab === 'regex' && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">Regex Live Tester</h2>
              <p className="text-xs text-text-secondary">Тестуйте регулярні вирази JavaScript на льоту.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Регулярний Вираз (Pattern)</Label>
                <div className="flex gap-2">
                  <span className="text-text-tertiary self-center font-mono text-sm">/</span>
                  <Input 
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="Введіть шаблон, наприклад \d+"
                    className="font-mono text-xs"
                  />
                  <span className="text-text-tertiary self-center font-mono text-sm">/</span>
                  <input 
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="flags"
                    className="w-16 bg-hover-bg/50 border border-border-accent rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono text-center focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Текст для Перевірки</Label>
                <Textarea 
                  value={regexText}
                  onChange={(e) => setRegexText(e.target.value)}
                  placeholder="Введіть тестовий текст сюди..."
                  className="font-mono text-xs h-[160px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Збіги ({regexMatches.length})</Label>
                <div className="p-3 bg-hover-bg/30 border border-border-accent rounded-lg h-[160px] overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5">
                  {regexMatches.length === 0 ? (
                    <span className="text-text-tertiary">Збігів не знайдено</span>
                  ) : (
                    regexMatches.map((m, i) => (
                      <div key={i} className="px-2 py-1 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple rounded-md inline-block mr-1.5 mb-1.5">
                        {m}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {regexError && (
              <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-xs font-mono text-status-error">
                <strong>Помилка синтаксису регулярного виразу:</strong> {regexError}
              </div>
            )}
          </Card>
        )}

        {/* 3. Color Palette Tab */}
        {activeTab === 'colors' && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">Interactive Color Palette Generator</h2>
              <p className="text-xs text-text-secondary">Створюйте та експортуйте гармонійні колірні схеми для своїх інтерфейсів.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Базовий Колір</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border border-border-accent/50 cursor-pointer overflow-hidden p-0"
                  />
                  <Input 
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="font-mono text-xs uppercase"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <Label>Тип Гармонії</Label>
                <Select 
                  value={paletteType}
                  onChange={(e) => setPaletteType(e.target.value as any)}
                  className="text-xs font-sans"
                >
                  <option value="analogous" className="bg-panel-bg">Аналогові кольори (Analogous)</option>
                  <option value="complementary" className="bg-panel-bg">Комплиментарний контраст (Complementary)</option>
                  <option value="triadic" className="bg-panel-bg">Тріадична гармонія (Triadic)</option>
                  <option value="monochromatic" className="bg-panel-bg">Монохромна гама (Monochromatic)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
              {generatedColors.map((color, idx) => (
                <div 
                  key={idx} 
                  className="group rounded-xl overflow-hidden border border-border-accent bg-panel-bg/40 flex flex-col transition-transform hover:-translate-y-1"
                >
                  {/* Visual preview */}
                  <div 
                    className="h-20 w-full relative transition-all group-hover:scale-105" 
                    style={{ backgroundColor: color.hex }}
                  />
                  {/* Hex specs */}
                  <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-text-tertiary">
                        {color.name}
                      </span>
                      <div className="text-xs font-mono font-semibold text-text-primary mt-0.5">
                        {color.hex}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full !py-1 mt-2 text-[10px] font-mono flex items-center justify-center gap-1 opacity-80 hover:opacity-100"
                      onClick={() => copyToClipboard(color.hex, `${color.hex} скопійовано!`)}
                    >
                      <Copy className="w-3 h-3" /> HEX
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 4. Base64/URL Tab */}
        {activeTab === 'base64' && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">Base64 / URL Encoder & Decoder</h2>
              <p className="text-xs text-text-secondary">Безпечне та швидке перетворення рядків.</p>
            </div>

            <div className="flex gap-4">
              <div className="space-y-1.5 flex-1">
                <Label>Алгоритм</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={codecType === 'base64' ? 'primary' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setCodecType('base64')}
                  >
                    Base64
                  </Button>
                  <Button 
                    variant={codecType === 'url' ? 'primary' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setCodecType('url')}
                  >
                    URL-Encode
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <Label>Режим роботи</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={codecMode === 'encode' ? 'primary' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setCodecMode('encode')}
                  >
                    Кодувати (Encode)
                  </Button>
                  <Button 
                    variant={codecMode === 'decode' ? 'primary' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setCodecMode('decode')}
                  >
                    Декодувати (Decode)
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Вхідний текст</Label>
                <Textarea 
                  value={codecInput}
                  onChange={(e) => setCodecInput(e.target.value)}
                  placeholder="Введіть текст..."
                  className="font-mono text-xs h-[180px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Результат</Label>
                <div className="relative">
                  <Textarea 
                    value={codecOutput}
                    readOnly
                    placeholder="Перетворений результат..."
                    className="font-mono text-xs h-[180px] bg-hover-bg/20"
                  />
                  {codecOutput && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 !p-1.5"
                      onClick={() => copyToClipboard(codecOutput, 'Результат конвертації скопійовано!')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 5. Timestamp Tab */}
        {activeTab === 'timestamp' && (
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">Epoch Timestamp Converter</h2>
              <p className="text-xs text-text-secondary">Конвертуйте Unix Epoch Timestamps в читабельну локальну дату та навпаки.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Timestamp -> Date */}
              <div className="space-y-3 p-4 bg-hover-bg/20 border border-border-accent/40 rounded-xl">
                <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase">Epoch to Human</h3>
                <div className="space-y-2">
                  <Label>Unix Timestamp (секунди або мс)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={unixTimestamp}
                      onChange={(e) => setUnixTimestamp(e.target.value)}
                      placeholder="Наприклад, 1784432921"
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setUnixTimestamp(Math.floor(Date.now() / 1000).toString())}
                    >
                      Зараз
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 bg-hover-bg/40 p-3 rounded-lg border border-border-accent/20 min-h-[60px] flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-text-tertiary">Локальний Час:</span>
                  <span className="text-xs font-mono font-semibold text-accent-purple truncate">
                    {readableDate}
                  </span>
                </div>
              </div>

              {/* Date -> Timestamp */}
              <div className="space-y-3 p-4 bg-hover-bg/20 border border-border-accent/40 rounded-xl">
                <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase">Human to Epoch</h3>
                <div className="space-y-2">
                  <Label>ISO Дата та Час</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      value={reverseDateInput}
                      onChange={(e) => setReverseDateInput(e.target.value)}
                      placeholder="2026-07-19T11:09:15"
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setReverseDateInput(new Date().toISOString())}
                    >
                      Зараз
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 bg-hover-bg/40 p-3 rounded-lg border border-border-accent/20 min-h-[60px] flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-text-tertiary">Unix Epoch (Seconds):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-accent-purple">
                      {reverseUnixOutput}
                    </span>
                    {reverseUnixOutput && !reverseUnixOutput.includes('Помилка') && (
                      <button 
                        onClick={() => copyToClipboard(reverseUnixOutput)}
                        className="text-text-tertiary hover:text-text-primary p-0.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </Card>
        )}

        {/* 6. Markdown Tab */}
        {activeTab === 'markdown' && (
          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-text-primary tracking-tight">Real-Time Markdown Preview</h2>
                <p className="text-xs text-text-secondary">Пишіть розмітку Markdown зліва та дивіться відрендерену сторінку справа.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(markdownInput)}>
                Скопіювати Markdown
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Редактор</Label>
                <Textarea 
                  value={markdownInput}
                  onChange={(e) => setMarkdownInput(e.target.value)}
                  placeholder="Пишіть Markdown сюди..."
                  className="font-mono text-xs h-[320px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Попередній перегляд (Live Preview)</Label>
                <div className="p-4 bg-hover-bg/10 border border-border-accent/40 rounded-lg h-[320px] overflow-y-auto custom-scrollbar markdown-body">
                  {parseMarkdown(markdownInput)}
                </div>
              </div>
            </div>
          </Card>
        )}

      </div>

    </div>
  );
};
