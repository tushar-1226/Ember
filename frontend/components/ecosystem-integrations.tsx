"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Reveal } from "./reveal";

const INTEGRATIONS = [
  { name: "Notion", x: "15%", y: "20%", delay: 0 },
  { name: "Linear", x: "35%", y: "12%", delay: 0.5 },
  { name: "Figma", x: "65%", y: "12%", delay: 0.7 },
  { name: "GitHub", x: "85%", y: "20%", delay: 0.2 },
  { name: "Discord", x: "10%", y: "50%", delay: 0.8 },
  { name: "VS Code", x: "90%", y: "50%", delay: 1.0 },
  { name: "Slack", x: "20%", y: "80%", delay: 0.4 },
  { name: "Calendar", x: "50%", y: "90%", delay: 1.2 },
  { name: "Obsidian", x: "80%", y: "80%", delay: 0.6 },
  { name: "Read", x: "30%", y: "40%", delay: 0.9 },
];

import { getFlowerConnections, FlowerConnection } from "@/lib/api";

export function EcosystemIntegrations() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [connections, setConnections] = useState<FlowerConnection[]>([]);
  
  // The terminal command changes dynamically based on interactivity
  const targetText = hoveredNode 
    ? `ember query --source ${hoveredNode.toLowerCase()} --watch`
    : "ember sync --target all --watch";

  // Typing effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let i = 0;
    setIsDone(false);
    setText("");
    
    const typeChar = () => {
      if (i < targetText.length) {
        setText(targetText.slice(0, i + 1));
        i++;
        timeoutId = setTimeout(typeChar, 30 + Math.random() * 30); // fast typing
      } else {
        setIsDone(true);
      }
    };
    
    typeChar();
    
    return () => clearTimeout(timeoutId);
  }, [targetText]);

  useEffect(() => {
    getFlowerConnections().then(setConnections).catch(() => {});
  }, []);

  return (
    <section className="relative min-h-[140vh] w-full bg-[#030303] overflow-hidden flex flex-col items-center justify-center border-t border-border-soft/30 py-32 font-mono">
      
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Radial vignette to darken edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_20%,#030303_80%)] pointer-events-none z-0" />

      <div className="absolute top-24 left-6 md:left-12 lg:left-24 z-30">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber bg-[#030303]/50 backdrop-blur-md px-2 py-1 inline-block rounded">
            The Ecosystem
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl drop-shadow-md">
            Connect everything.<br/>
            Analyze <span className="text-ember-amber italic">anything.</span>
          </h2>
        </Reveal>
      </div>

      {/* Full width container for the network */}
      <div className="relative w-full h-[800px] mt-32 z-10 flex items-center justify-center">
        
        {/* Global SVG Container for connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {INTEGRATIONS.map((node, i) => {
            const isHovered = hoveredNode === node.name;
            const isAnyHovered = hoveredNode !== null;
            const isLineActive = isDone && (!isAnyHovered || isHovered);

            return (
              <g key={`lines-${i}`}>
                {/* Background dashed line */}
                <line 
                  x1="50%" y1="50%" x2={node.x} y2={node.y}
                  stroke={isHovered ? "#ffb74d" : "#222"}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="transition-colors duration-300"
                />
                
                {/* Glowing animated line */}
                {isLineActive && (
                  <motion.line 
                    x1="50%" y1="50%" x2={node.x} y2={node.y}
                    stroke="#ffb74d"
                    strokeWidth={isHovered ? "3" : "2"}
                    strokeDasharray={isHovered ? "20 40" : "10 30"}
                    style={{ filter: isHovered ? "drop-shadow(0 0 10px rgba(255,183,77,0.8))" : "drop-shadow(0 0 6px rgba(255,183,77,0.6))" }}
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ 
                      duration: isHovered ? 0.8 : 2, 
                      repeat: Infinity, 
                      ease: "linear",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Central Terminal Core */}
        <div className="absolute z-30 w-[90%] sm:w-[500px] bg-[#0a0a0a]/90 backdrop-blur-md border border-[#333] rounded-lg shadow-[0_0_100px_rgba(255,183,77,0.08)] overflow-hidden">
          {/* Terminal Header */}
          <div className="h-8 bg-[#111] border-b border-[#222] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            <span className="mx-auto text-[10px] text-muted tracking-widest uppercase">
              {hoveredNode ? `ember-query: ${hoveredNode}` : "ember-cli"}
            </span>
          </div>
          {/* Terminal Body */}
          <div className="p-6 h-40 flex flex-col justify-center">
            <div className="flex items-center text-sm sm:text-base text-[#ddd]">
              <span className="text-ember-amber mr-3 text-lg leading-none">❯</span>
              <span>{text}</span>
              <motion.span 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="ml-1 w-2.5 h-5 bg-ember-amber inline-block"
              />
            </div>
            
            <div className="h-12 mt-4 text-xs sm:text-sm">
              {isDone && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#888] flex flex-col gap-1"
                >
                  {hoveredNode ? (
                    <>
                      <span className="text-amber-500">[+] Handshake with {hoveredNode} API successful.</span>
                      <span>[+] Streaming node-specific telemetry...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-emerald-500">[+] Established secure channels to 9 targets.</span>
                      <span>[+] Streaming real-time delta updates...</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Integration Interactive Nodes */}
        {INTEGRATIONS.map((node, i) => {
          const isHovered = hoveredNode === node.name;
          const isAnyHovered = hoveredNode !== null;
          const isActive = isDone && (!isAnyHovered || isHovered);
          const isConnected = connections.some(c => c.provider.toLowerCase() === node.name.toLowerCase());

          return (
            <motion.div 
              key={`node-${i}`}
              className={`absolute flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md border cursor-pointer z-20 transition-colors duration-300 ${
                isHovered ? "border-ember-amber shadow-[0_0_30px_rgba(255,183,77,0.3)]" : (isConnected ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-[#222]")
              }`}
              // We use tailwind classes for the width/height to make it responsive
              // Centering the absolute position by using translate-x and y
              style={{ 
                left: node.x, 
                top: node.y, 
                transform: 'translate(-50%, -50%)',
                width: 'clamp(100px, 12vw, 160px)',
                height: 'clamp(40px, 5vw, 56px)'
              }}
              onMouseEnter={() => setHoveredNode(node.name)}
              onMouseLeave={() => setHoveredNode(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Corner Accents - only show when active */}
              {isActive && (
                <>
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-ember-amber -mt-[1px] -ml-[1px]" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ember-amber -mt-[1px] -mr-[1px]" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ember-amber -mb-[1px] -ml-[1px]" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ember-amber -mb-[1px] -mr-[1px]" />
                </>
              )}
              
              <span className={`text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold transition-colors ${
                isHovered ? "text-ember-amber" : (isConnected ? "text-emerald-500" : "text-muted")
              }`}>
                {node.name}
              </span>
            </motion.div>
          );
        })}

      </div>
    </section>
  );
}
