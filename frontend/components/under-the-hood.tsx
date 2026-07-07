"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Reveal } from "./reveal";

const FEATURES = [
  {
    id: "local-first",
    title: "Local First",
    body: "Your memory garden lives on your machine. No cloud sync, no tracking, no data mining. What Ember remembers stays entirely with you.",
  },
  {
    id: "open-arch",
    title: "Open Architecture",
    body: "Ember's stack is built for tinkerers. Swap out the LLM backend, write your own Python memory plugins, and shape it exactly how you want.",
  },
  {
    id: "own-data",
    title: "Own Your Data",
    body: "Export your entire history as plain text or JSON at any moment. Clear your memory instantly. You hold the keys.",
  },
  {
    id: "context-recall",
    title: "Contextual Recall",
    body: "Ember connects dots across weeks, naturally bringing up past conversations and ideas when they matter most to your current thought process.",
  },
  {
    id: "md-native",
    title: "Markdown Native",
    body: "Everything is stored and exported in clean, standard Markdown. Your notes are universally readable forever, no proprietary formats.",
  },
  {
    id: "zero-latency",
    title: "Zero Latency",
    body: "No cloud roundtrips mean instantaneous responses. Interacting with your memory feels like a fluid extension of your own thought process.",
  },
  {
    id: "hackable",
    title: "Hackable Core",
    body: "Built with Python and FastAPI. The entire backend is exposed via a clean REST API, ready for your custom clients or automations.",
  },
  {
    id: "time-decay",
    title: "Time Decay Memory",
    body: "Irrelevant details fade over time, while your core principles and long-term goals stay strongly embedded. Memory that breathes.",
  },
];

function Card({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative h-full w-[85vw] max-w-[420px] shrink-0 rounded-2xl overflow-hidden bg-[#111]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tracer Wire Border (Rotating Conic Gradient) */}
      <div 
        className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_70%,#ffb74d_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
      />
      
      {/* Inner Solid Card */}
      <div className="absolute inset-[1px] rounded-[15px] bg-[#050505] z-10 transition-colors duration-300" />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col p-8 sm:p-10">
        
        {/* Animated SVG Icons */}
        <div className="mb-8 h-12 w-12 text-ember-amber relative">
          
          {f.id === "local-first" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.rect 
                x="4" y="4" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"
                animate={{ y: isHovered ? -2 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
              <motion.rect 
                x="4" y="10" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"
              />
              <motion.rect 
                x="4" y="16" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"
                animate={{ y: isHovered ? 2 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
              <circle cx="8" cy="6" r="0.5" fill="currentColor" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" />
              <circle cx="8" cy="18" r="0.5" fill="currentColor" />
            </svg>
          )}

          {f.id === "open-arch" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.path 
                d="M12 7V17M7 12H17" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                initial={{ pathLength: 1, opacity: 0.3 }}
                animate={{ 
                  pathLength: isHovered ? [0, 1] : 1,
                  opacity: isHovered ? 1 : 0.3
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" className="fill-[#050505]" />
              <circle cx="12" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" className="fill-[#050505]" />
              <circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" className="fill-[#050505]" />
              <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" className="fill-[#050505]" />
              <motion.circle 
                cx="12" cy="12" r="3" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                className="fill-[#050505]"
                animate={{ scale: isHovered ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </svg>
          )}

          {f.id === "own-data" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.g
                animate={{ rotate: isHovered ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{ transformOrigin: "16px 8px" }}
              >
                <circle cx="16" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 10.5L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 16L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 14L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </motion.g>
            </svg>
          )}

          {f.id === "context-recall" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.circle cx="7" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" 
                animate={{ scale: isHovered ? 1.2 : 1 }} transition={{ type: "spring" }} />
              <motion.circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" 
                animate={{ scale: isHovered ? 1.2 : 1 }} transition={{ type: "spring", delay: 0.1 }} />
              <motion.path d="M9 15L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 4"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: isHovered ? -20 : 0 }} transition={{ duration: 1, ease: "linear", repeat: isHovered ? Infinity : 0 }} />
            </svg>
          )}

          {f.id === "md-native" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <motion.path d="M7 15V9L10 12L13 9V15M16 11V15M16 15L14.5 13.5M16 15L17.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                animate={{ y: isHovered ? -1 : 0 }} transition={{ type: "spring", stiffness: 400, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }} />
            </svg>
          )}

          {f.id === "zero-latency" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                initial={{ fill: "transparent" }}
                animate={{ fill: isHovered ? "currentColor" : "transparent" }} transition={{ duration: 0.2 }} />
            </svg>
          )}

          {f.id === "hackable" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.path d="M9 7L4 12L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                animate={{ x: isHovered ? -2 : 0 }} transition={{ type: "spring" }} />
              <motion.path d="M15 7L20 12L15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
                animate={{ x: isHovered ? 2 : 0 }} transition={{ type: "spring" }} />
              <motion.path d="M14 5L10 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" 
                animate={{ rotate: isHovered ? 15 : 0 }} transition={{ type: "spring" }} />
            </svg>
          )}

          {f.id === "time-decay" && (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <motion.path d="M6 4H18M6 20H18M7 4V6C7 9 10 11 12 12C14 11 17 9 17 6V4M7 20V18C7 15 10 13 12 12C14 13 17 15 17 18V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <motion.path d="M12 12V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: isHovered ? 10 : 0 }} transition={{ duration: 1, ease: "linear", repeat: isHovered ? Infinity : 0 }} />
            </svg>
          )}

        </div>

        <h3 className="font-display text-xl font-medium text-foreground transition-colors duration-300 group-hover:text-ember-amber">
          {f.title}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {f.body}
        </p>
      </div>
    </div>
  );
}

export function UnderTheHood() {
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      setScrollRange(scrollWidth - viewportWidth);
    }
    
    const handleResize = () => {
      if (scrollRef.current) {
        setScrollRange(scrollRef.current.scrollWidth - window.innerWidth);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        
        {/* Absolute header that stays fixed while scrolling horizontally */}
        <div className="absolute left-6 top-24 z-10 md:left-12 lg:left-24 lg:top-32 pointer-events-none">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber bg-background/50 backdrop-blur-md px-2 py-1 inline-block rounded">
              Under the hood
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl drop-shadow-md">
              Built for <span className="text-ember-amber">privacy</span>, powered by <span className="text-ember-amber">local models</span>.
            </h2>
          </Reveal>
        </div>

        <motion.div 
          ref={scrollRef}
          style={{ x }} 
          className="flex gap-6 pl-6 pt-32 md:pl-12 lg:pl-24 pr-6 md:pr-12 lg:pr-24 items-stretch h-[450px] w-max"
        >
          {FEATURES.map((f, i) => (
            <Card key={f.id} f={f} i={i} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
