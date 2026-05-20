const DEFAULT_TRACEABILITY_API_URL = "https://agri1-32qq.onrender.com";

export const getTraceabilityApiUrl = () =>
  (import.meta.env.VITE_TRACEABILITY_API_BASE_URL || DEFAULT_TRACEABILITY_API_URL).replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${getTraceabilityApiUrl()}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      `Traceability request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
};

const fallbackSupplierTraces = {
  operatingAreas: [
    {
      village: "Sambalpur",
      district: "Sambalpur",
      state: "Odisha",
      pincode: "768001",
    },
  ],
  traces: [
    {
      packingId: 101,
      harvestId: 51,
      cropId: 21,
      plantationId: 11,
      plantationName: "Green Valley Farm",
      farmName: "Demo Farm",
      growerName: "Demo Grower",
      growerUserId: 1,
      cropName: "Wheat",
      cropVariety: "Premium",
      originLocation: "Sambalpur, Odisha",
      matchedArea: "Sambalpur, Odisha",
      packingCity: "Sambalpur",
      packingState: "Odisha",
      packingPincode: "768001",
      warehouseName: "Green Warehouse",
      harvestDate: "2026-04-01",
      packingDate: "2026-04-02",
      numPackages: 10,
      netWeight: 480,
      packingSize: "50kg bag",
      assignedPatchId: "",
    },
  ],
};

const normalizeSupplierTraces = (payload) => {
  if (Array.isArray(payload)) {
    return { traces: payload, operatingAreas: [] };
  }

  return {
    traces: Array.isArray(payload?.traces) ? payload.traces : [],
    operatingAreas: Array.isArray(payload?.operatingAreas)
      ? payload.operatingAreas
      : Array.isArray(payload?.operating_areas)
        ? payload.operating_areas
        : [],
  };
};

export const traceabilityApi = {
  async listSupplierFarmTraces() {
    const candidates = [
      "/api/traceability/supplier/farm-traces",
      "/api/supplier/farm-traces",
      "/supplier/farm-traces",
    ];

    let lastError = null;
    for (const path of candidates) {
      try {
        return normalizeSupplierTraces(await request(path));
      } catch (error) {
        lastError = error;
      }
    }

    if (import.meta.env.DEV) {
      console.warn("Using fallback traceability dashboard data", lastError);
      return fallbackSupplierTraces;
    }

    throw lastError || new Error("Unable to load supplier dashboard data.");
  },

  async listPlantations() {
    return request("/api/traceability/plantations");
  },

  async createPlantation(payload) {
    return request("/api/traceability/plantations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
