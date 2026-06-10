"use client";

import { motion } from "motion/react";

interface AnimatedCardProps {
  children:  React.ReactNode;
  delay?:    number;
  className?: string;
  style?:    React.CSSProperties;
}

export function AnimatedCard({ children, delay = 0, className, style }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      style={style as any}
    >
      {children}
    </motion.div>
  );
}
