import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';
import { Mic, Volume2, Loader2 } from 'lucide-react';

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

interface FloatingAmbientParticle {
  angle: number;
  distance: number;
  baseDistance: number;
  speed: number;
  radialSpeed: number;
  size: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  zDepth: number; // -1 (far back) to +1 (front layer)
  colorType: 'cyan' | 'indigo' | 'emerald' | 'white' | 'purple' | 'amber';
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

    let width = 400;
    let height = 400;
    
    // Set actual canvas resolution with devicePixelRatio for ultra-crisp display
    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(rect?.width || 400, rect?.height || 400, 400);
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

    // Scaled orbital rings that stay strictly within 75% of the radius
    const rings: OrbitalRing[] = [
      { radiusX: 100, radiusY: 38, rotation: 0.2, rotationSpeed: 0.009, tilt: 0.4, phase: 0, color: 'rgba(56, 189, 248, 0.75)', width: 1.5, eccentricity: 0.8 },
      { radiusX: 115, radiusY: 44, rotation: -0.5, rotationSpeed: -0.012, tilt: -0.35, phase: 1.2, color: 'rgba(125, 211, 252, 0.8)', width: 1.7, eccentricity: 0.85 },
      { radiusX: 125, radiusY: 48, rotation: 1.1, rotationSpeed: 0.007, tilt: 0.8, phase: 2.4, color: 'rgba(186, 230, 253, 0.65)', width: 1.3, eccentricity: 0.75 },
      { radiusX: 105, radiusY: 52, rotation: -1.4, rotationSpeed: -0.015, tilt: -0.6, phase: 3.1, color: 'rgba(96, 165, 250, 0.75)', width: 1.5, eccentricity: 0.9 },
      { radiusX: 135, radiusY: 56, rotation: 0.8, rotationSpeed: 0.005, tilt: 0.2, phase: 4.5, color: 'rgba(147, 197, 253, 0.55)', width: 1.1, eccentricity: 0.7 },
      { radiusX: 118, radiusY: 34, rotation: -2.1, rotationSpeed: 0.011, tilt: -0.85, phase: 5.2, color: 'rgba(224, 242, 254, 0.85)', width: 1.4, eccentricity: 0.88 },
      { radiusX: 90, radiusY: 60, rotation: 2.5, rotationSpeed: -0.008, tilt: 0.55, phase: 1.8, color: 'rgba(59, 130, 246, 0.7)', width: 1.7, eccentricity: 0.82 },
      { radiusX: 140, radiusY: 62, rotation: -0.9, rotationSpeed: 0.006, tilt: -0.15, phase: 3.8, color: 'rgba(191, 219, 254, 0.5)', width: 1.0, eccentricity: 0.65 }
    ];

    // Smooth ambient floating particles surrounding the orb in 3D orbit
    const ambientParticles: FloatingAmbientParticle[] = [];
    const NUM_AMBIENT_PARTICLES = 48;
    const colorTypes: Array<'cyan' | 'indigo' | 'emerald' | 'white' | 'purple' | 'amber'> = [
      'cyan', 'cyan', 'indigo', 'white', 'purple', 'cyan', 'indigo', 'emerald', 'white', 'amber', 'purple', 'cyan'
    ];

    for (let i = 0; i < NUM_AMBIENT_PARTICLES; i++) {
      const angle = (i / NUM_AMBIENT_PARTICLES) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const baseDist = 72 + Math.random() * 98; // between 72px and 170px from center
      const zDepth = -1 + (i / NUM_AMBIENT_PARTICLES) * 2; // -1 (background) to +1 (foreground)
      ambientParticles.push({
        angle,
        distance: baseDist,
        baseDistance: baseDist,
        speed: (0.003 + Math.random() * 0.007) * (i % 2 === 0 ? 1 : -1),
        radialSpeed: 0.015 + Math.random() * 0.02,
        size: 1.2 + Math.random() * 2.6,
        opacity: 0.35 + Math.random() * 0.55,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        zDepth,
        colorType: colorTypes[i % colorTypes.length],
      });
    }

    // Plasma discharge particles
    const particles: Particle[] = [];
    const MAX_PARTICLES = 45;

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
      const scale = Math.min(width, height) / 380;

