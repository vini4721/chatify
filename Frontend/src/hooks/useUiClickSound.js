import { useRef } from 'react';

function useUiClickSound() {
  const ctxRef = useRef(null);

  const ensureContext = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playClick = () => {
    try {
      const ctx = ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = 520;
      gain.gain.value = 0.02;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.start(now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.stop(now + 0.05);
    } catch {
      // ignore audio context errors
    }
  };

  return { playClick };
}

export default useUiClickSound;
