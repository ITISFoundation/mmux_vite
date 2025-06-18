import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPermissions, getServiceMode } from '../utils/function_utils';

interface ServiceContextType {
  permissions: string;
  serviceMode: string;
}

export const ServiceContext = createContext<ServiceContextType>(undefined!);

type Props = {
  children: React.ReactNode;
};

export const ServiceContextProvider = ({ children }: Props) => {
  const [permissions, setPermissions] = useState('');
  const [serviceMode, setServiceMode] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const responsePermissions = await getPermissions();
        const responseServiceMode = await getServiceMode();
        setPermissions(responsePermissions);
        setServiceMode(responseServiceMode);
      } catch (error) {
        console.error("Backend is not responding with permissions:", error);
      }
    };

    fetchStatus();
  }, []);

  const memo = React.useMemo(() => ({
    permissions,
    serviceMode,
  }), [permissions, serviceMode]);

  return (
    <ServiceContext.Provider value={memo}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServiceContext must be used within a ServiceContextProvider');
  }
  return context;
}