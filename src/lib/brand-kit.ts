'use client';

import { useState, useEffect } from 'react';
import { BrandKit } from '@/types';
import { saveBrandKit, loadBrandKit, defaultBrandKit } from './storage';

export const useBrandKit = () => {
  const [brandKit, setBrandKit] = useState<BrandKit>(defaultBrandKit);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load brand kit from localStorage on mount
  useEffect(() => {
    const saved = loadBrandKit();
    setBrandKit(saved);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever brandKit changes
  useEffect(() => {
    if (isLoaded) {
      saveBrandKit(brandKit);
    }
  }, [brandKit, isLoaded]);

  const updateLogo = (file: File | null, dataUrl: string | null) => {
    setBrandKit(prev => ({
      ...prev,
      logo: { file, dataUrl },
    }));
  };

  const updateColor = (color: string) => {
    setBrandKit(prev => ({
      ...prev,
      color,
    }));
  };

  const updateFont = (font: string) => {
    setBrandKit(prev => ({
      ...prev,
      font,
    }));
  };

  const resetBrandKit = () => {
    setBrandKit(defaultBrandKit);
  };

  return {
    brandKit,
    isLoaded,
    updateLogo,
    updateColor,
    updateFont,
    resetBrandKit,
  };
};

// Predefined Google Fonts for MVP
export const AVAILABLE_FONTS = [
  { name: 'Inter', displayName: 'Inter' },
  { name: 'Roboto', displayName: 'Roboto' },
  { name: 'Open Sans', displayName: 'Open Sans' },
  { name: 'Lato', displayName: 'Lato' },
  { name: 'Poppins', displayName: 'Poppins' },
] as const;