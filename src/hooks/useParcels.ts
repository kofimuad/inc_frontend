"use client";

import { useEffect, useState } from "react";
import demo from "@/data/parcels.demo.json";
import {
  getReconciliation, listParcels, listContainers,
  type Parcel, type Reconciliation, type ContainerSummary,
} from "@/services/parcels";

export interface ParcelData {
  reconciliation: Reconciliation;
  parcels: Parcel[];
  containers: ContainerSummary[];
  loading: boolean;
  /** true when the live API was unreachable and bundled sample data is shown. */
  isDemo: boolean;
  reload: () => void;
}

const demoData = demo as unknown as {
  reconciliation: Reconciliation;
  parcels: Parcel[];
  containers: ContainerSummary[];
};

/**
 * Loads the parcel model from the live API, falling back to the bundled sample
 * (derived from the real July/August sheets) when the backend is unreachable —
 * so the workspace is always demonstrable.
 */
export function useParcels(): ParcelData {
  const [state, setState] = useState<Omit<ParcelData, "reload">>({
    reconciliation: demoData.reconciliation,
    parcels: [],
    containers: [],
    loading: true,
    isDemo: false,
  });

  const load = () => {
    setState((s) => ({ ...s, loading: true }));
    Promise.all([getReconciliation(), listParcels({ limit: 100 }), listContainers()])
      .then(([reconciliation, parcelPage, containers]) => {
        setState({ reconciliation, parcels: parcelPage.parcels, containers, loading: false, isDemo: false });
      })
      .catch(() => {
        setState({
          reconciliation: demoData.reconciliation,
          parcels: demoData.parcels,
          containers: demoData.containers,
          loading: false,
          isDemo: true,
        });
      });
  };

  useEffect(load, []);
  return { ...state, reload: load };
}
