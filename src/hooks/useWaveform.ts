import { useRef, useEffect, useCallback } from 'react';

interface WaveformRefs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  modeRef: React.MutableRefObject<string>;
  volumeRef: React.MutableRefObject<number>;
}

export function useWaveform(): WaveformRefs {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<string>('idle');
  const volumeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const ampRef = useRef<number>(20);
  const timeRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Resize canvas buffer only when dimensions change
    if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    // Reset transform then apply DPR scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mode = modeRef.current;
    const vol = volumeRef.current;

    // Target amplitude per mode
    let targetAmp = 20;
    if (mode === 'listening') targetAmp = 20 + vol * 130;
    else if (mode === 'speaking') targetAmp = 20 + vol * 130;
    else if (mode === 'thinking') targetAmp = 30;

    // Smooth lerp
    ampRef.current += (targetAmp - ampRef.current) * 0.08;
    const amp = ampRef.current;

    timeRef.current += 0.02;
    const t = timeRef.current;

    const points = 200;
    const centerY = h / 2;

    const noise = (x: number, seed: number) => {
      const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };

    // Layer 1: teal (outer)
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle =
      mode === 'listening'
        ? 'rgba(78, 205, 196, 0.5)'
        : 'rgba(78, 205, 196, 0.25)';

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * w;
      const freq = 0.02;
      const phase = t;
      const n1 = noise(i, 1) * 0.3;
      const n2 = noise(i * 0.5, 2) * 0.2;

      let y = centerY;
      y += Math.sin(i * freq + phase) * amp * (1 + n1);
      y += Math.sin(i * freq * 2.3 + phase * 1.5) * amp * 0.3 * (1 + n2);

      if (mode === 'thinking') {
        y += Math.sin(i * 0.08 + t * 3) * 8;
      }

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Layer 2: amber (inner)
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle =
      mode === 'speaking'
        ? 'rgba(212, 168, 83, 0.7)'
        : 'rgba(212, 168, 83, 0.35)';

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * w;
      const freq = 0.025;
      const phase = t * 1.2 + 1;
      const n1 = noise(i + 50, 3) * 0.25;
      const n2 = noise(i * 0.4 + 20, 4) * 0.15;

      let y = centerY;
      y += Math.sin(i * freq + phase) * amp * 0.7 * (1 + n1);
      y += Math.sin(i * freq * 1.7 + phase * 1.3) * amp * 0.25 * (1 + n2);

      if (mode === 'thinking') {
        y += Math.cos(i * 0.06 + t * 2.5) * 6;
      }

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Ambient glow
    const glowAlpha =
      mode === 'idle' ? 0.03 : mode === 'thinking' ? 0.06 : 0.1;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, centerY, amp * 2, 0, Math.PI * 2);
    ctx.fillStyle =
      mode === 'listening'
        ? `rgba(78, 205, 196, ${glowAlpha})`
        : mode === 'thinking'
        ? `rgba(138, 123, 181, ${glowAlpha})`
        : `rgba(212, 168, 83, ${glowAlpha})`;
    ctx.fill();
    ctx.restore();

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial size
    const rect = canvas.getBoundingClientRect();
    sizeRef.current = { w: rect.width, h: rect.height };

    // ResizeObserver for responsive canvas
    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
    });
    ro.observe(canvas);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return { canvasRef, modeRef, volumeRef };
}
