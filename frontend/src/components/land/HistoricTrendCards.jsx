import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Droplets, Leaf, ThermometerSun, TrendingUp } from "lucide-react";

const chartPath = (values) => {
  const cleanValues = values.length ? values : [0];
  const max = Math.max(...cleanValues, 10);
  return cleanValues
    .map((value, index) => {
      const x = 8 + (index / Math.max(values.length - 1, 1)) * 144;
      const y = 72 - (value / max) * 56;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const TrendCard = memo(function TrendCard({ title, value, suffix = "", values, icon: Icon, tone, accent }) {
  const path = chartPath(values);
  const trend = values.length > 1 ? (values[values.length - 1] > values[0] ? "↑" : "↓") : "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className={`absolute left-5 top-5 inline-block h-1.5 w-14 rounded-full ${accent}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600">{title}</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900">
                {value}
                <span className="ml-1 text-sm font-medium text-slate-500">{suffix}</span>
              </p>
              {trend && <span className="mb-1 text-lg font-bold text-emerald-600">{trend}</span>}
            </div>
          </div>
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 ${tone}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <svg viewBox="0 0 160 82" className="mt-4 h-20 w-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L 152 82 L 8 82 Z`} fill={`url(#grad-${title})`} />
          <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy={72 - (values[0] / Math.max(...values, 10)) * 56} r="3.5" fill="currentColor" opacity="0.45" />
          <circle cx={8 + ((values.length - 1) / Math.max(values.length - 1, 1)) * 144} cy={72 - (values[values.length - 1] / Math.max(...values, 10)) * 56} r="3.5" fill="currentColor" />
        </svg>
      </div>
    </motion.article>
  );
});

const valuesFromTrends = (trends, key, fallback, limit) => {
  const values = (trends || [])
    .slice(-limit)
    .map((row) => Number(row?.[key]))
    .filter((value) => Number.isFinite(value));
  return values.length ? values : [Number(fallback || 0)];
};

const HistoricTrendCards = memo(function HistoricTrendCards({ analysis, trends = [] }) {
  const [timePeriod, setTimePeriod] = useState("month");

  const periodLimits = {
    week: 7,
    twoweeks: 14,
    month: 30,
    threeMonths: 90,
    all: trends.length,
  };

  const filteredTrends = useMemo(() => {
    return trends.slice(-(periodLimits[timePeriod] || trends.length));
  }, [trends, timePeriod]);

  const health = Number(analysis?.health ?? analysis?.avg_health ?? 0);
  const greenness = Number(analysis?.crop_greenness ?? analysis?.avg_ndvi ?? 0);
  const waterNeed = Number(analysis?.water_need ?? analysis?.irrigation_need_pct ?? 0);
  const heatStress = Number(analysis?.heat_stress ?? analysis?.avg_heat_stress ?? 0);
  const riskLabel = analysis?.risk_label || (Number(analysis?.risk || 0) >= 0.5 ? "High" : "Low");

  const healthTrend = valuesFromTrends(filteredTrends, "health", health, periodLimits[timePeriod]);
  const greennessTrend = valuesFromTrends(filteredTrends, "crop_greenness", greenness, periodLimits[timePeriod]);
  const waterNeedTrend = valuesFromTrends(filteredTrends, "water_need", waterNeed, periodLimits[timePeriod]);
  const heatTrend = valuesFromTrends(filteredTrends, "heat_stress", heatStress, periodLimits[timePeriod]);

  return (
    <section className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200/40 bg-emerald-50/60 p-4"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <p className="font-semibold text-slate-900">Historical Trends</p>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Week", value: "week" },
            { label: "2W", value: "twoweeks" },
            { label: "Month", value: "month" },
            { label: "3M", value: "threeMonths" },
            { label: "All", value: "all" },
          ].map((period) => (
            <motion.button
              key={period.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimePeriod(period.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${timePeriod === period.value
                ? "bg-emerald-600 text-white"
                : "border border-emerald-200/50 bg-white text-emerald-700 hover:bg-emerald-50"
                }`}
            >
              {period.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        layout
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <TrendCard
          title="🌱 Crop Health"
          value={health.toFixed(1)}
          values={healthTrend}
          icon={Activity}
          tone="text-emerald-700"
          accent="bg-emerald-100"
        />
        <TrendCard
          title="🍃 Crop Greenness"
          value={greenness.toFixed(2)}
          values={greennessTrend.map((value) => value * 10)}
          icon={Leaf}
          tone="text-lime-700"
          accent="bg-lime-100"
        />
        <TrendCard
          title="💧 Water Need"
          value={waterNeed.toFixed(0)}
          suffix="%"
          values={waterNeedTrend.map((value) => value / 10)}
          icon={Droplets}
          tone="text-sky-700"
          accent="bg-sky-100"
        />
        <TrendCard
          title="🌡️ Heat Stress"
          value={riskLabel}
          values={heatTrend.map((value) => Math.min(10, Math.max(0, value / 50)))}
          icon={ThermometerSun}
          tone="text-amber-700"
          accent="bg-amber-100"
        />
      </motion.div>
    </section>
  );
});

export default HistoricTrendCards;
