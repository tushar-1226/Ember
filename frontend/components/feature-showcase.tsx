"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Reveal } from "./reveal";

const FEATURES = [
  {
    id: "reflect",
    title: "Reflect",
    description: "Your active conversation interface. Talk to Ember like a friend, explore your thoughts, and let it mirror back the patterns you missed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    id: "flower",
    title: "Flower",
    description: "The background engine. Flower constantly connects to your external tools and integrates new information while you sleep.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-9-9h18M5 5l14 14M19 5L5 19" />
      </svg>
    )
  },
  {
    id: "garden",
    title: "Garden",
    description: "Your structured memory base. Watch as scattered concepts group into clusters, forming a beautiful, searchable map of your mind.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    id: "story",
    title: "Story",
    description: "The overarching narrative. See how your thoughts evolve chronologically across weeks, months, and years on a single timeline.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )
  }
];

import { useMotionValue, useMotionTemplate } from "framer-motion";
import { useRef } from "react";

function ReflectGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hardcoded pixel positions mapping to a 400x300 canvas
  const n1x = useMotionValue(50);
  const n1y = useMotionValue(150);
  
  const n2x = useMotionValue(200);
  const n2y = useMotionValue(150);
  
  const n3x = useMotionValue(350);
  const n3y = useMotionValue(70);
  
  const n4x = useMotionValue(350);
  const n4y = useMotionValue(150);
  
  const n5x = useMotionValue(350);
  const n5y = useMotionValue(230);

  const path1 = useMotionTemplate`M ${n1x} ${n1y} Q 125 150 ${n2x} ${n2y}`;
  const path2 = useMotionTemplate`M ${n2x} ${n2y} Q 275 70 ${n3x} ${n3y}`;
  const path3 = useMotionTemplate`M ${n2x} ${n2y} Q 275 150 ${n4x} ${n4y}`;
  const path4 = useMotionTemplate`M ${n2x} ${n2y} Q 275 230 ${n5x} ${n5y}`;

  // Helper to render nodes using motion values directly
  const DraggableNode = ({ x, y, className, delay, size = "h-4 w-4" }: any) => (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragElastic={0.1}
      dragMomentum={false}
      style={{ x, y }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay }}
      className={`absolute left-0 top-0 cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-1/2 rounded-full ${size} ${className}`}
    />
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center p-8 overflow-hidden">
      <div ref={containerRef} className="relative w-full max-w-[400px] aspect-[4/3]">
        <svg className="absolute inset-0 h-full w-full stroke-border-soft pointer-events-none" fill="none" viewBox="0 0 400 300" preserveAspectRatio="none">
          <motion.path d={path1} strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
          <motion.path d={path2} strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }} />
          <motion.path d={path3} strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut", delay: 1 }} />
          <motion.path d={path4} strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut", delay: 1.5 }} />
        </svg>
        
        {/* Because viewBox="0 0 400 300" scales to the container, using raw pixels for framer-motion x/y 
            only perfectly aligns if the container is EXACTLY 400x300. 
            To ensure perfect alignment across screen sizes without complex math, 
            we fix the container size and let the outer flex center it. */}
        <DraggableNode x={n1x} y={n1y} className="bg-ember-amber shadow-ember-sm" delay={0} size="h-3 w-3" />
        <DraggableNode x={n2x} y={n2y} className="bg-foreground shadow-[0_0_12px_#fff]" delay={0.75} size="h-5 w-5" />
        <DraggableNode x={n3x} y={n3y} className="bg-muted hover:bg-faint transition-colors" delay={1.5} size="h-3 w-3" />
        <DraggableNode x={n4x} y={n4y} className="bg-muted hover:bg-faint transition-colors" delay={2.0} size="h-3 w-3" />
        <DraggableNode x={n5x} y={n5y} className="bg-muted hover:bg-faint transition-colors" delay={2.5} size="h-3 w-3" />
      </div>
    </div>
  );
}

function FlowerGraph() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Central Hub */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute z-10 grid h-12 w-12 place-items-center rounded-full bg-foreground shadow-[0_0_16px_rgba(255,255,255,0.4)]"
      >
        <div className="h-4 w-4 rounded-full bg-ember-amber animate-pulse" />
      </motion.div>
      
      {/* Orbiting nodes */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div 
          key={deg}
          className="absolute origin-center left-1/2 top-1/2 -translate-y-1/2"
          initial={{ rotate: deg, width: 0 }}
          animate={{ width: 100 }}
          transition={{ delay: i * 0.1, duration: 0.8 }}
          style={{ height: '1px', backgroundColor: 'var(--color-border-soft)' }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="absolute -right-2 -top-2 h-4 w-4 rounded-full border border-ember-amber/40 bg-surface/80 backdrop-blur"
          />
        </motion.div>
      ))}
      
      {/* Subtle rotation layer */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="absolute h-[200px] w-[200px] rounded-full border border-dashed border-border-soft/50"
      />
    </div>
  );
}

