import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 1600);
  };
  return (
    <button type="button" onClick={copy} className="btn h-9 px-3 text-[13px]" aria-live="polite">
      {state === "done" ? "Copied" : state === "fail" ? "Select and copy" : label}
    </button>
  );
}
