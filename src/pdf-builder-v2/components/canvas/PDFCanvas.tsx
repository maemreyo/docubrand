// src/pdf-builder-v2/components/canvas/PDFCanvas.tsx
// UPDATED: 2025-07-04 - Fixed canvas initialization and position bounds

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { useEditorStore } from "../../stores/editor-store";
import { CanvasControls } from "./CanvasControls";
import type { BlockType, Position, FabricObjectWithId } from "../../types";

// Dynamically import fabric to avoid SSR issues
let fabric: any = null;

interface PDFCanvasProps {
  width: number;
  height: number;
  showGrid?: boolean;
  showRulers?: boolean;
  showGuides?: boolean;
  onBlockDrop?: (blockType: BlockType, position: Position) => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  width,
  height,
  showGrid = false,
  showRulers = false,
  showGuides = true,
  onBlockDrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Component lifecycle logging
  useEffect(() => {
    console.log("PDFCanvas component mounted", {
      width,
      height,
      showGrid,
      showRulers,
      showGuides,
    });

    return () => {
      console.log("PDFCanvas component unmounted");
    };
  }, []);

  // Store selectors
  const {
    canvas,
    canvasState,
    config,
    blocks,
    setCanvas,
    setZoom,
    pan,
    centerCanvas,
    updateCanvasState,
  } = useEditorStore();

