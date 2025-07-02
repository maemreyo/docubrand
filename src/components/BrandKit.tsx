'use client';

import { useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { BrandKit as BrandKitType } from '@/types';
import { AVAILABLE_FONTS } from '@/lib/brand-kit';

interface BrandKitProps {
  brandKit: BrandKitType;
  onLogoChange: (file: File | null, dataUrl: string | null) => void;
  onColorChange: (color: string) => void;
  onFontChange: (font: string) => void;
}

export function BrandKit({ 
  brandKit, 
  onLogoChange, 
  onColorChange, 
  onFontChange 
}: BrandKitProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Convert to data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onLogoChange(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onLogoChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Kit</h2>
        <p className="text-sm text-gray-600 mb-6">
          Customize your document branding with logo, colors, and fonts.
        </p>

        {/* Logo Upload Section */}
        <div className="brand-kit-section">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Logo</h3>
          
          {brandKit.logo.dataUrl ? (
            <div className="space-y-3">
              <div className="w-full h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <img
                  src={brandKit.logo.dataUrl}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex-1 text-xs"
                >
                  Change Logo
                </button>
                <button
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-700 text-xs px-3 py-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center text-sm text-gray-600"
            >
              <div className="text-center">
                <div className="text-lg mb-1">📁</div>
                Upload Logo
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* Color Picker Section */}
        <div className="brand-kit-section">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Brand Color</h3>
          <div className="space-y-3">
            <HexColorPicker 
              color={brandKit.color} 
              onChange={onColorChange}
              style={{ width: '100%', height: '150px' }}
            />
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: brandKit.color }}
              />
              <input
                type="text"
                value={brandKit.color.toUpperCase()}
                onChange={(e) => onColorChange(e.target.value)}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        {/* Font Selector Section */}
        <div className="brand-kit-section">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Font Family</h3>
          <select
            value={brandKit.font}
            onChange={(e) => onFontChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {AVAILABLE_FONTS.map((font) => (
              <option key={font.name} value={font.name}>
                {font.displayName}
              </option>
            ))}
          </select>
          
          {/* Font Preview */}
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <p 
              className="text-sm"
              style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
            >
              Sample text in {brandKit.font}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}