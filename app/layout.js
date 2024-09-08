'use client';

// Updated with Clerk and Firebase
import { ClerkProvider } from '@clerk/nextjs';
import { SWRConfig } from 'swr';
import { useEffect } from 'react';
import { analytics } from './firebase';  // Correct relative import path
import { logEvent } from 'firebase/analytics';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Check if Firebase analytics is loaded and log a custom event
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_path: window.location.pathname,
      });
    }
  }, []);

  return (
    <html lang="en">
      <body>
        <ClerkProvider frontendApi={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <SWRConfig value={{ /* your SWR config */ }}>
            {children}
          </SWRConfig>
        </ClerkProvider>
      </body>
    </html>
  );
}
