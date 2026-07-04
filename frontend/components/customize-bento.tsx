"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "./reveal";

function ToggleSwitch({ label, defaultOn = false }: { label: string, defaultOn?: boolean }) {
  const [isOn, setIsOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
      <span className="text-sm font-mono text-muted">{label}</span>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-ember-amber' : 'bg-[#333]'}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className={`inline-block h-3 w-3 transform rounded-full bg-void shadow-sm ${isOn ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

function SliderWidget() {
  const [value, setValue] = useState(50);
  return (
    <div className="w-full flex flex-col justify-center gap-4 mt-6">
      <div className="flex justify-between text-[8px] font-mono text-faint uppercase">
        <span>Passive</span>
        <span className="text-ember-amber">Aggressive</span>
      </div>
      <div className="relative w-full h-1.5 bg-[#222] rounded-full">
        <motion.div 
          className="absolute left-0 top-0 h-full bg-ember-amber rounded-full"
          animate={{ width: `${value}%` }}
        />
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 120 }} 
          dragElastic={0}
          dragMomentum={false}
          onDrag={(_, info) => {
            const v = Math.max(0, Math.min(100, (info.point.x / 120) * 100));
          }}
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -ml-1.5 rounded-full bg-void border-[2px] border-ember-amber shadow-[0_0_10px_rgba(255,183,77,0.5)] cursor-grab active:cursor-grabbing"
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  );
}

function EqualizerWidget() {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className="flex gap-1.5 items-end h-[40px] cursor-default mt-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-3 bg-ember-amber rounded-t-sm"
          initial={{ height: "20%" }}
          animate={{ height: isHovered ? `${Math.random() * 60 + 40}%` : `${20 + i * 10}%` }}
          transition={{
            repeat: isHovered ? Infinity : 0,
            repeatType: "reverse",
            duration: 0.3 + i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export function CustomizeBento() {
  return (
    <section className="relative px-6 py-32 lg:px-12 w-full">
      {/* Massive Cinematic Header */}
      <div className="mx-auto max-w-7xl text-center mb-32">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-ember-amber mb-6">
            Make it yours
          </p>
          <h2 className="font-display text-5xl font-medium leading-[1.1] tracking-tight sm:text-7xl lg:text-[5.5rem] mb-8">
            A reflection of your <br className="hidden md:block"/>
            <span className="text-ember-amber">preferences.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted leading-relaxed">
            Ember is built to be customized. From how it looks to what it remembers, you have complete control over the experience.
          </p>
        </Reveal>
      </div>

      <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        
        {/* Left Side: Visual Dashboard (Sticky) */}
        <div className="lg:sticky lg:top-32">
          <div className="grid grid-cols-2 gap-4 auto-rows-[160px]">
            
            {/* Capabilities - 2x2 */}
            <div className="col-span-2 row-span-2 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center p-6 group relative overflow-hidden">
              <div className="absolute top-6 left-6 z-10">
                <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[CAPABILITIES]</div>
                <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Extend the reach</div>
              </div>
              <div className="w-full max-w-[220px] bg-[#111] border border-[#222] rounded-xl p-5 shadow-2xl transition-transform group-hover:scale-105 mt-10">
                <ToggleSwitch label="Web Search" defaultOn={true} />
                <ToggleSwitch label="Code Sandbox" defaultOn={false} />
                <ToggleSwitch label="File Uploads" defaultOn={true} />
              </div>
              <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Persona - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center relative group overflow-hidden">
              <div className="absolute top-5 left-5 z-10">
                <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[PERSONA]</div>
                <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Set the tone</div>
              </div>
              <EqualizerWidget />
              <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Memory - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center p-6 relative group overflow-hidden">
              <div className="absolute top-5 left-5 z-10">
                <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[MEMORY]</div>
                <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Control flow</div>
              </div>
              <div className="w-full max-w-[140px]">
                <SliderWidget />
              </div>
              <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Aesthetics - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center relative group overflow-hidden">
              <div className="absolute top-5 left-5 z-10">
                <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[AESTHETICS]</div>
                <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Themes</div>
              </div>
              <div className="flex gap-2 mt-6">
                <motion.div className="h-8 w-8 rounded-full bg-void border border-[#222]" whileHover={{ scale: 1.2 }} />
                <motion.div className="h-8 w-8 rounded-full bg-[#333] border border-[#222]" whileHover={{ scale: 1.2 }} />
                <motion.div className="h-8 w-8 rounded-full bg-foreground border border-border" whileHover={{ scale: 1.2 }} />
              </div>
              <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Speech - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center relative group overflow-hidden cursor-default">
               <div className="absolute top-5 left-5 z-10">
                 <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[SPEECH]</div>
                 <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Voice I/O</div>
               </div>
               <div className="flex gap-1 h-8 items-center mt-6">
                 <motion.div className="w-1 h-2 bg-foreground rounded-full group-hover:h-8 group-hover:bg-ember-amber transition-all duration-300 delay-75"/>
                 <motion.div className="w-1 h-4 bg-foreground rounded-full group-hover:h-6 group-hover:bg-ember-amber transition-all duration-300 delay-150"/>
                 <motion.div className="w-1 h-8 bg-foreground rounded-full group-hover:h-3 group-hover:bg-ember-amber transition-all duration-300 delay-200"/>
                 <motion.div className="w-1 h-3 bg-foreground rounded-full group-hover:h-8 group-hover:bg-ember-amber transition-all duration-300 delay-300"/>
               </div>
               <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Data Export - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center relative group overflow-hidden">
               <div className="absolute top-5 left-5 z-10">
                 <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[EXPORT]</div>
                 <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Download</div>
               </div>
               <div className="w-12 h-12 border border-[#222] rounded-lg bg-[#111] flex items-center justify-center relative overflow-hidden mt-6">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    className="absolute font-mono text-muted group-hover:text-ember-amber transition-colors"
                    animate={{ 
                       y: [ -20, 0, 0, 20 ],
                       opacity: [ 0, 1, 1, 0 ]
                    }}
                    transition={{
                       duration: 2,
                       repeat: Infinity,
                       times: [0, 0.2, 0.8, 1],
                       ease: "easeInOut"
                    }}
                  >
                    ↓
                  </motion.div>
               </div>
               <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

            {/* Plugins - 1x1 */}
            <div className="col-span-1 row-span-1 rounded-2xl bg-[#050505] border border-[#222] flex flex-col items-center justify-center relative group overflow-hidden">
               <div className="absolute top-5 left-5 z-10">
                 <div className="text-[10px] font-mono uppercase text-muted tracking-widest">[PLUGINS]</div>
                 <div className="text-sm font-medium text-foreground mt-1 transition-colors group-hover:text-ember-amber">Connect</div>
               </div>
               <div className="flex items-center gap-1 mt-6">
                  <div className="w-5 h-5 rounded-md bg-[#333] group-hover:-translate-x-1 transition-transform border border-[#444]" />
                  <div className="w-8 h-0.5 bg-[#333] group-hover:bg-ember-amber transition-colors" />
                  <div className="w-5 h-5 rounded-md bg-[#333] group-hover:translate-x-1 transition-transform border border-[#444]" />
               </div>
               <div className="absolute inset-0 border border-ember-amber opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" />
            </div>

          </div>
        </div>

        {/* Right Side: Stacking Cards */}
        <div className="flex flex-col gap-[15vh] pb-[20vh]">
          
          <Reveal delay={0.08} className="sticky top-24 z-10">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center justify-between border-b border-[#222] pb-4">
                <span className="text-sm font-medium text-foreground">Memory</span>
                <div className="relative h-5 w-9 rounded-full bg-[#333]">
                  <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-void" />
                </div>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Control the flow</h3>
              <p className="mt-2 text-sm text-muted">
                Toggle proactive resurfacing, completely wipe specific memory clusters, or adjust how aggressively Ember connects past ideas.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="sticky top-28 z-20">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-3 border-b border-[#222] pb-4">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[#333] bg-[#111] text-xs text-foreground">E</span>
                <span className="text-sm font-medium text-foreground">Persona</span>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Set the tone</h3>
              <p className="mt-2 text-sm text-muted">
                Provide custom instructions to shape Ember's personality. Whether you want a gentle listener, an analytical partner, or a direct coach.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.16} className="sticky top-32 z-30">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-2 border-b border-[#222] pb-4">
                <div className="h-6 w-6 rounded border border-[#333] bg-[#111]" />
                <div className="grid h-6 w-6 place-items-center rounded border border-foreground bg-foreground text-void"><span className="font-mono text-[10px]">Aa</span></div>
                <div className="h-6 w-6 rounded border border-[#333] bg-background" />
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Aesthetics</h3>
              <p className="mt-2 text-sm text-muted">
                Choose between Light, Dark, or System themes. Adjust typography (Sans, System, Mono) and interface motion down to your exact liking.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.20} className="sticky top-36 z-40">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-3 border-b border-[#222] pb-4">
                <span className="rounded-full border border-amber-500/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-500">Active</span>
                <span className="text-sm font-medium text-foreground">Capabilities</span>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Extend the reach</h3>
              <p className="mt-2 text-sm text-muted">
                Toggle powerful features like web search, code execution sandboxing, and file uploads. Connect Ember seamlessly to your workflow.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.24} className="sticky top-40 z-50">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-3 border-b border-[#222] pb-4">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-foreground">Speech</span>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Voice interactions</h3>
              <p className="mt-2 text-sm text-muted">
                Choose from a selection of natural, expressive voices. Have fluid, spoken conversations with Ember when your hands are full.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.28} className="sticky top-44 z-[60]">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-3 border-b border-[#222] pb-4">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-foreground">Data Export</span>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Download your mind</h3>
              <p className="mt-2 text-sm text-muted">
                Ember makes it easy to pack up and leave. Export your entire garden to standard JSON or Markdown files instantly.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.32} className="sticky top-48 z-[70]">
            <div className="rounded-2xl bg-[#050505] border border-[#222] p-8 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="mb-6 flex items-center gap-3 border-b border-[#222] pb-4">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                  <path d="M9 7V4M15 7V4M7 7h10v4a5 5 0 0 1-10 0zM12 16v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-foreground">Plugins</span>
              </div>
              <h3 className="font-display text-lg font-medium text-ember-amber">Connect your world</h3>
              <p className="mt-2 text-sm text-muted">
                Sync with Notion, GitHub, or Spotify to give Ember context on what you're building, reading, and listening to.
              </p>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
