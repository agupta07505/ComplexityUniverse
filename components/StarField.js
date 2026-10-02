'use client';

import { useEffect, useRef } from 'react';

/**
 * Quiet drifting starfield for the home hero — "Universe" without the noise.
 * Honours prefers-reduced-motion and pauses offscreen.
 */
export default function StarField({ density = 0.00016, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(w * h * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.12,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.008 + 0.003,
        drift: Math.random() * 0.05 + 0.015,
        gold: Math.random() > 0.82,
      }));
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const alpha = s.a * (0.6 + 0.4 * Math.sin(t * s.sp + s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(185, 138, 28, ${alpha})`
          : `rgba(67, 56, 202, ${alpha * 0.85})`;
        ctx.fill();
        if (!reduced) {
          s.y -= s.drift * 0.12;
          if (s.y < -2) {
            s.y = h + 2;
            s.x = Math.random() * w;
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    if (reduced) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`cu-starfield ${className}`} aria-hidden="true" />;
}
