"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type {
  Block,
  Template,
  CanvasState,
  Layer,
  EditorConfig,
  Position,
  FabricObjectWithId,
} from "../types";

// Dynamic fabric import to avoid SSR issues
type FabricCanvas = any;

interface EditorState {
  // Canvas state
  canvas: FabricCanvas | null;
  canvasState: CanvasState;

  // Templates
  currentTemplate: Template | null;
  templates: Template[];

  // Blocks and layers
  blocks: Block[];
  layers: Layer[];
  activeLayer: string;

  // Selection
  selectedObjects: string[];
  clipboard: Block[];

  // History
  history: CanvasState[];
  historyIndex: number;
  maxHistorySize: number;

  // UI state
  isLoading: boolean;
  isDirty: boolean;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;

  // Configuration
  config: EditorConfig;
}

interface EditorActions {
  // Canvas actions
  setCanvas: (canvas: FabricCanvas | null) => void;
  updateCanvasState: (updates: Partial<CanvasState>) => void;

  // Template actions
  setCurrentTemplate: (template: Template | null) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
  removeTemplate: (templateId: string) => void;

  // Block actions
  addBlock: (block: Block) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (blockId: string, position: Position) => void;

  // Layer actions
  addLayer: (layer: Layer) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  // Selection actions
  selectObjects: (objectIds: string[]) => void;
  addToSelection: (objectId: string) => void;
  removeFromSelection: (objectId: string) => void;
  clearSelection: () => void;

  // Clipboard actions
  copySelection: () => void;
  cut: () => void;
  paste: () => void;

  // History actions
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setDirty: (dirty: boolean) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;

  // Canvas manipulation
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  centerCanvas: () => void;

  // Configuration
  updateConfig: (updates: Partial<EditorConfig>) => void;
  resetConfig: () => void;
}

type EditorStore = EditorState & EditorActions;

// Default configuration
const defaultConfig: EditorConfig = {
  canvas: {
    backgroundColor: "#ffffff",
    width: 595, // A4 width in points
    height: 842, // A4 height in points
    dpi: 72,
  },
  defaults: {
    fontSize: 16, // Increased from 12 to 16 for better visibility
    fontFamily: "Arial",
    textColor: "#000000", // Ensure black text
    backgroundColor: "transparent",
  },
  constraints: {
    minZoom: 0.1,
    maxZoom: 5.0,
    snapThreshold: 10,
    gridSize: 20,
  },
  features: {
    enableUndo: true,
    enableRedo: true,
    enableAutoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    maxHistorySize: 50,
  },
};

// Default canvas state
const defaultCanvasState: CanvasState = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  selectedObjects: [],
  clipboard: [],
  grid: {
    enabled: false,
    size: 20,
    color: "#e0e0e0",
    opacity: 0.5,
  },
  guides: {
    enabled: true,
    color: "#4285f4",
    snapDistance: 10,
  },
  rulers: {
    enabled: false,
    unit: "mm",
  },
};

// Default layer
const createDefaultLayer = (): Layer => ({
  id: "default-layer",
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: "normal",
  blocks: [],
  color: "#4285f4",
});

