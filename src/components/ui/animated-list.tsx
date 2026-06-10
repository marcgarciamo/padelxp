"use client";

import { motion, AnimatePresence } from "motion/react";

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <AnimatePresence>
      <div className={className}>
        {children.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, delay: i * 0.06, ease: "easeOut" }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
