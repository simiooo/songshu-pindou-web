import { useRef, useEffect, useCallback, useState } from 'react';
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
  } = useEditorStore();

  const getPixelCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);

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
        setSelection({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
        return;
      }

      setIsDragging(true);
      const op = handlePixelAction(coords.x, coords.y);
      if (op) {
        setCurrentOperations([op]);
      }
    },
    [currentTool, currentColor, getPixelCoords, handlePixelAction, fillArea, pushHistory, setSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = getPixelCoords(e);
      if (!coords) return;

      if (currentTool === 'selection') {
        const selection = useEditorStore.getState().selection;
        if (selection) {
          setSelection({
            ...selection,
            x2: coords.x,
            y2: coords.y,
          });
        }
        return;
      }

      if (!isDragging) return;

      const op = handlePixelAction(coords.x, coords.y);
      if (op) {
        setCurrentOperations((prev) => [...prev, op]);
      }
    },
    [currentTool, isDragging, getPixelCoords, handlePixelAction, setSelection]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && currentOperations.length > 0) {
      pushHistory(currentOperations);
      setCurrentOperations([]);
    }
    setIsDragging(false);
  }, [isDragging, currentOperations, pushHistory]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize * PIXEL_SIZE;
    canvas.height = canvasSize * PIXEL_SIZE;

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
        ctx.lineTo(i * PIXEL_SIZE, canvasSize * PIXEL_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SIZE);
        ctx.lineTo(canvasSize * PIXEL_SIZE, i * PIXEL_SIZE);
        ctx.stroke();
      }
    }

    const selection = useEditorStore.getState().selection;
    if (selection) {
      const x1 = Math.min(selection.x1, selection.x2);
      const y1 = Math.min(selection.y1, selection.y2);
      const x2 = Math.max(selection.x1, selection.x2);
      const y2 = Math.max(selection.y1, selection.y2);

      ctx.strokeStyle = '#D4763B';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        x1 * PIXEL_SIZE + 1,
        y1 * PIXEL_SIZE + 1,
        (x2 - x1 + 1) * PIXEL_SIZE - 2,
        (y2 - y1 + 1) * PIXEL_SIZE - 2
      );
      ctx.setLineDash([]);
    }
  }, [canvasData, canvasSize, showGrid, gridColor]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && currentOperations.length > 0) {
        pushHistory(currentOperations);
        setCurrentOperations([]);
      }
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, currentOperations, pushHistory]);

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          cursor: currentTool === 'brush' || currentTool === 'eraser' ? 'crosshair' : 'default',
        }}
      />
    </div>
  );
}
