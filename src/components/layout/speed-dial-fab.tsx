"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Swords, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SpeedDialFab() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ACTIONS = [
    { href: "/register-match",    label: "Partido", icon: <Swords size={20} /> },
    { href: "/tournaments/create", label: "Torneo",  icon: <Trophy size={20} /> },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position:       "fixed",
        bottom:         "calc(70px + env(safe-area-inset-bottom))",
        right:          "max(16px, calc(50% - 224px))",
        zIndex:         45,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "flex-end",
        gap:            "12px",
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}
          >
            {ACTIONS.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textDecoration: "none",
                }}
              >
                <span style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  border: "1px solid var(--border)",
                }}>
                  {action.label}
                </span>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  border: "1px solid var(--border)",
                }}>
                  {action.icon}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width:          "56px",
          height:         "56px",
          borderRadius:   "50%",
          background:     "var(--accent)",
          color:          "#fff",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 4px 20px rgba(124,92,252,0.4)",
          border:         "none",
          cursor:         "pointer",
          transition:     "transform 0.2s",
          transform:      isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
