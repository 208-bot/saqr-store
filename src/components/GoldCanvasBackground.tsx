import { useEffect, useRef } from 'react';

interface GoldCanvasBackgroundProps {
  className?: string;
}

export default function GoldCanvasBackground({ className = '' }: GoldCanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = window.innerWidth < 640 ? 28 : 54;
    const particles = Array.from({ length: particleCount }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.6 + Math.random() * 1.8,
      speed: 0.00008 + Math.random() * 0.00018,
      phase: index * 0.73,
    }));
    let frame = 0;
    let animationFrame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      frame += 1;
      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.7);
      glow.addColorStop(0, 'rgba(201, 151, 56, 0.12)');
      glow.addColorStop(0.52, 'rgba(50, 35, 13, 0.05)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(198, 151, 63, 0.08)';
      context.lineWidth = 1;
      for (let row = 0; row < 5; row += 1) {
        context.beginPath();
        for (let x = -20; x <= width + 20; x += 28) {
          const y = height * (0.62 + row * 0.08) + Math.sin(x * 0.008 + frame * 0.006 + row) * 13;
          if (x === -20) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }

      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -0.02) particle.y = 1.02;
        const x = particle.x * width + Math.sin(frame * 0.003 + particle.phase) * 12;
        const y = particle.y * height;
        const alpha = 0.18 + (Math.sin(frame * 0.02 + particle.phase) + 1) * 0.12;
        context.fillStyle = `rgba(234, 190, 95, ${alpha})`;
        context.beginPath();
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      if (!reduceMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none fixed inset-0 -z-0 opacity-90 ${className}`} />;
}
