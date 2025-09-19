'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollToHash() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Extract hash from pathname if it exists
    const hash = pathname?.includes('#') ? pathname.split('#')[1] : null;
    
    if (hash) {
      // Find the element with the id matching the hash
      const element = document.getElementById(hash);
      
      if (element) {
        // Scroll to the element with smooth behavior
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); // Small delay to ensure the page is fully rendered
      }
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}