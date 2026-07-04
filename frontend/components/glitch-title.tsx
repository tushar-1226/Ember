"use client";

import { useState, useEffect } from "react";
import { EmberCritter } from "./ember-critter";

export function GlitchTitle() {
  const [word1, setWord1] = useState("remembers");
  const [word2, setWord2] = useState("reflects");
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    // 3 seconds of glitching
    const endTime = Date.now() + 3000;
    
    const interval = setInterval(() => {
      if (Date.now() > endTime) {
        clearInterval(interval);
        setWord1("remembers");
        setWord2("reflects");
        setIsGlitching(false);
      } else {
        // Swap randomly to create glitch effect
        if (Math.random() > 0.5) {
          setWord1("reflects");
          setWord2("remembers");
        } else {
          setWord1("remembers");
          setWord2("reflects");
        }
      }
    }, 200); // Clean word transition interval

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
      <span className="relative inline-block">
        I
        {/* Glowing Ember Pixel over the 'I' */}
        <span className="absolute -top-1 left-[40%] h-2.5 w-2.5 animate-pulse rounded-full bg-ember-gold shadow-[0_0_12px_#ffb74d]" />
      </span>
      t{" "}
      <span className="relative inline-block text-ember-amber">
        {word1}
        {/* Sitting Ember Critter */}
        <div className="absolute -top-16 right-12 z-20 hidden sm:block animate-float">
          <EmberCritter unit={5} />
        </div>
      </span>
      <br />
      your life, and
      <br />
      <span className="text-ember-amber">
        {word2}
      </span>{" "}
      it back.
    </h1>
  );
}
