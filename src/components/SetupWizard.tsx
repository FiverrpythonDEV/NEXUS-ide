import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../i18n/translations';
import { Sparkles, User, Key, Check, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { settings, updateSettings } = useAppContext();
  const { t, lang } = useTranslation();
  const [step, setStep] = useState(1);
  
  // Local states for setup values
  const [userName, setUserName] = useState(settings.userName || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');

  const handleNext = () => {
    if (step === 2 && !userName.trim()) {
      return; // Name is required
    }
    if (step < 4) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    // Save to global settings context
    updateSettings({
      userName: userName.trim(),
      geminiApiKey: geminiApiKey.trim(),
    });
    
    // Set onboarding complete
    localStorage.setItem('nexus_onboarded', 'true');
    
    // Also save directly if needed to prevent race conditions
    localStorage.setItem('nexus_gemini_api_key', geminiApiKey.trim());
    
    onComplete();
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="fixed inset-0 bg-[#07050F] z-[9999] overflow-y-auto flex flex-col justify-center items-center p-4 font-sans text-text-primary selection:bg-accent-purple/30">
      {/* Dynamic Background Mesh Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-purple opacity-[0.08] rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500 opacity-[0.05] rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Main card box container */}
      <div className="w-full max-w-lg bg-[#0C0A15]/80 border border-accent-purple/20 shadow-2xl rounded-2xl relative p-8 backdrop-blur-md z-10 overflow-hidden">
        
        {/* Progress indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
          <div 
            className="h-full bg-linear-to-r from-accent-purple to-indigo-500 transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-center items-center gap-2 mb-8 mt-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'bg-accent-purple ring-4 ring-accent-purple/20 w-6'
                  : s < step
                  ? 'bg-accent-purple/50'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Greeting */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-accent-purple/10 border border-accent-purple/30 rounded-2xl mx-auto flex items-center justify-center text-accent-purple shadow-lg shadow-accent-purple/5">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase font-mono">
                NEXUS
              </h1>
              <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
                {t('wizard.step1.desc')}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-linear-to-r from-accent-purple to-indigo-600 hover:opacity-90 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg shadow-accent-purple/15 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{t('wizard.step1.btn')}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 2: Name Input */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-accent-purple/10 border border-accent-purple/20 rounded-xl mx-auto flex items-center justify-center text-accent-purple">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t('wizard.step2.title')}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {t('wizard.step2.desc')}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">
                {lang === 'uk' ? "Нікнейм" : "Nickname"}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('wizard.step2.placeholder')}
                className="w-full bg-[#110E1F] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent-purple focus:ring-1 focus:ring-accent-purple focus:outline-hidden transition-all placeholder:text-slate-600 font-medium"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-[#110E1F] hover:bg-white/5 border border-white/5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('wizard.btn.back')}</span>
              </button>
              <button
                onClick={handleNext}
                disabled={!userName.trim()}
                className="flex-1 py-3 bg-accent-purple hover:bg-accent-purple/90 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{t('wizard.btn.next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: API Key */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-accent-purple/10 border border-accent-purple/20 rounded-xl mx-auto flex items-center justify-center text-accent-purple">
                <Key className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t('wizard.step3.title')}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {t('wizard.step3.desc')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder={t('wizard.step3.placeholder')}
                  className="w-full bg-[#110E1F] border border-white/10 rounded-xl p-3 text-sm text-accent-purple font-mono focus:border-accent-purple focus:ring-1 focus:ring-accent-purple focus:outline-hidden transition-all placeholder:text-slate-600"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-1.5 text-[10px] font-semibold text-accent-purple hover:underline"
              >
                <span>{t('settings.get_gemini_key_link')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-[#110E1F] hover:bg-white/5 border border-white/5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('wizard.btn.back')}</span>
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-accent-purple hover:bg-accent-purple/90 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{geminiApiKey.trim() ? t('wizard.btn.next') : t('wizard.step3.skip')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Check className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {t('wizard.step4.title')}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
                {t('wizard.step4.desc')}
              </p>
            </div>

            <div className="p-4 bg-[#110E1F] border border-white/5 rounded-xl text-left space-y-2">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-slate-400 font-medium">{lang === 'uk' ? 'Користувач' : 'Username'}</span>
                <span className="text-white font-mono">{userName}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400 font-medium">Gemini AI</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {geminiApiKey.trim() ? 'CONNECTED' : 'LOCAL_ONLY'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="py-3.5 px-5 bg-[#110E1F] hover:bg-white/5 border border-white/5 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3.5 bg-linear-to-r from-accent-purple to-indigo-600 hover:opacity-90 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-lg shadow-accent-purple/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('wizard.step4.btn')}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
