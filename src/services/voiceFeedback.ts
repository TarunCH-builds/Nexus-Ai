/**
 * NEXUS AI - Audio Feedback Engine
 * Synthesizes refined on-device acoustic cues using Web Audio API.
 * Recreates the Apple iOS Siri-style crystalline activation chime & acoustic responses.
 * Zero external MP3 asset dependencies; instant, reliable, and privacy-preserving.
 */

class AudioFeedbackEngine {
  private ctx: AudioContext | null = null;
  private initializedListener = false;

  public initGestureUnlock(): void {
    if (this.initializedListener || typeof window === 'undefined') return;
    this.initializedListener = true;
    const unlock = () => {
      this.getContext();
      ['click', 'keydown', 'touchstart'].forEach(evt =>
        window.removeEventListener(evt, unlock)
      );
    };
    ['click', 'keydown', 'touchstart'].forEach(evt =>
      window.addEventListener(evt, unlock, { once: true, passive: true })
    );
  }

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

  /**
   * Iconic Apple iOS Siri-style crystalline two-tone activation chime
   * F#5 (740Hz) into D6 (1174.66Hz) with smooth bell shimmer
   */
  public playWake(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Primary tone 1: F#5 (740 Hz) - bell-like fundamental + subtle harmonic
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(739.99, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Primary tone 2: D6 (1174.66 Hz) - bright crystalline bell tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.11);
      gain2.gain.setValueAtTime(0.001, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.14, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.0005, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.42);

      // Delicate overtone shimmer (2349.32 Hz) for the Apple glassy bell texture
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(2349.32, now + 0.11);
      shimmerGain.gain.setValueAtTime(0.001, now + 0.11);
      shimmerGain.gain.exponentialRampToValueAtTime(0.025, now + 0.13);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(now + 0.11);
      shimmer.stop(now + 0.35);
    } catch (e) {
      console.debug('Audio cue skipped:', e);
    }
  }

  /**
   * Single crisp confirmation tone when speech recognition finishes and AI starts thinking
   */
  public playAcknowledge(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.debug('Audio cue skipped:', e);
    }
  }

  /**
   * Gentle falling tone when session returns to standby or user stops NEXUS
   */
  public playSleep(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.18); // A4
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.debug('Audio cue skipped:', e);
    }
  }

  /**
   * Soft harmonic warning chime on errors or denied permissions
   */
  public playError(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(329.63, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.debug('Audio cue skipped:', e);
    }
  }
}

export const audioFeedback = new AudioFeedbackEngine();

