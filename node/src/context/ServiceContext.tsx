import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getPermissions, getServiceMode } from "../utils/functionUtils";

type PermissionsEnum = "WRITE" | "READ-ONLY";
type ServiceModeEnum = "UQ" | "SUMO" | "MOGA" | ""; // this will need to be expanded as we include more flavours

interface ServiceContextType {
  permissions: PermissionsEnum;
  serviceMode: ServiceModeEnum;
}

const ServiceContext = createContext<ServiceContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export function ServiceContextProvider({ children }: Props) {
  const [permissions, setPermissions] = useState<PermissionsEnum>("READ-ONLY");
  const [serviceMode, setServiceMode] = useState<ServiceModeEnum>("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const responsePermissions = await getPermissions();
        const responseServiceMode = (await getServiceMode()) as ServiceModeEnum;
        if (responsePermissions !== "WRITE" && responsePermissions !== "READ-ONLY") {
          console.warn("Unexpected permissions value, falling back to READ-ONLY:", responsePermissions);
        }
        setPermissions(responsePermissions === "WRITE" ? "WRITE" : "READ-ONLY");
        setServiceMode(responseServiceMode);
      } catch (error) {
        console.error("Backend is not responding with permissions:", error);
        toast.error(
          "Could not load the service configuration from the backend. Running read-only; please reload or contact support.",
        );
      }
    };

    fetchStatus();
  }, []);

  const memo = React.useMemo(
    () => ({
      permissions,
      serviceMode,
    }),
    [permissions, serviceMode],
  );

  return <ServiceContext.Provider value={memo}>{children}</ServiceContext.Provider>;
}

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error("useServiceContext must be used within a ServiceContextProvider");
  }
  return context;
};