  // Initialize Fabric.js canvas
  useEffect(() => {
    console.log("Canvas initialization effect triggered", {
      hasCanvasRef: !!canvasRef.current,
      hasExistingCanvas: !!canvas,
      containerDimensions: { width, height },
      canvasConfig: {
        width: config.canvas.width,
        height: config.canvas.height,
      },
    });

    // Use a small timeout to ensure the canvas element is properly rendered in the DOM
    const initTimeout = setTimeout(() => {
      console.log("Checking canvas ref after timeout", {
        hasCanvasRef: !!canvasRef.current,
      });

      if (!canvasRef.current) {
        console.log(
          "Canvas ref is still not available after timeout, skipping initialization"
        );
        return;
      }

      if (canvas) {
        console.log("Canvas already exists in store, skipping initialization");
        return;
      }

      const initializeFabric = async () => {
        console.log("Starting fabric initialization");
        try {
          if (!fabric) {
            console.log("Fabric not loaded, importing dynamically");
            try {
              // Dynamically import fabric only on client side
              const fabricModule = await import("fabric");
              fabric = fabricModule.fabric;
              console.log("Fabric imported successfully", {
                fabricLoaded: !!fabric,
                fabricVersion: fabric?.version || "unknown",
                fabricObject:
                  Object.keys(fabric || {}).length > 0
                    ? "has properties"
                    : "empty object",
              });

              if (!fabric || !fabric.Canvas) {
                console.error(
                  "Fabric loaded but Canvas class is not available",
                  fabric
                );
                throw new Error("Fabric Canvas class not available");
              }
            } catch (importError) {
              console.error("Error importing fabric.js:", importError);
              throw importError;
            }
          }

          console.log("Creating fabric canvas instance", {
            canvasRefExists: !!canvasRef.current,
            canvasElement: canvasRef.current,
            // Use CONFIG dimensions for fabric canvas logical size
            logicalDimensions: {
              width: config.canvas.width,
              height: config.canvas.height,
            },
            // Container dimensions for display
            containerDimensions: { width, height },
          });

          // Make sure we still have the canvas reference
          if (!canvasRef.current) {
            console.error("Canvas reference lost during initialization");
            return null;
          }

          // Check if the canvas element has proper dimensions
          const canvasElement = canvasRef.current;
          console.log("Canvas element dimensions before initialization", {
            offsetWidth: canvasElement.offsetWidth,
            offsetHeight: canvasElement.offsetHeight,
            clientWidth: canvasElement.clientWidth,
            clientHeight: canvasElement.clientHeight,
            width: canvasElement.width,
            height: canvasElement.height,
          });

          let fabricCanvas;

          try {
            console.log(
              "Attempting to create interactive Canvas with CONFIG dimensions"
            );
            fabricCanvas = new fabric.Canvas(canvasRef.current, {
              // Use CONFIG dimensions for logical canvas size (A4: 595x842)
              width: config.canvas.width,
              height: config.canvas.height,
              backgroundColor: config.canvas.backgroundColor,
              selection: true,
              preserveObjectStacking: true,
              stopContextMenu: true,
              fireRightClick: true,
              enableRetinaScaling: false,
              renderOnAddRemove: true,
              skipTargetFind: false,
              perPixelTargetFind: true,
              targetFindTolerance: 4,
              // Add performance optimizations
              allowTouchScrolling: false,
              imageSmoothingEnabled: false,
            });

            console.log("Canvas created with logical dimensions", {
              fabricWidth: fabricCanvas.width,
              fabricHeight: fabricCanvas.height,
              configWidth: config.canvas.width,
              configHeight: config.canvas.height,
            });
          } catch (canvasError) {
            console.error(
              "Error creating interactive Canvas, trying StaticCanvas as fallback:",
              canvasError
            );

            try {
              // Try with StaticCanvas as fallback
              fabricCanvas = new fabric.StaticCanvas(canvasRef.current, {
                width: config.canvas.width,
                height: config.canvas.height,
                backgroundColor: config.canvas.backgroundColor,
                renderOnAddRemove: true,
              });
              console.log("Created StaticCanvas as fallback");
            } catch (staticCanvasError) {
              console.error(
                "Error creating StaticCanvas fallback:",
                staticCanvasError
              );
              throw new Error("Failed to create both Canvas and StaticCanvas");
            }
          }

          console.log("Fabric canvas created successfully", {
            canvasCreated: !!fabricCanvas,
            canvasDimensions: {
              width: fabricCanvas.width,
              height: fabricCanvas.height,
            },
          });

          // Configure default controls
          fabric.Object.prototype.set({
            borderColor: "#4285f4",
            borderOpacityWhenMoving: 0.5,
            borderScaleFactor: 2,
            cornerColor: "#4285f4",
            cornerStyle: "circle",
            cornerSize: 8,
            transparentCorners: false,
            rotatingPointOffset: 40,
          });

          // Set initial zoom to fit canvas in container
          const zoomToFit =
            Math.min(
              width / config.canvas.width,
              height / config.canvas.height
            ) * 0.9; // 90% to add padding

          console.log("Setting initial zoom to fit", {
            zoomToFit,
            containerSize: { width, height },
            canvasSize: {
              width: config.canvas.width,
              height: config.canvas.height,
            },
          });

          fabricCanvas.setZoom(zoomToFit);

          // Center the canvas
          const centerX = (width - config.canvas.width * zoomToFit) / 2;
          const centerY = (height - config.canvas.height * zoomToFit) / 2;
          fabricCanvas.setViewportTransform([
            zoomToFit,
            0,
            0,
            zoomToFit,
            centerX,
            centerY,
          ]);

          // Setup canvas in store
          console.log(
            "Setting canvas in store and updating initialization state"
          );
          setCanvas(fabricCanvas);
          setIsInitialized(true);
          console.log("Canvas initialization complete");

          return fabricCanvas;
        } catch (error) {
          console.error("Error initializing fabric canvas:", error);
          return null;
        }
      };

      let fabricCanvasInstance: any = null;

      initializeFabric()
        .then((canvas) => {
          fabricCanvasInstance = canvas;
          console.log("Canvas instance saved to local variable", {
            hasInstance: !!fabricCanvasInstance,
          });
        })
        .catch((error) => {
          console.error("Unhandled error in fabric initialization:", error);
        });
    }, 100); // Small delay to ensure DOM is ready

    // Cleanup
    return () => {
      console.log(
        "Cleanup function called, clearing timeout and disposing canvas"
      );
      clearTimeout(initTimeout);

      if (canvas) {
        console.log("Disposing existing canvas");
        canvas.dispose();
      }
      setCanvas(null);
      setIsInitialized(false);
    };
  }, [
    width,
    height,
    config.canvas.backgroundColor,
    config.canvas.width,
    config.canvas.height,
  ]);

  // Update canvas size when container resizes
  useEffect(() => {
    console.log("Canvas resize effect triggered", {
      hasCanvas: !!canvas,
      isInitialized,
      newContainerDimensions: { width, height },
      canvasLogicalSize: {
        width: config.canvas.width,
        height: config.canvas.height,
      },
    });

    if (canvas && isInitialized) {
      console.log("Updating canvas zoom to fit new container size");

      // Recalculate zoom to fit
      const zoomToFit =
        Math.min(width / config.canvas.width, height / config.canvas.height) *
        0.9; // 90% to add padding

      // Update zoom and center position
      canvas.setZoom(zoomToFit);
      const centerX = (width - config.canvas.width * zoomToFit) / 2;
      const centerY = (height - config.canvas.height * zoomToFit) / 2;
      canvas.setViewportTransform([
        zoomToFit,
        0,
        0,
        zoomToFit,
        centerX,
        centerY,
      ]);

      canvas.renderAll();
      console.log("Canvas zoom updated successfully", { zoomToFit });
    } else {
      console.log("Skipping canvas resize - canvas not ready", {
        hasCanvas: !!canvas,
        isInitialized,
      });
    }
  }, [
    canvas,
    width,
    height,
    isInitialized,
    config.canvas.width,
    config.canvas.height,
  ]);

