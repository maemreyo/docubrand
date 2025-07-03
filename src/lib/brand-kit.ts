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

  const updateSecondaryColor = (secondaryColor: string) => {
    setBrandKit(prev => ({
      ...prev,
      secondaryColor,
    }));
  };

  const updateAccentColor = (accentColor: string) => {
    setBrandKit(prev => ({
      ...prev,
      accentColor,
    }));
  };

  const updateFont = (font: string) => {
    setBrandKit(prev => ({
      ...prev,
      font,
    }));
  };

  const updateHeaderFont = (headerFont: string) => {
    setBrandKit(prev => ({
      ...prev,
      headerFont,
    }));
  };

  const updateWatermark = (watermark: string | null) => {
    setBrandKit(prev => ({
      ...prev,
      watermark,
    }));
  };

  const updateFooterText = (footerText: string | null) => {
    setBrandKit(prev => ({
      ...prev,
      footerText,
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
    updateSecondaryColor,
    updateAccentColor,
    updateFont,
    updateHeaderFont,
    updateWatermark,
    updateFooterText,
    resetBrandKit,
  };
};

// Predefined Google Fonts for MVP
export const AVAILABLE_FONTS = [
  { name: 'Inter', displayName: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', displayName: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', displayName: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', displayName: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', displayName: 'Poppins', category: 'sans-serif' },
  { name: 'Merriweather', displayName: 'Merriweather', category: 'serif' },
  { name: 'Playfair Display', displayName: 'Playfair Display', category: 'serif' },
  { name: 'Montserrat', displayName: 'Montserrat', category: 'sans-serif' },
  { name: 'Source Sans Pro', displayName: 'Source Sans Pro', category: 'sans-serif' },
  { name: 'PT Serif', displayName: 'PT Serif', category: 'serif' },
  { name: 'Nunito', displayName: 'Nunito', category: 'sans-serif' },
  { name: 'Quicksand', displayName: 'Quicksand', category: 'sans-serif' },
] as const;