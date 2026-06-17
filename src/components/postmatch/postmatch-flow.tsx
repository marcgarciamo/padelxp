"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PostmatchStep1 } from "./postmatch-step1";
import { PostmatchStep2 } from "./postmatch-step2";
import { PostmatchStep3 } from "./postmatch-step3";
import { PostmatchStep4 } from "./postmatch-step4";

type Step = 1 | 2 | 3 | 4;

interface Props {
  flow:          any;
  currentPlayer: any;
  myCompletion:  any;
  matchData:     any;
}

export function PostmatchFlow({ flow, currentPlayer, myCompletion, matchData }: Props) {
  const initialStep: Step =
    !myCompletion.validated    ? 1 :
    !myCompletion.mvpVoted     ? 2 :
    !myCompletion.prestigeDone ? 3 : 4;

  const [step, setStep]       = useState<Step>(initialStep);
  const [rewards, setRewards] = useState<any>(null);

  const team1    = matchData?.team1;
  const team2    = matchData?.team2;
  const isTeam1  = [team1?.player1Id, team1?.player2Id].includes(currentPlayer.id);
  const myTeam   = isTeam1 ? team1 : team2;
  const rivals   = isTeam1
    ? [team2?.player1, team2?.player2]
    : [team1?.player1, team1?.player2];
  const partner  = myTeam?.player1?.id === currentPlayer.id
    ? myTeam?.player2
    : myTeam?.player1;

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Post-partido
          </span>
        </div>
        {step < 4 && (
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
            {([1, 2, 3] as const).map((n) => (
              <div key={n} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: step >= n ? "var(--accent)" : "var(--bg-elevated)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <PostmatchStep1
              flow={flow}
              currentPlayer={currentPlayer}
              myCompletion={myCompletion}
              isCreator={flow.createdBy === currentPlayer.id}
              onNext={() => setStep(2)}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <PostmatchStep2
              flow={flow}
              currentPlayer={currentPlayer}
              rivals={rivals.filter(Boolean)}
              partner={partner}
              onNext={() => setStep(3)}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <PostmatchStep3
              flow={flow}
              currentPlayer={currentPlayer}
              rivals={rivals.filter(Boolean)}
              onNext={(rewardData) => { setRewards(rewardData); setStep(4); }}
            />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <PostmatchStep4
              flow={flow}
              currentPlayer={currentPlayer}
              rewards={rewards}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
