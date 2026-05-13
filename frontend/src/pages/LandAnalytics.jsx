import { lazy, Suspense, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Droplets, Leaf, MapPinned, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import HistoricTrendCards from "@/components/land/HistoricTrendCards";
import RecommendationsPanel from "@/components/land/RecommendationsPanel";
import { useLandStore } from "@/store/useLandStore";

const LandAnalyticsMap = lazy(() => import("@/components/land/LandAnalyticsMap"));

const Metric = ({ icon: Icon, label, value, suffix = "" }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-teal-300/15 text-teal-200">
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">
      {value}
      <span className="ml-1 text-sm text-slate-400">{suffix}</span>
    </p>
  </div>
);

export default function LandAnalytics() {
  const { id } = useParams();
  const land = useLandStore((state) => state.getLand(id));
  const analysis = land?.analysis || {};

  const areaLabel = useMemo(() => {
    const ring = land?.geometry?.coordinates?.[0] || [];
    if (ring.length < 4) return "NA";
    return `${Math.max(0.4, ring.length * 0.18).toFixed(1)} ha`;
  }, [land?.geometry]);

  if (!land) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03130d] px-4 text-white">
        <div className="max-w-md rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center shadow-2xl backdrop-blur-xl">
          <MapPinned className="mx-auto mb-4 h-9 w-9 text-teal-200" />
          <h1 className="text-2xl font-bold">Land not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Draw and save a field from the dashboard to open its analytics.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-teal-300 px-5 font-bold text-slate-950 transition hover:bg-teal-200"
          >
            Open Land Map
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03130d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#03130d]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                BhoomiAI
              </p>
              <h1 className="truncate text-2xl font-bold">{land.name}</h1>
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100 sm:inline-flex">
            {analysis.risk || "Low"} risk
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_390px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/25"
          >
            <Suspense
              fallback={
                <div className="flex min-h-[360px] items-center justify-center bg-slate-900/80">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-200 border-t-transparent" />
                </div>
              }
            >
              <LandAnalyticsMap geometry={land.geometry} />
            </Suspense>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
              Analytics
            </p>
            <h2 className="mt-1 text-xl font-bold">Field intelligence</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {analysis.irrigation_advice || "Monitoring signals are ready for this registered field."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric icon={ShieldCheck} label="Health" value={Number(analysis.avg_health || 0).toFixed(1)} />
              <Metric icon={Droplets} label="Irrigation" value={Number(analysis.irrigation_need_pct || 0).toFixed(0)} suffix="%" />
              <Metric icon={Leaf} label="NDVI" value={Number(analysis.avg_ndvi ?? (analysis.avg_health || 0) / 10).toFixed(2)} />
              <Metric icon={MapPinned} label="Area" value={areaLabel} />
            </div>
          </motion.aside>
        </section>

        <HistoricTrendCards analysis={analysis} />
        <RecommendationsPanel analysis={analysis} />
      </div>
    </main>
  );
}
