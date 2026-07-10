import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function RocketSvg() {
  return (
    <svg width="72" height="112" viewBox="0 0 72 112" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* fins */}
      <path d="M20 74 L4 100 L24 92 Z" fill="hsl(16 68% 42%)" />
      <path d="M52 74 L68 100 L48 92 Z" fill="hsl(16 68% 42%)" />
      {/* body */}
      <path
        d="M36 2 C50 18 54 42 54 62 C54 76 46 84 36 88 C26 84 18 76 18 62 C18 42 22 18 36 2 Z"
        fill="hsl(35 18% 90%)"
      />
      {/* nose stripe */}
      <path d="M36 2 C44 12 49 26 51.5 40 L20.5 40 C23 26 28 12 36 2 Z" fill="hsl(38 85% 52%)" />
      {/* window */}
      <circle cx="36" cy="56" r="8" fill="hsl(22 12% 6%)" />
      <circle cx="36" cy="56" r="5.5" fill="hsl(200 60% 55%)" />
    </svg>
  );
}

export default function IntroLoader() {
  const [phase, setPhase] = useState<"idle" | "launch" | "warp" | "done">("idle");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("launch"), 350);
    const t2 = setTimeout(() => setPhase("warp"), 1350);
    const t3 = setTimeout(() => setPhase("done"), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(var(--background))" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* warp starfield streaks */}
          {phase === "warp" &&
            Array.from({ length: 40 }, (_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              const dist = 60 + Math.random() * 30;
              return (
                <motion.span
                  key={i}
                  className="absolute top-1/2 left-1/2 rounded-full"
                  style={{ width: 2, height: 2, background: "hsl(38 85% 70%)" }}
                  initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist * 8,
                    y: Math.sin(angle) * dist * 8,
                    opacity: 0,
                    scaleX: 14,
                  }}
                  transition={{ duration: 0.75, ease: "easeIn" }}
                />
              );
            })}

          {/* ambient stars */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 100}%`,
                  width: 1.5,
                  height: 1.5,
                  background: "hsl(35 18% 80%)",
                  opacity: 0.4,
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative flex flex-col items-center"
            animate={
              phase === "launch" || phase === "warp"
                ? { y: -260, opacity: phase === "warp" ? 0 : 1 }
                : { y: 0, opacity: 1 }
            }
            transition={{ duration: 1.05, ease: [0.5, 0, 0.85, 0.4] }}
          >
            {/* flame */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: 84, width: 26, borderRadius: "0 0 40% 40%" }}
              animate={{
                height: phase === "idle" ? 10 : 46,
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                height: { duration: 0.4 },
                opacity: { duration: 0.18, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  borderRadius: "0 0 50% 50%",
                  background: "linear-gradient(to bottom, hsl(38 95% 65%), hsl(16 90% 50%) 60%, transparent 100%)",
                }}
              />
            </motion.div>

            <RocketSvg />
          </motion.div>

          <motion.p
            className="mt-10 text-xs uppercase tracking-[0.3em] font-body"
            style={{ color: "hsl(var(--muted-foreground))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "warp" ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {phase === "idle" ? "Preparing for launch" : "Entering orbit"}
          </motion.p>

          <motion.div
            className="mt-4 h-px w-32 overflow-hidden"
            style={{ background: "hsl(var(--border))" }}
          >
            <motion.div
              className="h-full"
              style={{ background: "hsl(var(--primary))" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.9, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
