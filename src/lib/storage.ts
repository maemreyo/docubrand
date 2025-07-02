import { BrandKit } from '@/types';

const BRAND_KIT_KEY = 'docubrand_brand_kit';

export const defaultBrandKit: BrandKit = {
  logo: {
    file: null,
    dataUrl: null,
  },
  color: '#3B82F6', // default blue
  font: 'Inter', // default font
};

export const saveBrandKit = (brandKit: BrandKit): void => {
  try {
    // Don't save the File object, only the dataUrl
    const saveData = {
      ...brandKit,
      logo: {
        file: null,
        dataUrl: brandKit.logo.dataUrl,
      },
    };
    localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error('Failed to save brand kit:', error);
  }
};

export const loadBrandKit = (): BrandKit => {
  try {
    const saved = localStorage.getItem(BRAND_KIT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultBrandKit,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Failed to load brand kit:', error);
  }
  return defaultBrandKit;
};

export const clearBrandKit = (): void => {
  try {
    localStorage.removeItem(BRAND_KIT_KEY);
  } catch (error) {
    console.error('Failed to clear brand kit:', error);
  }
};