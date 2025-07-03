import React from 'react';
import { useEditorStore } from '../../stores/editor-store';
import type { Block, TextBlock, ImageBlock, TableBlock } from '../../types';

// Color picker component
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  label: string;
}> = ({ value, onChange, label }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="#000000"
      />
    </div>
  </div>
);

// Number input component
const NumberInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}> = ({ value, onChange, label, min, max, step = 1, unit }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    <div className="flex items-center">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      {unit && <span className="ml-1 text-xs text-gray-500">{unit}</span>}
    </div>
  </div>
);

// Select input component
const SelectInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}> = ({ value, onChange, options, label }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Text properties component
const TextProperties: React.FC<{ block: TextBlock; onUpdate: (updates: Partial<TextBlock>) => void }> = ({
  block,
  onUpdate,
}) => (
  <div className="space-y-4">
    {/* Text content */}
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">Content</label>
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        rows={3}
        placeholder="Enter text content..."
      />
    </div>

    {/* Font settings */}
    <div className="grid grid-cols-2 gap-2">
      <SelectInput
        value={block.fontFamily}
        onChange={(fontFamily) => onUpdate({ fontFamily })}
        options={[
          { value: 'Arial', label: 'Arial' },
          { value: 'Times New Roman', label: 'Times New Roman' },
          { value: 'Helvetica', label: 'Helvetica' },
          { value: 'Georgia', label: 'Georgia' },
          { value: 'Verdana', label: 'Verdana' },
        ]}
        label="Font Family"
      />
      <NumberInput
        value={block.fontSize}
        onChange={(fontSize) => onUpdate({ fontSize })}
        label="Font Size"
        min={8}
        max={72}
        unit="pt"
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <SelectInput
        value={block.fontWeight}
        onChange={(fontWeight) => onUpdate({ fontWeight: fontWeight as any })}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Bold' },
          { value: '300', label: 'Light' },
          { value: '500', label: 'Medium' },
        ]}
        label="Font Weight"
      />
      <SelectInput
        value={block.textAlign}
        onChange={(textAlign) => onUpdate({ textAlign: textAlign as any })}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
          { value: 'justify', label: 'Justify' },
        ]}
        label="Text Align"
      />
    </div>

    {/* Color */}
    <ColorPicker
      value={block.color}
      onChange={(color) => onUpdate({ color })}
      label="Text Color"
    />

    {/* Line height and letter spacing */}
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        value={block.lineHeight}
        onChange={(lineHeight) => onUpdate({ lineHeight })}
        label="Line Height"
        min={0.5}
        max={3}
        step={0.1}
      />
      <NumberInput
        value={block.letterSpacing}
        onChange={(letterSpacing) => onUpdate({ letterSpacing })}
        label="Letter Spacing"
        min={-2}
        max={10}
        step={0.1}
        unit="px"
      />
    </div>
  </div>
);

