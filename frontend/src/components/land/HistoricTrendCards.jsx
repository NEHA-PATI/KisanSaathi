import { memo } from "react";
import { Activity, Droplets, Leaf, ThermometerSun } from "lucide-react";

const chartPath = (values) => {
  const max = Math.max(...values, 10);
  return values
    .map((value, index) => {
      const x = 8 + (index / Math.max(values.length - 1, 1)) * 144;
      const y = 72 - (value / max) * 56;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const TrendCard = memo(function TrendCard({ title, value, suffix = "", values, icon: Icon, tone }) {
  const path = chartPath(values);

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.06] p-4 text-white shadow-xl shadow-black/15 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="mt-1 text-3xl font-bold">
            {value}
            <span className="ml-1 text-sm font-semibold text-slate-400">{suffix}</span>
          </p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <svg viewBox="0 0 160 82" className="mt-3 h-24 w-full overflow-visible">
        <path d={`${path} L 152 82 L 8 82 Z`} fill="rgba(45, 212, 191, 0.11)" />
        <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </article>
  );
});

const HistoricTrendCards = memo(function HistoricTrendCards({ analysis }) {
  const health = Number(analysis?.avg_health || 0);
  const irrigation = Number(analysis?.irrigation_need_pct || 0);
  const trend = analysis?.trend?.length ? analysis.trend : [health - 0.7, health - 0.2, health, health + 0.25];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <TrendCard
        title="Crop Health"
        value={health.toFixed(1)}
        values={trend}
        icon={Activity}
        tone="bg-emerald-400/15 text-emerald-200"
      />
      <TrendCard
        title="NDVI"
        value={Number(analysis?.avg_ndvi ?? health / 10).toFixed(2)}
        values={trend.map((value) => Math.max(0, Math.min(10, value + 0.4)))}
        icon={Leaf}
        tone="bg-lime-400/15 text-lime-200"
      />
      <TrendCard
        title="Water Stress"
        value={irrigation.toFixed(0)}
        suffix="%"
        values={[irrigation * 0.07, irrigation * 0.08, irrigation * 0.095, irrigation * 0.1]}
        icon={Droplets}
        tone="bg-sky-400/15 text-sky-200"
      />
      <TrendCard
        title="Heat Risk"
        value={analysis?.risk || "Low"}
        values={trend.map((value) => Math.max(0, 10 - value))}
        icon={ThermometerSun}
        tone="bg-amber-400/15 text-amber-200"
      />
    </section>
  );
});

export default HistoricTrendCards;