  // Render blocks on canvas
  useEffect(() => {
    console.log("Render blocks effect triggered", {
      hasCanvas: !!canvas,
      isInitialized,
      blocksCount: blocks.length,
      showGrid,
      canvasDimensions: {
        width: config.canvas.width,
        height: config.canvas.height,
      },
    });

    if (!canvas || !isInitialized) {
      console.log("Skipping block rendering - canvas not ready", {
        hasCanvas: !!canvas,
        isInitialized,
      });
      return;
    }

    console.log("Clearing existing canvas objects");
    // Clear existing objects
    canvas.clear();

    // Add grid if enabled
    if (showGrid) {
      console.log("Adding grid to canvas");
      addGridToCanvas(canvas, config.canvas.width, config.canvas.height);
    }

    // Render blocks
    console.log(`Rendering ${blocks.length} blocks on canvas`);
    blocks.forEach((block, index) => {
      console.log(`Creating fabric object for block ${index}`, {
        blockType: block.type,
        blockId: block.id,
        originalPosition: block.position,
        canvasBounds: {
          width: config.canvas.width,
          height: config.canvas.height,
        },
      });

      const fabricObject = createFabricObjectFromBlock(block);
      if (fabricObject) {
        canvas.add(fabricObject);
        console.log(`Added block ${index} to canvas`);
      } else {
        console.warn(`Failed to create fabric object for block ${index}`, {
          blockType: block.type,
        });
      }
    });

    console.log("Rendering all canvas objects");
    canvas.renderAll();
    console.log("Canvas rendering complete");
  }, [
    canvas,
    blocks,
    showGrid,
    config.canvas.width,
    config.canvas.height,
    isInitialized,
  ]);