// Image properties component
const ImageProperties: React.FC<{ block: ImageBlock; onUpdate: (updates: Partial<ImageBlock>) => void }> = ({
  block,
  onUpdate,
}) => (
  <div className="space-y-4">
    {/* Image source */}
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">Image Source</label>
      <input
        type="text"
        value={block.src}
        onChange={(e) => onUpdate({ src: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Image URL or upload..."
      />
    </div>

    {/* Alt text */}
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">Alt Text</label>
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onUpdate({ alt: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Alternative text..."
      />
    </div>

    {/* Fit mode */}
    <SelectInput
      value={block.fit}
      onChange={(fit) => onUpdate({ fit: fit as any })}
      options={[
        { value: 'contain', label: 'Contain' },
        { value: 'cover', label: 'Cover' },
        { value: 'fill', label: 'Fill' },
        { value: 'scale-down', label: 'Scale Down' },
      ]}
      label="Fit Mode"
    />

    {/* Filters */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Filters</label>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={block.filters.brightness}
          onChange={(brightness) => onUpdate({ 
            filters: { ...block.filters, brightness } 
          })}
          label="Brightness"
          min={0}
          max={200}
          unit="%"
        />
        <NumberInput
          value={block.filters.contrast}
          onChange={(contrast) => onUpdate({ 
            filters: { ...block.filters, contrast } 
          })}
          label="Contrast"
          min={0}
          max={200}
          unit="%"
        />
        <NumberInput
          value={block.filters.saturation}
          onChange={(saturation) => onUpdate({ 
            filters: { ...block.filters, saturation } 
          })}
          label="Saturation"
          min={0}
          max={200}
          unit="%"
        />
        <NumberInput
          value={block.filters.blur}
          onChange={(blur) => onUpdate({ 
            filters: { ...block.filters, blur } 
          })}
          label="Blur"
          min={0}
          max={10}
          unit="px"
        />
      </div>
    </div>
  </div>
);

// Table properties component
const TableProperties: React.FC<{ block: TableBlock; onUpdate: (updates: Partial<TableBlock>) => void }> = ({
  block,
  onUpdate,
}) => (
  <div className="space-y-4">
    {/* Table structure */}
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        value={block.rows}
        onChange={(rows) => onUpdate({ rows })}
        label="Rows"
        min={1}
        max={20}
      />
      <NumberInput
        value={block.columns}
        onChange={(columns) => onUpdate({ columns })}
        label="Columns"
        min={1}
        max={10}
      />
    </div>

    {/* Border style */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Border</label>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={block.borderStyle.width}
          onChange={(width) => onUpdate({ 
            borderStyle: { ...block.borderStyle, width } 
          })}
          label="Width"
          min={0}
          max={10}
          unit="px"
        />
        <ColorPicker
          value={block.borderStyle.color}
          onChange={(color) => onUpdate({ 
            borderStyle: { ...block.borderStyle, color } 
          })}
          label="Color"
        />
      </div>
    </div>

    {/* Header style */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Header Style</label>
      <ColorPicker
        value={block.headerStyle.backgroundColor}
        onChange={(backgroundColor) => onUpdate({ 
          headerStyle: { ...block.headerStyle, backgroundColor } 
        })}
        label="Background"
      />
    </div>

    {/* Alternating rows */}
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={block.alternateRowColors}
        onChange={(e) => onUpdate({ alternateRowColors: e.target.checked })}
        className="rounded"
      />
      <label className="text-xs text-gray-700">Alternate row colors</label>
    </div>
  </div>
);

// Common transform properties
const TransformProperties: React.FC<{ block: Block; onUpdate: (updates: Partial<Block>) => void }> = ({
  block,
  onUpdate,
}) => (
  <div className="space-y-4">
    {/* Position */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Position</label>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={block.position.x}
          onChange={(x) => onUpdate({ position: { ...block.position, x } })}
          label="X"
          unit="pt"
        />
        <NumberInput
          value={block.position.y}
          onChange={(y) => onUpdate({ position: { ...block.position, y } })}
          label="Y"
          unit="pt"
        />
      </div>
    </div>

    {/* Size */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">Size</label>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          value={block.size.width}
          onChange={(width) => onUpdate({ size: { ...block.size, width } })}
          label="Width"
          min={1}
          unit="pt"
        />
        <NumberInput
          value={block.size.height}
          onChange={(height) => onUpdate({ size: { ...block.size, height } })}
          label="Height"
          min={1}
          unit="pt"
        />
      </div>
    </div>

    {/* Rotation and opacity */}
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        value={block.rotation}
        onChange={(rotation) => onUpdate({ rotation })}
        label="Rotation"
        min={-180}
        max={180}
        unit="°"
      />
      <NumberInput
        value={block.opacity}
        onChange={(opacity) => onUpdate({ opacity })}
        label="Opacity"
        min={0}
        max={1}
        step={0.1}
      />
    </div>

    {/* Layer and visibility */}
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        value={block.layer}
        onChange={(layer) => onUpdate({ layer })}
        label="Layer"
        min={0}
        max={100}
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Visibility</label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={block.visible}
              onChange={(e) => onUpdate({ visible: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs">Visible</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={block.locked}
              onChange={(e) => onUpdate({ locked: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs">Locked</span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

export const PropertyPanel: React.FC = () => {
  const { blocks, selectedObjects, updateBlock } = useEditorStore();

  // Get selected block
  const selectedBlock = selectedObjects.length === 1 
    ? blocks.find(b => b.id === selectedObjects[0])
    : null;

  const handleUpdateBlock = (updates: Partial<Block>) => {
    if (selectedBlock) {
      updateBlock(selectedBlock.id, updates);
    }
  };

  if (!selectedBlock) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <div className="text-4xl mb-4">🎨</div>
          <div className="text-sm text-gray-600 mb-2">No object selected</div>
          <div className="text-xs text-gray-500">
            Select an object on the canvas to edit its properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Object info */}
        <div className="pb-4 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-900 capitalize">
            {selectedBlock.type} Properties
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ID: {selectedBlock.id.slice(-8)}...
          </div>
        </div>

        {/* Type-specific properties */}
        {selectedBlock.type === 'text' && (
          <TextProperties 
            block={selectedBlock as TextBlock} 
            onUpdate={handleUpdateBlock}
          />
        )}

        {selectedBlock.type === 'image' && (
          <ImageProperties 
            block={selectedBlock as ImageBlock} 
            onUpdate={handleUpdateBlock}
          />
        )}

        {selectedBlock.type === 'table' && (
          <TableProperties 
            block={selectedBlock as TableBlock} 
            onUpdate={handleUpdateBlock}
          />
        )}

        {/* Common transform properties */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-900 mb-4">Transform</div>
          <TransformProperties 
            block={selectedBlock} 
            onUpdate={handleUpdateBlock}
          />
        </div>
      </div>
    </div>
  );
};