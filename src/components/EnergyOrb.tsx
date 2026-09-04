import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';

interface EnergyOrbProps {
  state: AssistantState;
  audioLevel: number; // 0 to 1
  onClick?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

interface OrbitalRing {
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  phase: number;
  color: string;
  width: number;
  eccentricity: number;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({
  state,
  audioLevel,
  onClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // State refs to avoid restart on re-renders
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);
  const smoothAudioRef = useRef(0);
  
  stateRef.current = state;
  audioLevelRef.current = audioLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 500;
    let height = 500;
    
    // Set actual canvas resolution with devicePixelRatio for ultra-crisp display
    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(rect?.width || 500, rect?.height || 500);
      width = size;
      height = size;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    // Initialize 8 3D magnetic flux orbital rings
    const rings: OrbitalRing[] = [
      { radiusX: 130, radiusY: 55, rotation: 0.2, rotationSpeed: 0.009, tilt: 0.4, phase: 0, color: 'rgba(56, 189, 248, 0.7)', width: 1.8, eccentricity: 0.8 },
      { radiusX: 155, radiusY: 65, rotation: -0.5, rotationSpeed: -0.012, tilt: -0.35, phase: 1.2, color: 'rgba(125, 211, 252, 0.8)', width: 2.0, eccentricity: 0.85 },
      { radiusX: 180, radiusY: 70, rotation: 1.1, rotationSpeed: 0.007, tilt: 0.8, phase: 2.4, color: 'rgba(186, 230, 253, 0.65)', width: 1.5, eccentricity: 0.75 },
      { radiusX: 140, radiusY: 80, rotation: -1.4, rotationSpeed: -0.015, tilt: -0.6, phase: 3.1, color: 'rgba(96, 165, 250, 0.75)', width: 1.8, eccentricity: 0.9 },
      { radiusX: 195, radiusY: 85, rotation: 0.8, rotationSpeed: 0.005, tilt: 0.2, phase: 4.5, color: 'rgba(147, 197, 253, 0.55)', width: 1.2, eccentricity: 0.7 },
      { radiusX: 165, radiusY: 50, rotation: -2.1, rotationSpeed: 0.011, tilt: -0.85, phase: 5.2, color: 'rgba(224, 242, 254, 0.85)', width: 1.6, eccentricity: 0.88 },
      { radiusX: 120, radiusY: 90, rotation: 2.5, rotationSpeed: -0.008, tilt: 0.55, phase: 1.8, color: 'rgba(59, 130, 246, 0.7)', width: 2.2, eccentricity: 0.82 },
      { radiusX: 210, radiusY: 95, rotation: -0.9, rotationSpeed: 0.006, tilt: -0.15, phase: 3.8, color: 'rgba(191, 219, 254, 0.5)', width: 1.1, eccentricity: 0.65 }
    ];

    // Plasma discharge particles
    const particles: Particle[] = [];
    const MAX_PARTICLES = 65;

    let time = 0;

    const render = () => {
      time += 0.02;
      
      // Smooth audio interpolation
      const targetAudio = audioLevelRef.current;
      smoothAudioRef.current += (targetAudio - smoothAudioRef.current) * 0.25;
      const curAudio = smoothAudioRef.current;
      const curState = stateRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Base radius calculation depending on state and audio
      let baseRadius = 78;
      let auraMultiplier = 1;
      let speedMultiplier = 1;
      let sparkChance = 0.15;

      if (curState === 'listening') {
        baseRadius = 82 + curAudio * 45;
        auraMultiplier = 1.3 + curAudio * 1.2;
        speedMultiplier = 1.4 + curAudio * 1.5;
        sparkChance = 0.4 + curAudio * 0.5;
      } else if (curState === 'processing') {
        baseRadius = 74 + Math.sin(time * 6) * 8;
        auraMultiplier = 1.4;
        speedMultiplier = 3.2; // vortex acceleration
        sparkChance = 0.5;
      } else if (curState === 'speaking') {
        const speechPulse = Math.sin(time * 8) * 0.5 + 0.5;
        baseRadius = 80 + (curAudio * 35 || speechPulse * 22);
        auraMultiplier = 1.4 + (curAudio * 0.8 || speechPulse * 0.6);
        speedMultiplier = 1.8;
        sparkChance = 0.45;
      } else if (curState === 'error') {
        baseRadius = 72;
        speedMultiplier = 0.6;
      }

      // 1. OUTER CELESTIAL GLOW / NEBULA AURA
      const auraGradient = ctx.createRadialGradient(
        cx, cy, baseRadius * 0.3,
        cx, cy, baseRadius * 2.8 * auraMultiplier
      );

      if (curState === 'error') {
        auraGradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        auraGradient.addColorStop(0.4, 'rgba(220, 38, 38, 0.2)');
        auraGradient.addColorStop(0.8, 'rgba(153, 27, 27, 0.05)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        const cyanAlpha = curState === 'listening' ? 0.65 : curState === 'speaking' ? 0.7 : 0.4;
        auraGradient.addColorStop(0, `rgba(186, 230, 253, ${cyanAlpha})`);
        auraGradient.addColorStop(0.25, `rgba(56, 189, 248, ${cyanAlpha * 0.75})`);
        auraGradient.addColorStop(0.55, `rgba(14, 165, 233, ${cyanAlpha * 0.35})`);
        auraGradient.addColorStop(0.85, `rgba(3, 105, 161, ${cyanAlpha * 0.12})`);
        auraGradient.addColorStop(1, 'rgba(2, 6, 23, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.8 * auraMultiplier, 0, Math.PI * 2);
      ctx.fill();

      // 2. ORBITAL MAGNETIC FLUX RINGS (Swirling elliptical 3D filaments)
      ctx.save();
      rings.forEach((ring, idx) => {
        ring.rotation += ring.rotationSpeed * speedMultiplier;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.rotation + ring.tilt);

        const currentRx = ring.radiusX * (1 + (curAudio * 0.35 * Math.sin(time + idx)));
        const currentRy = ring.radiusY * (1 + (curAudio * 0.45 * Math.cos(time + idx * 1.3)));

        // Draw multiple passes for glowing bloom effect
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRx, currentRy, ring.phase, 0, Math.PI * 2);
        
        // Outer glow pass
        ctx.lineWidth = ring.width * 2.5;
        ctx.strokeStyle = ring.color.replace(/[\d.]+\)$/, '0.18)');
        ctx.stroke();

        // Inner bright filament pass
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRx, currentRy, ring.phase, 0, Math.PI * 2);
        ctx.lineWidth = ring.width;
        ctx.strokeStyle = ring.color;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.restore();
      });
      ctx.restore();

      // 3. ELECTRIC ARCS & SPARKS
      if (Math.random() < sparkChance && particles.length < MAX_PARTICLES) {
        const angle = Math.random() * Math.PI * 2;
        const dist = baseRadius * (0.8 + Math.random() * 0.4);
        particles.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: Math.cos(angle) * (1.2 + Math.random() * 3.5),
          vy: Math.sin(angle) * (1.2 + Math.random() * 3.5),
          life: 0,
          maxLife: 20 + Math.random() * 25,
          size: 1 + Math.random() * 2.8,
          color: Math.random() > 0.4 ? '#ffffff' : '#7dd3fc',
          alpha: 1,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 4. INNER PLASMA CORE (Dynamic textured noise sphere)
      const coreGradient = ctx.createRadialGradient(
        cx - baseRadius * 0.15,
        cy - baseRadius * 0.15,
        baseRadius * 0.05,
        cx,
        cy,
        baseRadius
      );

      if (curState === 'error') {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.2, '#fca5a5');
        coreGradient.addColorStop(0.6, '#ef4444');
        coreGradient.addColorStop(1, 'rgba(185, 28, 28, 0.85)');
      } else {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.25, '#e0f2fe');
        coreGradient.addColorStop(0.5, '#7dd3fc');
        coreGradient.addColorStop(0.75, '#0284c7');
        coreGradient.addColorStop(1, 'rgba(3, 105, 161, 0.9)');
      }

