/**
 * sound.js - Autarker Web Audio API Synthesizer für mechanische Schlosssounds
 * Keine externen MP3-Assets notwendig, 100% latenzfrei und offline lauffähig.
 */

class LockSoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem('lock_sim_muted') === 'true';
  }

  // Initialisiert AudioContext bei der ersten Nutzerinteraktion
  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('lock_sim_muted', muted ? 'true' : 'false');
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Mechanisches Klickgeräusch beim Drehen eines Zylinders
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    // Kurzer metallischer Klick (Transiente)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.025);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Metallisches Aufspringen des Schlossbügels
  playShackleUnlock() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;

    // 1. Initialer Schlag (Bolzen zieht an)
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(140, t + 0.06);
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // 2. Feder-Nachklang (metallischer Ring)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1840, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(650, t + 0.25);
    gain2.gain.setValueAtTime(0.25, t + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(t + 0.04);
    osc2.stop(t + 0.3);
  }

  // Zuklappen des Bügels
  playShackleLock() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Fehlversuch (Klemmen / dumpfes Feedback)
  playError() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Erfolgssound (Hacker Win Fanfare)
  playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startT = this.audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const noteTime = startT + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }
}

// Global verfügbare Instanz
window.lockSound = new LockSoundEngine();