export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      canvas: null,
      canvasState: defaultCanvasState,
      currentTemplate: null,
      templates: [],
      blocks: [],
      layers: [createDefaultLayer()],
      activeLayer: "default-layer",
      selectedObjects: [],
      clipboard: [],
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
      isLoading: false,
      isDirty: false,
      showGrid: false,
      showRulers: false,
      showGuides: true,
      config: defaultConfig,

      // Canvas actions
      setCanvas: (canvas) => {
        console.log("Editor store: setCanvas called", {
          hasCanvas: !!canvas,
          canvasType: canvas ? typeof canvas : "null",
        });

        set({ canvas });

        if (canvas) {
          console.log("Editor store: Setting up canvas event listeners");

          // Setup canvas event listeners
          canvas.on("object:added", () => {
            console.log("Canvas event: object:added");
            get().setDirty(true);
            get().saveState();
          });

          canvas.on("object:removed", () => {
            console.log("Canvas event: object:removed");
            get().setDirty(true);
            get().saveState();
          });

          canvas.on("object:modified", () => {
            console.log("Canvas event: object:modified");
            get().setDirty(true);
            get().saveState();
          });

          canvas.on("selection:created", (e) => {
            console.log("Canvas event: selection:created", {
              selected: e.selected?.length || 0,
            });
            const objects = e.selected || [];
            const objectIds = objects
              .filter((obj): obj is FabricObjectWithId => "id" in obj)
              .map((obj) => obj.id);
            get().selectObjects(objectIds);
          });

          canvas.on("selection:updated", (e) => {
            console.log("Canvas event: selection:updated", {
              selected: e.selected?.length || 0,
            });
            const objects = e.selected || [];
            const objectIds = objects
              .filter((obj): obj is FabricObjectWithId => "id" in obj)
              .map((obj) => obj.id);
            get().selectObjects(objectIds);
          });

          canvas.on("selection:cleared", () => {
            console.log("Canvas event: selection:cleared");
            get().clearSelection();
          });

          console.log("Editor store: Canvas event listeners setup complete");
        } else {
          console.log(
            "Editor store: Canvas is null, skipping event listener setup"
          );
        }
      },

      updateCanvasState: (updates) => {
        console.log("Editor store: updateCanvasState called", { updates });
        set((state) => {
          const newState = { ...state.canvasState, ...updates };
          console.log("Editor store: Canvas state updated", {
            previousState: state.canvasState,
            newState,
          });
          return { canvasState: newState };
        });
      },

      // Template actions
      setCurrentTemplate: (template) => {
        set({ currentTemplate: template });
        if (template) {
          set({
            blocks: [...template.blocks],
            isDirty: false,
          });
        }
      },

      addTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates, template],
        }));
      },

      updateTemplate: (templateId, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, ...updates } : t
          ),
        }));
      },

      removeTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }));
      },

      // Block actions
      addBlock: (block) => {
        console.log("Store: addBlock called with:", block);

        set((state) => {
          console.log("Store: Current state before adding block:", {
            currentBlocksCount: state.blocks.length,
            currentBlockIds: state.blocks.map((b) => b.id),
            activeLayer: state.activeLayer,
            layersCount: state.layers.length,
          });

          const activeLayer = state.layers.find(
            (l) => l.id === state.activeLayer
          );

          if (activeLayer) {
            const newState = {
              blocks: [...state.blocks, block],
              layers: state.layers.map((l) =>
                l.id === state.activeLayer
                  ? { ...l, blocks: [...l.blocks, block.id] }
                  : l
              ),
              isDirty: true,
            };

            console.log("Store: New state after adding block:", {
              newBlocksCount: newState.blocks.length,
              newBlockIds: newState.blocks.map((b) => b.id),
              addedBlock: block,
            });

            return newState;
          }

          const newState = {
            blocks: [...state.blocks, block],
            isDirty: true,
          };

          console.log(
            "Store: Added block without layer association:",
            newState
          );
          return newState;
        });
      },

      updateBlock: (blockId, updates) => {
        console.log("Store: updateBlock called", { blockId, updates });

        set((state) => {
          const updatedBlocks = state.blocks.map((b) => {
            if (b.id === blockId) {
              const updatedBlock = { ...b, ...updates };
              console.log("Store: Block updated", {
                originalBlock: b,
                updates,
                updatedBlock,
              });
              return updatedBlock;
            }
            return b;
          });

          return {
            blocks: updatedBlocks,
            isDirty: true,
          };
        });
      },

      removeBlock: (blockId) => {
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== blockId),
          layers: state.layers.map((l) => ({
            ...l,
            blocks: l.blocks.filter((id) => id !== blockId),
          })),
          selectedObjects: state.selectedObjects.filter((id) => id !== blockId),
          isDirty: true,
        }));
      },

      duplicateBlock: (blockId) => {
        const state = get();
        const block = state.blocks.find((b) => b.id === blockId);
        if (block) {
          const duplicatedBlock: Block = {
            ...block,
            id: `${block.id}-copy-${Date.now()}`,
            position: {
              x: block.position.x + 20,
              y: block.position.y + 20,
            },
          };
          state.addBlock(duplicatedBlock);
        }
      },

      moveBlock: (blockId, position) => {
        get().updateBlock(blockId, { position });
      },

      // Layer actions
      addLayer: (layer) => {
        set((state) => ({
          layers: [...state.layers, layer],
        }));
      },

      updateLayer: (layerId, updates) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId ? { ...l, ...updates } : l
          ),
        }));
      },

      removeLayer: (layerId) => {
        set((state) => {
          // Don't remove if it's the last layer
          if (state.layers.length <= 1) return state;

          const layer = state.layers.find((l) => l.id === layerId);
          if (layer) {
            // Remove all blocks from this layer
            layer.blocks.forEach((blockId) => {
              state.removeBlock(blockId);
            });
          }

          const newLayers = state.layers.filter((l) => l.id !== layerId);
          const newActiveLayer =
            state.activeLayer === layerId
              ? newLayers[0]?.id || ""
              : state.activeLayer;

          return {
            layers: newLayers,
            activeLayer: newActiveLayer,
          };
        });
      },

      setActiveLayer: (layerId) => {
        set({ activeLayer: layerId });
      },

      reorderLayers: (fromIndex, toIndex) => {
        set((state) => {
          const newLayers = [...state.layers];
          const [movedLayer] = newLayers.splice(fromIndex, 1);
          newLayers.splice(toIndex, 0, movedLayer);
          return { layers: newLayers };
        });
      },

      // Selection actions
      selectObjects: (objectIds) => {
        set({ selectedObjects: objectIds });
      },

      addToSelection: (objectId) => {
        set((state) => ({
          selectedObjects: [...state.selectedObjects, objectId],
        }));
      },

      removeFromSelection: (objectId) => {
        set((state) => ({
          selectedObjects: state.selectedObjects.filter(
            (id) => id !== objectId
          ),
        }));
      },

      clearSelection: () => {
        set({ selectedObjects: [] });
      },

      // Clipboard actions
      copySelection: () => {
        const state = get();
        const selectedBlocks = state.blocks.filter((b) =>
          state.selectedObjects.includes(b.id)
        );
        set({ clipboard: selectedBlocks });
      },

      cut: () => {
        const state = get();
        state.copySelection();
        state.selectedObjects.forEach((id) => {
          state.removeBlock(id);
        });
        state.clearSelection();
      },

      paste: () => {
        const state = get();
        state.clipboard.forEach((block) => {
          const pastedBlock: Block = {
            ...block,
            id: `${block.id}-paste-${Date.now()}`,
            position: {
              x: block.position.x + 20,
              y: block.position.y + 20,
            },
          };
          state.addBlock(pastedBlock);
        });
      },

      // History actions
      saveState: () => {
        const state = get();
        if (!state.config.features.enableUndo) return;

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ ...state.canvasState });

        // Limit history size
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift();
        } else {
          set({ historyIndex: state.historyIndex + 1 });
        }

        set({ history: newHistory });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const previousState = state.history[state.historyIndex - 1];
          set({
            canvasState: previousState,
            historyIndex: state.historyIndex - 1,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1];
          set({
            canvasState: nextState,
            historyIndex: state.historyIndex + 1,
          });
        }
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 });
      },

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setDirty: (dirty) => set({ isDirty: dirty }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
      toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),

      // Canvas manipulation
      zoomIn: () => {
        const state = get();
        const newZoom = Math.min(
          state.canvasState.zoom * 1.2,
          state.config.constraints.maxZoom
        );
        state.setZoom(newZoom);
      },

      zoomOut: () => {
        const state = get();
        const newZoom = Math.max(
          state.canvasState.zoom / 1.2,
          state.config.constraints.minZoom
        );
        state.setZoom(newZoom);
      },

      zoomToFit: () => {
        const state = get();
        if (state.canvas) {
          const canvasWidth = state.canvas.getWidth();
          const canvasHeight = state.canvas.getHeight();
          const configWidth = state.config.canvas.width;
          const configHeight = state.config.canvas.height;

          const zoomX = canvasWidth / configWidth;
          const zoomY = canvasHeight / configHeight;
          const zoom = Math.min(zoomX, zoomY) * 0.9; // 90% to add padding

          state.setZoom(zoom);
          state.centerCanvas();
        }
      },

      resetZoom: () => {
        get().setZoom(1);
      },

      setZoom: (zoom) => {
        const state = get();
        const constrainedZoom = Math.max(
          state.config.constraints.minZoom,
          Math.min(zoom, state.config.constraints.maxZoom)
        );

        if (state.canvas) {
          state.canvas.setZoom(constrainedZoom);
          state.canvas.renderAll();
        }

        state.updateCanvasState({ zoom: constrainedZoom });
      },

      pan: (deltaX, deltaY) => {
        const state = get();
        if (state.canvas) {
          const vpt = state.canvas.viewportTransform;
          if (vpt) {
            vpt[4] += deltaX;
            vpt[5] += deltaY;
            state.canvas.setViewportTransform(vpt);
            state.updateCanvasState({
              panOffset: { x: vpt[4], y: vpt[5] },
            });
          }
        }
      },

      centerCanvas: () => {
        const state = get();
        if (state.canvas) {
          const canvasWidth = state.canvas.getWidth();
          const canvasHeight = state.canvas.getHeight();
          const configWidth = state.config.canvas.width;
          const configHeight = state.config.canvas.height;
          const zoom = state.canvasState.zoom;

          const centerX = (canvasWidth - configWidth * zoom) / 2;
          const centerY = (canvasHeight - configHeight * zoom) / 2;

          state.canvas.setViewportTransform([
            zoom,
            0,
            0,
            zoom,
            centerX,
            centerY,
          ]);
          state.updateCanvasState({
            panOffset: { x: centerX, y: centerY },
          });
        }
      },

      // Configuration
      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      resetConfig: () => {
        set({ config: defaultConfig });
      },
    })),
    {
      name: "pdf-builder-editor-store",
    }
  )
);
