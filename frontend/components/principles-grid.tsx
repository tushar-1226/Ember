"use client";

import { useMotionValue, useMotionTemplate, motion } from "framer-motion";
import { useState } from "react";

const PRINCIPLES = [
  {
    n: "01",
    title: "It remembers",
    body: "Every conversation leaves an ember. Ember keeps the moments that matter — your goals, your people, the things you keep circling back to.",
    id: "remembers"
  },
  {
    n: "02",
    title: "It consolidates",
    body: "Scattered thoughts get gathered into a story. Ember quietly connects the dots across weeks so patterns you'd never notice surface on their own.",
    id: "consolidates"
  },
  {
    n: "03",
    title: "It lets go",
    body: "Memory that never forgets is noise. Ember lets the unimportant fade — visibly — so what stays lit is only what's worth keeping warm.",
    id: "lets-go"
  },
];

export function PrinciplesGrid() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      className="group relative grid w-full grid-cols-1 gap-[1px] md:grid-cols-3 bg-border-soft overflow-hidden border-y border-border-soft"
      onMouseMove={handleMouseMove}
    >
      {PRINCIPLES.map((p, i) => (
        <Card 
          key={p.n} 
          p={p} 
          i={i} 
          mouseX={mouseX} 
          mouseY={mouseY} 
        />
      ))}
    </div>
  );
}

function Card({ p, i, mouseX, mouseY }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex flex-col justify-between overflow-hidden bg-[#050505] p-10 md:p-16 xl:p-20 h-full min-h-[450px]"
    >
      {/* Spotlight Hover Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-20 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 183, 77, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* Watermark Number */}
      <div className="absolute right-0 top-0 -mr-6 -mt-8 text-[200px] font-bold leading-none tracking-tighter text-[#111] select-none pointer-events-none transition-transform duration-700 ease-out">
        {p.n}
      </div>

      <div className="relative z-30">
        {/* Animated Iconography based on Card ID */}
        <div className="mb-24 h-16 w-16 relative">
          {p.id === "remembers" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`h-4 w-4 rounded-full bg-ember-amber transition-all duration-700 ${isHovered ? 'shadow-[0_0_40px_rgba(255,183,77,1)] scale-150' : 'shadow-[0_0_15px_rgba(255,183,77,0.5)] scale-100'}`}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-ember-amber" />
              </div>
            </div>
          )}
          {p.id === "consolidates" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`absolute h-2.5 w-2.5 rounded-full bg-ember-amber transition-all duration-500 ease-out ${isHovered ? 'translate-x-0 translate-y-0 opacity-100 scale-150 shadow-[0_0_20px_rgba(255,183,77,0.8)]' : '-translate-x-6 -translate-y-6 opacity-40'}`} />
              <div className={`absolute h-2.5 w-2.5 rounded-full bg-ember-amber transition-all duration-500 ease-out delay-75 ${isHovered ? 'translate-x-0 translate-y-0 opacity-100 scale-150 shadow-[0_0_20px_rgba(255,183,77,0.8)]' : 'translate-x-6 -translate-y-3 opacity-40'}`} />
              <div className={`absolute h-2.5 w-2.5 rounded-full bg-ember-amber transition-all duration-500 ease-out delay-150 ${isHovered ? 'translate-x-0 translate-y-0 opacity-100 scale-150 shadow-[0_0_20px_rgba(255,183,77,0.8)]' : 'translate-x-0 translate-y-6 opacity-40'}`} />
            </div>
          )}
          {p.id === "lets-go" && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, idx) => (
                <div 
                  key={idx}
                  className={`absolute h-2 w-2 rounded-full bg-ember-amber transition-all duration-1000 ease-out`}
                  style={{
                    transform: isHovered 
                      ? `translate(${Math.cos(idx * 45 * Math.PI / 180) * 60}px, ${Math.sin(idx * 45 * Math.PI / 180) * 60}px) scale(0)` 
                      : `translate(0px, 0px) scale(1.5)`,
                    opacity: isHovered ? 0 : 0.8
                  }}
                />
              ))}
              <div className={`h-5 w-5 rounded-full bg-ember-amber transition-all duration-1000 ${isHovered ? 'opacity-0 scale-[0.2]' : 'opacity-100 scale-100 shadow-[0_0_15px_rgba(255,183,77,0.5)]'}`} />
            </div>
          )}
        </div>

        <h3 className={`font-display text-3xl md:text-4xl font-medium text-ember-amber transition-all duration-500 ${isHovered ? 'translate-x-2' : 'translate-x-0'}`}>
          {p.title}
        </h3>
        <p className={`mt-6 text-base md:text-lg leading-relaxed text-muted max-w-sm transition-all duration-500 delay-75 ${isHovered ? 'translate-x-2 text-foreground' : 'translate-x-0'}`}>
          {p.body}
        </p>
      </div>
    </motion.div>
  );
}
