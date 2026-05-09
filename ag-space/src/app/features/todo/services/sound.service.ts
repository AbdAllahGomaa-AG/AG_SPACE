import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private lastPlayedTime = 0;
  private readonly COOLDOWN = 600;

  /**
   * Plays a "Premium Achievement" sound
   */
  playSuccess(): void {
    const now = Date.now();
    if (now - this.lastPlayedTime < this.COOLDOWN) return;
    this.lastPlayedTime = now;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      /**
       * Internal helper to play a layered rich note
       */
      const playRichNote = (freq: number, startAt: number, duration: number, volume: number) => {
        const playLayer = (type: OscillatorType, f: number, v: number, detune = 0) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(f, ctx.currentTime + startAt);
          osc.detune.setValueAtTime(detune, ctx.currentTime + startAt);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime + startAt);
          gainNode.gain.linearRampToValueAtTime(v, ctx.currentTime + startAt + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(ctx.currentTime + startAt);
          osc.stop(ctx.currentTime + startAt + duration);
        };

        // Layer 1: Fundamental (Melodic)
        playLayer('triangle', freq, volume * 0.6);
        // Layer 2: Harmonic (Sparkle)
        playLayer('sine', freq * 2, volume * 0.3, 5); 
      };

      // Energetic Achievement Sequence (Ascending Power Chord + Peak)
      const v = 0.25;
      playRichNote(523.25, 0.00, 0.4, v);       // C5
      playRichNote(659.25, 0.08, 0.4, v * 0.9); // E5
      playRichNote(783.99, 0.16, 0.5, v * 0.8); // G5
      playRichNote(1046.5, 0.26, 0.8, v * 0.7); // C6 (Peak High Note)

      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close();
      }, 2000);
    } catch (err) {
      console.warn('Achievement sound failed:', err);
    }
  }
}
