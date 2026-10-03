'use client';

import { useEffect, useRef } from 'react';

/**
 * Gentle drifting starfield canvas for the hero section.
 * Respects prefers-reduced-motion and automatically resizes with its container.
 */
export default function StarField({ density = 0.00016, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars = [];
    let animationFrameId = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;

    function handleResize() {
      const containerRect = canvas.parentElement.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = containerRect.width;
      canvasHeight = containerRect.height;
      canvas.width = canvasWidth * pixelRatio;
      canvas.height = canvasHeight * pixelRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const totalStarCount = Math.round(canvasWidth * canvasHeight * density);
      stars = Array.from({ length: totalStarCount }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.12,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.008 + 0.003,
        driftSpeed: Math.random() * 0.05 + 0.015,
        isGold: Math.random() > 0.82,
      }));
    }

    function renderFrame(timestamp) {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      for (const star of stars) {
        const currentAlpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset));
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = star.isGold
          ? `rgba(185, 138, 28, ${currentAlpha})`
          : `rgba(67, 56, 202, ${currentAlpha * 0.85})`;
        context.fill();

        if (!prefersReducedMotion) {
          star.y -= star.driftSpeed * 0.12;
          if (star.y < -2) {
            star.y = canvasHeight + 2;
            star.x = Math.random() * canvasWidth;
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderFrame);
    }

    handleResize();
    if (prefersReducedMotion) {
      renderFrame(0);
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(renderFrame);
    }

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`starfield-canvas ${className}`} aria-hidden="true" />;
}
