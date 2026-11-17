import { RepertoireTrack } from '../types/orchestra';

type PlaybackListener = (state: {
  trackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}) => void;

class OrchestraAudioEngine {
  private audioEl: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private noteTimerId: number | null = null;
  private currentTrack: RepertoireTrack | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private volume = 0.72;
  private noteIndex = 0;
  private listeners = new Set<PlaybackListener>();

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return {
      trackId: this.currentTrack?.id ?? null,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, this.ctx.currentTime, 0.04);
    }
    this.emit();
  }

  async playTrack(track: RepertoireTrack) {
    if (this.currentTrack?.id === track.id) {
      if (this.isPlaying) {
        this.pause();
      } else {
        await this.resume();
      }
      return;
    }

    this.stopInternal();
    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = track.duration_seconds || 180;
    this.noteIndex = 0;

    if (track.audio_url) {
      this.audioEl = new Audio(track.audio_url);
      this.audioEl.volume = this.volume;
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.addEventListener('timeupdate', () => {
        if (this.audioEl) {
          this.currentTime = this.audioEl.currentTime;
          this.duration = this.audioEl.duration || track.duration_seconds;
          this.emit();
        }
      });
      this.audioEl.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.emit();
      });
      try {
        await this.audioEl.play();
        this.isPlaying = true;
        this.emit();
        return;
      } catch {
        // Fallback to synthesized preview if remote file fails
        this.audioEl = null;
      }
    }

    await this.startSynthPlayback(track);
  }

  async resume() {
    if (!this.currentTrack) return;
    if (this.audioEl) {
      await this.audioEl.play();
      this.isPlaying = true;
      this.emit();
      return;
    }
    await this.startSynthPlayback(this.currentTrack);
  }

  pause() {
    this.isPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.clearTimers();
    this.emit();
  }

  seek(seconds: number) {
    if (!this.currentTrack) return;
    const clamped = Math.max(0, Math.min(this.duration, seconds));
    this.currentTime = clamped;
    if (this.audioEl) {
      this.audioEl.currentTime = clamped;
    } else if (this.currentTrack.melody_notes?.length) {
      const beatSec = 60 / (this.currentTrack.tempo_bpm || 76);
      this.noteIndex = Math.floor(clamped / beatSec) % this.currentTrack.melody_notes.length;
    }
    this.emit();
  }

  private async startSynthPlayback(track: RepertoireTrack) {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.35;
      this.masterGain.connect(this.ctx.destination);
    }

    this.isPlaying = true;
    this.emit();

    const notes = track.melody_notes && track.melody_notes.length > 0
      ? track.melody_notes
      : [293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66];

    const beatMs = Math.round((60 / (track.tempo_bpm || 76)) * 1000);

    const triggerChord = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const freq = notes[this.noteIndex % notes.length];
      this.noteIndex += 1;
      const now = this.ctx.currentTime;
      const dur = beatMs / 1000;

      // Warm ensemble voices: Strings lead + Octave lower cello + Fifth brass pad
      this.playVoice(freq, 'triangle', now, dur * 1.15, 0.28);
      this.playVoice(freq * 0.5, 'sine', now, dur * 1.25, 0.22);
      this.playVoice(freq * 1.498, 'sine', now, dur * 1.1, 0.08);
    };

    triggerChord();
    this.noteTimerId = window.setInterval(triggerChord, beatMs);
    this.timerId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.currentTime += 0.25;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0;
        this.pause();
        return;
      }
      this.emit();
    }, 250);
  }

  private playVoice(freq: number, type: OscillatorType, startTime: number, duration: number, peakGain: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1650, startTime);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.08);
    env.gain.exponentialRampToValueAtTime(peakGain * 0.65, startTime + duration * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }

  private clearTimers() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.noteTimerId !== null) {
      window.clearInterval(this.noteTimerId);
      this.noteTimerId = null;
    }
  }

  private stopInternal() {
    this.isPlaying = false;
    this.clearTimers();
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
  }
}

export const audioEngine = new OrchestraAudioEngine();

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
