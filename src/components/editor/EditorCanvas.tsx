import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useKeyPress, useEventListener } from 'ahooks';
import { useEditorStore } from '@/store/editorStore';
import type { EditorOperation } from '@/types/editor';

interface EditorCanvasProps {
  showGrid: boolean;
  gridColor: 'dark' | 'light';
}

const PIXEL_SIZE = 12;

export function EditorCanvas({ showGrid, gridColor }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentOperations, setCurrentOperations] = useState<EditorOperation[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const [localSelection, setLocalSelection] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const {
    canvasData,
    canvasSize,
    currentTool,
    currentColor,
    setPixel,
    erasePixel,
    fillArea,
    pushHistory,
    setSelection,
    zoomLevel,
    panOffset,
    setZoomLevel,
    setPanOffset,
    selection,
  } = useEditorStore();

  useKeyPress('Escape', () => {
    if (currentTool === 'selection') {
      setLocalSelection(null);
      setSelection(null);
    }
  });

  const canvasWidth = canvasSize * PIXEL_SIZE;
  const canvasHeight = canvasSize * PIXEL_SIZE;

  const getPixelCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const visualWidth = rect.width;
      const visualHeight = rect.height;
      
      const x = Math.floor((e.clientX - rect.left) / (visualWidth / canvasSize));
      const y = Math.floor((e.clientY - rect.top) / (visualHeight / canvasSize));

      if (x < 0 || y < 0 || x >= canvasSize || y >= canvasSize) {
        return null;
      }

      return { x, y };
    },
    [canvasSize]
  );

  const handlePixelAction = useCallback(
    (x: number, y: number): EditorOperation | null => {
      if (currentTool === 'brush') {
        return setPixel(x, y, currentColor);
      } else if (currentTool === 'eraser') {
        return erasePixel(x, y);
      }
      return null;
    },
    [currentTool, currentColor, setPixel, erasePixel]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.altKey) {
        setIsPanning(true);
        setPanStart({ clientX: e.clientX, clientY: e.clientY, panX: panOffset.x, panY: panOffset.y });
        return;
      }

      const coords = getPixelCoords(e);
      if (!coords) return;

      if (currentTool === 'fill') {
        const operations = fillArea(coords.x, coords.y, currentColor);
        if (operations.length > 0) {
          pushHistory(operations);
        }
        return;
      }

      if (currentTool === 'selection') {
        setLocalSelection({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
        return;
      }

      setIsDragging(true);
      const op = handlePixelAction(coords.x, coords.y);
      if (op) {
        setCurrentOperations([op]);
      }
    },
    [currentTool, currentColor, getPixelCoords, handlePixelAction, fillArea, pushHistory, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning && panStart) {
        const dx = e.clientX - panStart.clientX;
        const dy = e.clientY - panStart.clientY;
        setPanOffset({ x: panStart.panX + dx, y: panStart.panY + dy });
        return;
      }

      if (currentTool === 'selection' && localSelection) {
        const coords = getPixelCoords(e);
        if (!coords) return;
        setLocalSelection(prev => prev ? { ...prev, x2: coords.x, y2: coords.y } : null);
        return;
      }

      if (!isDragging) return;

      const coords = getPixelCoords(e);
      if (!coords) return;

      const op = handlePixelAction(coords.x, coords.y);
      if (op) {
        setCurrentOperations((prev) => [...prev, op]);
      }
    },
    [currentTool, isDragging, isPanning, panStart, localSelection, getPixelCoords, handlePixelAction, setPanOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && currentOperations.length > 0) {
      pushHistory(currentOperations);
      setCurrentOperations([]);
    }
    if (currentTool === 'selection' && localSelection) {
      setSelection({
        x1: localSelection.x1,
        y1: localSelection.y1,
        x2: localSelection.x2,
        y2: localSelection.y2,
      });
      setLocalSelection(null);
    }
    setIsDragging(false);
    setIsPanning(false);
    setPanStart(null);
  }, [isDragging, currentOperations, pushHistory, currentTool, localSelection, setSelection]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * delta, 0.5), 5);
    setZoomLevel(newZoom);
  }, [zoomLevel, setZoomLevel]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvasSize; y++) {
      for (let x = 0; x < canvasSize; x++) {
        const pixel = canvasData[y]?.[x];
        if (pixel?.filled && pixel.color) {
          ctx.fillStyle = pixel.color;
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      }
    }

    if (showGrid) {
      ctx.strokeStyle = gridColor === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;

      for (let i = 0; i <= canvasSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SIZE, 0);
        ctx.lineTo(i * PIXEL_SIZE, canvasHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SIZE);
        ctx.lineTo(canvasWidth, i * PIXEL_SIZE);
        ctx.stroke();
      }
    }
  }, [canvasData, canvasSize, canvasWidth, canvasHeight, showGrid, gridColor]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleGlobalMouseUp = useCallback(() => {
    if (isDragging && currentOperations.length > 0) {
      pushHistory(currentOperations);
      setCurrentOperations([]);
    }
    if (currentTool === 'selection' && localSelection) {
      setSelection({
        x1: localSelection.x1,
        y1: localSelection.y1,
        x2: localSelection.x2,
        y2: localSelection.y2,
      });
      setLocalSelection(null);
    }
    setIsDragging(false);
    setIsPanning(false);
    setPanStart(null);
  }, [isDragging, currentOperations, pushHistory, currentTool, localSelection, setSelection]);

  useEventListener('mouseup', handleGlobalMouseUp);

  const selectionBox = useMemo(() => {
    const sel = localSelection || selection;
    if (!sel) return null;
    const x1 = Math.min(sel.x1, sel.x2);
    const y1 = Math.min(sel.y1, sel.y2);
    const x2 = Math.max(sel.x1, sel.x2);
    const y2 = Math.max(sel.y1, sel.y2);
    return {
      left: x1 * PIXEL_SIZE,
      top: y1 * PIXEL_SIZE,
      width: (x2 - x1 + 1) * PIXEL_SIZE,
      height: (y2 - y1 + 1) * PIXEL_SIZE,
    };
  }, [localSelection, selection]);

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            position: 'relative',
          }}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              display: 'block',
              cursor: isPanning 
                ? 'grabbing' 
                : (currentTool === 'selection' 
                  ? (isDragging ? 'move' : 'crosshair')
                  : (currentTool === 'brush' || currentTool === 'eraser' ? 'crosshair' : 'default')),
            }}
          />
          {selectionBox && currentTool === 'selection' && (
            <div
              style={{
                position: 'absolute',
                left: selectionBox.left,
                top: selectionBox.top,
                width: selectionBox.width,
                height: selectionBox.height,
                border: '2px dashed #D4763B',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
