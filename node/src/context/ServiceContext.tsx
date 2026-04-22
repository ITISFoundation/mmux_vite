import React, { createContext, useContext, useState, useEffect } from "react";
import { getPermissions, getServiceMode } from "../utils/function_utils";

type PermissionsEnum = "WRITE" | "READ-ONLY";
type ServiceModeEnum = "UQ" | "SUMO" | "MOGA" | ""; // this will need to be expanded as we include more flavours

export interface ServiceContextType {
  permissions: PermissionsEnum;
  serviceMode: ServiceModeEnum;
}

export const ServiceContext = createContext<ServiceContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export function ServiceContextProvider({ children }: Props) {
  const [permissions, setPermissions] = useState<PermissionsEnum>("READ-ONLY");
  const [serviceMode, setServiceMode] = useState<ServiceModeEnum>("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const responsePermissions = (await getPermissions()) as PermissionsEnum;
        const responseServiceMode = (await getServiceMode()) as ServiceModeEnum;
        setPermissions(responsePermissions);
        setServiceMode(responseServiceMode);
      } catch (error) {
        console.error("Backend is not responding with permissions:", error);
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
