
'use client';

import { SessionProvider } from "next-auth/react";

export function ClientSessionProvider({ children }) {
  return (
    <SessionProvider 
      // Refetch session every 5 minutes
      refetchInterval={60}
      // Only refetch when window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}