'use client';

import { useEffect, useRef } from 'react';

/**
 * High-performance cosmic particle & constellation network canvas.
 * Fixed across the full viewport, with glowing nodes, dynamic graph connection
 * lines between nearby particles, and fluid cursor interactivity.
 */
export default function StarField({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let particles = [];
    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    const mouse = { x: -2000, y: -2000, radius: 150 };

    const COLOR_PALETTE = [
      { r: 79, g: 70, b: 229, name: 'indigo' },    // #4f46e5 Indigo
      { r: 124, g: 58, b: 237, name: 'purple' },   // #7c3aed Purple
      { r: 217, g: 119, b: 6, name: 'gold' },      // #d97706 Cosmic Gold
      { r: 2, g: 132, b: 199, name: 'cyan' },      // #0284c7 Cyan
      { r: 100, g: 116, b: 139, name: 'slate' },   // #64748b Slate
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Scale count with screen size: ~85 on desktop, ~45 on mobile
      const targetCount = Math.min(Math.max(Math.round((width * height) / 14000), 40), 95);

      // Re-populate if particle count changed significantly or first load
      if (particles.length === 0 || Math.abs(particles.length - targetCount) > 20) {
        particles = Array.from({ length: targetCount }, () => {
          const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
          const isStarNode = Math.random() > 0.82;
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (isStarNode ? 0.35 : 0.55),
            vy: (Math.random() - 0.5) * (isStarNode ? 0.35 : 0.55) - 0.12, // gentle upward drift
            radius: isStarNode ? Math.random() * 1.5 + 2.8 : Math.random() * 1.2 + 1.4,
            baseAlpha: isStarNode ? 0.65 : Math.random() * 0.35 + 0.35,
            twinkleSpeed: Math.random() * 0.008 + 0.004,
            twinkleOffset: Math.random() * Math.PI * 2,
            color,
            isStarNode,
          };
        });
      }
    }

    function onMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onMouseLeave() {
      mouse.x = -2000;
      mouse.y = -2000;
    }

    function onClick(e) {
      // Gentle burst from click
      const clickX = e.clientX;
      const clickY = e.clientY;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 0) {
          const force = (1 - dist / 180) * 2.2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    }

    function draw(timestamp) {
      ctx.clearRect(0, 0, width, height);

      const maxConnectDist = 110;
      const count = particles.length;

      // 1. Draw constellation network lines between nearby particles
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // 2. Draw particles & mouse interactions
      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Motion physics
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Gentle friction to prevent runaway velocities
          p.vx *= 0.992;
          p.vy *= 0.992;

          // Ensure minimum drift
          if (Math.abs(p.vx) < 0.1) p.vx = (Math.random() - 0.5) * 0.3;
          if (Math.abs(p.vy) < 0.1) p.vy = (Math.random() - 0.5) * 0.3 - 0.1;
        }

        // Alpha twinkle
        const alpha = Math.min(
          Math.max(p.baseAlpha * (0.7 + 0.3 * Math.sin(timestamp * p.twinkleSpeed + p.twinkleOffset)), 0.2),
          0.9
        );

        // Interaction with mouse cursor
        if (mouse.x > 0 && mouse.y > 0) {
          const mdx = mouse.x - p.x;
          const mdy = mouse.y - p.y;
          const mdist = Math.hypot(mdx, mdy);

          if (mdist < mouse.radius) {
            // Draw connection line to cursor
            const lineAlpha = (1 - mdist / mouse.radius) * 0.42;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${lineAlpha})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();

            // Gentle repulsion push
            if (!prefersReducedMotion && mdist < 80 && mdist > 0) {
              const push = (1 - mdist / 80) * 0.4;
              p.vx -= (mdx / mdist) * push;
              p.vy -= (mdy / mdist) * push;
            }
          }
        }

        // Render particle circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Glowing outer aura for larger star nodes
        if (p.isStarNode) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.75})`;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    if (prefersReducedMotion) {
      draw(0);
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`starfield-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
