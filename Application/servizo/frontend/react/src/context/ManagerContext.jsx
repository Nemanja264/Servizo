import React, { createContext } from 'react';

const ManagerContext = createContext();

export const ManagerProvider = ({ children }) => {
 
  
  const contextData = {
    
  };

  return (
    <ManagerContext.Provider value={contextData}>
      {children}
    </ManagerContext.Provider>
  );
};

export default ManagerContext;