      // Base radius calculation
      let baseRadius = 58 * scale;
      let auraMultiplier = 1;
      let speedMultiplier = 1;
      let sparkChance = 0.15;

      if (curState === 'listening') {
        baseRadius = (62 + curAudio * 28) * scale;
        auraMultiplier = 1.2 + curAudio * 0.7;
        speedMultiplier = 1.4 + curAudio * 1.5;
        sparkChance = 0.4 + curAudio * 0.5;
      } else if (curState === 'processing') {
        baseRadius = (56 + Math.sin(time * 6) * 6) * scale;
        auraMultiplier = 1.2;
        speedMultiplier = 3.0;
        sparkChance = 0.5;
      } else if (curState === 'speaking') {
        const speechPulse = Math.sin(time * 8) * 0.5 + 0.5;
        baseRadius = (60 + (curAudio * 22 || speechPulse * 15)) * scale;
        auraMultiplier = 1.2 + (curAudio * 0.4 || speechPulse * 0.35);
        speedMultiplier = 1.8;
        sparkChance = 0.45;
      } else if (curState === 'error') {
        baseRadius = 54 * scale;
        speedMultiplier = 0.6;
      }

      // 1. OUTER CELESTIAL GLOW (Strictly bounded and fades to 0% alpha)
      const maxAuraRadius = Math.min(baseRadius * 2.1 * auraMultiplier, (width / 2) * 0.85);
      const auraGradient = ctx.createRadialGradient(
        cx, cy, baseRadius * 0.25,
        cx, cy, maxAuraRadius
      );

