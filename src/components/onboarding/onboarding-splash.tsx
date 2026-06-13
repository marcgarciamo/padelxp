"use client";

import { motion } from "motion/react";

export function OnboardingSplash() {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0" }}>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width:          140,
          height:         140,
          borderRadius:   "50%",
          background:     "radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)",
          margin:         "0 auto 8px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          position:       "relative",
        }}
      >
        <motion.div
          initial={{ rotate: -30, scale: 0 }}
          animate={{ rotate: 0,   scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
          style={{ fontSize: "64px" }}
        >
          🎾
        </motion.div>

        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div
            key={deg}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1.5, delay: 0.5 + i * 0.1, repeat: Infinity, repeatDelay: 1 }}
            style={{
              position:     "absolute",
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   i % 2 === 0 ? "#7c5cfc" : "#00d4ff",
              top:          "50%",
              left:         "50%",
              transform:    `rotate(${deg}deg) translateX(60px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ marginBottom: "12px" }}
      >
        <span style={{ fontSize: "36px", fontWeight: 900, color: "#fff" }}>Padel</span>
        <span style={{
          fontSize:   "36px",
          fontWeight: 900,
          color:      "#7c5cfc",
          textShadow: "0 0 20px rgba(124,92,252,0.6)",
        }}>XP</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{ fontSize: "14px", color: "var(--text-muted)", letterSpacing: "0.1em" }}
      >
        Track · Compete · Level Up
      </motion.p>

      <motion.div
        style={{
          height:       3,
          background:   "var(--bg-elevated)",
          borderRadius: 2,
          marginTop:    "32px",
          overflow:     "hidden",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.3 }}
          style={{
            height:       "100%",
            background:   "linear-gradient(90deg, #7c5cfc, #a78bfa)",
            borderRadius: 2,
          }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}
      >
        Preparando tu experiencia...
      </motion.p>
    </div>
  );
}
