import { memo } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

import { buildRecommendations } from "./landMetrics";

const RecommendationsPanel = memo(function RecommendationsPanel({ analysis }) {
  const recommendations = buildRecommendations(analysis);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-5 text-white shadow-xl shadow-black/15 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-300 text-slate-950">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
            AI Recommendations
          </p>
          <h2 className="text-xl font-bold">Next best actions</h2>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {recommendations.map((item) => (
          <div key={item} className="flex gap-3 rounded-md border border-white/10 bg-slate-950/35 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <p className="text-sm leading-6 text-slate-200">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default RecommendationsPanel;
