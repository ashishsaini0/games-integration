import { useRef, useCallback, useEffect } from 'react';

export function useSound(enabled = true) {
  const ctxRef = useRef(null);
  const enabledRef = useRef(enabled);
  useEffect(() => { enabledRef.current = enabled; });

  const getCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []);

  const playSwap = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const dur = 0.08;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now);
    } catch { /* silent fail */ }
  }, [getCtx]);

  const playMatch = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now);
      osc2.frequency.exponentialRampToValueAtTime(1980, now + 0.15);
      gain2.gain.setValueAtTime(0.06, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.2);
    } catch { /* silent fail */ }
  }, [getCtx]);

  const playLevelComplete = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const notes = [523, 659, 784, 1047];
      for (let i = 0; i < notes.length; i++) {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[i];
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      }
    } catch { /* silent fail */ }
  }, [getCtx]);

  const playFail = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch { /* silent fail */ }
  }, [getCtx]);

  const playLightning = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Electric crackle — filtered noise burst
      const dur = 0.25;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.5) * (Math.sin(t * 80) > 0 ? 1 : 0.3);
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noiseSrc.connect(hp).connect(noiseGain).connect(ctx.destination);
      noiseSrc.start(now);

      // Electric zap — rising then falling pitch
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      oscGain.gain.setValueAtTime(0.1, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(oscGain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch { /* silent fail */ }
  }, [getCtx]);

  return { playSwap, playMatch, playLevelComplete, playFail, playLightning };
}
