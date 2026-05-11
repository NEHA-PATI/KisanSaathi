import { lazy, Suspense } from "react";
import { motion } from "framer-motion";

const BhoomiMap = lazy(() => import("@/components/map/BhoomiMap"));

export default function Dashboard() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#03130d]">
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-[#03130d] text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-white/10 bg-slate-950/60 px-6 py-5 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-teal-300 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-teal-100">
                Preparing BhoomiAI map
              </p>
            </motion.div>
          </div>
        }
      >
        <BhoomiMap />
      </Suspense>
    </main>
  );
}
