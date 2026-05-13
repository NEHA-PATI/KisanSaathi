import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FARMER_ID = 1;

export const useLandStore = create(
  persist(
    (set, get) => ({
      lands: {},
      selectedLandId: null,
      upsertLand: (land) =>
        set((state) => ({
          lands: {
            ...state.lands,
            [String(land.id)]: {
              ...state.lands[String(land.id)],
              ...land,
              updatedAt: Date.now(),
            },
          },
          selectedLandId: String(land.id),
        })),
      getLand: (id) => get().lands[String(id)] || null,
      setSelectedLandId: (selectedLandId) => set({ selectedLandId }),
    }),
    {
      name: "bhoomiai-lands",
      partialize: (state) => ({ lands: state.lands, selectedLandId: state.selectedLandId }),
    }
  )
);
