'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const orbs = [
      { x: 0.3, y: 0.3, radius: 0.4, color: '#3B82F6', speed: 0.0003 },
      { x: 0.7, y: 0.5, radius: 0.35, color: '#EC4899', speed: 0.0004 },
      { x: 0.5, y: 0.8, radius: 0.3, color: '#8B5CF6', speed: 0.0005 },
    ];

    const animate = () => {
      time += 1;
      const bg = theme === 'dark' ? '#0F0F13' : '#F5F3EE';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const alpha = theme === 'dark' ? '25' : '12';
      const alphaEnd = theme === 'dark' ? '08' : '04';

      orbs.forEach((orb, i) => {
        const offsetX = Math.sin(time * orb.speed + i * 2) * 100;
        const offsetY = Math.cos(time * orb.speed * 0.7 + i * 2) * 80;

        const gradient = ctx.createRadialGradient(
          orb.x * canvas.width + offsetX,
          orb.y * canvas.height + offsetY,
          0,
          orb.x * canvas.width + offsetX,
          orb.y * canvas.height + offsetY,
          orb.radius * Math.min(canvas.width, canvas.height)
        );

        gradient.addColorStop(0, orb.color + alpha);
        gradient.addColorStop(0.5, orb.color + alphaEnd);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </>
  );
}
