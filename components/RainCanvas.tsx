
import React, { useRef, useEffect, useCallback } from 'react';
import { RainDrop, AudioAnalysis } from '../types';

interface RainCanvasProps {
  analysis: AudioAnalysis;
  bpm: number;
}

const RainCanvas: React.FC<RainCanvasProps> = ({ analysis, bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<RainDrop[]>([]);
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);
  
  // State for smoothing logic (Inertia)
  const smoothedIntensityRef = useRef<number>(0);
  const sustainTimerRef = useRef<number>(0);
  
  // Configuration
  const MAX_DROPS = 4000; // Total pool size
  const SPAWN_BUFFER = 600; // Extra width on left/right to spawn drops
  
  const initDrops = useCallback((width: number, height: number) => {
    const drops: RainDrop[] = [];
    for (let i = 0; i < MAX_DROPS; i++) {
      drops.push({
        x: Math.random() * (width + SPAWN_BUFFER * 2) - SPAWN_BUFFER,
        y: Math.random() * height, 
        z: Math.random() * 1.5 + 0.5, // 0.5 to 2.0 depth
        length: Math.random() * 20 + 10,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 10 + 5,
        active: false, 
      });
    }
    return drops;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (dropsRef.current.length === 0) {
        dropsRef.current = initDrops(canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      timeRef.current += 0.005;
      const time = timeRef.current;
      const { intensity: rawIntensity, bass, treble } = analysis;

      // --- 1. Rain Inertia Logic (Attack / Sustain / Decay) ---
      
      let visualIntensity = smoothedIntensityRef.current;
      const ATTACK_SPEED = 0.08;
      const DECAY_SPEED = 0.003;
      const SUSTAIN_FRAMES = 180;
      
      if (rawIntensity > visualIntensity) {
        visualIntensity += (rawIntensity - visualIntensity) * ATTACK_SPEED;
        sustainTimerRef.current = SUSTAIN_FRAMES;
      } else {
        if (sustainTimerRef.current > 0) {
           sustainTimerRef.current--;
           visualIntensity += (rawIntensity - visualIntensity) * 0.0005; 
        } else {
           visualIntensity += (rawIntensity - visualIntensity) * DECAY_SPEED;
        }
      }
      smoothedIntensityRef.current = visualIntensity;

      // --- 2. Draw Atmospheric Background ---
      
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#02040a'); 
      bgGrad.addColorStop(1, '#0f172a'); 
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'screen';

      const orb1X = canvas.width * 0.5 + Math.sin(time * 0.2) * (canvas.width * 0.1);
      const orb1Y = canvas.height * 0.2 + Math.cos(time * 0.15) * 50;
      const orb1Size = canvas.width * 0.7;
      
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orb1Size);
      const r1 = 15 + bass * 20;
      const g1 = 20 + bass * 25; 
      const b1 = 40 + bass * 50;
      grad1.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.2)`);
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (visualIntensity > 0.01) {
        const orb2X = canvas.width * 0.8 - Math.sin(time * 0.5) * 100;
        const orb2Y = canvas.height * 0.8;
        const orb2Size = canvas.width * 0.6 * (1 + bass * 0.4); 
        
        const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orb2Size);
        grad2.addColorStop(0, `rgba(60, 80, 100, ${0.05 + visualIntensity * 0.15})`);
        grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalCompositeOperation = 'source-over';

      if (rawIntensity > 0.7 && Math.random() > (0.995 - (rawIntensity * 0.005))) {
         ctx.fillStyle = `rgba(210, 220, 255, ${Math.random() * 0.15 * rawIntensity})`;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // --- 3. Rain Engine ---
      
      const targetActiveCount = Math.floor(50 + (MAX_DROPS - 50) * Math.pow(visualIntensity, 0.6));
      
      // Fixed BPM Sync Logic
      let effectiveSpeedFactor = 0.5; // Default slow drift
      if (bpm > 0) {
         effectiveSpeedFactor = bpm / 180; 
      }

      const windAngle = Math.sin(time * 0.2) * (0.2 + visualIntensity * 0.8);
      
      // Minimal jitter for metronomic feel
      const dynamicJitter = 1.0; 

      const speedGlobalMult = dynamicJitter * effectiveSpeedFactor;

      ctx.strokeStyle = '#a0a0a0';
      ctx.lineCap = 'butt'; 

      const drops = dropsRef.current;
      let currentActiveCount = 0;
      
      for (const drop of drops) {
        if (drop.active) currentActiveCount++;
      }
      
      let dropsToSpawn = targetActiveCount - currentActiveCount;
      
      for (let i = 0; i < MAX_DROPS; i++) {
        const drop = drops[i];

        if (drop.active) {
          drop.y += drop.speed * drop.z * speedGlobalMult;
          drop.x += windAngle * drop.speed * 0.2 * drop.z;
          
          if (drop.x > canvas.width + SPAWN_BUFFER) drop.x = -SPAWN_BUFFER;
          if (drop.x < -SPAWN_BUFFER) drop.x = canvas.width + SPAWN_BUFFER;

          if (drop.y > -drop.length) {
            ctx.beginPath();
            
            const drawLength = (drop.length * drop.z * (1 + bass * 0.3)) + (visualIntensity * 40);
            const lineWidth = (1 * drop.z * (0.5 + bass * 0.5));
            const baseAlpha = 0.05 + (visualIntensity * 0.3);
            const drawOpacity = Math.min(0.8, drop.opacity * drop.z + baseAlpha);
            
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = `rgba(170, 185, 200, ${drawOpacity})`;
            
            const slant = windAngle * 10 * drop.z;
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + slant, drop.y + drawLength);
            ctx.stroke();
          }

          if (drop.y > canvas.height) {
            if (currentActiveCount > targetActiveCount) {
               drop.active = false;
               currentActiveCount--;
            } else {
               drop.y = -drop.length - (Math.random() * 50); 
               drop.x = Math.random() * (canvas.width + SPAWN_BUFFER * 2) - SPAWN_BUFFER;
               // Minimal speed variation for consistent BPM feel
               const speedVar = 2;
               drop.speed = (Math.random() * 10 + 5) + (visualIntensity * speedVar);
            }
          }
        } else {
          if (dropsToSpawn > 0) {
            drop.active = true;
            const verticalSpread = 100 + (dropsToSpawn * 2);
            drop.y = -Math.random() * verticalSpread - drop.length; 
            drop.x = Math.random() * (canvas.width + SPAWN_BUFFER * 2) - SPAWN_BUFFER;
            const speedVar = 2;
            drop.speed = (Math.random() * 10 + 5) + (visualIntensity * speedVar);
            
            dropsToSpawn--;
            currentActiveCount++;
          }
        }
      }

      if (visualIntensity > 0.1) {
          const splashes = Math.floor(visualIntensity * 8);
          ctx.fillStyle = `rgba(180, 200, 220, ${0.1 + visualIntensity * 0.15})`;
          for(let k=0; k<splashes; k++) {
             const sx = Math.random() * canvas.width;
             const sy = canvas.height - (Math.random() * 50); 
             const sSize = Math.random() * (1 + bass);
             ctx.beginPath();
             ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
             ctx.fill();
          }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analysis, initDrops, bpm]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out"
    />
  );
};

export default RainCanvas;
