"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useEditorStore } from '../../stores/editor-store';
import { CanvasControls } from './CanvasControls';
import type { BlockType, Position, FabricObjectWithId } from '../../types';

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
    console.log('PDFCanvas component mounted', { 
      width, 
      height, 
      showGrid, 
      showRulers, 
      showGuides 
    });
    
    return () => {
      console.log('PDFCanvas component unmounted');
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
    console.log('Canvas initialization effect triggered', { 
      hasCanvasRef: !!canvasRef.current, 
      hasExistingCanvas: !!canvas,
      width,
      height,
      configBg: config.canvas.backgroundColor
    });
    
    // Use a small timeout to ensure the canvas element is properly rendered in the DOM
    const initTimeout = setTimeout(() => {
      console.log('Checking canvas ref after timeout', { hasCanvasRef: !!canvasRef.current });
      
      if (!canvasRef.current) {
        console.log('Canvas ref is still not available after timeout, skipping initialization');
        return;
      }
      
      if (canvas) {
        console.log('Canvas already exists in store, skipping initialization');
        return;
      }

      const initializeFabric = async () => {
        console.log('Starting fabric initialization');
        try {
          if (!fabric) {
            console.log('Fabric not loaded, importing dynamically');
            try {
              // Dynamically import fabric only on client side
              const fabricModule = await import('fabric');
              fabric = fabricModule.fabric;
              console.log('Fabric imported successfully', { 
                fabricLoaded: !!fabric,
                fabricVersion: fabric?.version || 'unknown',
                fabricObject: Object.keys(fabric || {}).length > 0 ? 'has properties' : 'empty object'
              });
              
              if (!fabric || !fabric.Canvas) {
                console.error('Fabric loaded but Canvas class is not available', fabric);
                throw new Error('Fabric Canvas class not available');
              }
            } catch (importError) {
              console.error('Error importing fabric.js:', importError);
              throw importError;
            }
          }

          console.log('Creating fabric canvas instance', { 
            canvasRefExists: !!canvasRef.current,
            canvasElement: canvasRef.current,
            dimensions: { width, height }
          });
          
          // Make sure we still have the canvas reference
          if (!canvasRef.current) {
            console.error('Canvas reference lost during initialization');
            return null;
          }
          
          // Check if the canvas element has proper dimensions
          const canvasElement = canvasRef.current;
          console.log('Canvas element dimensions before initialization', {
            offsetWidth: canvasElement.offsetWidth,
            offsetHeight: canvasElement.offsetHeight,
            clientWidth: canvasElement.clientWidth,
            clientHeight: canvasElement.clientHeight,
            width: canvasElement.width,
            height: canvasElement.height
          });
          
          let fabricCanvas;
          
          try {
            console.log('Attempting to create interactive Canvas');
            fabricCanvas = new fabric.Canvas(canvasRef.current, {
              width: width,
              height: height,
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
            });
          } catch (canvasError) {
            console.error('Error creating interactive Canvas, trying StaticCanvas as fallback:', canvasError);
            
            try {
              // Try with StaticCanvas as fallback
              fabricCanvas = new fabric.StaticCanvas(canvasRef.current, {
                width: width,
                height: height,
                backgroundColor: config.canvas.backgroundColor,
                renderOnAddRemove: true,
              });
              console.log('Created StaticCanvas as fallback');
            } catch (staticCanvasError) {
              console.error('Error creating StaticCanvas fallback:', staticCanvasError);
              throw new Error('Failed to create both Canvas and StaticCanvas');
            }
          }
          
          console.log('Fabric canvas created successfully', { 
            canvasCreated: !!fabricCanvas,
            canvasDimensions: { width: fabricCanvas.width, height: fabricCanvas.height }
          });

          // Configure default controls
          fabric.Object.prototype.set({
            borderColor: '#4285f4',
            borderOpacityWhenMoving: 0.5,
            borderScaleFactor: 2,
            cornerColor: '#4285f4',
            cornerStyle: 'circle',
            cornerSize: 8,
            transparentCorners: false,
            rotatingPointOffset: 40,
          });

          // Set initial zoom and center
          fabricCanvas.setZoom(1);
          fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

          // Setup canvas in store
          console.log('Setting canvas in store and updating initialization state');
          setCanvas(fabricCanvas);
          setIsInitialized(true);
          console.log('Canvas initialization complete');

          return fabricCanvas;
        } catch (error) {
          console.error('Error initializing fabric canvas:', error);
          return null;
        }
      };

      let fabricCanvasInstance: any = null;

      initializeFabric()
        .then((canvas) => {
          fabricCanvasInstance = canvas;
          console.log('Canvas instance saved to local variable', { hasInstance: !!fabricCanvasInstance });
        })
        .catch(error => {
          console.error('Unhandled error in fabric initialization:', error);
        });
    }, 100); // Small delay to ensure DOM is ready

    // Cleanup
    return () => {
      console.log('Cleanup function called, clearing timeout and disposing canvas');
      clearTimeout(initTimeout);
      
      if (canvas) {
        console.log('Disposing existing canvas');
        canvas.dispose();
      }
      setCanvas(null);
      setIsInitialized(false);
    };
  }, [width, height, config.canvas.backgroundColor, setCanvas, canvas]);

  // Update canvas size when container resizes
  useEffect(() => {
    console.log('Canvas resize effect triggered', { 
      hasCanvas: !!canvas, 
      isInitialized, 
      newDimensions: { width, height } 
    });
    
    if (canvas && isInitialized) {
      console.log('Resizing canvas');
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
      console.log('Canvas resized successfully');
    } else {
      console.log('Skipping canvas resize - canvas not ready', { 
        hasCanvas: !!canvas, 
        isInitialized 
      });
    }
  }, [canvas, width, height, isInitialized]);

  // Render blocks on canvas
  useEffect(() => {
    console.log('Render blocks effect triggered', { 
      hasCanvas: !!canvas, 
      isInitialized, 
      blocksCount: blocks.length,
      showGrid,
      canvasDimensions: { 
        width: config.canvas.width, 
        height: config.canvas.height 
      }
    });
    
    if (!canvas || !isInitialized) {
      console.log('Skipping block rendering - canvas not ready', { 
        hasCanvas: !!canvas, 
        isInitialized 
      });
      return;
    }

    console.log('Clearing existing canvas objects');
    // Clear existing objects
    canvas.clear();
    
    // Add grid if enabled
    if (showGrid) {
      console.log('Adding grid to canvas');
      addGridToCanvas(canvas, config.canvas.width, config.canvas.height);
    }

    // Render blocks
    console.log(`Rendering ${blocks.length} blocks on canvas`);
    blocks.forEach((block, index) => {
      console.log(`Creating fabric object for block ${index}`, { blockType: block.type, blockId: block.id });
      const fabricObject = createFabricObjectFromBlock(block);
      if (fabricObject) {
        canvas.add(fabricObject);
        console.log(`Added block ${index} to canvas`);
      } else {
        console.warn(`Failed to create fabric object for block ${index}`, { blockType: block.type });
      }
    });

    console.log('Rendering all canvas objects');
    canvas.renderAll();
    console.log('Canvas rendering complete');
  }, [canvas, blocks, showGrid, config.canvas.width, config.canvas.height, isInitialized]);

  // Create fabric object from block
  const createFabricObjectFromBlock = (block: any): FabricObjectWithId | null => {
    console.log('Creating fabric object from block', { 
      blockType: block.type, 
      blockId: block.id,
      hasFabric: !!fabric 
    });
    
    if (!fabric) {
      console.warn('Fabric not available, cannot create object');
      return null;
    }
    
    switch (block.type) {
      case 'text':
        console.log('Creating text object', { 
          content: block.content,
          position: block.position,
          size: block.size
        });
        
        try {
          const textObject = new fabric.Textbox(block.content, {
            left: block.position.x,
            top: block.position.y,
            width: block.size.width,
            height: block.size.height,
            fontFamily: block.fontFamily,
            fontSize: block.fontSize,
            fontWeight: block.fontWeight,
            fontStyle: block.fontStyle,
            textAlign: block.textAlign,
            fill: block.color,
            angle: block.rotation,
            opacity: block.opacity,
            selectable: !block.locked,
            visible: block.visible,
          }) as unknown as FabricObjectWithId;
          
          textObject.id = block.id;
          textObject.blockType = block.type;
          textObject.blockData = block;
          
          console.log('Text object created successfully');
          return textObject;
        } catch (error) {
          console.error('Error creating text object:', error);
          return null;
        }

      case 'image':
        console.log('Creating image placeholder object', { 
          position: block.position,
          size: block.size
        });
        
        try {
          // For now, create a placeholder rectangle for images
          const imageObject = new fabric.Rect({
            left: block.position.x,
            top: block.position.y,
            width: block.size.width,
            height: block.size.height,
            fill: '#f0f0f0',
            stroke: '#cccccc',
            strokeWidth: 2,
            angle: block.rotation,
            opacity: block.opacity,
            selectable: !block.locked,
            visible: block.visible,
          }) as FabricObjectWithId;
          
          // Add image placeholder text
          const imageText = new fabric.Text('IMAGE', {
            left: block.position.x + block.size.width / 2,
            top: block.position.y + block.size.height / 2,
            fontSize: 14,
            fill: '#999999',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
          });
          
          imageObject.id = block.id;
          imageObject.blockType = block.type;
          imageObject.blockData = block;
          
          console.log('Image placeholder object created successfully');
          // For now, just return the rectangle
          return imageObject;
        } catch (error) {
          console.error('Error creating image placeholder object:', error);
          return null;
        }

      case 'table':
        console.log('Creating table object', { 
          position: block.position,
          size: block.size,
          rows: block.rows,
          columns: block.columns
        });
        
        try {
          // Create a simple table representation
          const tableGroup = new fabric.Group([], {
            left: block.position.x,
            top: block.position.y,
            angle: block.rotation,
            opacity: block.opacity,
            selectable: !block.locked,
            visible: block.visible,
          }) as unknown as FabricObjectWithId;

          const cellWidth = block.size.width / block.columns;
          const cellHeight = block.size.height / block.rows;
          
          console.log('Table cell dimensions calculated', { cellWidth, cellHeight });

          // Create table cells
          for (let row = 0; row < block.rows; row++) {
            for (let col = 0; col < block.columns; col++) {
              console.log(`Creating cell at row ${row}, col ${col}`);
              
              const cellRect = new fabric.Rect({
                left: col * cellWidth,
                top: row * cellHeight,
                width: cellWidth,
                height: cellHeight,
                fill: row === 0 ? block.headerStyle.backgroundColor : block.cellStyle.backgroundColor,
                stroke: block.borderStyle.color,
                strokeWidth: block.borderStyle.width,
              });

              const cellData = block.data[row]?.[col];
              const cellText = new fabric.Text(cellData?.content || '', {
                left: col * cellWidth + 5,
                top: row * cellHeight + 5,
                fontSize: row === 0 ? block.headerStyle.fontSize : block.cellStyle.fontSize,
                fontWeight: row === 0 ? block.headerStyle.fontWeight : block.cellStyle.fontWeight,
                fill: row === 0 ? block.headerStyle.textColor : block.cellStyle.textColor,
              });

              // Note: These lines are commented out in the original code
              // tableGroup.addWithUpdate(cellRect);
              // tableGroup.addWithUpdate(cellText);
              console.log(`Cell at row ${row}, col ${col} created but not added to group`);
            }
          }

          tableGroup.id = block.id;
          tableGroup.blockType = block.type;
          tableGroup.blockData = block;
          
          console.log('Table object created successfully');
          return tableGroup;
        } catch (error) {
          console.error('Error creating table object:', error);
          return null;
        }

      default:
        console.warn(`Unsupported block type: ${block.type}`);
        return null;
    }
  };

  // Add grid to canvas
  const addGridToCanvas = (canvas: any, canvasWidth: number, canvasHeight: number) => {
    console.log('Adding grid to canvas', { 
      canvasWidth, 
      canvasHeight,
      hasFabric: !!fabric,
      gridSettings: {
        size: canvasState.grid.size,
        color: canvasState.grid.color,
        opacity: canvasState.grid.opacity
      }
    });
    
    if (!fabric) {
      console.warn('Fabric not available, cannot add grid');
      return;
    }
    
    const gridSize = canvasState.grid.size;
    const gridColor = canvasState.grid.color;
    const gridOpacity = canvasState.grid.opacity;

    try {
      // Vertical lines
      console.log(`Adding ${Math.ceil(canvasWidth / gridSize) + 1} vertical grid lines`);
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
      console.log(`Adding ${Math.ceil(canvasHeight / gridSize) + 1} horizontal grid lines`);
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
      
      console.log('Grid added successfully');
    } catch (error) {
      console.error('Error adding grid to canvas:', error);
    }
  };

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvas || !e.ctrlKey) return;

    e.preventDefault();
    
    const delta = e.deltaY;
    const zoom = canvas.getZoom();
    const newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
    
    // Constrain zoom
    const constrainedZoom = Math.max(
      config.constraints.minZoom,
      Math.min(newZoom, config.constraints.maxZoom)
    );

    // Zoom to mouse position
    const pointer = canvas.getPointer(e);
    canvas.zoomToPoint(pointer, constrainedZoom);
    
    setZoom(constrainedZoom);
  }, [canvas, config.constraints, setZoom]);

  // Handle panning
  const handleMouseDown = useCallback((e: fabric.IEvent) => {
    if (!canvas) return;

    const evt = e.e as MouseEvent;
    
    // Middle mouse button or space + left click for panning
    if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
      canvas.isDragging = true;
      canvas.lastPosX = evt.clientX;
      canvas.lastPosY = evt.clientY;
      canvas.defaultCursor = 'grabbing';
      evt.preventDefault();
    }
  }, [canvas]);

  const handleMouseMove = useCallback((e: fabric.IEvent) => {
    if (!canvas || !canvas.isDragging) return;

    const evt = e.e as MouseEvent;
    const deltaX = evt.clientX - canvas.lastPosX;
    const deltaY = evt.clientY - canvas.lastPosY;
    
    pan(deltaX, deltaY);
    
    canvas.lastPosX = evt.clientX;
    canvas.lastPosY = evt.clientY;
  }, [canvas, pan]);

  const handleMouseUp = useCallback(() => {
    if (!canvas) return;
    
    canvas.isDragging = false;
    canvas.defaultCursor = 'default';
  }, [canvas]);

  // Setup event listeners
  useEffect(() => {
    console.log('Event listeners setup effect triggered', { 
      hasCanvas: !!canvas, 
      hasContainer: !!containerRef.current 
    });
    
    if (!canvas || !containerRef.current) {
      console.log('Skipping event listener setup - dependencies not ready', { 
        hasCanvas: !!canvas, 
        hasContainer: !!containerRef.current 
      });
      return;
    }

    console.log('Setting up canvas event listeners');
    const container = containerRef.current;

    // Mouse wheel for zoom
    container.addEventListener('wheel', handleWheel, { passive: false });
    console.log('Added wheel event listener');

    // Canvas events for panning
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    console.log('Added canvas mouse event listeners');

    return () => {
      console.log('Cleaning up event listeners');
      container.removeEventListener('wheel', handleWheel);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Drop zone for drag and drop
  const [{ isOver }, drop] = useDrop({
    accept: 'block',
    drop: (item: { type: BlockType }, monitor) => {
      if (!canvas || !onBlockDrop) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const canvasRect = canvas.getElement().getBoundingClientRect();
      const canvasPointer = {
        x: clientOffset.x - canvasRect.left,
        y: clientOffset.y - canvasRect.top,
      };

      // Transform to canvas coordinates
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;
      if (vpt) {
        const position = {
          x: (canvasPointer.x - vpt[4]) / zoom,
          y: (canvasPointer.y - vpt[5]) / zoom,
        };
        onBlockDrop(item.type, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine refs
  const setRefs = useCallback((element: HTMLDivElement) => {
    containerRef.current = element;
    drop(element);
  }, [drop]);

  console.log('Rendering PDFCanvas component', { 
    isInitialized, 
    hasCanvas: !!canvas, 
    canvasRef: !!canvasRef.current,
    containerRef: !!containerRef.current
  });

  return (
    <div 
      ref={setRefs}
      className={`relative w-full h-full overflow-hidden ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-100'
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
          width={width}
          height={height}
          className="block border border-gray-300 shadow-sm"
          style={{
            background: 'white',
            margin: '20px',
            maxWidth: 'calc(100% - 40px)',
            maxHeight: 'calc(100% - 40px)',
          }}
        />
      </div>

      {/* Canvas controls - only show when initialized */}
      {isInitialized && (
        <CanvasControls 
          canvas={canvas}
          className="absolute bottom-4 right-4"
        />
      )}

      {/* Loading overlay - show when not initialized */}
      {!isInitialized && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-lg text-gray-600 mb-2">Initializing Canvas...</div>
            <div className="text-sm text-gray-500 mb-1">
              Canvas reference: {canvasRef.current ? 'Available' : 'Not available'}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Container reference: {containerRef.current ? 'Available' : 'Not available'}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Canvas dimensions: {width}x{height}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              If this message persists, please check the browser console for errors.
            </div>
          </div>
        </div>
      )}

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg font-semibold shadow-lg">
            Drop Block Here
          </div>
        </div>
      )}
    </div>
  );
};