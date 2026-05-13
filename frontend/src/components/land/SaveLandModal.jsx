import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { analyzePolygon, createLand } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";
import { FARMER_ID, useLandStore } from "@/store/useLandStore";
import { analyzeVisibleFallback, previewFromGeometry } from "./landMetrics";

export default function SaveLandModal() {
  const navigate = useNavigate();
  const [landName, setLandName] = useState("");
  const isOpen = useMapStore((state) => state.saveModalOpen);
  const geometry = useMapStore((state) => state.drawnGeometry);
  const analysis = useMapStore((state) => state.analyzeResult);
  const polygons = useMapStore((state) => state.polygons);
  const isSaving = useMapStore((state) => state.isSaving);
  const setAnalyzeResult = useMapStore((state) => state.setAnalyzeResult);
  const setSaveModalOpen = useMapStore((state) => state.setSaveModalOpen);
  const setSaving = useMapStore((state) => state.setSaving);
  const setDrawing = useMapStore((state) => state.setDrawing);
  const clearDrawPoints = useMapStore((state) => state.clearDrawPoints);
  const setError = useMapStore((state) => state.setError);
  const upsertLand = useLandStore((state) => state.upsertLand);

  const previewImage = useMemo(() => previewFromGeometry(geometry), [geometry]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!geometry || !landName.trim()) return;

    setSaving(true);
    setError(null);

    let nextAnalysis = analysis;
    try {
      nextAnalysis = nextAnalysis || (await analyzePolygon(geometry));
      setAnalyzeResult(nextAnalysis);
    } catch {
      nextAnalysis = analyzeVisibleFallback(polygons);
      setAnalyzeResult(nextAnalysis);
      setError("Analyze API is unavailable, so this land uses a visible-map estimate.");
    }

    try {
      const response = await createLand({
        farmerId: FARMER_ID,
        landName: landName.trim(),
        geometry,
      });
      const id = response?.land_id ?? response?.id ?? `local_${Date.now()}`;
      upsertLand({
        id,
        farmerId: FARMER_ID,
        name: landName.trim(),
        geometry,
        previewImage,
        analysis: nextAnalysis,
        savedAt: Date.now(),
      });
      setSaveModalOpen(false);
      setDrawing(false);
      clearDrawPoints();
      navigate(`/lands/${id}`);
    } catch {
      const id = `local_${Date.now()}`;
      upsertLand({
        id,
        farmerId: FARMER_ID,
        name: landName.trim(),
        geometry,
        previewImage,
        analysis: nextAnalysis,
        savedAt: Date.now(),
        isLocalFallback: true,
      });
      setError("Backend save is unavailable, so this land was kept in this browser session.");
      setSaveModalOpen(false);
      setDrawing(false);
      clearDrawPoints();
      navigate(`/lands/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/64 px-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 210, damping: 24 }}
            onSubmit={onSubmit}
            className="w-full max-w-md overflow-hidden rounded-lg border border-emerald-100 bg-white/95 text-slate-900 shadow-2xl shadow-emerald-950/20 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1A9E6E]">
                  Save Land
                </p>
                <h2 className="mt-1 text-xl font-bold">Register this field</h2>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-slate-900"
                aria-label="Close save land modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {previewImage && (
              <img src={previewImage} alt="Drawn land boundary preview" className="h-36 w-full object-cover" />
            )}

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Land Name</span>
                <input
                  value={landName}
                  onChange={(event) => setLandName(event.target.value)}
                  placeholder="North paddy field"
                  className="h-12 w-full rounded-md border border-emerald-100 bg-emerald-50/60 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E6E] focus:ring-2 focus:ring-[#1A9E6E]/20"
                  autoFocus
                />
              </label>

              <button
                type="submit"
                disabled={!landName.trim() || !geometry || isSaving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1A9E6E] font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Land
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
