"use client";

/**
 * A short two-tone "new order" chime, synthesised with the Web Audio API — no audio file to fetch
 * or license (Constitution I: no stock assets). Browsers block audio until the page has had a user
 * gesture, so this only plays after the admin clicks "Enable sound" once (see NewOrderAlert.tsx).
 */
let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/** Unlocks audio playback; call this directly inside the click handler that enables sound. */
export function unlockChime(): void {
  void getContext()?.resume();
}

function tone(ctx: AudioContext, frequency: number, startAt: number, durationSeconds: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.2, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationSeconds);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds);
}

export function playChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 880, now, 0.18); // A5
  tone(ctx, 1318.5, now + 0.16, 0.22); // E6
}
