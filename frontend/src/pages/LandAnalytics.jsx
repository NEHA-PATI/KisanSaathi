import { lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Droplets, Grid3X3, LandPlot, Leaf, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { fetchLand, fetchLandOverlaps, fetchLandTrends } from "@/api/mapApi";
import HistoricTrendCards from "@/components/land/HistoricTrendCards";
import RecommendationsPanel from "@/components/land/RecommendationsPanel";
import { useLandStore } from "@/store/useLandStore";

const LandAnalyticsMap = lazy(() => import("@/components/land/LandAnalyticsMap"));

const Metric = ({ icon: Icon, label, value, suffix = "", tone = "bg-emerald-100 border-emerald-200 text-emerald-700" }) => (
  <div className={`group relative overflow-hidden rounded-xl border ${tone.split(' ').slice(1).join(' ')} ${tone.split(' ')[0]} bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-sm transition hover:shadow-md hover:border-emerald-300`}>
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent" />
    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-emerald-600">{label}</p>
    <p className="mt-1.5 text-2xl font-bold text-slate-900">
      {value}
      <span className="ml-1 text-sm text-emerald-600">{suffix}</span>
    </p>
  </div>
);

const CoverageStat = ({ label, value }) => (
  <div className="rounded-lg border border-emerald-200/40 bg-gradient-to-br from-emerald-50/80 to-white px-3 py-2.5 transition hover:border-emerald-200/60 hover:bg-emerald-50">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{label}</p>
    <p className="mt-1.5 text-lg font-black text-slate-900">{value}</p>
  </div>
);

const weightedAverage = (rows, key) => {
  const totalWeight = rows.reduce((total, row) => total + Number(row.overlap_area_m2 || 0), 0);
  if (!totalWeight) return 0;
  return rows.reduce((total, row) => total + Number(row[key] || 0) * Number(row.overlap_area_m2 || 0), 0) / totalWeight;
};

const hasPredictionValue = (analysis) =>
  analysis &&
  [analysis.health, analysis.avg_health, analysis.crop_greenness, analysis.avg_ndvi, analysis.water_need, analysis.irrigation_need_pct]
    .some((value) => value !== null && value !== undefined && Number.isFinite(Number(value)));

export default function LandAnalytics() {
  const { id } = useParams();
  const localLand = useLandStore((state) => state.getLand(id));

  const landQuery = useQuery({
    queryKey: ["land", id],
    queryFn: () => fetchLand(id),
    enabled: Boolean(id) && !String(id).startsWith("local_"),
  });

  const trendsQuery = useQuery({
    queryKey: ["land-trends", id],
    queryFn: () => fetchLandTrends(id),
    enabled: Boolean(id) && !String(id).startsWith("local_"),
  });

  const latestDate = landQuery.data?.latest_snapshot?.date || trendsQuery.data?.at(-1)?.date;
  const isBackendLandId = Boolean(id) && /^\d+$/.test(String(id));

  const overlapsQuery = useQuery({
    queryKey: ["land-overlaps", id, latestDate || "latest"],
    queryFn: () => fetchLandOverlaps(id, latestDate),
    enabled: isBackendLandId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const land = useMemo(() => {
    if (!landQuery.data) return localLand;
    return {
      id: landQuery.data.land_id,
      name: landQuery.data.land_name,
      geometry: landQuery.data.geometry,
      areaHectares: landQuery.data.area_hectares,
      analysis: landQuery.data.latest_snapshot,
    };
  }, [landQuery.data, localLand]);

  const overlaps = overlapsQuery.data || [];
  const trends = trendsQuery.data || [];

  const overlapAnalysis = useMemo(() => {
    if (!overlaps.length) return null;
    const health = weightedAverage(overlaps, "health_score");
    const waterNeed = weightedAverage(overlaps, "water_need");
    const risk = weightedAverage(overlaps, "risk_score");
    return {
      date: overlaps.find((cell) => cell.date)?.date,
      health,
      crop_greenness: weightedAverage(overlaps, "crop_greenness"),
      soil_wetness: weightedAverage(overlaps, "soil_wetness"),
      water_stress: weightedAverage(overlaps, "water_stress"),
      heat_stress: weightedAverage(overlaps, "heat_stress"),
      water_need: waterNeed,
      risk,
      risk_label: risk >= 0.5 || health < 4.2 || waterNeed >= 70 ? "High" : health < 7 || waterNeed >= 45 ? "Moderate" : "Low",
      irrigation_advice: `Weighted from ${overlaps.length} covered grid cells. Water need is ${waterNeed.toFixed(0)}%.`,
      cell_count: overlaps.length,
    };
  }, [overlaps]);

  const analysis = hasPredictionValue(land?.analysis) ? land.analysis : overlapAnalysis || land?.analysis || {};

  const coverageStats = useMemo(() => {
    const partial = overlaps.filter((cell) => Number(cell.coverage_pct) > 0.05 && Number(cell.coverage_pct) < 99.5);
    const full = overlaps.filter((cell) => Number(cell.coverage_pct) >= 99.5);
    const avg = overlaps.length
      ? overlaps.reduce((total, cell) => total + Number(cell.coverage_pct || 0), 0) / overlaps.length
      : 0;
    return {
      total: overlaps.length,
      partial: partial.length,
      full: full.length,
      avg,
    };
  }, [overlaps]);

  const areaLabel = useMemo(() => {
    if (land?.areaHectares) return `${Number(land.areaHectares).toFixed(2)} ha`;
    const ring = land?.geometry?.coordinates?.[0] || [];
    if (ring.length < 4) return "NA";
    return `${Math.max(0.4, ring.length * 0.18).toFixed(1)} ha`;
  }, [land?.areaHectares, land?.geometry]);

  if (landQuery.isLoading && !localLand) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white px-4 text-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  if (!land) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white px-4 text-slate-900">
        <div className="max-w-md rounded-xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/40 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <MapPinned className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Field Not Found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Draw and save a field from MaatiTrace to open its detailed analytics.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
          >
            <MapPinned className="h-4 w-4" />
            Open MaatiTrace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-emerald-50/40 to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-200/30 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200/40 bg-emerald-50/60 text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300"
              aria-label="Back to MaatiTrace"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                MaatiTrace Intelligence
              </p>
              <h1 className="truncate text-2xl font-bold text-slate-900">{land.name}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${analysis.risk_label === "High" || Number(analysis.risk || 0) >= 0.5
                ? "border-red-300/50 bg-red-50/60 text-red-700"
                : "border-amber-300/50 bg-amber-50/60 text-amber-700"
              }`}>
              {analysis.risk_label || (Number(analysis.risk || 0) >= 0.5 ? "High" : "Low")} Risk
            </span>
            <span className="rounded-full border border-blue-300/50 bg-blue-50/60 px-3 py-1 text-sm font-semibold text-blue-700">
              {coverageStats.partial} Partial Cells
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4">
        <section className="grid gap-3 md:grid-cols-4">
          <CoverageStat label="Covered Cells" value={coverageStats.total} />
          <CoverageStat label="Partial Cells" value={coverageStats.partial} />
          <CoverageStat label="Full Cells" value={coverageStats.full} />
          <CoverageStat label="Avg Coverage" value={`${coverageStats.avg.toFixed(0)}%`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_390px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/30 shadow-md"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[410] flex items-center justify-between p-3">
              <div className="rounded-full border border-emerald-300/50 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 backdrop-blur-sm">
                📍 Precision Grid
              </div>
              <div className="rounded-full border border-amber-300/50 bg-white/90 px-3 py-1 text-xs font-bold text-amber-700 backdrop-blur-sm">
                {latestDate || overlapAnalysis?.date || "Latest"}
              </div>
            </div>
            <Suspense
              fallback={
                <div className="flex min-h-[360px] items-center justify-center bg-emerald-50/50">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </div>
              }
            >
              <LandAnalyticsMap geometry={land.geometry} overlaps={overlaps} />
            </Suspense>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/30 p-5 shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              <LandPlot className="h-3.5 w-3.5" />
              Field Analytics
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Real-time Insights</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {analysis.irrigation_advice || "Monitoring signals are ready for this registered field."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric icon={ShieldCheck} label="Health" value={Number(analysis.health ?? analysis.avg_health ?? 0).toFixed(1)} tone="bg-emerald-100 border-emerald-300 text-emerald-700" />
              <Metric icon={Droplets} label="Water Need" value={Number(analysis.water_need ?? analysis.irrigation_need_pct ?? 0).toFixed(0)} suffix="%" tone="bg-blue-100 border-blue-300 text-blue-700" />
              <Metric icon={Leaf} label="Crop Greenness" value={Number(analysis.crop_greenness ?? analysis.avg_ndvi ?? (analysis.avg_health || 0) / 10).toFixed(2)} tone="bg-lime-100 border-lime-300 text-lime-700" />
              <Metric icon={MapPinned} label="Area" value={areaLabel} tone="bg-amber-100 border-amber-300 text-amber-700" />
            </div>
            <div className="mt-4 grid grid-cols-[36px_1fr] items-center gap-3 rounded-lg border border-emerald-200/40 bg-emerald-50/60 px-3 py-3 text-sm text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-200/60 text-emerald-700">
                <Grid3X3 className="h-4 w-4" />
              </span>
              <span className="font-medium">
                {overlapsQuery.isLoading
                  ? "Loading covered grids..."
                  : `${overlaps.length} covered grid${overlaps.length === 1 ? "" : "s"} mapped.`}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[36px_1fr] items-center gap-3 rounded-lg border border-amber-200/40 bg-amber-50/60 px-3 py-3 text-sm text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-200/60 text-amber-700">
                <CalendarDays className="h-4 w-4" />
              </span>
              <span className="font-medium">{latestDate || overlapAnalysis?.date ? `Latest: ${latestDate || overlapAnalysis?.date}` : "Snapshot timeline ready soon."}</span>
            </div>
          </motion.aside>
        </section>

        <HistoricTrendCards analysis={analysis} trends={trends} />
        <RecommendationsPanel analysis={analysis} />
      </div>
    </main>
  );
}