  const createFabricObjectFromBlock = (
    block: any
  ): FabricObjectWithId | null => {
    console.log("Creating fabric object from block", {
      blockType: block.type,
      blockId: block.id,
      hasFabric: !!fabric,
      originalPosition: block.position,
      canvasBounds: {
        width: config.canvas.width,
        height: config.canvas.height,
      },
      blockData: block, // DEBUG: Log full block data
    });

    if (!fabric) {
      console.warn("Fabric not available, cannot create object");
      return null;
    }

    // CONSTRAINT POSITIONS TO CANVAS BOUNDS
    const constrainedPosition = {
      x: Math.max(
        0,
        Math.min(
          block.position?.x || 50,
          config.canvas.width - (block.size?.width || 100)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          block.position?.y || 50,
          config.canvas.height - (block.size?.height || 50)
        )
      ),
    };

    // CONSTRAINT SIZE TO CANVAS BOUNDS
    const constrainedSize = {
      width: Math.min(
        block.size?.width || 200,
        config.canvas.width - constrainedPosition.x
      ),
      height: Math.min(
        block.size?.height || 100,
        config.canvas.height - constrainedPosition.y
      ),
    };

    console.log("Position and size constraints applied", {
      original: {
        position: block.position,
        size: block.size,
      },
      constrained: {
        position: constrainedPosition,
        size: constrainedSize,
      },
      wasConstrained: {
        position:
          (block.position?.x || 0) !== constrainedPosition.x ||
          (block.position?.y || 0) !== constrainedPosition.y,
        size:
          (block.size?.width || 0) !== constrainedSize.width ||
          (block.size?.height || 0) !== constrainedSize.height,
      },
    });

    switch (block.type) {
      case "text":
        // PROVIDE STRONG DEFAULTS FOR ALL TEXT PROPERTIES
        const textContent = block.content || "Sample Text";
        const textColor = block.color || "#000000";
        const fontSize = block.fontSize || 16;
        const fontFamily = block.fontFamily || "Arial";
        const fontWeight = block.fontWeight || "normal";
        const fontStyle = block.fontStyle || "normal";
        const textAlign = block.textAlign || "left";
        const opacity = block.opacity !== undefined ? block.opacity : 1;
        const visible = block.visible !== false; // Default to true

        console.log("Creating text object with DEBUG info", {
          textContent,
          textColor,
          fontSize,
          fontFamily,
          fontWeight,
          constrainedPosition,
          constrainedSize,
          opacity,
          visible,
          originalBlock: {
            content: block.content,
            color: block.color,
            fontSize: block.fontSize,
            fontFamily: block.fontFamily,
          },
        });

        try {
          const textObject = new fabric.Textbox(textContent, {
            left: constrainedPosition.x,
            top: constrainedPosition.y,
            width: constrainedSize.width,
            height: constrainedSize.height,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            textAlign: textAlign,
            fill: textColor,
            angle: block.rotation || 0,
            opacity: opacity,
            selectable: !block.locked,
            visible: visible,
            // Add bounds checking
            lockMovementX: false,
            lockMovementY: false,
            hasControls: true,
            hasBorders: true,
            // IMPORTANT: Make sure text is visible
            backgroundColor: "transparent",
            borderColor: "#4285f4",
            borderScaleFactor: 2,
            cornerSize: 10,
            transparentCorners: false,
            // Prevent text from being too small to see
            minScaleLimit: 0.1,
            // Add padding to make text more visible
            padding: 5,
          }) as unknown as FabricObjectWithId;

          textObject.id = block.id;
          textObject.blockType = block.type;
          textObject.blockData = block;

          // DEBUG: Log final text object properties
          console.log("Text object created successfully with properties", {
            id: textObject.id,
            finalPosition: { left: textObject.left, top: textObject.top },
            finalSize: { width: textObject.width, height: textObject.height },
            textContent: textObject.text,
            fontSize: textObject.fontSize,
            fontFamily: textObject.fontFamily,
            fill: textObject.fill,
            visible: textObject.visible,
            opacity: textObject.opacity,
            selectable: textObject.selectable,
          });

          // FORCE RENDER: Ensure text is rendered immediately
          textObject.setCoords();

          return textObject;
        } catch (error) {
          console.error("Error creating text object:", error);
          console.error("Block data that caused error:", block);
          return null;
        }

      case "image":
        console.log("Creating image placeholder object", {
          constrainedPosition,
          constrainedSize,
        });

        try {
          // For now, create a placeholder rectangle for images
          const imageObject = new fabric.Rect({
            left: constrainedPosition.x,
            top: constrainedPosition.y,
            width: constrainedSize.width,
            height: constrainedSize.height,
            fill: "#f0f0f0",
            stroke: "#cccccc",
            strokeWidth: 2,
            angle: block.rotation || 0,
            opacity: block.opacity || 1,
            selectable: !block.locked,
            visible: block.visible !== false,
          }) as FabricObjectWithId;

          imageObject.id = block.id;
          imageObject.blockType = block.type;
          imageObject.blockData = block;

          console.log("Image placeholder object created successfully");
          return imageObject;
        } catch (error) {
          console.error("Error creating image placeholder object:", error);
          return null;
        }

      case "table":
        console.log("Creating table object", {
          constrainedPosition,
          constrainedSize,
          rows: block.rows || 3,
          columns: block.columns || 3,
        });

        try {
          // Create a simple table representation
          const tableGroup = new fabric.Group([], {
            left: constrainedPosition.x,
            top: constrainedPosition.y,
            angle: block.rotation || 0,
            opacity: block.opacity || 1,
            selectable: !block.locked,
            visible: block.visible !== false,
          }) as unknown as FabricObjectWithId;

          tableGroup.id = block.id;
          tableGroup.blockType = block.type;
          tableGroup.blockData = block;

          console.log("Table object created successfully");
          return tableGroup;
        } catch (error) {
          console.error("Error creating table object:", error);
          return null;
        }

      default:
        console.warn(`Unsupported block type: ${block.type}`);
        return null;
    }
  };

  // ALSO ADD: Prevent canvas clearing on every state update
  // Update the render blocks useEffect to be more selective:

