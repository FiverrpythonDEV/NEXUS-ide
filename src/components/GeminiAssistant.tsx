import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTranslation } from '../i18n/translations';
import { useAppContext } from '../context/AppContext';
import { Sparkles, Send, X, Bot, User, HelpCircle, Code, ShieldAlert, RefreshCw, Trash2, Key, ExternalLink } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface GeminiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ isOpen, onClose }) => {
  const { t, lang } = useTranslation();
  const { settings, updateSettings } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Monitor the active file synchronized in localStorage
  useEffect(() => {
    const checkActiveFile = () => {
      const name = localStorage.getItem('nexus_current_active_file_name');
      setActiveFileName(name);
    };

    checkActiveFile();
    // Listen for storage changes in case of cross-tab/cross-component selection
    const interval = setInterval(checkActiveFile, 1500);
    return () => clearInterval(interval);
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_gemini_chat_history');
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: t('assistant.welcome_message') || "Привіт! Я твій інтелектуальний асистент NEXUS. Чим можу допомогти тобі сьогодні? Можеш запитати мене про код, або скористатися швидкими командами аналізу файлу вгорі.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save chat history to localStorage
  const saveChatHistory = (msgs: ChatMessage[]) => {
    localStorage.setItem('nexus_gemini_chat_history', JSON.stringify(msgs));
  };

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText.trim();
    if (!textToSend || isLoading) return;

    if (!customPrompt) {
      setInputText('');
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setIsLoading(true);

    const modelMessageId = `msg-${Date.now()}-model`;
    const emptyModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, emptyModelMessage]);

    try {
      if (settings.aiProvider === 'ollama') {
        const url = settings.ollamaUrl || 'http://localhost:11434';
        const model = settings.ollamaModel || 'llama3';
        const ollamaMessages = updatedMessages
          .filter(m => m.id !== 'welcome')
          .map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.text,
          }));

        const response = await fetch(`${url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: ollamaMessages,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to connect to Ollama: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error('ReadableStream not supported by browser.');
        }

        let fullResponseText = '';
        let done = false;
        let buffer = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunkStr = decoder.decode(value, { stream: !done });
            buffer += chunkStr;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.content) {
                  fullResponseText += parsed.message.content;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === modelMessageId ? { ...msg, text: fullResponseText } : msg
                    )
                  );
                }
              } catch (e) {
                // ignore potential partial JSONs
              }
            }
          }
        }

        if (buffer.trim() !== '') {
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.message?.content) {
              fullResponseText += parsed.message.content;
            }
          } catch (e) {
            // ignore
          }
        }

        const finalMessages = [
          ...updatedMessages,
          {
            id: modelMessageId,
            role: 'model',
            text: fullResponseText,
            timestamp: new Date().toLocaleTimeString(),
          },
        ];
        setMessages(finalMessages);
        saveChatHistory(finalMessages);
        setIsLoading(false);
        return;
      }

      const apiKey = settings.geminiApiKey || localStorage.getItem('nexus_gemini_api_key') || '';
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      // Initialize the official @google/genai SDK
      const ai = new GoogleGenAI({ apiKey });

      // Transform history to official GoogleGenAI contents array
      const contents = updatedMessages
        .filter(m => m.id !== 'welcome') // Skip mock welcome message if any
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      // Call streaming API
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash', // Modern flash model
        contents,
        config: {
          systemInstruction: "You are the NEXUS AI Assistant, integrated directly inside a high-performance web-based cyber IDE. You help developers write, optimize, and debug full-stack web applications. Provide elegant, concise responses. Use high-contrast formatting and markdown styling for terminal-like aesthetics.",
        },
      });

      let fullResponseText = '';
      for await (const chunk of responseStream) {
        const textChunk = chunk.text || '';
        fullResponseText += textChunk;
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, text: fullResponseText } : msg
          )
        );
      }

      // Save complete history after stream ends
      const finalMessages = [
        ...updatedMessages,
        {
          id: modelMessageId,
          role: 'model',
          text: fullResponseText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

    } catch (err: any) {
      let errorMessage = 'Помилка зв\'язку з AI-провайдером.';
      if (err.message === 'API_KEY_MISSING') {
        errorMessage = 'Будь ласка, вкажіть ваш Gemini API Key у Налаштуваннях або в полі нижче.';
      } else if (err.status === 400 || err.status === 403) {
        errorMessage = 'Недійсний API-ключ. Будь ласка, перевірте правильність вводу.';
      } else {
        errorMessage = `Помилка API: ${err.message || err}`;
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === modelMessageId ? { ...msg, text: `❌ ${errorMessage}` } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionType: string) => {
    const name = localStorage.getItem('nexus_current_active_file_name') || 'unknown';
    const content = localStorage.getItem('nexus_current_active_file_content') || '';
    const lastError = localStorage.getItem('nexus_last_console_error') || '';
    const selectedText = localStorage.getItem('nexus_current_editor_selection') || '';

    let prompt = '';
    if (actionType === 'explain_error') {
      if (!lastError) {
        alert(lang === 'uk' ? 'Помилок у ConsoleRunner не знайдено!' : 'No errors found in ConsoleRunner!');
        return;
      }
      prompt = `Будь ласка, детально поясни цю помилку з ConsoleRunner і допоможи її виправити:\n\n\`\`\`\n${lastError}\n\`\`\``;
    } else if (actionType === 'generate_tests') {
      if (!content) {
        alert(lang === 'uk' ? 'Будь ласка, спочатку відкрий файл у редакторі!' : 'Please open a file in the editor first!');
        return;
      }
      prompt = `Згенеруй модульні тести для коду з файлу "${name}":\n\n\`\`\`\n${content}\n\`\`\``;
    } else if (actionType === 'optimize') {
      if (!content) {
        alert(lang === 'uk' ? 'Будь ласка, спочатку відкрий файл у редакторі!' : 'Please open a file in the editor first!');
        return;
      }
      prompt = `Оптимізуй наступний код з файлу "${name}" для кращої продуктивності та швидкості роботи:\n\n\`\`\`\n${content}\n\`\`\``;
    } else if (actionType === 'document') {
      if (!content) {
        alert(lang === 'uk' ? 'Будь ласка, спочатку відкрий файл у редакторі!' : 'Please open a file in the editor first!');
        return;
      }
      prompt = `Додай JSDoc коментарі та детальну документацію до коду у файлі "${name}":\n\n\`\`\`\n${content}\n\`\`\``;
    } else if (actionType === 'refactor') {
      if (!content) {
        alert(lang === 'uk' ? 'Будь ласка, спочатку відкрий файл у редакторі!' : 'Please open a file in the editor first!');
        return;
      }
      prompt = `Проведи рефакторинг коду у файлі "${name}" за стандартами Clean Code:\n\n\`\`\`\n${content}\n\`\`\``;
    } else if (actionType === 'explain_code') {
      const codeToExplain = selectedText || content;
      if (!codeToExplain) {
        alert(lang === 'uk' ? 'Будь ласка, виділи текст або відкрий файл!' : 'Please select text or open a file!');
        return;
      }
      prompt = `Поясни цей код${selectedText ? ' (виділений фрагмент)' : ` з файлу "${name}"`}:\n\n\`\`\`\n${codeToExplain}\n\`\`\``;
    }

    if (prompt) {
      handleSend(prompt);
    }
  };

  const clearHistory = () => {
    if (confirm(t('assistant.confirm_clear_history') || 'Ви впевнені, що бажаєте очистити історію чату?')) {
      const defaultState: ChatMessage[] = [
        {
          id: 'welcome',
          role: 'model',
          text: t('assistant.welcome_message') || "Привіт! Я твій інтелектуальний асистент NEXUS. Чим можу допомогти тобі сьогодні? Можеш запитати мене про код, або скористатися швидкими командами аналізу файлу вгорі.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
      setMessages(defaultState);
      saveChatHistory(defaultState);
    }
  };

  const saveLocalApiKey = (key: string) => {
    updateSettings({ geminiApiKey: key });
    localStorage.setItem('nexus_gemini_api_key', key);
  };

  // Render text with simple Markdown formatter (inline code, blocks, bold, headers, lists)
  const formatText = (text: string) => {
    if (!text) return null;

    // Split text into paragraphs and block quotes/code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Code Block
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : 'code';
        const codeText = match ? match[2] : part.slice(3, -3);

        const copyCode = () => {
          navigator.clipboard.writeText(codeText);
        };

        return (
          <div key={index} className="my-3 border border-white/10 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs">
            <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 border-b border-white/5 select-none text-[10px] text-slate-400">
              <span className="uppercase font-semibold tracking-wide text-accent-purple">{language || 'code'}</span>
              <button
                onClick={copyCode}
                className="hover:text-white transition-all bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-slate-300 break-all whitespace-pre-wrap">{codeText}</pre>
          </div>
        );
      }

      // Inline formatter helper (for bold and inline backticks)
      const formattedLines = part.split('\n').map((line, lIdx) => {
        // Bullet list
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Inline Bold and backticks
        const processedParts = [];
        let tempLine = cleanLine;

        // Process bold and backticks inline
        const regex = /(\*\*.*?\*\*|`.*?`)/g;
        const inlineSplit = tempLine.split(regex);

        const renderedLine = inlineSplit.map((inlinePart, pIdx) => {
          if (inlinePart.startsWith('**') && inlinePart.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-white">{inlinePart.slice(2, -2)}</strong>;
          }
          if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
            return <code key={pIdx} className="bg-white/10 px-1.5 py-0.5 rounded text-accent-purple font-mono text-[11px]">{inlinePart.slice(1, -1)}</code>;
          }
          return inlinePart;
        });

        if (isBullet) {
          return (
            <li key={lIdx} className="ml-4 list-disc pl-1 text-slate-300 py-0.5">
              {renderedLine}
            </li>
          );
        }

        return <p key={lIdx} className="text-slate-300 py-1 leading-relaxed">{renderedLine}</p>;
      });

      return <div key={index}>{formattedLines}</div>;
    });
  };

  const isApiKeyMissing = settings.aiProvider !== 'ollama' && !settings.geminiApiKey && !localStorage.getItem('nexus_gemini_api_key');

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          id="assistant-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <div
        id="assistant-drawer"
        className={`fixed top-0 right-0 h-screen w-full sm:w-112 bg-[#0C0A15] border-l border-accent-purple/20 shadow-2xl z-50 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div id="assistant-header" className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0E0B1B]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-purple/15 rounded-lg border border-accent-purple/30 text-accent-purple">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm tracking-tight text-text-primary">NEXUS AI Assistant</h3>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                {settings.aiProvider === 'ollama' ? `Ollama (${settings.ollamaModel || 'llama3'})` : 'Gemini 2.5 Flash'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="assistant-clear-btn"
              onClick={clearHistory}
              className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="assistant-close-btn"
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Setup Screen / Chat View */}
        {isApiKeyMissing ? (
          <div id="assistant-setup-view" className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-accent-purple/10 border border-accent-purple/30 rounded-full flex items-center justify-center text-accent-purple">
              <Key className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-text-primary">{t('assistant.setup_title') || 'Потрібен Gemini API Key'}</h4>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                {t('assistant.setup_desc') || 'Для роботи розумного асистента необхідно підключити ваш особистий API-ключ Gemini.'}
              </p>
            </div>

            <div className="w-full bg-[#141122] border border-white/5 p-4 rounded-xl space-y-3">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  onChange={(e) => saveLocalApiKey(e.target.value)}
                  className="w-full bg-[#090710] border border-white/10 rounded-lg p-2 text-xs font-mono text-accent-purple focus:border-accent-purple focus:outline-hidden"
                />
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-accent-purple hover:underline"
              >
                <span>{t('settings.get_gemini_key_link') || 'Отримати ключ в Google AI Studio'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[10px] text-slate-500 italic max-w-xs">
              {t('assistant.setup_warning') || '⚠️ Ключ зберігається лише у вашому браузері (localStorage) і ніколи не передається третім сторонам.'}
            </p>
          </div>
        ) : (
          <div id="assistant-chat-view" className="flex-1 flex flex-col overflow-hidden">
            {/* Context Helper Actions on Active Code File */}
            <div id="assistant-quick-actions" className="p-3 bg-[#110E1F] border-b border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider font-bold text-text-secondary select-none">
                <span>⚡ {lang === 'uk' ? 'Швидкі дії' : 'Quick Actions'}</span>
                {activeFileName && (
                  <span className="text-accent-purple normal-case truncate max-w-[200px]">
                    {lang === 'uk' ? 'файл:' : 'file:'} {activeFileName}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => handleQuickAction('explain_error')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">🐛</span>
                  <span className="truncate">{lang === 'uk' ? 'Поясни помилку' : 'Explain error'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('generate_tests')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">✅</span>
                  <span className="truncate">{lang === 'uk' ? 'Згенеруй тести' : 'Generate tests'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('optimize')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">⚡</span>
                  <span className="truncate">{lang === 'uk' ? 'Оптимізуй код' : 'Optimize code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('document')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">📝</span>
                  <span className="truncate">{lang === 'uk' ? 'Документуй код' : 'Document code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('refactor')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">🔄</span>
                  <span className="truncate">{lang === 'uk' ? 'Рефакторинг' : 'Refactoring'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('explain_code')}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-[10px] font-semibold bg-[#1C162E] hover:bg-accent-purple/20 border border-border-accent/15 rounded-lg text-text-primary text-left transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-xs">💡</span>
                  <span className="truncate">{lang === 'uk' ? 'Поясни код' : 'Explain code'}</span>
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div id="assistant-message-thread" className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#090710]/40">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                      isUser
                        ? 'bg-accent-purple/15 text-accent-purple border-accent-purple/30'
                        : 'bg-slate-900 text-slate-400 border-white/5'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-accent-purple" />}
                    </div>

                    {/* Message Bubble */}
                    <div className="flex flex-col">
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isUser
                          ? 'bg-accent-purple/10 border-accent-purple/20 rounded-tr-none'
                          : 'bg-[#120F1D]/80 border-white/5 rounded-tl-none'
                      }`}>
                        {formatText(msg.text)}
                        {/* Loading pulse inside stream */}
                        {msg.role === 'model' && msg.text === '' && (
                          <div className="flex gap-1.5 items-center p-1 py-1.5">
                            <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] font-mono text-slate-500 mt-1 select-none ${isUser ? 'text-right' : ''}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Footer */}
            <div id="assistant-input-form" className="p-3 border-t border-white/5 bg-[#0E0B1B]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  disabled={isLoading}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('assistant.placeholder') || "Запитайте штучний інтелект..."}
                  className="flex-1 bg-[#090710] border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-purple focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
