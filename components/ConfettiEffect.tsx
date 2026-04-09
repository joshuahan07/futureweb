'use client';

import { useState, useEffect } from 'react';

interface ConfettiEffectProps {
  trigger: boolean;
}

export default function ConfettiEffect({ trigger }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; color: string; delay: number }>
  >([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 24 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        color: ['#F4A5B0', '#A8C5A0', '#C9A0B4', '#FBBF24', '#F87171', '#7BA5D4'][
          i % 6
        ],
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 1200);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${p.x}%`,
            top: '50%',
            backgroundColor: p.color,
            animation: `confetti 1s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
