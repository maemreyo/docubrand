'use client';

import { useState, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { BrandKit as BrandKitType } from '@/types';
import { AVAILABLE_FONTS } from '@/lib/brand-kit';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';

interface BrandKitProps {
  brandKit: BrandKitType;
  onLogoChange: (file: File | null, dataUrl: string | null) => void;
  onColorChange: (color: string) => void;
  onSecondaryColorChange?: (color: string) => void;
  onAccentColorChange?: (color: string) => void;
  onFontChange: (font: string) => void;
  onHeaderFontChange?: (font: string) => void;
  onWatermarkChange?: (watermark: string | null) => void;
  onFooterTextChange?: (footerText: string | null) => void;
}

export function BrandKit({ 
  brandKit, 
  onLogoChange, 
  onColorChange,
  onSecondaryColorChange,
  onAccentColorChange,
  onFontChange,
  onHeaderFontChange,
  onWatermarkChange,
  onFooterTextChange
}: BrandKitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
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

  // Group fonts by category
  const fontsByCategory = AVAILABLE_FONTS.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_FONTS>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Collapsible Header */}
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
        <Collapsible.Trigger asChild>
          <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-medium text-gray-900">Document Branding</h2>
              {brandKit.logo.dataUrl && (
                <div className="h-8 w-8 bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
                  <img 
                    src={brandKit.logo.dataUrl} 
                    alt="Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div 
                className="h-5 w-5 rounded-full border border-gray-300"
                style={{ backgroundColor: brandKit.color }}
              />
              <span 
                className="text-sm"
                style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
              >
                {brandKit.font}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isOpen ? 'Click to collapse' : 'Click to customize'}
              </span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M8 10L4 6H12L8 10Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="p-4 border-t border-gray-200">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List className="flex border-b border-gray-200 mb-4">
                <Tabs.Trigger 
                  value="basics"
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'basics' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Basics
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="colors"
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'colors' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Colors
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="typography"
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'typography' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Typography
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="extras"
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'extras' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Extras
                </Tabs.Trigger>
              </Tabs.List>

              {/* Basics Tab */}
              <Tabs.Content value="basics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Logo</h3>
                    <div className="flex items-start gap-4">
                      {brandKit.logo.dataUrl ? (
                        <div>
                          <div className="w-24 h-24 bg-gray-50 rounded-lg border border-gray-300 flex items-center justify-center mb-2 overflow-hidden">
                            <img
                              src={brandKit.logo.dataUrl}
                              alt="Logo preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Change
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={handleRemoveLogo}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 bg-gray-50 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center text-sm text-gray-600"
                        >
                          <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">Upload Logo</span>
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
                      
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">
                          Upload your school or institution logo to brand your documents.
                        </p>
                        <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                          <li>Recommended size: 400x200 pixels</li>
                          <li>Transparent background (PNG) works best</li>
                          <li>Max file size: 5MB</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Primary Color & Font */}
                  <div className="space-y-4">
                    {/* Primary Color */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Primary Color</h3>
                      <div className="flex items-center gap-3">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button 
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                              style={{ backgroundColor: brandKit.color }}
                              aria-label="Pick a color"
                            />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-50">
                              <HexColorPicker 
                                color={brandKit.color} 
                                onChange={onColorChange}
                                style={{ width: '200px', height: '150px' }}
                              />
                              <Popover.Arrow className="fill-white" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                        <input
                          type="text"
                          value={brandKit.color.toUpperCase()}
                          onChange={(e) => onColorChange(e.target.value)}
                          className="w-28 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="#000000"
                        />
                        <span className="text-xs text-gray-500">
                          Used for headers and accents
                        </span>
                      </div>
                    </div>

                    {/* Primary Font */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Primary Font</h3>
                      <div className="flex items-center gap-3">
                        <select
                          value={brandKit.font}
                          onChange={(e) => onFontChange(e.target.value)}
                          className="w-40 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.entries(fontsByCategory).map(([category, fonts]) => (
                            <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                              {fonts.map((font) => (
                                <option key={font.name} value={font.name}>
                                  {font.displayName}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <span 
                          className="text-sm flex-1 truncate"
                          style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
                        >
                          Sample text in {brandKit.font}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              {/* Colors Tab */}
              <Tabs.Content value="colors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Primary Color */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Primary Color</h3>
                    <div className="space-y-2">
                      <div 
                        className="w-full h-12 rounded border border-gray-300"
                        style={{ backgroundColor: brandKit.color }}
                      />
                      <div className="flex items-center gap-2">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button 
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              style={{ backgroundColor: brandKit.color }}
                              aria-label="Pick a color"
                            />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-50">
                              <HexColorPicker 
                                color={brandKit.color} 
                                onChange={onColorChange}
                                style={{ width: '200px', height: '150px' }}
                              />
                              <Popover.Arrow className="fill-white" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                        <input
                          type="text"
                          value={brandKit.color.toUpperCase()}
                          onChange={(e) => onColorChange(e.target.value)}
                          className="w-28 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="#000000"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Used for headers, titles, and primary elements
                      </p>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Secondary Color</h3>
                    <div className="space-y-2">
                      <div 
                        className="w-full h-12 rounded border border-gray-300"
                        style={{ backgroundColor: brandKit.secondaryColor }}
                      />
                      <div className="flex items-center gap-2">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button 
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              style={{ backgroundColor: brandKit.secondaryColor }}
                              aria-label="Pick a color"
                            />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-50">
                              <HexColorPicker 
                                color={brandKit.secondaryColor} 
                                onChange={onSecondaryColorChange || (() => {})}
                                style={{ width: '200px', height: '150px' }}
                              />
                              <Popover.Arrow className="fill-white" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                        <input
                          type="text"
                          value={brandKit.secondaryColor.toUpperCase()}
                          onChange={(e) => onSecondaryColorChange?.(e.target.value)}
                          className="w-28 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="#000000"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Used for backgrounds, borders, and secondary elements
                      </p>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Accent Color</h3>
                    <div className="space-y-2">
                      <div 
                        className="w-full h-12 rounded border border-gray-300"
                        style={{ backgroundColor: brandKit.accentColor }}
                      />
                      <div className="flex items-center gap-2">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button 
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              style={{ backgroundColor: brandKit.accentColor }}
                              aria-label="Pick a color"
                            />
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-50">
                              <HexColorPicker 
                                color={brandKit.accentColor} 
                                onChange={onAccentColorChange || (() => {})}
                                style={{ width: '200px', height: '150px' }}
                              />
                              <Popover.Arrow className="fill-white" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                        <input
                          type="text"
                          value={brandKit.accentColor.toUpperCase()}
                          onChange={(e) => onAccentColorChange?.(e.target.value)}
                          className="w-28 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="#000000"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Used for highlights, buttons, and interactive elements
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Palette Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Color Palette Preview</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.color }}
                        />
                        <span className="text-xs mt-1">Primary</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.secondaryColor }}
                        />
                        <span className="text-xs mt-1">Secondary</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.accentColor }}
                        />
                        <span className="text-xs mt-1">Accent</span>
                      </div>
                      
                      {/* Color variations */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.color, opacity: 0.8 }}
                        />
                        <span className="text-xs mt-1">Primary 80%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.color, opacity: 0.5 }}
                        />
                        <span className="text-xs mt-1">Primary 50%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-sm"
                          style={{ backgroundColor: brandKit.color, opacity: 0.2 }}
                        />
                        <span className="text-xs mt-1">Primary 20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              {/* Typography Tab */}
              <Tabs.Content value="typography" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Body Font */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Body Font</h3>
                    <div className="space-y-3">
                      <select
                        value={brandKit.font}
                        onChange={(e) => onFontChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(fontsByCategory).map(([category, fonts]) => (
                          <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                            {fonts.map((font) => (
                              <option key={font.name} value={font.name}>
                                {font.displayName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {/* Font Preview */}
                      <div className="p-3 bg-gray-50 rounded border">
                        <p 
                          className="text-sm mb-2"
                          style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
                        >
                          <span className="font-bold">Body text in {brandKit.font}.</span> This is how your main content will appear in documents.
                        </p>
                        <p 
                          className="text-xs"
                          style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
                        >
                          The quick brown fox jumps over the lazy dog. 0123456789
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Header Font */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Header Font</h3>
                    <div className="space-y-3">
                      <select
                        value={brandKit.headerFont}
                        onChange={(e) => onHeaderFontChange?.(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(fontsByCategory).map(([category, fonts]) => (
                          <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                            {fonts.map((font) => (
                              <option key={font.name} value={font.name}>
                                {font.displayName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {/* Font Preview */}
                      <div className="p-3 bg-gray-50 rounded border">
                        <p 
                          className="text-base font-bold mb-2"
                          style={{ fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})` }}
                        >
                          Header text in {brandKit.headerFont}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})` }}
                        >
                          The quick brown fox jumps over the lazy dog. 0123456789
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Typography Preview</h3>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <h1 
                      className="text-xl font-bold mb-2"
                      style={{ 
                        fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})`,
                        color: brandKit.color
                      }}
                    >
                      Document Title
                    </h1>
                    <h2 
                      className="text-lg font-semibold mb-2"
                      style={{ 
                        fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})`,
                        color: brandKit.color
                      }}
                    >
                      Section Heading
                    </h2>
                    <p 
                      className="text-sm mb-2"
                      style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
                    >
                      This is how your document content will appear. The body text uses {brandKit.font} while headings use {brandKit.headerFont}.
                    </p>
                    <div 
                      className="text-sm p-2 rounded"
                      style={{ 
                        backgroundColor: brandKit.secondaryColor,
                        fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` 
                      }}
                    >
                      <span style={{ color: brandKit.accentColor }}>Highlighted content</span> will use your accent color.
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              {/* Extras Tab */}
              <Tabs.Content value="extras" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Watermark */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Document Watermark</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={brandKit.watermark || ''}
                        onChange={(e) => onWatermarkChange?.(e.target.value || null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., CONFIDENTIAL or School Name"
                      />
                      <p className="text-xs text-gray-500">
                        Add a watermark that will appear diagonally across your document (optional)
                      </p>
                      
                      {/* Watermark Preview */}
                      {brandKit.watermark && (
                        <div className="relative h-32 bg-gray-50 rounded border overflow-hidden">
                          <div 
                            className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl font-bold transform rotate-315 pointer-events-none"
                            style={{ transform: 'rotate(-45deg)' }}
                          >
                            {brandKit.watermark}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-xs text-gray-500 bg-white bg-opacity-70 p-1 rounded">Watermark Preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Text */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Footer Text</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={brandKit.footerText || ''}
                        onChange={(e) => onFooterTextChange?.(e.target.value || null)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., © 2025 School Name or Contact Information"
                      />
                      <p className="text-xs text-gray-500">
                        Add text that will appear in the footer of each page (optional)
                      </p>
                      
                      {/* Footer Preview */}
                      {brandKit.footerText && (
                        <div className="mt-2 p-2 border-t border-gray-200 text-xs text-center text-gray-500">
                          {brandKit.footerText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Document Preview</h3>
                  <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div 
                      className="p-3 border-b"
                      style={{ backgroundColor: brandKit.color + '20' }} // 20% opacity
                    >
                      <div className="flex items-center justify-between">
                        {brandKit.logo.dataUrl ? (
                          <img 
                            src={brandKit.logo.dataUrl} 
                            alt="Logo" 
                            className="h-8 object-contain"
                          />
                        ) : (
                          <div className="h-8 w-24 bg-gray-100 rounded"></div>
                        )}
                        <div 
                          className="text-sm font-bold"
                          style={{ 
                            fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})`,
                            color: brandKit.color
                          }}
                        >
                          SAMPLE DOCUMENT
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 relative min-h-32">
                      {/* Watermark if present */}
                      {brandKit.watermark && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center text-gray-200 text-xl font-bold pointer-events-none"
                          style={{ transform: 'rotate(-45deg)' }}
                        >
                          {brandKit.watermark}
                        </div>
                      )}
                      
                      {/* Sample content */}
                      <div className="relative">
                        <h1 
                          className="text-lg font-bold mb-2"
                          style={{ 
                            fontFamily: `var(--font-${brandKit.headerFont.toLowerCase().replace(' ', '-')})`,
                            color: brandKit.color
                          }}
                        >
                          Document Title
                        </h1>
                        <p 
                          className="text-xs mb-2"
                          style={{ fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` }}
                        >
                          This is a preview of how your branded document might look with your selected colors, fonts, and other branding elements.
                        </p>
                        <div 
                          className="text-xs p-2 rounded mb-2"
                          style={{ 
                            backgroundColor: brandKit.secondaryColor + '40',
                            fontFamily: `var(--font-${brandKit.font.toLowerCase().replace(' ', '-')})` 
                          }}
                        >
                          <span style={{ color: brandKit.accentColor }}>Note:</span> This is just a sample to help visualize your branding.
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    {brandKit.footerText && (
                      <div className="p-2 border-t border-gray-200 text-xs text-center text-gray-500">
                        {brandKit.footerText}
                      </div>
                    )}
                  </div>
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}