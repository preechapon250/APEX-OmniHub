import { useState, useEffect } from 'react';

export const useManMode = () => {
  const [manModeActive, setManModeActive] = useState(false);
  useEffect(() => {
    // In production, check user role/claims here
    const isMan = localStorage.getItem('apex_man_mode') === 'true';
    setManModeActive(isMan);
  }, []);
  return { manModeActive };
};
