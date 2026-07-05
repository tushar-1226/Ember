"use client";

import { useScroll, useAnimationFrame, MotionValue } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Reveal } from "./reveal";

const CODE_LINES = [
  "// [0x000] SYSTEM CORE INITIALIZATION",
  "import { CoreEngine, MemoryBank } from '@ember/sys';",
  "import { encrypt, compress, shard } from '@ember/crypto';",
  "import { VectorDb } from '@ember/db';",
  "",
  "class EmberSystem {",
  "  private activeContext: Map<string, any>;",
  "  private memoryBank: MemoryBank;",
  "  private vectorDb: VectorDb;",
  "",
  "  constructor() {",
  "    this.activeContext = new Map();",
  "    this.memoryBank = new MemoryBank({ retention: 'decay' });",
  "    this.vectorDb = new VectorDb({ dim: 1536 });",
  "    this.bootSequence();",
  "  }",
  "",
  "  private async bootSequence() {",
  "    console.log('[SYSTEM] Initializing pathways...');",
  "    await this.memoryBank.connect();",
  "    await this.vectorDb.warmup();",
  "    this.startDecayCycle();",
  "  }",
  "",
  "  private startDecayCycle() {",
  "    setInterval(() => {",
  "      const staleKeys = this.analyzeContextRelevance();",
  "      for (const key of staleKeys) {",
  "        this.degradeMemoryNode(key);",
  "      }",
  "    }, 1000 * 60 * 60);",
  "  }",
  "",
  "  private analyzeContextRelevance(): string[] {",
  "    const threshold = Date.now() - (1000 * 60 * 60 * 24);",
  "    return Array.from(this.activeContext.entries())",
  "      .filter(([_, data]) => data.lastAccessed < threshold)",
  "      .map(([key]) => key);",
  "  }",
  "",
  "  private async degradeMemoryNode(key: string) {",
  "    const data = this.activeContext.get(key);",
  "    if (!data) return;",
  "",
  "    // 1. Encrypt and Compress payload",
  "    const compressed = compress(encrypt(data.payload));",
  "    ",
  "    // 2. Extract semantic embeddings",
  "    const vector = await this.vectorDb.embed(data.summary);",
  "    ",
  "    // 3. Archive to cold storage",
  "    await this.memoryBank.archive({",
  "       key,",
  "       blob: compressed,",
  "       embedding: vector",
  "    });",
  "",
  "    // 4. Purge from active memory",
  "    this.activeContext.delete(key);",
  "    console.warn(`[DECAY] Memory node \${key} archived.`);",
  "  }",
  "}",
];

const GLITCH_CHARS = "!<>-_\\\\/[]{}—=+*^?#_▒▓";

const BG_WORDS = ["EMBER", "CODE", "MEMORY", "SYSTEM", "DATA", "NEURAL"];

function BackgroundGlitchWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const isHovered = useRef(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const lastChangeTime = useRef(Date.now());

  // Cycle words every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % BG_WORDS.length);
      lastChangeTime.current = Date.now();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useAnimationFrame(() => {
    if (!textRef.current) return;
    
    // In this component, targetWord is the CURRENT word that is displayed.
    const currentWord = BG_WORDS[wordIndex];
    const timeSinceChange = Date.now() - lastChangeTime.current;
    
    // Glitch BEFORE transforming to another word.
    // Since the interval is 3000ms, we start glitching at 2400ms.
    const isGlitchingBeforeChange = timeSinceChange > 2400;
    
    let displayText = "";
    
    if (isHovered.current || isGlitchingBeforeChange) {
      // Apply the code decompile glitch effect
      for (let i = 0; i < currentWord.length; i++) {
        if (Math.random() > 0.3) {
          displayText += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        } else {
          displayText += currentWord[i];
        }
      }
      textRef.current.style.color = "#ffb74d";
      textRef.current.style.opacity = "0.15";
      textRef.current.style.filter = "blur(2px)";
    } else {
      // Normal clean word
      displayText = currentWord;
      textRef.current.style.color = "white"; 
      textRef.current.style.opacity = "0.03"; 
      textRef.current.style.filter = "blur(0px)";
    }
    
    textRef.current.textContent = displayText;
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <span 
        ref={textRef}
        className="font-display font-black uppercase tracking-tighter pointer-events-auto cursor-crosshair transition-opacity duration-100"
        style={{ fontSize: "15vw", userSelect: "none" }}
        onMouseEnter={() => isHovered.current = true}
        onMouseLeave={() => isHovered.current = false}
      >
        {BG_WORDS[wordIndex]}
      </span>
    </div>
  );
}

function CodeLine({ 
  text, 
  index, 
  totalLines, 
  scrollYProgress 
}: { 
  text: string, 
  index: number, 
  totalLines: number, 
  scrollYProgress: MotionValue<number> 
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);

  // useAnimationFrame runs at 60fps, entirely bypassing React's render cycle for maximum performance.
  useAnimationFrame(() => {
    if (!lineRef.current || !containerRef.current) return;
    
    // INTERACTIVITY: Hovering over the corrupted memory "recovers" it instantly.
    if (isHovered.current) {
      lineRef.current.innerText = text;
      containerRef.current.style.opacity = "1";
      containerRef.current.style.filter = "blur(0px)";
      containerRef.current.style.color = "#ffb74d";
      containerRef.current.style.textShadow = "0 0 15px rgba(255,183,77,0.8)";
      return;
    }

    const scroll = scrollYProgress.get();
    
    // Calculate the threshold for this specific line to start decaying.
    // Top lines (index 0) decay first as you scroll down.
    const lineThreshold = index / totalLines; 
    
    // How deep into the "decay zone" is this line currently?
    const distanceToDecay = scroll - lineThreshold; 
    
    if (distanceToDecay < -0.1) {
      // PRISTINE (Future / Present Focus)
      lineRef.current.innerText = text;
      containerRef.current.style.opacity = "1";
      containerRef.current.style.filter = "blur(0px)";
      
      // Bottom lines represent the active core, they glow amber.
      if (index > totalLines - 6) {
         containerRef.current.style.color = "#ffb74d";
         containerRef.current.style.textShadow = "0 0 10px rgba(255,183,77,0.4)";
      } else {
         containerRef.current.style.color = "#a3a3a3"; 
         containerRef.current.style.textShadow = "none";
      }
    } else if (distanceToDecay > 0.15) {
      // FULLY DECAYED (Deep Past)
      // Replace almost all alphanumeric characters with solid blocks
      lineRef.current.innerText = text.replace(/[a-zA-Z0-9]/g, "▒"); 
      containerRef.current.style.opacity = "0.15";
      containerRef.current.style.filter = "blur(2px)";
      containerRef.current.style.color = "#333333";
      containerRef.current.style.textShadow = "none";
    } else {
      // GLITCH ZONE (Actively Decaying)
      // Map distance (-0.1 to 0.15) to a 0-1 intensity scale
      const intensity = (distanceToDecay + 0.1) / 0.25; 
      
      // Throttle the glitch string generation slightly so it doesn't look like static noise, but actual failing hardware
      if (Math.random() > 0.4) {
         let glitchedText = "";
         for (let i = 0; i < text.length; i++) {
           if (text[i] === " " || text[i] === "\n") {
             glitchedText += text[i];
             continue;
           }
           if (Math.random() < intensity) {
             glitchedText += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
           } else {
             glitchedText += text[i];
           }
         }
         lineRef.current.innerText = glitchedText;
      }
      
      containerRef.current.style.opacity = (1 - (intensity * 0.5)).toString();
      containerRef.current.style.filter = `blur(${intensity * 1.5}px)`;
      containerRef.current.style.color = intensity > 0.5 ? "#ffb74d" : "#a3a3a3";
      containerRef.current.style.textShadow = intensity > 0.5 ? "0 0 10px rgba(255,183,77,0.5)" : "none";
    }
  });

  return (
    <div 
      ref={containerRef}
      className="font-mono text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap break-inside-avoid cursor-crosshair transition-all duration-100 ease-out"
      onMouseEnter={() => isHovered.current = true}
      onMouseLeave={() => isHovered.current = false}
    >
      {/* 
        We use an inner span targeted by the ref. 
        This is what useAnimationFrame modifies directly, bypassing React. 
      */}
      <span ref={lineRef}>{text}</span>
    </div>
  );
}

export function MemoryAnalytics() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll over a large 200vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative w-full h-[200vh] bg-[#030303]">
      {/* Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden border-t border-border-soft/30">
        
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,183,77,0.05)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

        {/* Massive Background Glitch Word */}
        <BackgroundGlitchWord />

        {/* Narrative UI Overlay */}
        <div className="absolute top-12 md:top-24 left-6 md:left-12 lg:left-24 z-30 pointer-events-none max-w-xl">
           <Reveal>
             <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber bg-[#030303]/50 backdrop-blur-md px-3 py-1.5 inline-block rounded-full border border-ember-amber/20 mb-6">
               Memory Analytics / Time Decay
             </p>
             <h2 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl text-white mb-6 drop-shadow-md">
               Watch the noise <br/>degrade.
             </h2>
             <p className="text-muted text-lg leading-relaxed">
               Scroll to observe Ember actively managing its memory banks. Stale context is physically corrupted, compressed, and archived, leaving only the most relevant active memory intact.
             </p>
           </Reveal>
        </div>

        {/* The Code Decompilation Block - Full Width Multi-Column */}
        <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 mt-64 md:mt-0 font-mono">
           <div className="columns-1 md:columns-2 lg:columns-3 gap-12 text-left">
             {CODE_LINES.map((line, i) => (
               <CodeLine 
                 key={i} 
                 text={line} 
                 index={i} 
                 totalLines={CODE_LINES.length} 
                 scrollYProgress={scrollYProgress} 
               />
             ))}
           </div>
        </div>

        {/* Edges Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_50%,rgba(3,3,3,1)_100%)] z-20" />
      </div>
    </section>
  );
}
