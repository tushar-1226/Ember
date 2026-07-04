"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isHot, setIsHot] = useState(false);

  // Use framer-motion values for smooth interpolation
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Apply spring physics for that "premium" smooth trailing feel
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Optional: Hide default cursor globally when this mounts
    document.documentElement.classList.add("hide-cursor");

    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if hovering over a clickable element
      const isClickable = target.closest('a, button, input, select, textarea, [role="button"], [data-cursor="interactive"]');
      setIsHovering(!!isClickable);

      // Check for specific "hot" cursor state (like on the CTA button)
      const isHotElement = target.closest('[data-cursor="hot"]');
      setIsHot(!!isHotElement);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", updateHoverState);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.documentElement.classList.remove("hide-cursor");
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", updateHoverState);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* The main tiny dot that strictly follows the cursor */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-amber shadow-ember"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isClicking ? 0.5 : isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ duration: 0.15 }}
      />
      
      {/* The trailing, glowing aura */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full border border-ember-amber/40"
        style={{
          x: smoothX,
          y: smoothY,
          width: 40,
          height: 40,
        }}
        animate={{
          scale: isClicking ? 0.8 : isHot ? 2.5 : isHovering ? 1.5 : 1,
          backgroundColor: isHot ? "rgba(255, 183, 77, 0.15)" : isHovering ? "rgba(255, 183, 77, 0.05)" : "rgba(255, 183, 77, 0)",
          borderColor: isHot ? "rgba(255, 183, 77, 0.8)" : "rgba(255, 183, 77, 0.3)",
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
