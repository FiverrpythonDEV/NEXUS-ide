// Web Audio API Sound Synthesizer for UI Interactions
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(type: 'click' | 'success' | 'toggle' | 'run' | 'tab' | 'error', soundProfile: string = 'cyber', volume: number = 0.3) {
    if (soundProfile === 'off' || volume <= 0) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click' || type === 'tab') {
        const osc = ctx.createOscillator();
        osc.type = soundProfile === 'retro-arcade' ? 'square' : 'sine';
        osc.frequency.setValueAtTime(soundProfile === 'cyber' ? 1200 : 800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

        masterGain.gain.setValueAtTime(volume * 0.15, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'toggle') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);

        masterGain.gain.setValueAtTime(volume * 0.15, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'run' || type === 'success') {
        // Sci-Fi chime up
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);

          noteGain.gain.setValueAtTime(volume * 0.12, now + idx * 0.04);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

          osc.connect(noteGain);
          noteGain.connect(ctx.destination);

          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.12);
        });
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(130, now + 0.08);

        masterGain.gain.setValueAtTime(volume * 0.2, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Ignore audio policy errors
    }
  }
}

export const soundEngine = new SoundEngine();
