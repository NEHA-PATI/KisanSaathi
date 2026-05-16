import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileCheck2, FileText, Loader2, MapPinned, Save, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { analyzePolygon, createLand } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";
import { FARMER_ID, useLandStore } from "@/store/useLandStore";
import { analyzeVisibleFallback, previewFromGeometry } from "./landMetrics";

export default function SaveLandModal() {
  const navigate = useNavigate();
  const [landName, setLandName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [cropHint, setCropHint] = useState("");
  const [documents, setDocuments] = useState([]);
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
        ownerName: ownerName.trim(),
        cropHint: cropHint.trim(),
        documents: documents.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
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
        ownerName: ownerName.trim(),
        cropHint: cropHint.trim(),
        documents: documents.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
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
          className="fixed inset-0 z-[900] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
        >
          <motion.form
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 210, damping: 24 }}
            onSubmit={onSubmit}
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-emerald-200/50 bg-gradient-to-br from-white to-emerald-50/40 text-slate-900 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-emerald-200/30 bg-gradient-to-r from-white to-emerald-50/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/50 bg-emerald-100 text-emerald-700">
                  <MapPinned className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    🌾 Register Land
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Create field record</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200/40 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-700"
                aria-label="Close save land modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[240px_1fr]">
              <div className="border-b border-emerald-200/30 bg-emerald-50/60 p-5 md:border-b-0 md:border-r">
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Drawn land boundary preview"
                    className="h-40 w-full rounded-lg border border-emerald-200/50 object-cover shadow-md"
                  />
                )}
                <div className="mt-4 rounded-lg border border-emerald-200/40 bg-white/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    ✓ Boundary Quality
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-200/30">
                    <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Polygon ready for grid mapping and intelligence.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-900">🌾 Land Name</span>
                    <input
                      value={landName}
                      onChange={(event) => setLandName(event.target.value)}
                      placeholder="North paddy field"
                      className="h-12 w-full rounded-lg border border-emerald-200/50 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      autoFocus
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-900">👤 Owner / Farmer</span>
                    <input
                      value={ownerName}
                      onChange={(event) => setOwnerName(event.target.value)}
                      placeholder="Optional"
                      className="h-11 w-full rounded-lg border border-emerald-200/50 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-900">🌱 Primary Crop</span>
                    <input
                      value={cropHint}
                      onChange={(event) => setCropHint(event.target.value)}
                      placeholder="Paddy, maize..."
                      className="h-11 w-full rounded-lg border border-emerald-200/50 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-900">📄 Land Documents</span>
                  <div className="rounded-lg border border-dashed border-emerald-300/50 bg-emerald-50/60 p-4 transition hover:border-emerald-400/70 hover:bg-emerald-50">
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      id="land-documents"
                      onChange={(event) => setDocuments(Array.from(event.target.files || []))}
                    />
                    <label
                      htmlFor="land-documents"
                      className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200 text-emerald-700">
                        <Upload className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-bold">Upload land record, soil test, or lease</span>
                        <span className="text-xs text-slate-600">PDF, image, or document. Optional.</span>
                      </span>
                    </label>
                  </div>
                </label>

                {documents.length > 0 && (
                  <div className="grid gap-2">
                    {documents.slice(0, 3).map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center gap-2 rounded-lg border border-emerald-200/40 bg-emerald-50/60 px-3 py-2 text-sm text-slate-700"
                      >
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
                        <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!landName.trim() || !geometry || isSaving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 font-bold text-white shadow-md transition hover:from-emerald-700 hover:to-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Field to MaatiTrace
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
