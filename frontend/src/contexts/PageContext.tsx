import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PageContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  pageActions: ReactNode | null;
  setPageActions: (actions: ReactNode | null) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [pageActions, setPageActions] = useState<ReactNode | null>(null);

  return (
    <PageContext.Provider value={{ pageTitle, setPageTitle, pageActions, setPageActions }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
};


