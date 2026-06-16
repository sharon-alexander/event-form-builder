import { createContext, useContext } from "react";
import type { LocationConfig } from "../locations";

const LocationContext = createContext<LocationConfig | null>(null);

export function LocationProvider({
  config,
  children,
}: {
  config: LocationConfig;
  children: React.ReactNode;
}) {
  return (
    <LocationContext.Provider value={config}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationConfig(): LocationConfig {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocationConfig must be used within a LocationProvider");
  }
  return ctx;
}
