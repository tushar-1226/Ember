"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

function FeatureCard({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-transparent">
      <h3 className="font-display text-2xl md:text-4xl text-foreground font-medium mb-2 text-center">{title}</h3>
      <p className="font-mono text-xs text-muted uppercase tracking-widest text-center">{subtitle}</p>
    </div>
  );
}

export function CTATunnel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Background Grid endless dive (Scale 1 to 20)
  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 20]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.9, 1], [0.3, 0.3, 0]);

  // Global background dimming for specific environments (e.g. ENV 6, 7, 8)
  const globalGlowOpacity = useTransform(scrollYProgress, 
    [0, 0.55, 0.6, 0.88, 0.93, 1], 
    [1, 1, 0, 0, 1, 1]
  );

  // INTRO: Explore the depth (0.0 - 0.1)
  // Exponential scaling for a cinematic deep zoom
  const introScale = useTransform(scrollYProgress, [0.0, 0.04, 0.07, 0.1], [1, 3, 20, 200]);
  const introOpacity = useTransform(scrollYProgress, [0.0, 0.02, 0.09, 0.1], [0, 1, 1, 0]);
  // Offset the text so the camera pushes perfectly into the letter "p" in "depths"
  const introX = useTransform(scrollYProgress, [0.0, 0.1], ["0vw", "-50vw"]);
  const introY = useTransform(scrollYProgress, [0.0, 0.1], ["0vh", "15vh"]);

  const textStr = "Explore the depths of Ember.";
  const typeContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };
  const typeChild = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  // FEATURE 1: Local-First (0.1 - 0.2) Scale from Center
  const f1Scale = useTransform(scrollYProgress, [0.1, 0.2], [0, 2]);
  const f1Opacity = useTransform(scrollYProgress, [0.1, 0.12, 0.18, 0.2], [0, 1, 1, 0]);
  const f1BgScale = useTransform(scrollYProgress, [0.1, 0.2], [1, 4]);

  // FEATURE 2: Infinite Context (0.2 - 0.3) Slide from Left
  const f2X = useTransform(scrollYProgress, [0.2, 0.23, 0.27, 0.3], [-1000, 0, 0, 1000]);
  const f2Opacity = useTransform(scrollYProgress, [0.2, 0.22, 0.28, 0.3], [0, 1, 1, 0]);
  // Exponential scaling for a smooth, fast zoom effect
  const f2InfinityScale = useTransform(scrollYProgress, [0.2, 0.24, 0.28, 0.3], [1, 5, 20, 80]);

  // FEATURE 3: Hardware Acceleration (0.3 - 0.4) Zoom & Rotate
  const f3X = useTransform(scrollYProgress, [0.3, 0.4], [500, -500]);
  const f3Y = useTransform(scrollYProgress, [0.3, 0.4], [-500, 500]);
  const f3Rotate = useTransform(scrollYProgress, [0.3, 0.4], [45, -45]);
  const f3Opacity = useTransform(scrollYProgress, [0.3, 0.32, 0.38, 0.4], [0, 1, 1, 0]);
  const f3ChipScale = useTransform(scrollYProgress, [0.3, 0.34], [4, 1]);

  // FEATURE 4: Markdown Export (0.4 - 0.5) Drop from ceiling
  const f4Y = useTransform(scrollYProgress, [0.4, 0.43, 0.47, 0.5], [-800, 0, 0, 800]);
  const f4Opacity = useTransform(scrollYProgress, [0.4, 0.42, 0.48, 0.5], [0, 1, 1, 0]);
  const f4BgScale = useTransform(scrollYProgress, [0.4, 0.46, 0.5], [1, 1, 15]);
  const f4FileY = useTransform(scrollYProgress, [0.41, 0.46], [40, -120]);

  // FEATURE 5: Real-time Synthesis (0.5 - 0.6) Glitch
  const f5Opacity = useTransform(scrollYProgress, 
    [0.5, 0.51, 0.52, 0.53, 0.54, 0.58, 0.6], 
    [0, 1, 0, 1, 1, 1, 0]
  );
  const f5BgOpacity = useTransform(scrollYProgress, [0.5, 0.52, 0.58, 0.6], [0, 1, 1, 0]);
  const f5Scale = useTransform(scrollYProgress, [0.5, 0.6], [0.8, 1.2]);
  const f5WireDraw = useTransform(scrollYProgress, [0.5, 0.55], [0, 1]);

  // FEATURE 6: Custom Personas (0.6 - 0.7) Rise from floor
  const f6Y = useTransform(scrollYProgress, [0.6, 0.63, 0.67, 0.7], [800, 0, 0, -800]);
  const f6Opacity = useTransform(scrollYProgress, [0.6, 0.62, 0.68, 0.7], [0, 1, 1, 0]);
  const f6Scale = useTransform(scrollYProgress, [0.6, 0.65, 0.7], [1, 2, 15]); // Exponential scale zoom

  // FEATURE 7: Vector Search (0.7 - 0.8) 3D Graph
  const f7Opacity = useTransform(scrollYProgress, [0.7, 0.72, 0.78, 0.8], [0, 1, 1, 0]);
  const f7RotateY = useTransform(scrollYProgress, [0.7, 0.8], [90, -90]);
  const f7GridOpacity = useTransform(scrollYProgress, [0.7, 0.72, 0.78, 0.8], [0, 0.15, 0.15, 0]);
  const f7Scale = useTransform(scrollYProgress, [0.7, 0.78], [0.8, 1.8]);
  const f7AxisDraw = useTransform(scrollYProgress, [0.71, 0.74], [0, 1]);
  const f7VectorDraw = useTransform(scrollYProgress, [0.73, 0.76], [0, 1]);

  // FEATURE 8: Deep Reflection (0.8 - 0.9) Glow and massive scale
  const f8Scale = useTransform(scrollYProgress, [0.8, 0.84, 0.88, 0.9], [0.5, 1.5, 1.5, 3]);
  const f8Opacity = useTransform(scrollYProgress, [0.8, 0.82, 0.88, 0.9], [0, 1, 1, 0]);

  // FINALE (0.9 - 1.0)
  const textScale = useTransform(scrollYProgress, [0.9, 0.95, 1], [0.5, 1, 1], { clamp: true });
  const textOpacity = useTransform(scrollYProgress, [0.9, 0.94, 1], [0, 1, 1], { clamp: true });
  const ctaOpacity = useTransform(scrollYProgress, [0.94, 0.98, 1], [0, 1, 1], { clamp: true });
  const ctaY = useTransform(scrollYProgress, [0.94, 0.98, 1], [40, 0, 0], { clamp: true });

  return (
    <section ref={containerRef} className="relative h-[800vh] w-full bg-[#050505]">
      
      {/* Sticky Container holds the view while scrolling through the 800vh section */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden" style={{ perspective: "1000px" }}>
        
        {/* Massive Radial Glow Background */}
        <motion.div 
          className="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-ember-amber/20 blur-[120px]" 
          style={{ opacity: globalGlowOpacity }}
        />

        {/* Outer 3D Grid */}
        <motion.div 
          className="absolute inset-0 origin-center pointer-events-none will-change-transform"
          style={{ 
            scale: gridScale, 
            opacity: gridOpacity,
            backgroundImage: 'linear-gradient(var(--color-ember-amber) 2px, transparent 2px), linear-gradient(90deg, var(--color-ember-amber) 2px, transparent 2px)', 
            backgroundSize: '100px 100px',
            backgroundPosition: 'center center',
            WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 15%, black 60%)'
          }} 
        />

        {/* ================= 8 ENVIRONMENTS ================= */}

        {/* ENV 1: Cobweb */}
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden origin-center will-change-transform" style={{ opacity: f1Opacity, scale: f1BgScale }}>
           {mounted && (
           <svg className="absolute inset-0 w-full h-full opacity-50 text-ember-amber" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor">
              
              {/* Web 1: Top Left */}
              <g transform="translate(100, 150)">
                 {Array.from({ length: 16 }).map((_, i) => (
                   <line key={`r1-${i}`} x1="0" y1="0" x2={450 * Math.cos(i * Math.PI / 8)} y2={450 * Math.sin(i * Math.PI / 8)} strokeWidth={0.4 + Math.abs(Math.sin(i))*0.6} strokeOpacity={0.3 + Math.abs(Math.cos(i))*0.5} />
                 ))}
                 {Array.from({ length: 14 }).map((_, ring) => {
                   const r = 30 + ring * 28;
                   return (
                     <path key={`s1-${ring}`} d={`M ${r} 0 ` + Array.from({ length: 16 }).map((_, i) => {
                       const angle = i * Math.PI / 8;
                       const midAngle = angle - Math.PI / 16;
                       const dip = 3 + Math.abs(Math.sin(i * ring)) * 4;
                       const midR = r - dip;
                       return `Q ${midR * Math.cos(midAngle)} ${midR * Math.sin(midAngle)} ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
                     }).join(" ")} strokeWidth={0.3 + Math.abs(Math.sin(ring))*0.4} strokeOpacity={0.3 + Math.abs(Math.cos(ring))*0.4} />
                   );
                 })}
              </g>
              
              {/* Web 2: Top Right */}
              <g transform="translate(850, 100)">
                 {Array.from({ length: 20 }).map((_, i) => (
                   <line key={`r2-${i}`} x1="0" y1="0" x2={600 * Math.cos(i * Math.PI / 10)} y2={600 * Math.sin(i * Math.PI / 10)} strokeWidth={0.4 + Math.abs(Math.sin(i*2))*0.6} strokeOpacity={0.3 + Math.abs(Math.cos(i*2))*0.5} />
                 ))}
                 {Array.from({ length: 18 }).map((_, ring) => {
                   const r = 25 + ring * 25;
                   return (
                     <path key={`s2-${ring}`} d={`M ${r} 0 ` + Array.from({ length: 20 }).map((_, i) => {
                       const angle = i * Math.PI / 10;
                       const midAngle = angle - Math.PI / 20;
                       const dip = 4 + Math.abs(Math.cos(i * ring)) * 5;
                       const midR = r - dip;
                       return `Q ${midR * Math.cos(midAngle)} ${midR * Math.sin(midAngle)} ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
                     }).join(" ")} strokeWidth={0.3 + Math.abs(Math.sin(ring*2))*0.4} strokeOpacity={0.3 + Math.abs(Math.cos(ring*2))*0.4} />
                   );
                 })}
              </g>
              
              {/* Web 3: Center Right Large */}
              <g transform="translate(1100, 500)">
                 {Array.from({ length: 24 }).map((_, i) => (
                   <line key={`r3-${i}`} x1="0" y1="0" x2={900 * Math.cos(i * Math.PI / 12)} y2={900 * Math.sin(i * Math.PI / 12)} strokeWidth={0.4 + Math.abs(Math.sin(i*3))*0.6} strokeOpacity={0.3 + Math.abs(Math.cos(i*3))*0.5} />
                 ))}
                 {Array.from({ length: 22 }).map((_, ring) => {
                   const r = 40 + ring * 35;
                   return (
                     <path key={`s3-${ring}`} d={`M ${r} 0 ` + Array.from({ length: 24 }).map((_, i) => {
                       const angle = i * Math.PI / 12;
                       const midAngle = angle - Math.PI / 24;
                       const dip = 5 + Math.abs(Math.sin(i + ring)) * 6;
                       const midR = r - dip;
                       return `Q ${midR * Math.cos(midAngle)} ${midR * Math.sin(midAngle)} ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
                     }).join(" ")} strokeWidth={0.3 + Math.abs(Math.sin(ring*3))*0.4} strokeOpacity={0.3 + Math.abs(Math.cos(ring*3))*0.4} />
                   );
                 })}
              </g>

              {/* Web 4: Bottom Left */}
              <g transform="translate(-100, 800)">
                 {Array.from({ length: 22 }).map((_, i) => (
                   <line key={`r4-${i}`} x1="0" y1="0" x2={800 * Math.cos(i * Math.PI / 11)} y2={800 * Math.sin(i * Math.PI / 11)} strokeWidth={0.4 + Math.abs(Math.sin(i*4))*0.6} strokeOpacity={0.3 + Math.abs(Math.cos(i*4))*0.5} />
                 ))}
                 {Array.from({ length: 20 }).map((_, ring) => {
                   const r = 35 + ring * 32;
                   return (
                     <path key={`s4-${ring}`} d={`M ${r} 0 ` + Array.from({ length: 22 }).map((_, i) => {
                       const angle = i * Math.PI / 11;
                       const midAngle = angle - Math.PI / 22;
                       const dip = 4 + Math.abs(Math.cos(i + ring)) * 5;
                       const midR = r - dip;
                       return `Q ${midR * Math.cos(midAngle)} ${midR * Math.sin(midAngle)} ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
                     }).join(" ")} strokeWidth={0.3 + Math.abs(Math.sin(ring*4))*0.4} strokeOpacity={0.3 + Math.abs(Math.cos(ring*4))*0.4} />
                   );
                 })}
              </g>

              {/* Web 5: Bottom Center Small */}
              <g transform="translate(600, 950)">
                 {Array.from({ length: 14 }).map((_, i) => (
                   <line key={`r5-${i}`} x1="0" y1="0" x2={350 * Math.cos(i * Math.PI / 7)} y2={350 * Math.sin(i * Math.PI / 7)} strokeWidth={0.4 + Math.abs(Math.sin(i*5))*0.6} strokeOpacity={0.3 + Math.abs(Math.cos(i*5))*0.5} />
                 ))}
                 {Array.from({ length: 10 }).map((_, ring) => {
                   const r = 20 + ring * 25;
                   return (
                     <path key={`s5-${ring}`} d={`M ${r} 0 ` + Array.from({ length: 14 }).map((_, i) => {
                       const angle = i * Math.PI / 7;
                       const midAngle = angle - Math.PI / 14;
                       const dip = 2 + Math.abs(Math.sin(i * ring * 2)) * 3;
                       const midR = r - dip;
                       return `Q ${midR * Math.cos(midAngle)} ${midR * Math.sin(midAngle)} ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
                     }).join(" ")} strokeWidth={0.3 + Math.abs(Math.sin(ring*5))*0.4} strokeOpacity={0.3 + Math.abs(Math.cos(ring*5))*0.4} />
                   );
                 })}
              </g>
              
              {/* Structural connecting bridges */}
              <path d="M 100 150 Q 450 200 850 100" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M 100 150 Q 300 400 -100 800" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M 850 100 Q 950 350 1100 500" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M 1100 500 Q 800 650 600 950" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M 600 950 Q 200 900 -100 800" strokeWidth="1.5" strokeOpacity="0.6" />
              
              <path d="M 250 250 Q 550 300 750 250" strokeWidth="0.8" strokeOpacity="0.4" />
              <path d="M 150 400 Q 350 600 200 750" strokeWidth="0.8" strokeOpacity="0.4" />
              <path d="M 800 350 Q 750 500 850 650" strokeWidth="0.8" strokeOpacity="0.4" />
              <path d="M 350 750 Q 550 700 700 800" strokeWidth="0.8" strokeOpacity="0.4" />

              {/* Extra dense chaotic threads in the background */}
              {Array.from({ length: 40 }).map((_, i) => {
                 const x1 = Math.abs(Math.sin(i * 11)) * 1200 - 100;
                 const y1 = Math.abs(Math.cos(i * 13)) * 1200 - 100;
                 const x2 = Math.abs(Math.sin(i * 17)) * 1200 - 100;
                 const y2 = Math.abs(Math.cos(i * 19)) * 1200 - 100;
                 const cx = Math.abs(Math.sin(i * 23)) * 1200 - 100;
                 const cy = Math.abs(Math.cos(i * 29)) * 1200 - 100;
                 return (
                   <path 
                     key={`c-${i}`} 
                     d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} 
                     strokeWidth={0.2 + Math.abs(Math.sin(i))*0.4} 
                     strokeOpacity={0.15 + Math.abs(Math.cos(i))*0.3} 
                   />
                 );
              })}
           </svg>
           )}
        </motion.div>

        {/* ENV 2: Portal Window (Infinite Context) */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ opacity: f2Opacity }}>
           <motion.div 
             style={{ scale: f2InfinityScale }} 
             className="w-[40vw] text-ember-amber opacity-30 flex items-center justify-center will-change-transform"
           >
             <svg viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-auto">
               <path d="M 25,25 C 10,10 5,20 5,25 C 5,30 10,40 25,25 C 40,10 60,10 75,25 C 90,40 95,30 95,25 C 95,20 90,10 75,25 C 60,40 40,40 25,25 Z" />
             </svg>
           </motion.div>
        </motion.div>

        {/* ENV 3: Circuitry (Hardware Acceleration) */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" style={{ opacity: f3Opacity }}>
           <motion.div style={{ scale: f3ChipScale }} className="relative w-[200vw] h-[200vh] flex items-center justify-center opacity-40 will-change-transform">
              {mounted && (
              <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full text-ember-amber" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 {/* Center Chip */}
                 <rect x="420" y="420" width="160" height="160" rx="20" fill="#050505" strokeWidth="4" />
                 
                 {/* Added complex circuit board traces */}
                 {Array.from({ length: 24 }).map((_, i) => {
                   const angle = (i * Math.PI) / 12;
                   const startX = 500 + 100 * Math.cos(angle);
                   const startY = 500 + 100 * Math.sin(angle);
                   
                   const midX1 = 500 + (150 + (i%5) * 15) * Math.cos(angle);
                   const midY1 = 500 + (150 + (i%5) * 15) * Math.sin(angle);
                   
                   const angle2 = angle + (i % 2 === 0 ? 0.15 : -0.15);
                   const midX2 = 500 + (300 + (i%3) * 30) * Math.cos(angle2);
                   const midY2 = 500 + (300 + (i%3) * 30) * Math.sin(angle2);
                   
                   const endX = 500 + 700 * Math.cos(angle2);
                   const endY = 500 + 700 * Math.sin(angle2);

                   return (
                     <g key={i}>
                       <path d={`M ${startX} ${startY} L ${midX1} ${midY1} L ${midX2} ${midY2} L ${endX} ${endY}`} strokeOpacity={0.4 + (i%4)*0.15} />
                       {(i % 3 === 0) && <circle cx={midX2} cy={midY2} r="4" fill="currentColor" />}
                       {(i % 5 === 0) && <rect x={endX-5} y={endY-5} width="10" height="10" fill="currentColor" />}
                     </g>
                   );
                 })}

                 {/* Classic 45-degree organized circuit traces */}
                 <path d="M 420 480 L 300 480 L 200 380 L -50 380" />
                 <path d="M 420 500 L 320 500 L 220 400 L -50 400" />
                 <path d="M 420 520 L 340 520 L 240 420 L -50 420" />
                 
                 <path d="M 580 480 L 700 480 L 800 380 L 1050 380" />
                 <path d="M 580 500 L 720 500 L 820 400 L 1050 400" />
                 <path d="M 580 520 L 740 520 L 840 420 L 1050 420" />

                 <path d="M 480 420 L 480 300 L 380 200 L 380 -50" />
                 <path d="M 500 420 L 500 320 L 400 220 L 400 -50" />
                 <path d="M 520 420 L 520 340 L 420 240 L 420 -50" />

                 <path d="M 480 580 L 480 700 L 380 800 L 380 1050" />
                 <path d="M 500 580 L 500 720 L 400 820 L 400 1050" />
                 <path d="M 520 580 L 520 740 L 420 840 L 420 1050" />

                 {/* Corner blocks */}
                 <path d="M 430 420 L 430 350 L 350 270 L 100 270" strokeWidth="1.5" />
                 <path d="M 450 420 L 450 370 L 370 290 L 100 290" strokeWidth="1.5" />

                 <path d="M 570 420 L 570 350 L 650 270 L 900 270" strokeWidth="1.5" />
                 <path d="M 550 420 L 550 370 L 630 290 L 900 290" strokeWidth="1.5" />

                 <path d="M 430 580 L 430 650 L 350 730 L 100 730" strokeWidth="1.5" />
                 <path d="M 450 580 L 450 630 L 370 710 L 100 710" strokeWidth="1.5" />

                 <path d="M 570 580 L 570 650 L 650 730 L 900 730" strokeWidth="1.5" />
                 <path d="M 550 580 L 550 630 L 630 710 L 900 710" strokeWidth="1.5" />

                 {/* Decor dots */}
                 <circle cx="100" cy="270" r="3" fill="currentColor" />
                 <circle cx="100" cy="290" r="3" fill="currentColor" />
                 <circle cx="900" cy="270" r="3" fill="currentColor" />
                 <circle cx="900" cy="290" r="3" fill="currentColor" />
                 <circle cx="100" cy="730" r="3" fill="currentColor" />
                 <circle cx="100" cy="710" r="3" fill="currentColor" />
                 <circle cx="900" cy="730" r="3" fill="currentColor" />
                 <circle cx="900" cy="710" r="3" fill="currentColor" />
                 
                 {/* Micro chip clusters (4 squares) */}
                 <g transform="translate(250, 480)">
                   <rect x="0" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="0" y="12" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="12" width="8" height="8" fill="currentColor" />
                 </g>
                 
                 <g transform="translate(730, 480)">
                   <rect x="0" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="0" y="12" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="12" width="8" height="8" fill="currentColor" />
                 </g>
                 
                 <g transform="translate(480, 250)">
                   <rect x="0" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="0" y="12" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="12" width="8" height="8" fill="currentColor" />
                 </g>

                 <g transform="translate(480, 730)">
                   <rect x="0" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="0" width="8" height="8" fill="currentColor" />
                   <rect x="0" y="12" width="8" height="8" fill="currentColor" />
                   <rect x="12" y="12" width="8" height="8" fill="currentColor" />
                 </g>
              </svg>
             )}
           </motion.div>
        </motion.div>

        {/* ENV 4: Markdown Folder */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center will-change-transform" style={{ opacity: f4Opacity, scale: f4BgScale }}>
           <div className="relative w-[300px] h-[300px] flex flex-col items-center justify-end text-ember-amber opacity-30">
             
             {/* Back of Folder */}
             <div className="absolute bottom-10 w-[240px] h-[160px] bg-current rounded-t-xl opacity-20" />
             {/* Folder Tab */}
             <div className="absolute bottom-[170px] left-[30px] w-[80px] h-[20px] bg-current rounded-t-lg opacity-20" />

             {/* File Sliding Up */}
             <motion.div 
               className="absolute bottom-10 w-[200px] h-[180px] bg-[#111] border-2 border-current rounded-md flex flex-col p-6 gap-4 shadow-xl"
               style={{ y: f4FileY }}
             >
               {/* Markdown File Content representation */}
               <div className="h-2 w-full bg-current opacity-50 rounded-full" />
               <div className="h-2 w-[80%] bg-current opacity-50 rounded-full" />
               <div className="h-2 w-[60%] bg-current opacity-50 rounded-full" />
               <div className="h-2 w-full bg-current opacity-50 rounded-full mt-4" />
               <div className="h-2 w-[40%] bg-current opacity-50 rounded-full" />
             </motion.div>

             {/* Front of Folder */}
             <div className="absolute bottom-10 w-[260px] h-[120px] bg-[#050505] border-t-2 border-current rounded-t-lg shadow-[0_-10px_30px_rgba(5,5,5,0.9)] z-10" />
             
             {/* Glowing effect inside folder */}
             <div className="absolute bottom-10 w-[240px] h-4 bg-current blur-[20px] opacity-40 z-0" />
           </div>
        </motion.div>

        {/* ENV 5: Neural Data Wires */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center will-change-transform" style={{ opacity: f5BgOpacity, scale: f5Scale }}>
           {/* Central Core Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/30 rounded-full blur-[80px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-400/20 rounded-full blur-[40px]" />

           {mounted && (
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none" strokeLinecap="round">
              
              {/* Dazzling Wires generated procedurally */}
              {Array.from({ length: 60 }).map((_, i) => {
                 // Randomize starting positions around the perimeter
                 const angle = (i * Math.PI * 2) / 60 + (Math.sin(i) * 0.5);
                 const startR = 800 + Math.abs(Math.cos(i)) * 400;
                 const startX = 500 + startR * Math.cos(angle);
                 const startY = 500 + startR * Math.sin(angle);
                 
                 // Connect to center with a slight curve
                 const endX = 500 + (30 + Math.abs(Math.sin(i*2))*50) * Math.cos(angle);
                 const endY = 500 + (30 + Math.abs(Math.sin(i*2))*50) * Math.sin(angle);
                 
                 // Control points for a curved path
                 const cp1X = startX - 200 * Math.cos(angle - 0.5);
                 const cp1Y = startY - 200 * Math.sin(angle - 0.5);
                 const cp2X = endX + 100 * Math.cos(angle + 0.5);
                 const cp2Y = endY + 100 * Math.sin(angle + 0.5);

                 // Distribute colors: predominantly blue/cyan, some pink/magenta
                 const color = i % 5 === 0 ? "text-pink-500" : (i % 3 === 0 ? "text-cyan-400" : "text-blue-500");
                 const strokeW = 0.5 + Math.abs(Math.sin(i*13)) * 2;
                 const opacity = 0.3 + Math.abs(Math.cos(i*7)) * 0.7;

                 return (
                   <g key={`wire-${i}`} className={color}>
                     <motion.path 
                       d={`M ${startX} ${startY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${endX} ${endY}`} 
                       stroke="currentColor" 
                       strokeWidth={strokeW} 
                       strokeOpacity={opacity}
                       style={{ pathLength: f5WireDraw }}
                     />
                     <motion.circle 
                       cx={endX} cy={endY} r={strokeW * 1.5} fill="currentColor"
                       style={{ scale: f5WireDraw, opacity: f5WireDraw }} 
                     />
                   </g>
                 );
              })}
           </svg>
           )}
        </motion.div>

        {/* ENV 6: Radial Core Network */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center will-change-transform overflow-hidden" style={{ opacity: f6Opacity, scale: f6Scale }}>
           {/* Deep Blue Background Glow for the Core */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] bg-cyan-400/40 rounded-full blur-[40px]" />

           {mounted && (
               <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none">
                 {/* Central Core Rings */}
                 <circle cx="500" cy="500" r="30" fill="none" stroke="#38bdf8" strokeWidth="4" />
                 <circle cx="500" cy="500" r="45" fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.6" strokeDasharray="10 10" />
                 <circle cx="500" cy="500" r="10" fill="#7dd3fc" />
                 
                 {/* Radial Burst Network */}
                 {Array.from({ length: 250 }).map((_, i) => {
                     const angle = (i * Math.PI * 2) / 250 + Math.sin(i) * 0.1;
                     const innerR = 50 + Math.abs(Math.sin(i * 13)) * 100;
                     const outerR = 300 + Math.abs(Math.cos(i * 7)) * 700;
                     
                     const x1 = 500 + innerR * Math.cos(angle);
                     const y1 = 500 + innerR * Math.sin(angle);
                     const x2 = 500 + outerR * Math.cos(angle);
                     const y2 = 500 + outerR * Math.sin(angle);

                     const isThick = i % 15 === 0;
                     const hasDot = i % 5 === 0;

                     return (
                         <g key={`burst-${i}`}>
                             <line 
                               x1={x1} y1={y1} x2={x2} y2={y2} 
                               stroke={isThick ? "#38bdf8" : "#0284c7"} 
                               strokeWidth={isThick ? 2 : 0.5} 
                               strokeOpacity={isThick ? 0.8 : 0.4} 
                             />
                             {hasDot && (
                               <circle 
                                 cx={x2} cy={y2} 
                                 r={isThick ? 3 : 1.5} 
                                 fill="#7dd3fc" 
                                 opacity="0.8" 
                               />
                             )}
                         </g>
                     );
                 })}
               </svg>
           )}
        </motion.div>

        {/* ENV 7: Vector Space Cartesian Grid */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden will-change-transform" style={{ opacity: f7Opacity, scale: f7Scale }}>
           {/* Graph Paper Grid Background */}
           <motion.div 
             className="absolute inset-0"
             style={{ 
               opacity: f7GridOpacity,
               backgroundImage: `
                 linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
               `,
               backgroundSize: '40px 40px',
               backgroundPosition: 'center center'
             }} 
           />

           <div className="relative w-[1000px] h-[1000px] will-change-transform">
             {mounted && (
               <svg className="absolute inset-0 w-full h-full font-mono text-sm" viewBox="-500 -500 1000 1000" fill="none">
                 <defs>
                   <marker id="arrow-axis" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.5)" />
                   </marker>
                   <marker id="arrow-man" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                   </marker>
                   <marker id="arrow-king" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                   </marker>
                   <marker id="arrow-woman" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                   </marker>
                   <marker id="arrow-queen" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                   </marker>
                 </defs>

                 {/* 3D Axes */}
                 <motion.g stroke="rgba(255,255,255,0.5)" strokeWidth="2" markerEnd="url(#arrow-axis)">
                   {/* Y axis (up) */}
                   <motion.line x1="0" y1="0" x2="0" y2="-350" style={{ pathLength: f7AxisDraw }} />
                   {/* X axis (right) */}
                   <motion.line x1="0" y1="0" x2="400" y2="0" style={{ pathLength: f7AxisDraw }} />
                   {/* Z axis (bottom left) */}
                   <motion.line x1="0" y1="0" x2="-250" y2="250" style={{ pathLength: f7AxisDraw }} />
                 </motion.g>

                 {/* Vectors */}
                 <motion.g strokeWidth="3" style={{ opacity: f7VectorDraw }}>
                   {/* man */}
                   <motion.line x1="0" y1="0" x2="-150" y2="-200" stroke="#3b82f6" markerEnd="url(#arrow-man)" style={{ pathLength: f7VectorDraw }} />
                   {/* king */}
                   <motion.line x1="0" y1="0" x2="80" y2="-150" stroke="#ef4444" markerEnd="url(#arrow-king)" style={{ pathLength: f7VectorDraw }} />
                   {/* woman */}
                   <motion.line x1="0" y1="0" x2="120" y2="-80" stroke="#8b5cf6" markerEnd="url(#arrow-woman)" style={{ pathLength: f7VectorDraw }} />
                   {/* queen */}
                   <motion.line x1="0" y1="0" x2="350" y2="-50" stroke="#10b981" markerEnd="url(#arrow-queen)" style={{ pathLength: f7VectorDraw }} />
                   
                   {/* Dotted relational lines */}
                   <motion.line x1="-120" y1="-190" x2="50" y2="-160" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="5,5" style={{ pathLength: f7VectorDraw }} />
                   <motion.line x1="150" y1="-70" x2="320" y2="-40" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="5,5" style={{ pathLength: f7VectorDraw }} />
                 </motion.g>

                 {/* Labels */}
                 <motion.g style={{ opacity: f7VectorDraw }} fontWeight="bold" fontSize="18">
                   <text x="-160" y="-220" fill="#3b82f6" textAnchor="middle">man = [-0.3, 0.85, 0.45]</text>
                   <text x="100" y="-170" fill="#ef4444" textAnchor="middle">king = [0.2, 0.72, 0.35]</text>
                   <text x="140" y="-100" fill="#8b5cf6" textAnchor="middle">woman = [0.3, 0.48, 0.29]</text>
                   <text x="370" y="-70" fill="#10b981" textAnchor="middle">queen = [0.89, 0.41, 0.2]</text>
                 </motion.g>

               </svg>
             )}
           </div>
        </motion.div>

        {/* ENV 8: Deep Reflection Graph Network */}
        <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center will-change-transform overflow-hidden" style={{ opacity: f8Opacity, scale: f8Scale }}>
           {/* Subtle background glow */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,183,77,0.05)_0%,transparent_100%)]" />

           <div className="relative w-[1000px] h-[1000px] will-change-transform">
             {mounted && (
               <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none">
                 {/* Unified Dense Graph */}
                 {(() => {
                   const nodes = Array.from({ length: 180 }).map((_, i) => {
                     // Create an organic swirling shape using trig functions to distribute points
                     const t = i * 0.15;
                     const radius = 80 + Math.abs(Math.sin(t * 3)) * 350;
                     const angle = t * 2.5 + Math.cos(i * 0.5);
                     
                     // Introduce some pseudo-3D clustering (some points are dense, some spread)
                     const x = 500 + radius * Math.cos(angle) + Math.sin(i * 17) * 70;
                     const y = 500 + radius * Math.sin(angle) * 0.8 + Math.cos(i * 13) * 200; 
                     
                     const isPrimary = i % 5 === 0;
                     const isAccent = i % 12 === 0;
                     
                     let color = "rgba(148, 163, 184, 0.4)"; // Default gray/slate
                     if (isPrimary) color = "#ffb74d"; // Peach/Amber
                     if (isAccent) color = "#818cf8"; // Soft indigo/blue accent
                     
                     const size = isPrimary ? (4 + Math.abs(Math.sin(i))*5) : (1.5 + Math.abs(Math.cos(i))*2);
                     return { x, y, isPrimary, color, size, id: i };
                   });

                   return (
                     <g>
                       {/* Draw lines first so they are under nodes */}
                       {nodes.map((node, i) => (
                         <g key={`lines-${i}`}>
                           {nodes.slice(i + 1).map((targetNode, j) => {
                             const dist = Math.sqrt((node.x - targetNode.x)**2 + (node.y - targetNode.y)**2);
                             // Connect if they are close enough. Primary nodes have a larger connection radius.
                             const threshold = (node.isPrimary || targetNode.isPrimary) ? 140 : 70;
                             
                             if (dist < threshold) {
                               const opacity = Math.max(0, 1 - (dist / threshold)) * (node.isPrimary ? 0.6 : 0.25);
                               const strokeColor = node.isPrimary ? node.color : "rgba(148, 163, 184, 0.8)";
                               return (
                                 <line 
                                   key={`l-${i}-${j}`} 
                                   x1={node.x} y1={node.y} x2={targetNode.x} y2={targetNode.y} 
                                   stroke={strokeColor} 
                                   strokeWidth={node.isPrimary ? 0.6 : 0.2} 
                                   strokeOpacity={opacity} 
                                 />
                               );
                             }
                             return null;
                           })}
                         </g>
                       ))}

                       {/* Draw nodes on top */}
                       {nodes.map((node) => (
                         <circle 
                           key={`n-${node.id}`} 
                           cx={node.x} cy={node.y} r={node.size} 
                           fill={node.color} 
                           className="animate-[pulse_0.6s_ease-in-out_infinite]"
                           style={{ animationDelay: `${(node.id * 0.13) % 0.6}s` }}
                         />
                       ))}
                     </g>
                   );
                 })()}
               </svg>
             )}
           </div>
        </motion.div>


        {/* --- INTRO TEXT --- */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform" 
          style={{ scale: introScale, opacity: introOpacity, x: introX, y: introY }}
        >
           <motion.h2 
             variants={typeContainer}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, margin: "-10%" }}
             className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-ember-amber text-center tracking-tight whitespace-nowrap"
           >
             {textStr.split("").map((char, index) => (
               <motion.span key={index} variants={typeChild} className="inline-block">
                 {char === " " ? "\u00A0" : char}
               </motion.span>
             ))}
           </motion.h2>
        </motion.div>

        {/* --- FEATURES --- */}
        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ scale: f1Scale, opacity: f1Opacity }}>
           <FeatureCard title="Local-First Privacy" subtitle="Your data never leaves" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ x: f2X, opacity: f2Opacity }}>
           <FeatureCard title="Infinite Context" subtitle="Remember everything" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ x: f3X, y: f3Y, rotateZ: f3Rotate, opacity: f3Opacity }}>
           <FeatureCard title="Hardware Acceleration" subtitle="Blazing fast metal" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ y: f4Y, opacity: f4Opacity }}>
           <FeatureCard title="Markdown Export" subtitle="Standardized format" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ scale: f5Scale, opacity: f5Opacity }}>
           <FeatureCard title="Real-time Synthesis" subtitle="Zero latency thought" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ y: f6Y, opacity: f6Opacity }}>
           <FeatureCard title="Custom Personas" subtitle="Shape the AI's mind" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ rotateY: f7RotateY, opacity: f7Opacity }}>
           <FeatureCard title="Vector Search" subtitle="Semantic retrieval" />
        </motion.div>

        <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ scale: f8Scale, opacity: f8Opacity }}>
           <FeatureCard title="Deep Reflection" subtitle="Connect the dots" />
        </motion.div>


        {/* --- GRAND FINALE --- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div 
            className="flex flex-col items-center text-center px-6"
            style={{ scale: textScale, opacity: textOpacity }}
          >
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="h-px w-16 sm:w-24 bg-border-soft/60" />
              <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/50 backdrop-blur-sm px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <span className="grid h-3 w-3 place-items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember-amber shadow-ember-sm" />
                </span>
                The Final Step
              </div>
              <div className="h-px w-16 sm:w-24 bg-border-soft/60" />
            </div>

            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tighter sm:text-7xl lg:text-[6.5rem]">
              Start keeping the <span className="text-ember-amber">fire</span>.
            </h2>
          </motion.div>

          <motion.div 
            className="flex w-full flex-col items-center mt-16 pointer-events-auto"
            style={{ opacity: ctaOpacity, y: ctaY }}
          >
            <Link
              href="/reflect"
              data-cursor="hot"
              className="flex items-center gap-2 rounded-md border border-border-soft bg-[#111] px-8 py-4 text-sm font-medium text-foreground transition-all hover:bg-surface hover:border-ember-amber/50 hover:shadow-[0_0_20px_rgba(255,183,77,0.2)]"
            >
              Begin reflecting
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-ember-amber stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