  // Render blocks on canvas - IMPROVED VERSION
  useEffect(() => {
    console.log("Render blocks effect triggered", {
      hasCanvas: !!canvas,
      isInitialized,
      blocksCount: blocks.length,
      showGrid,
      canvasDimensions: {
        width: config.canvas.width,
        height: config.canvas.height,
      },
      blocksIds: blocks.map((b) => b.id), // DEBUG: Track block IDs
    });

    if (!canvas || !isInitialized) {
      console.log("Skipping block rendering - canvas not ready", {
        hasCanvas: !!canvas,
        isInitialized,
      });
      return;
    }

    // CHECK IF BLOCKS ACTUALLY CHANGED before clearing everything
    const currentObjectIds = canvas
      .getObjects()
      .map((obj: any) => obj.id)
      .filter(Boolean);
    const newBlockIds = blocks.map((b) => b.id);

    const objectsChanged =
      currentObjectIds.length !== newBlockIds.length ||
      !currentObjectIds.every((id) => newBlockIds.includes(id)) ||
      !newBlockIds.every((id) => currentObjectIds.includes(id));

    console.log("Objects change check", {
      currentObjectIds,
      newBlockIds,
      objectsChanged,
      shouldUpdate: objectsChanged || showGrid !== canvas._hasGrid,
    });

    // Only clear and re-render if objects actually changed
    if (objectsChanged) {
      console.log("Clearing existing canvas objects due to changes");
      // Clear existing objects
      canvas.clear();

      // Add grid if enabled
      if (showGrid) {
        console.log("Adding grid to canvas");
        addGridToCanvas(canvas, config.canvas.width, config.canvas.height);
        canvas._hasGrid = true;
      } else {
        canvas._hasGrid = false;
      }

      // Render blocks
      console.log(`Rendering ${blocks.length} blocks on canvas`);
      blocks.forEach((block, index) => {
        console.log(`Creating fabric object for block ${index}`, {
          blockType: block.type,
          blockId: block.id,
          originalPosition: block.position,
          canvasBounds: {
            width: config.canvas.width,
            height: config.canvas.height,
          },
        });

        const fabricObject = createFabricObjectFromBlock(block);
        if (fabricObject) {
          canvas.add(fabricObject);
          console.log(`Added block ${index} to canvas with final properties:`, {
            id: fabricObject.id,
            type: fabricObject.blockType,
            position: { left: fabricObject.left, top: fabricObject.top },
            size: { width: fabricObject.width, height: fabricObject.height },
            visible: fabricObject.visible,
            text: fabricObject.text || "N/A",
          });
        } else {
          console.warn(`Failed to create fabric object for block ${index}`, {
            blockType: block.type,
          });
        }
      });

      console.log("Rendering all canvas objects");
      canvas.renderAll();
      console.log("Canvas rendering complete");

      // DEBUG: Log final canvas state
      console.log("Final canvas state:", {
        totalObjects: canvas.getObjects().length,
        objectTypes: canvas.getObjects().map((obj: any) => ({
          id: obj.id,
          type: obj.blockType || obj.type,
          visible: obj.visible,
          text: obj.text || "N/A",
        })),
      });
    } else {
      console.log("No changes detected, skipping re-render");
    }
  }, [
    canvas,
    blocks,
    showGrid,
    config.canvas.width,
    config.canvas.height,
    isInitialized,
  ]);

  // ADD DEBUG FUNCTION to inspect canvas objects
  const debugCanvasObjects = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    console.log("=== CANVAS DEBUG INFO ===");
    console.log("Total objects:", objects.length);

    objects.forEach((obj: any, index: number) => {
      console.log(`Object ${index}:`, {
        id: obj.id,
        type: obj.blockType || obj.type,
        position: { left: obj.left, top: obj.top },
        size: { width: obj.width, height: obj.height },
        visible: obj.visible,
        text: obj.text || "N/A",
        fill: obj.fill,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
      });
    });

