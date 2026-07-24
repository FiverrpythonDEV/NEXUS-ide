import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/translations';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('toggle-shortcuts-modal', handleToggle);
    window.addEventListener('keydown', handleClose);

    return () => {
      window.removeEventListener('toggle-shortcuts-modal', handleToggle);
      window.removeEventListener('keydown', handleClose);
    };
  }, []);

  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: lang === 'uk' ? 'Командна палітра' : 'Command Palette' },
    { keys: ['Ctrl', '`'], desc: lang === 'uk' ? 'Відкрити/Закрити Консоль' : 'Toggle JS Console' },
    { keys: ['Ctrl', 'I'], desc: lang === 'uk' ? 'Відкрити/Закрити AI Асистента' : 'Toggle AI Assistant' },
    { keys: ['?'], desc: lang === 'uk' ? 'Показати це вікно довідки' : 'Show this help modal' },
    { keys: ['Alt', 'Click'], desc: lang === 'uk' ? 'Мульти-курсор у Monaco' : 'Multi-cursor in Monaco' },
    { keys: ['Alt', 'Shift', 'Drag'], desc: lang === 'uk' ? 'Виділення колонкою у Monaco' : 'Column select in Monaco' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0B0A12]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-[#0C0A15] border border-accent-purple/20 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent-purple/10 border border-accent-purple/20 rounded-lg text-accent-purple">
                  <Keyboard className="w-4 h-4" />
                </div>
                <h3 className="font-sans font-bold text-sm tracking-tight text-white">
                  {lang === 'uk' ? 'Гарячі клавіші NEXUS' : 'NEXUS Hotkeys'}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-3.5 py-5">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-300 font-medium">{shortcut.desc}</span>
                  <div className="flex items-center gap-1.5">
                    {shortcut.keys.map((key, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span className="text-slate-600 text-[10px] font-mono">+</span>}
                        <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#141221] border border-white/10 rounded-md text-accent-purple shadow-sm">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Tip */}
            <div className="flex items-start gap-2 p-3 bg-accent-purple/5 border border-accent-purple/10 rounded-xl text-[10px] leading-relaxed text-text-secondary">
              <HelpCircle className="w-4 h-4 text-accent-purple shrink-0 mt-0.5" />
              <span>
                {lang === 'uk' 
                  ? 'Ви можете викликати це довідкове вікно у будь-який час, натиснувши клавішу ? (Shift + /), коли ви не пишете у полях вводу.'
                  : 'You can trigger this help modal anytime by pressing ? (Shift + /) on your keyboard, as long as you are not focused on an input.'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
