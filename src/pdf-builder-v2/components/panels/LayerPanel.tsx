import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useEditorStore } from '../../stores/editor-store';
import type { Layer } from '../../types';

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditName(layer.name);
  };

  const handleFinishEdit = () => {
    if (editName.trim() && editName !== layer.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(layer.name);
    }
  };

  return (
    <div
      className={`
        flex items-center p-2 rounded-md cursor-pointer transition-colors group
        ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
      `}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="w-4 h-4 mr-2 opacity-50 group-hover:opacity-100">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>

      {/* Layer color indicator */}
      <div 
        className="w-3 h-3 rounded-full mr-2"
        style={{ backgroundColor: layer.color }}
      />

      {/* Layer name */}
      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span 
            className="text-sm text-gray-900 truncate block"
            onDoubleClick={handleStartEdit}
          >
            {layer.name}
          </span>
        )}
        <div className="text-xs text-gray-500">
          {layer.blocks.length} {layer.blocks.length === 1 ? 'object' : 'objects'}
        </div>
      </div>

      {/* Layer controls */}
      <div className="flex items-center space-x-1 ml-2">
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          )}
        </button>

        {/* Lock toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Delete layer */}
        {layer.id !== 'default-layer' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="Delete layer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export const LayerPanel: React.FC = () => {
  const {
    layers,
    activeLayer,
    setActiveLayer,
    addLayer,
    updateLayer,
    removeLayer,
    reorderLayers,
  } = useEditorStore();

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      blocks: [],
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    };
    addLayer(newLayer);
    setActiveLayer(newLayer.id);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex !== destinationIndex) {
      reorderLayers(sourceIndex, destinationIndex);
    }
  };

  const handleLayerSelect = (layerId: string) => {
    setActiveLayer(layerId);
  };

  const handleToggleVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  };

  const handleRename = (layerId: string, newName: string) => {
    updateLayer(layerId, { name: newName });
  };

  const handleDelete = (layerId: string) => {
    if (layers.length > 1) {
      removeLayer(layerId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Layers</h3>
        <button
          onClick={handleAddLayer}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Add new layer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📚</div>
            <div className="text-sm">No layers</div>
            <button
              onClick={handleAddLayer}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Create your first layer
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layers" isDropDisabled={false}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-1"
                >
                  {layers.map((layer, index) => (
                    <Draggable
                      key={layer.id}
                      draggableId={layer.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            ${snapshot.isDragging ? 'shadow-lg' : ''}
                          `}
                        >
                          <LayerItem
                            layer={layer}
                            isActive={layer.id === activeLayer}
                            onSelect={() => handleLayerSelect(layer.id)}
                            onToggleVisibility={() => handleToggleVisibility(layer.id)}
                            onToggleLock={() => handleToggleLock(layer.id)}
                            onRename={(newName) => handleRename(layer.id, newName)}
                            onDelete={() => handleDelete(layer.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>{layers.length} {layers.length === 1 ? 'layer' : 'layers'}</span>
          <span>Active: {layers.find(l => l.id === activeLayer)?.name || 'None'}</span>
        </div>
      </div>
    </div>
  );
};