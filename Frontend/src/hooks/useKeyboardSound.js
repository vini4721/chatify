import { useRef } from 'react';

function useKeyboardSound() {
  const ctxRef = useRef(null);

  const ensureContext = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playKeySound = () => {
    try {
      const ctx = ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = 950 + Math.random() * 140;
      gain.gain.value = 0.015;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.start(now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.stop(now + 0.03);
    } catch {
      // browsers can block sound until first user gesture
    }
  };

  return { playKeySound };
}

export default useKeyboardSound;