      ctx.save();
      ctx.shadowColor = curState === 'error' ? '#ef4444' : '#38bdf8';
      ctx.shadowBlur = 35 + curAudio * 40;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. PLASMA SURFACE TEXTURE & FILAMENT WEAVE (Electric noise simulation)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      const numFilaments = 14;
      for (let i = 0; i < numFilaments; i++) {
        const angleOffset = (i / numFilaments) * Math.PI * 2 + time * 0.8 * (i % 2 === 0 ? 1 : -1);
        const radiusFactor = 0.3 + (i / numFilaments) * 0.65;
        const fx = cx + Math.cos(angleOffset) * (baseRadius * radiusFactor);
        const fy = cy + Math.sin(angleOffset) * (baseRadius * radiusFactor);

        const filamentGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, baseRadius * 0.45);
        filamentGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        filamentGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.45)');
        filamentGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = filamentGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, baseRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bright incandescent central core
      const hotSpot = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.42);
      hotSpot.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      hotSpot.addColorStop(0.4, 'rgba(240, 249, 255, 0.7)');
      hotSpot.addColorStop(0.8, 'rgba(125, 211, 252, 0.3)');
      hotSpot.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = hotSpot;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. ELECTRIC SHOCKWAVE PULSES (When listening / speaking)
      if (curState === 'listening' || curState === 'speaking') {
        const waveRadius = baseRadius + (time * 60) % (baseRadius * 1.5);
        const waveAlpha = Math.max(0, 1 - (waveRadius - baseRadius) / (baseRadius * 1.5));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${waveAlpha * 0.5 * (curAudio + 0.3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="energy-orb-container"
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95 ${className}`}
      title={
        state === 'listening'
          ? 'Escuchando... ¡Habla ahora!'
          : state === 'processing'
          ? 'Procesando tu consulta...'
          : state === 'speaking'
          ? 'Hablando... Haz clic para silenciar'
          : 'Haz clic para hablar'
      }
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[440px] max-h-[440px] drop-shadow-[0_0_50px_rgba(56,189,248,0.35)]"
      />
    </div>
  );
};
