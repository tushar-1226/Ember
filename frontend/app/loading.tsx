"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative flex items-center justify-center">
          {/* Core glow */}
          <motion.div
            className="absolute h-16 w-16 rounded-full bg-primary/20 blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Inner ring */}
          <motion.div
            className="h-10 w-10 rounded-full border border-primary/50 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
        <motion.div
          className="text-sm font-medium tracking-widest text-primary/60 uppercase"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Loading
        </motion.div>
      </motion.div>
    </div>
  );
}