      if (curState === 'error') {
        auraGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        auraGradient.addColorStop(0.35, 'rgba(220, 38, 38, 0.15)');
        auraGradient.addColorStop(0.7, 'rgba(153, 27, 27, 0.03)');
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (curState === 'listening') {
        const greenAlpha = 0.6 + curAudio * 0.4;
        auraGradient.addColorStop(0, `rgba(167, 243, 208, ${greenAlpha})`);
        auraGradient.addColorStop(0.3, `rgba(52, 211, 153, ${greenAlpha * 0.7})`);
        auraGradient.addColorStop(0.65, `rgba(16, 185, 129, ${greenAlpha * 0.3})`);
        auraGradient.addColorStop(0.9, `rgba(5, 150, 105, 0.03)`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        const cyanAlpha = curState === 'speaking' ? 0.55 : 0.32;
        auraGradient.addColorStop(0, `rgba(186, 230, 253, ${cyanAlpha})`);
        auraGradient.addColorStop(0.3, `rgba(56, 189, 248, ${cyanAlpha * 0.6})`);
        auraGradient.addColorStop(0.65, `rgba(14, 165, 233, ${cyanAlpha * 0.2})`);
        auraGradient.addColorStop(0.9, `rgba(3, 105, 161, 0.02)`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, maxAuraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. SMOOTH AMBIENT FLOATING PARTICLES (SURROUNDING ATMOSPHERE WITH AUDIO REACTIVITY)
      ctx.save();

      // Acoustic harmonic soundwaves that pulse outwards with voice audioLevel
      if ((curState === 'speaking' || curState === 'listening') && curAudio > 0.12) {
        const waveCount = 3;
        for (let w = 0; w < waveCount; w++) {
          const wavePhase = (time * 2.2 + (w / waveCount)) % 1;
          const waveRadius = (baseRadius + wavePhase * (115 * scale)) * (1 + curAudio * 0.3);
          const waveAlpha = (1 - wavePhase) * (curAudio * 0.38);

          ctx.beginPath();
          ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
          ctx.lineWidth = (1.5 + (1 - wavePhase) * 2.5) * scale;
          ctx.strokeStyle = curState === 'listening'
            ? `rgba(52, 211, 153, ${waveAlpha})`
            : `rgba(56, 189, 248, ${waveAlpha})`;
          ctx.stroke();
        }
      }

      ambientParticles.forEach((ap, idx) => {
        // Orbit angle update with audio acceleration during speech
        const audioSpeedSurge = curState === 'speaking' ? Math.sign(ap.speed) * (curAudio * 0.016) : 0;
        ap.angle += (ap.speed + audioSpeedSurge) * speedMultiplier;
        
        // Dynamic radial expansion: particles bloom outward with louder speech
        const radialWobble = Math.sin(time * 1.5 + ap.pulsePhase) * 12 * scale;
        const audioDisplacement = curState === 'speaking'
          ? curAudio * (0.35 + (ap.zDepth + 1) * 0.22)
          : curAudio * 0.2;
        const currentDist = (ap.baseDistance + radialWobble) * scale * (1 + audioDisplacement);

        // 3D perspective flattening and depth offset
        const depthPerspective = 0.72 + (ap.zDepth + 1) * 0.14;
        const px = cx + Math.cos(ap.angle) * currentDist;
        const py = cy + Math.sin(ap.angle) * (currentDist * depthPerspective);

        // Dynamic size and glow radiance scaling with audio volume
        const depthScale = 0.8 + (ap.zDepth + 1) * 0.2;
        const audioSizeBoost = curState === 'speaking' ? (1 + curAudio * 0.85) : (1 + curAudio * 0.35);
        const particleSize = ap.size * scale * depthScale * audioSizeBoost;

        // Breathing opacity + Audio luminosity flash on vocal peaks
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.5 + ap.pulsePhase);
        const audioGlowBoost = curState === 'speaking' ? (1 + curAudio * 0.7) : 1.0;
        const particleAlpha = Math.min(1, ap.opacity * (0.6 + 0.4 * pulse) * audioGlowBoost);

        // Dynamic particle coloring according to state & type
        let baseColor = 'rgba(56, 189, 248,'; // cyan default
        let haloColor = 'rgba(14, 165, 233,';

        if (curState === 'listening') {
          baseColor = idx % 2 === 0 ? 'rgba(52, 211, 153,' : 'rgba(110, 231, 183,';
          haloColor = 'rgba(16, 185, 129,';
        } else if (curState === 'processing') {
          baseColor = 'rgba(147, 197, 253,';
          haloColor = 'rgba(99, 102, 241,';
        } else if (curState === 'error') {
          baseColor = 'rgba(248, 113, 113,';
          haloColor = 'rgba(239, 68, 68,';
        } else {
          switch (ap.colorType) {
            case 'indigo':
              baseColor = 'rgba(129, 140, 248,';
              haloColor = 'rgba(99, 102, 241,';
              break;
            case 'purple':
              baseColor = 'rgba(192, 132, 252,';
              haloColor = 'rgba(168, 85, 247,';
              break;
            case 'amber':
              baseColor = 'rgba(251, 191, 36,';
              haloColor = 'rgba(245, 158, 11,';
              break;
            case 'white':
              baseColor = 'rgba(255, 255, 255,';
              haloColor = 'rgba(186, 230, 253,';
              break;
            case 'emerald':
              baseColor = 'rgba(52, 211, 153,';
              haloColor = 'rgba(16, 185, 129,';
              break;
            default:
              baseColor = 'rgba(56, 189, 248,';
              haloColor = 'rgba(14, 165, 233,';
          }
        }

        // Soft outer glow halo - expands exponentially during audio peaks
        const haloRadius = particleSize * (3.5 + (curState === 'speaking' ? curAudio * 3.0 : 0));
        const haloGrad = ctx.createRadialGradient(px, py, 0, px, py, haloRadius);
        haloGrad.addColorStop(0, `${baseColor} ${Math.min(1, particleAlpha * 0.9)})`);
        haloGrad.addColorStop(0.35, `${haloColor} ${Math.min(1, particleAlpha * 0.45)})`);
        haloGrad.addColorStop(1, `${haloColor} 0)`);

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent particle core
        ctx.fillStyle = `${baseColor} ${Math.min(1, particleAlpha * 0.98)})`;
        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 3. ORBITAL MAGNETIC FLUX RINGS
      ctx.save();
      rings.forEach((ring, idx) => {
        ring.rotation += ring.rotationSpeed * speedMultiplier;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.rotation + ring.tilt);

        const currentRx = ring.radiusX * scale * (1 + (curAudio * 0.22 * Math.sin(time + idx)));
        const currentRy = ring.radiusY * scale * (1 + (curAudio * 0.32 * Math.cos(time + idx * 1.3)));

        const activeRingColor = curState === 'listening'
          ? (idx % 2 === 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(110, 231, 183, 0.75)')
          : ring.color;

        // Outer glow pass
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRx, currentRy, ring.phase, 0, Math.PI * 2);
        ctx.lineWidth = ring.width * 2.0 * scale;
        ctx.strokeStyle = activeRingColor.replace(/[\d.]+\)$/, '0.14)');
        ctx.stroke();

        // Inner bright filament pass
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRx, currentRy, ring.phase, 0, Math.PI * 2);
        ctx.lineWidth = ring.width * scale;
        ctx.strokeStyle = activeRingColor;
        ctx.shadowColor = curState === 'listening' ? '#34d399' : '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.stroke();

        ctx.restore();
      });
      ctx.restore();

      // 3. ELECTRIC ARCS & SPARKS
      if (Math.random() < sparkChance && particles.length < MAX_PARTICLES) {
        const angle = Math.random() * Math.PI * 2;
        const dist = baseRadius * (0.8 + Math.random() * 0.35);
        particles.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: Math.cos(angle) * (0.8 + Math.random() * 2.2) * scale,
          vy: Math.sin(angle) * (0.8 + Math.random() * 2.2) * scale,
          life: 0,
          maxLife: 16 + Math.random() * 18,
          size: (1 + Math.random() * 2.0) * scale,
          color: curState === 'listening' ? '#6ee7b7' : Math.random() > 0.4 ? '#ffffff' : '#7dd3fc',
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

      // 4. INNER PLASMA CORE
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
      } else if (curState === 'listening') {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.25, '#d1fae5');
        coreGradient.addColorStop(0.5, '#34d399');
        coreGradient.addColorStop(0.75, '#059669');
        coreGradient.addColorStop(1, 'rgba(4, 120, 87, 0.9)');
      } else {
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.25, '#e0f2fe');
        coreGradient.addColorStop(0.5, '#7dd3fc');
        coreGradient.addColorStop(0.75, '#0284c7');
        coreGradient.addColorStop(1, 'rgba(3, 105, 161, 0.9)');
      }

