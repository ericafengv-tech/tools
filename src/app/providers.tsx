// app/providers.tsx
'use client'

import { useEffect } from 'react'
import { NextUIProvider } from '@nextui-org/react'
import { useRouter } from 'next/navigation'

export function Providers({children}: { children: React.ReactNode }) {
  const router = useRouter();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        if (args[0]?.includes?.('removeChild') || 
            (typeof args[0] === 'string' && args[0].includes('removeChild'))) {
          return;
        }
        originalError.apply(console, args);
      };
      
      const handleError = (event: ErrorEvent) => {
        if (event.message?.includes('removeChild')) {
          event.preventDefault();
          return;
        }
      };
      
      window.addEventListener('error', handleError);
      
      return () => {
        console.error = originalError;
        window.removeEventListener('error', handleError);
      };
    }
  }, []);
  
  return (
    <NextUIProvider navigate={router.push}>
      {children}
    </NextUIProvider>
  )
}