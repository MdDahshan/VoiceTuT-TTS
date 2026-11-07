import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info as InfoIcon } from "lucide-react";

type Toast = { id: number; kind: "error" | "ok" | "info"; text: string };

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id} layout className={`toast ${toast.kind}`} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}>
            {toast.kind === "error" ? <AlertCircle size={17} /> : toast.kind === "ok" ? <CheckCircle2 size={17} /> : <InfoIcon size={17} />}
            <span>{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
