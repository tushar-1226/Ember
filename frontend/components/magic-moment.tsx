"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";

export function MagicMoment() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // The mask image will reveal the X-Ray layer wherever the mouse is
  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black 20%, transparent 80%)`;

  return (
    <section className="relative px-4 md:px-8 py-24 sm:py-32 w-full max-w-[100vw]">
      
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
          className="font-mono text-xs uppercase tracking-[0.25em] text-faint"
        >
          The moment it clicks
        </motion.p>
      </div>

      <div 
        className="relative mx-auto w-full max-w-7xl h-[600px] rounded-[2rem] border border-[#222] bg-[#050505] overflow-hidden cursor-crosshair group flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
           // Optionally snap back to center when mouse leaves
           // mouseX.set(window.innerWidth / 2);
           // mouseY.set(300);
        }}
      >
        
        {/* ================= BASE LAYER (Clean UI) ================= */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
           <blockquote className="font-display text-2xl md:text-4xl lg:text-5xl font-medium leading-[1.6] tracking-tight text-foreground text-center max-w-4xl text-balance">
              “Three weeks ago you told me Sunday nights make you spiral. It's Sunday. Want to plan tomorrow now, so it feels lighter?”
           </blockquote>
           <div className="mt-14 inline-flex items-center gap-2 rounded-full border border-[#222] bg-[#111] px-4 py-2 font-mono text-xs text-muted shadow-sm transition-opacity duration-300 group-hover:opacity-0">
             Hover to look under the hood
           </div>
        </div>

        {/* ================= X-RAY LAYER (Technical/Under the hood) ================= */}
        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none bg-[#0a0a0a]"
          style={{ maskImage, WebkitMaskImage: maskImage }}
        >
           {/* Technical Grid Background */}
           <div 
             className="absolute inset-0 opacity-20"
             style={{ 
               backgroundImage: 'linear-gradient(var(--color-ember-amber) 1px, transparent 1px), linear-gradient(90deg, var(--color-ember-amber) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
           />

           {/* X-Ray Content Container */}
           <div className="absolute inset-0 flex items-center justify-center p-8">
              {/* Highlighted Quote Match */}
              <blockquote className="font-display text-2xl md:text-4xl lg:text-5xl font-medium leading-[1.6] tracking-tight text-ember-amber text-center max-w-4xl text-balance relative">
                 <span className="opacity-30">“Three weeks ago you told me </span>
                 <span className="relative">
                    Sunday nights make you spiral
                    {/* Connection Line & Node */}
                    <svg className="absolute left-1/2 -top-[120px] -translate-x-1/2 w-px h-[110px] overflow-visible">
                       <line x1="0" y1="0" x2="0" y2="110" stroke="#ffb74d" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                       <circle cx="0" cy="0" r="4" fill="#ffb74d" />
                    </svg>
                    {/* Technical Floating Box */}
                    <div className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[220px] bg-[#111] border border-ember-amber/50 rounded-lg p-4 font-mono text-[10px] text-ember-amber text-left shadow-[0_0_20px_rgba(255,183,77,0.2)]">
                       <div className="text-muted mb-2 border-b border-ember-amber/20 pb-2">[MEMORY_RETRIEVED]</div>
                       <div className="flex justify-between"><span>Match:</span><span>99.8%</span></div>
                       <div className="flex justify-between"><span>Source:</span><span>Chat Log</span></div>
                       <div className="flex justify-between"><span>Date:</span><span>May 3, 2024</span></div>
                       <div className="mt-2 pt-2 border-t border-ember-amber/20 text-[#ffb74d]">
                         {'{ action: proactive_plan }'}
                       </div>
                    </div>
                 </span>
                 <span className="opacity-30">. It's Sunday. Want to plan tomorrow now, so it feels lighter?”</span>
              </blockquote>
           </div>

           {/* Floating Code Snippets around the canvas */}
           <div className="absolute top-12 left-12 font-mono text-[10px] text-ember-amber/50 leading-relaxed">
             {'// KNOWLEDGE_GRAPH_INIT'}<br/>
             {'const ctx = await Ember.query({'}<br/>
             &nbsp;&nbsp;{'vector: user_state,'}<br/>
             &nbsp;&nbsp;{'decay: false'}<br/>
             {'});'}<br/>
           </div>

           <div className="absolute bottom-12 right-12 font-mono text-[10px] text-ember-amber/50 leading-relaxed text-right">
             {'// SYNTHESIS_PIPELINE'}<br/>
             {'pipeline.applyTone(ctx.persona);'}<br/>
             {'return buildResponse(nodes);'}<br/>
             {'[✓] GENERATION_COMPLETE'}<br/>
           </div>

           {/* Central Scanner Glow */}
           <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,183,77,0.15)]" />
        </motion.div>

      </div>
    </section>
  );
}
