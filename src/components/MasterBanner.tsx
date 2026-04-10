'use client';

import { useEffect, useState } from 'react';

export function MasterBanner() {
  const [hasMaster, setHasMaster] = useState(true);

  useEffect(() => {
    try {
      const masterData = localStorage.getItem('ambrish_master');
      if (!masterData) {
        setHasMaster(false);
      } else {
        const parsed = JSON.parse(masterData);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setHasMaster(false);
        } else {
          setHasMaster(true);
        }
      }
    } catch {
      setHasMaster(false);
    }
    
    // Listen to storage events from upload
    const handleStorageChange = () => {
      const masterData = localStorage.getItem('ambrish_master');
      setHasMaster(!!masterData);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('master-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('master-updated', handleStorageChange);
    };
  }, []);

  if (hasMaster) return null;

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-3 text-center text-sm font-semibold shadow-sm">
      <p>No master CSV loaded. Please upload the master ambrish list to get started.</p>
    </div>
  );
}