      ctx.save();
      ctx.shadowColor = curState === 'error' ? '#ef4444' : curState === 'listening' ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = (20 + curAudio * 25) * scale;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. PLASMA SURFACE TEXTURE & FILAMENT WEAVE
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      const numFilaments = 12;
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

      // 6. ELECTRIC SHOCKWAVE PULSES
      if (curState === 'listening' || curState === 'speaking') {
        const waveRadius = baseRadius + (time * 45 * scale) % (baseRadius * 1.25);
        const waveAlpha = Math.max(0, 1 - (waveRadius - baseRadius) / (baseRadius * 1.25));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${waveAlpha * 0.35 * (curAudio + 0.3)})`;
        ctx.lineWidth = 1.6 * scale;
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
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95 bg-transparent ${className}`}
      title={
        state === 'listening'
          ? 'Escuchando... ¡Habla ahora!'
          : state === 'processing'
          ? 'Procesando tu consulta...'
          : state === 'speaking'
          ? 'Hablando... Haz clic para silenciar'
          : 'Toca el micrófono para hablar'
      }
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[400px] max-h-[400px] bg-transparent"
      />

      {/* Central Microphone Icon inside the Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-xs ${
            state === 'listening'
              ? 'bg-emerald-500/90 text-white scale-110 ring-4 ring-emerald-400/50 shadow-emerald-500/50 animate-pulse'
              : state === 'processing'
              ? 'bg-cyan-500/70 text-white ring-4 ring-cyan-300/40 shadow-cyan-400/50'
              : state === 'speaking'
              ? 'bg-indigo-600/80 text-white ring-4 ring-indigo-400/40 shadow-indigo-500/50'
              : 'bg-white/15 text-white ring-2 ring-white/30 hover:bg-white/25 shadow-cyan-500/20'
          }`}
        >
          {state === 'processing' ? (
            <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-spin" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-200 animate-pulse" />
          ) : (
            <Mic
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${
                state === 'listening' ? 'text-white scale-110' : 'text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
};