function GardenGraph() {
  return (
    <div className="relative h-full w-full p-6 flex flex-col justify-end gap-6">
      <div className="flex w-full h-[60%] items-end justify-between px-4">
         {/* Bar chart / memory clusters representation */}
         {[40, 70, 45, 90, 60, 30, 80].map((h, i) => (
           <motion.div 
             key={i}
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: `${h}%`, opacity: 1 }}
             transition={{ delay: i * 0.1, duration: 0.5 }}
             className={`w-[10%] rounded-t-sm ${i === 3 ? 'bg-ember-amber shadow-ember-sm' : 'bg-border-soft hover:bg-border transition-colors'}`}
           />
         ))}
      </div>
      <div className="w-full h-[1px] bg-border-soft relative">
         <motion.div 
           initial={{ width: 0 }} 
           animate={{ width: "100%" }} 
           transition={{ duration: 1 }} 
           className="h-full bg-ember-amber/50 absolute left-0 top-0" 
         />
      </div>
    </div>
  );
}

function StoryGraph() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-8">
      {/* Timeline view */}
      <div className="relative w-full h-[2px] bg-border-soft">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute left-0 top-0 h-full bg-ember-amber"
        />
        
        {/* Timeline Events */}
        {[10, 35, 60, 85].map((pos, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.3 }}
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${pos}%` }}
          >
            <div className={`z-10 h-3 w-3 rounded-full ${i === 2 ? 'bg-ember-amber shadow-ember-sm' : 'bg-foreground border border-border-soft'}`} />
            <div className="w-px h-8 bg-border-soft" style={{ transform: i % 2 === 0 ? 'translateY(16px)' : 'translateY(-16px)' }} />
            <div className={`text-[10px] font-mono text-muted absolute ${i % 2 === 0 ? 'top-10' : 'bottom-10 whitespace-nowrap'}`}>
              Log {i+1}
            </div>
          </motion.div>
        ))}
        
        {/* A connecting sine wave */}
        <svg viewBox="0 0 400 100" className="absolute -top-[50px] left-0 h-[100px] w-full stroke-ember-amber/30" fill="none" preserveAspectRatio="none">
           <motion.path
             d="M 0 50 Q 100 10 200 50 T 400 50"
             strokeWidth="2"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: 1 }}
             transition={{ duration: 2, ease: "linear" }}
           />
        </svg>
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(FEATURES[0].id);

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <Reveal>
        <div className="mb-12 text-center md:text-left">
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-5xl">
            Your <span className="text-ember-amber">companion</span> for every thought
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Explore the four pillars that make Ember intelligent, quiet, and deeply personal.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        {/* Left Column: Interactive Cards */}
        <div className="flex flex-col gap-4">
          {FEATURES.map((feature) => {
            const isActive = activeTab === feature.id;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all duration-300 ${
                  isActive 
                    ? "border-ember-amber/50 bg-surface shadow-[0_0_30px_rgba(255,183,77,0.1)]" 
                    : "border-border-soft bg-surface/40 hover:bg-surface/80 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-md border transition-colors ${
                    isActive ? "border-ember-amber/30 text-ember-amber bg-ember-amber/10" : "border-border-soft text-muted bg-border-soft/50 group-hover:text-foreground"
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className={`font-display text-lg font-medium transition-colors ${isActive ? "text-foreground" : "text-muted group-hover:text-foreground"}`}>
                    {feature.title}
                  </h3>
                </div>
                <p className={`mt-3 text-sm leading-relaxed transition-colors ${isActive ? "text-muted" : "text-faint"}`}>
                  {feature.description}
                </p>
              </button>
            );
          })}

          <div className="mt-4 md:mt-6">
            <Link
              href="/reflect"
              className="inline-block rounded-full bg-ember-amber px-8 py-3 text-sm font-medium text-void transition-transform hover:scale-[1.03]"
            >
              Get Started — It&apos;s free
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Graph Display */}
        <div className="relative flex min-h-[400px] w-full items-center justify-center rounded-3xl border border-border-soft bg-surface/30 p-4 lg:h-[600px] overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] rounded-full bg-ember-amber/20 blur-[100px] pointer-events-none transition-opacity duration-700" />
          
          {/* The Technical Graph Container */}
          <div className="relative z-10 aspect-[4/3] w-full max-w-[550px] overflow-hidden rounded-2xl border border-border-soft bg-surface/80 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border-soft bg-surface px-4 py-3">
              <div className="text-xs font-mono tracking-wider text-muted uppercase">
                {FEATURES.find(f => f.id === activeTab)?.title} Analysis
              </div>
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-border-soft" />
                <div className="h-2 w-2 rounded-full bg-border-soft" />
                <div className="h-2 w-2 rounded-full bg-border-soft" />
              </div>
            </div>
            
            <div className="relative h-[calc(100%-45px)] w-full bg-[#0a0a0a]">
               {/* Grid background */}
               <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(var(--color-border-soft) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-soft) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
               <AnimatePresence mode="wait">
                 {activeTab === 'reflect' && (
                   <motion.div key="reflect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full w-full">
                     <ReflectGraph />
                   </motion.div>
                 )}
                 {activeTab === 'flower' && (
                   <motion.div key="flower" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full w-full">
                     <FlowerGraph />
                   </motion.div>
                 )}
                 {activeTab === 'garden' && (
                   <motion.div key="garden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full w-full">
                     <GardenGraph />
                   </motion.div>
                 )}
                 {activeTab === 'story' && (
                   <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full w-full">
                     <StoryGraph />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
