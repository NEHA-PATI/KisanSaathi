import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle,
  Grid3X3,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Plus,
  Sprout,
  User,
} from "lucide-react";
import SupplierDashboard from "./SupplierDashboard";
import TraceabilityPage from "./TraceabilityPage";
import { getTraceabilityApiUrl, traceabilityApi } from "../api/traceabilityApi";
import "../styles/traceconnect.css";

const TODAY = new Date().toISOString().slice(0, 10);

const demoPlantations = [
  {
    id: "demo-1",
    name: "Demo Farm",
    location: "Sambalpur, Odisha",
    type: "crop",
    status: "Active",
    createdAt: TODAY,
  },
];

const normalizePlantation = (row) => ({
  id: row.id ?? row.plantation_id ?? crypto.randomUUID(),
  name: row.name || row.plantationName || row.farm_name || "Farm Trace",
  location: row.location_description || row.location || row.originLocation || "Location not available",
  type: row.type || "crop",
  status: row.status || "Active",
  createdAt: String(row.created_at || row.createdAt || TODAY).slice(0, 10),
});

function StatCard({ icon, label, value, color = "green" }) {
  return (
    <article className="tc-stat-card">
      <span className={`tc-stat-icon ${color}`}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function GrowerWorkspace() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    plantations: [],
  });
  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "crop",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    traceabilityApi
      .listPlantations()
      .then((rows) => {
        if (!mounted) return;
        const plantations = Array.isArray(rows) ? rows.map(normalizePlantation) : [];
        setState({
          loading: false,
          error: "",
          plantations: plantations.length ? plantations : demoPlantations,
        });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({
          loading: false,
          error: `External traceability backend is reachable at ${getTraceabilityApiUrl()}, but plantations could not be loaded: ${error.message}`,
          plantations: demoPlantations,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(
    () => ({
      plantations: state.plantations.length,
      active: state.plantations.filter((item) => String(item.status).toLowerCase() === "active").length,
    }),
    [state.plantations],
  );

  const createPlantation = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.location.trim()) return;

    setSaving(true);
    try {
      const created = await traceabilityApi.createPlantation({
        name: form.name.trim(),
        location_description: form.location.trim(),
        type: form.type,
        status: "active",
      });
      setState((current) => ({
        ...current,
        error: "",
        plantations: [normalizePlantation(created), ...current.plantations],
      }));
      setForm({ name: "", location: "", type: "crop" });
    } catch (error) {
      const local = normalizePlantation({
        id: `local-${Date.now()}`,
        name: form.name,
        location: form.location,
        type: form.type,
        status: "Active",
      });
      setState((current) => ({
        ...current,
        error: `Could not save to the external backend yet: ${error.message}. Showing your entry locally for this session.`,
        plantations: [local, ...current.plantations],
      }));
      setForm({ name: "", location: "", type: "crop" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="tc-page-container">
      <div className="tc-dashboard-hero">
        <div>
          <span className="tc-kicker">Grower Workspace</span>
          <h1>Seed-to-Batch Traceability Dashboard</h1>
          <p>
            Create farm traces, register crop lifecycle activity, and prepare
            verified supply-chain records using the external traceability backend.
          </p>
        </div>
        <div className="tc-api-panel">
          <span>Connected Backend</span>
          <strong>{getTraceabilityApiUrl()}</strong>
        </div>
      </div>

      {state.error && <div className="tc-alert">{state.error}</div>}

      <div className="tc-stats-row">
        <StatCard icon={<Grid3X3 />} label="Plantations" value={totals.plantations} />
        <StatCard icon={<CheckCircle />} label="Active Traces" value={totals.active} color="blue" />
        <StatCard icon={<Package />} label="Packings" value="Demo" color="amber" />
        <StatCard icon={<BarChart2 />} label="Reports" value="Live" color="purple" />
      </div>

      <div className="tc-grid-layout">
        <form className="tc-card" onSubmit={createPlantation}>
          <div className="tc-card-title">
            <Plus />
            Add New Plantation
          </div>
          <label>
            Production Type
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="crop">Crop Farming</option>
              <option value="shrimp">Shrimp / Prawn Aquaculture</option>
            </select>
          </label>
          <label>
            Plantation Name
            <input
              placeholder="e.g. Green Valley Farm"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            Location
            <input
              placeholder="e.g. Sambalpur, Odisha"
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            />
          </label>
          <button className="tc-primary-btn" type="submit" disabled={saving}>
            {saving ? <Loader2 className="tc-spin" /> : <Plus />}
            Create Trace
          </button>
        </form>

        <div className="tc-card tc-list-card">
          <div className="tc-card-title">
            <Leaf />
            Plantations
          </div>
          {state.loading ? (
            <div className="tc-empty">Loading traceability data...</div>
          ) : (
            <div className="tc-plantation-list">
              {state.plantations.map((plantation) => (
                <article key={plantation.id} className="tc-plantation-card">
                  <div className="tc-plantation-top">
                    <span>{plantation.type === "shrimp" ? "Aquaculture" : "Crop Farming"}</span>
                    <strong>{plantation.status}</strong>
                  </div>
                  <h3>{plantation.name}</h3>
                  <p>
                    <MapPin />
                    {plantation.location}
                  </p>
                  <p>
                    <Calendar />
                    Created {plantation.createdAt}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function TraceConnect() {
  const [view, setView] = useState("grower");

  useEffect(() => {
    document.body.classList.add("traceconnect-body");
    document.getElementById("root")?.classList.add("traceconnect-root-host");

    return () => {
      document.body.classList.remove("traceconnect-body");
      document.getElementById("root")?.classList.remove("traceconnect-root-host");
    };
  }, []);

  return (
    <div className="tc-root">
      <header className="tc-header">
        <button className="tc-brand" type="button" onClick={() => setView("landing")}>
          <Sprout />
          <span>Seed-to-Batch</span>
        </button>
        <nav>
          <button className={view === "landing" ? "active" : ""} type="button" onClick={() => setView("landing")}>
            <Leaf /> Overview
          </button>
          <button className={view === "grower" ? "active" : ""} type="button" onClick={() => setView("grower")}>
            <User /> Grower
          </button>
          <button className={view === "supplier" ? "active" : ""} type="button" onClick={() => setView("supplier")}>
            <Package /> Supplier
          </button>
        </nav>
      </header>

      {view === "landing" ? (
        <TraceabilityPage
          embedded
          centerDashboardButton
          onGoToDashboard={() => setView("grower")}
        />
      ) : view === "supplier" ? (
        <SupplierDashboard />
      ) : (
        <GrowerWorkspace />
      )}

      <a className="tc-floating-link" href="/traceability">
        Back to Traceability <ArrowRight />
      </a>
    </div>
  );
}