    console.log("Canvas viewport:", {
      zoom: canvas.getZoom(),
      transform: canvas.viewportTransform,
    });
    console.log("========================");
  }, [canvas]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).debugCanvas = debugCanvasObjects;
    }
  }, [debugCanvasObjects]);

  // Add grid to canvas
  const addGridToCanvas = (
    canvas: any,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    console.log("Adding grid to canvas", {
      canvasWidth,
      canvasHeight,
      hasFabric: !!fabric,
      gridSettings: {
        size: canvasState.grid.size,
        color: canvasState.grid.color,
        opacity: canvasState.grid.opacity,
      },
    });

    if (!fabric) {
      console.warn("Fabric not available, cannot add grid");
      return;
    }

    const gridSize = canvasState.grid.size;
    const gridColor = canvasState.grid.color;
    const gridOpacity = canvasState.grid.opacity;

    try {
      // Vertical lines
      console.log(
        `Adding ${Math.ceil(canvasWidth / gridSize) + 1} vertical grid lines`
      );
      for (let i = 0; i <= canvasWidth; i += gridSize) {
        const line = new fabric.Line([i, 0, i, canvasHeight], {
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }

      // Horizontal lines
      console.log(
        `Adding ${Math.ceil(canvasHeight / gridSize) + 1} horizontal grid lines`
      );
      for (let i = 0; i <= canvasHeight; i += gridSize) {
        const line = new fabric.Line([0, i, canvasWidth, i], {
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }

      console.log("Grid added successfully");
    } catch (error) {
      console.error("Error adding grid to canvas:", error);
    }
  };

  // Drag and drop functionality
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "block",
      drop: (item: { type: BlockType }, monitor) => {
        if (!canvas || !onBlockDrop) return;

        const offset = monitor.getClientOffset();
        const canvasRect = canvasRef.current?.getBoundingClientRect();

        if (offset && canvasRect) {
          // Convert screen coordinates to canvas coordinates
          const zoom = canvas.getZoom();
          const vpt = canvas.viewportTransform;

          const position: Position = {
            x: (offset.x - canvasRect.left - vpt[4]) / zoom,
            y: (offset.y - canvasRect.top - vpt[5]) / zoom,
          };

          // Constrain position to canvas bounds
          const constrainedPosition = {
            x: Math.max(0, Math.min(position.x, config.canvas.width - 100)),
            y: Math.max(0, Math.min(position.y, config.canvas.height - 50)),
          };

          console.log("Block dropped on canvas", {
            blockType: item.type,
            screenPosition: { x: offset.x, y: offset.y },
            canvasPosition: position,
            constrainedPosition,
            canvasBounds: {
              width: config.canvas.width,
              height: config.canvas.height,
            },
          });

          onBlockDrop(item.type, constrainedPosition);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [canvas, onBlockDrop, config.canvas.width, config.canvas.height]
  );

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!canvas || !e.ctrlKey) return;

      e.preventDefault();

      const delta = e.deltaY;
      const zoom = canvas.getZoom();
      const newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;

      // Constrain zoom
      const constrainedZoom = Math.max(0.1, Math.min(5, newZoom));

      canvas.setZoom(constrainedZoom);
      canvas.renderAll();
    },
    [canvas]
  );

  // Setup refs
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      drop(node);
    },
    [drop]
  );

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  // Debug info
  console.log("Rendering PDFCanvas component", {
    isInitialized,
    hasCanvas: !!canvas,
    canvasRef: !!canvasRef.current,
    containerRef: !!containerRef.current,
    containerSize: { width, height },
    canvasLogicalSize: {
      width: config.canvas.width,
      height: config.canvas.height,
    },
    blocksCount: blocks.length,
  });

  return (
    <div
      ref={setRefs}
      className={`relative w-full h-full overflow-hidden ${
        isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-gray-100"
      }`}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Horizontal ruler */}
          <div className="absolute top-0 left-8 right-0 h-8 bg-white border-b border-gray-300 z-10">
            <div className="h-full flex items-end text-xs text-gray-500">
              {/* Ruler marks would go here */}
            </div>
          </div>

          {/* Vertical ruler */}
          <div className="absolute top-8 left-0 bottom-0 w-8 bg-white border-r border-gray-300 z-10">
            <div className="w-full h-full flex flex-col justify-start text-xs text-gray-500">
              {/* Ruler marks would go here */}
            </div>
          </div>
        </>
      )}

      {/* Canvas container */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          top: showRulers ? 32 : 0,
          left: showRulers ? 32 : 0,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block border border-gray-300 shadow-sm"
          style={{
            background: "white",
            margin: "20px",
            maxWidth: "calc(100% - 40px)",
            maxHeight: "calc(100% - 40px)",
          }}
          {...({ willReadFrequently: true } as any)}
        />
      </div>

      {/* Canvas controls - only show when initialized */}
      {isInitialized && (
        <CanvasControls canvas={canvas} className="absolute bottom-4 right-4" />
      )}

      {/* Loading overlay - show when not initialized */}
      {!isInitialized && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-lg text-gray-600 mb-2">
              Initializing Canvas...
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Canvas reference:{" "}
              {canvasRef.current ? "Available" : "Not available"}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Container reference:{" "}
              {containerRef.current ? "Available" : "Not available"}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Canvas dimensions: {config.canvas.width}x{config.canvas.height}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Container dimensions: {width}x{height}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              If this message persists, please check the browser console for
              errors.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
