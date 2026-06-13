"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { OnboardingSplash } from "./onboarding-splash";
import { OnboardingStep1 } from "./onboarding-step1";
import { OnboardingStep2 } from "./onboarding-step2";
import { OnboardingStep3 } from "./onboarding-step3";
import { completeOnboarding, type OnboardingInput } from "@lib/actions/onboarding";
import { toast } from "sonner";
import type { Player } from "@db/schema";

type Step = "splash" | "step1" | "step2" | "step3";

interface Props {
  userName:         string;
  availablePlayers: Player[];
}

export function OnboardingFlow({ userName, availablePlayers }: Props) {
  const [step,   setStep]   = useState<Step>("splash");
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<Partial<OnboardingInput>>({
    displayName:     userName,
    attrAttack:      60,
    attrDefense:     60,
    attrVolley:      60,
    attrConsistency: 60,
    position:        "right",
  });

  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("step1"), 2500);
    return () => clearTimeout(t);
  }, [step]);

  function handleStep1(values: Pick<OnboardingInput, "username" | "displayName" | "location">) {
    setData((d) => ({ ...d, ...values }));
    setStep("step2");
  }

  function handleStep2(values: Pick<OnboardingInput, "position" | "attrAttack" | "attrDefense" | "attrVolley" | "attrConsistency">) {
    setData((d) => ({ ...d, ...values }));
    setStep("step3");
  }

  async function handleStep3(firstFriendId?: string) {
    setSaving(true);
    try {
      await completeOnboarding({
        ...(data as OnboardingInput),
        firstFriendId,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear tu perfil");
      setSaving(false);
    }
  }

  const stepNumber = step === "step1" ? 1 : step === "step2" ? 2 : step === "step3" ? 3 : null;

  return (
    <div style={{ width: "100%", maxWidth: "420px", padding: "1.5rem" }}>

      <AnimatePresence>
        {stepNumber && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "24px" }}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  height:       4,
                  width:        stepNumber >= n ? 32 : 16,
                  borderRadius: 2,
                  background:   stepNumber >= n ? "var(--accent)" : "var(--bg-elevated)",
                  transition:   "all 0.3s ease",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <OnboardingSplash />
          </motion.div>
        )}

        {step === "step1" && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingStep1
              defaultValues={{
                displayName: data.displayName ?? "",
                username:    "",
                location:    "",
              }}
              onNext={handleStep1}
            />
          </motion.div>
        )}

        {step === "step2" && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingStep2
              defaultValues={{
                position:        data.position ?? "right",
                attrAttack:      data.attrAttack ?? 60,
                attrDefense:     data.attrDefense ?? 60,
                attrVolley:      data.attrVolley ?? 60,
                attrConsistency: data.attrConsistency ?? 60,
              }}
              onNext={handleStep2}
              onBack={() => setStep("step1")}
            />
          </motion.div>
        )}

        {step === "step3" && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingStep3
              availablePlayers={availablePlayers}
              onNext={handleStep3}
              onSkip={() => handleStep3(undefined)}
              onBack={() => setStep("step2")}
              saving={saving}
            />
          </motion.div>
        )}

        {saving && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "3rem" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎾</div>
            <div style={{ fontSize: "18px", fontWeight: 500, color: "var(--text-primary)" }}>
              Creando tu perfil...
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
              Preparando tu experiencia PadelXP
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
