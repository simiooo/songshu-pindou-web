import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, Button, Spin, Alert } from 'antd';
import type { CanvasSize, ColorGroup, CanvasData } from '@/types/editor';
import { DEFAULT_COLOR_GROUPS } from '@/constants/colorGroups';
import { imageDataToCanvasData } from '@/utils/pixelation';
import { exportToPNG } from '@/utils/exportUtils';
import { useUploadStore } from '@/store/uploadStore';

interface PixelationPreviewProps {
  open: boolean;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (canvasData: CanvasData, canvasSize: CanvasSize) => void;
  onCancel: () => void;
}

export function PixelationPreview({
  open,
  imageUrl,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
}: PixelationPreviewProps) {
  const {
    pixelationCanvasSize,
    selectedColorGroupId,
    enableDithering,
    cropRegion,
    zoomLevel,
    setPixelationCanvasSize,
    setSelectedColorGroupId,
    setCropRegion,
    setZoomLevel,
  } = useUploadStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ imageX: number; imageY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const processingRef = useRef(false);
  const isFirstLoadRef = useRef(true);

  const containerSize = 400;

  const { displayWidth, displayHeight } = useMemo(() => {
    const aspectRatio = imageWidth && imageHeight ? imageWidth / imageHeight : 1;
    const dw = aspectRatio >= 1 ? containerSize : containerSize * aspectRatio;
    const dh = aspectRatio >= 1 ? containerSize / aspectRatio : containerSize;
    return { displayWidth: dw, displayHeight: dh };
  }, [imageWidth, imageHeight]);

  const imageLeft = panOffset.x + (containerSize - displayWidth * zoomLevel) / 2;
  const imageTop = panOffset.y + (containerSize - displayHeight * zoomLevel) / 2;

  const containerToImage = useCallback((containerX: number, containerY: number) => {
    const imageX = (containerX - imageLeft) / zoomLevel;
    const imageY = (containerY - imageTop) / zoomLevel;
    return { imageX, imageY };
  }, [imageLeft, imageTop, zoomLevel]);

  const processImage = useCallback(() => {
    if (!imageRef.current || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('无法创建画布上下文');
        setIsProcessing(false);
        processingRef.current = false;
        return;
      }

      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, img.width, img.height);

      if (cropRegion && cropRegion.width > 0 && cropRegion.height > 0) {
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;
        const sx = Math.floor(cropRegion.x * scaleX);
        const sy = Math.floor(cropRegion.y * scaleY);
        const sw = Math.floor(cropRegion.width * scaleX);
        const sh = Math.floor(cropRegion.height * scaleY);
        imageData = ctx.getImageData(sx, sy, sw, sh);
      }

      const colorGroup = DEFAULT_COLOR_GROUPS.find(
        (g: ColorGroup) => g.id === selectedColorGroupId
      );
      if (!colorGroup) {
        setError('未选择色号组');
        setIsProcessing(false);
        processingRef.current = false;
        return;
      }

      const canvasData = imageDataToCanvasData(
        imageData,
        pixelationCanvasSize,
        colorGroup.colors,
        enableDithering
      );

      const previewDataUrl = exportToPNG({
        canvasData,
        canvasSize: pixelationCanvasSize,
        pixelSize: 8,
        backgroundColor: '#FFFFFF',
      });

      setPreviewUrl(previewDataUrl);
      setIsProcessing(false);
      processingRef.current = false;
    } catch {
      setError('图片处理失败');
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [pixelationCanvasSize, selectedColorGroupId, enableDithering, cropRegion, displayWidth, displayHeight]);

  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        setPanOffset({ x: 0, y: 0 });
        setCropRegion(null);
      }
      processImage();
    };
    img.onerror = () => {
      setError('图片加载失败');
    };
    img.src = imageUrl;
  }, [open, imageUrl, processImage]);

  useEffect(() => {
    if (!open) {
      isFirstLoadRef.current = true;
    }
  }, [open]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    const { imageX, imageY } = containerToImage(containerX, containerY);

    if (e.altKey) {
      setIsPanning(true);
      setPanStart({ clientX: e.clientX, clientY: e.clientY, panX: panOffset.x, panY: panOffset.y });
    } else {
      setIsDragging(true);
      setDragStart({ imageX, imageY });
      setCropRegion({ x: imageX, y: imageY, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.clientX;
      const dy = e.clientY - panStart.clientY;
      setPanOffset({ x: panStart.panX + dx, y: panStart.panY + dy });
    } else if (isDragging && dragStart) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;
      const { imageX, imageY } = containerToImage(containerX, containerY);

      const minX = Math.min(dragStart.imageX, imageX);
      const minY = Math.min(dragStart.imageY, imageY);
      const width = Math.abs(imageX - dragStart.imageX);
      const height = Math.abs(imageY - dragStart.imageY);

      setCropRegion({ x: minX, y: minY, width, height });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
    setDragStart(null);
    setPanStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * delta, 0.5), 5);
    setZoomLevel(newZoom);
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel * 0.8, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setCropRegion(null);
  };

  const handleConfirm = useCallback(() => {
    if (!imageRef.current) return;

    setIsProcessing(true);

    const img = imageRef.current;

    let processWidth: number;
    let processHeight: number;
    let sx = 0;
    let sy = 0;

    if (cropRegion && cropRegion.width > 0 && cropRegion.height > 0) {
      const scaleX = img.width / displayWidth;
      const scaleY = img.height / displayHeight;
      sx = Math.floor(cropRegion.x * scaleX);
      sy = Math.floor(cropRegion.y * scaleY);
      processWidth = Math.floor(cropRegion.width * scaleX);
      processHeight = Math.floor(cropRegion.height * scaleY);
    } else {
      processWidth = img.width;
      processHeight = img.height;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processWidth;
    tempCanvas.height = processHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      setError('无法创建画布上下文');
      setIsProcessing(false);
      return;
    }
    ctx.drawImage(img, sx, sy, processWidth, processHeight, 0, 0, processWidth, processHeight);
    const imageData = ctx.getImageData(0, 0, processWidth, processHeight);

    const colorGroup = DEFAULT_COLOR_GROUPS.find(
      (g: ColorGroup) => g.id === selectedColorGroupId
    );
    if (!colorGroup) {
      setError('未选择色号组');
      setIsProcessing(false);
      return;
    }

    const canvasData = imageDataToCanvasData(
      imageData,
      pixelationCanvasSize,
      colorGroup.colors,
      enableDithering
    );

    onConfirm(canvasData, pixelationCanvasSize);
    setIsProcessing(false);
  }, [pixelationCanvasSize, selectedColorGroupId, enableDithering, cropRegion, displayWidth, displayHeight, onConfirm]);

  const cropPercent = cropRegion && displayWidth > 0 && displayHeight > 0
    ? {
        x: ((cropRegion.x / displayWidth) * 100).toFixed(1),
        y: ((cropRegion.y / displayHeight) * 100).toFixed(1),
        width: ((cropRegion.width / displayWidth) * 100).toFixed(1),
        height: ((cropRegion.height / displayHeight) * 100).toFixed(1),
      }
    : null;

  const selectionBoxStyle = useMemo(() => {
    if (!cropRegion || cropRegion.width <= 0 || cropRegion.height <= 0) return null;
    return {
      left: imageLeft + cropRegion.x * zoomLevel,
      top: imageTop + cropRegion.y * zoomLevel,
      width: cropRegion.width * zoomLevel,
      height: cropRegion.height * zoomLevel,
    };
  }, [cropRegion, imageLeft, imageTop, zoomLevel]);

  return (
    <Modal
      title="图片像素化预览"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} disabled={isProcessing || !!error}>
          应用到画布
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert type="error" message={error} />}

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 500, marginRight: 8 }}>画布尺寸:</span>
            <Button.Group>
              {[29, 52, 72, 104].map((size) => (
                <Button
                  key={size}
                  type={pixelationCanvasSize === size ? 'primary' : 'default'}
                  onClick={() => setPixelationCanvasSize(size as CanvasSize)}
                >
                  {size}
                </Button>
              ))}
            </Button.Group>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 500, marginRight: 8 }}>色号组:</span>
            <Button.Group>
              {DEFAULT_COLOR_GROUPS.map((group: ColorGroup) => (
                <Button
                  key={group.id}
                  type={selectedColorGroupId === group.id ? 'primary' : 'default'}
                  onClick={() => setSelectedColorGroupId(group.id)}
                >
                  {group.name}
                </Button>
              ))}
            </Button.Group>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 500 }}>原图 (拖拽选择区域，Alt+拖拽平移，滚轮缩放)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" onClick={handleZoomOut}>-</Button>
                <span style={{ lineHeight: '24px', minWidth: 50, textAlign: 'center' }}>{(zoomLevel * 100).toFixed(0)}%</span>
                <Button size="small" onClick={handleZoomIn}>+</Button>
                <Button size="small" onClick={handleResetView}>重置</Button>
              </div>
            </div>
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                width: containerSize,
                height: containerSize,
                border: '1px solid #e8e8e8',
                borderRadius: 4,
                overflow: 'hidden',
                background: '#fafafa',
                position: 'relative',
                cursor: isPanning ? 'grabbing' : isDragging ? 'crosshair' : 'grab',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: containerSize / 2,
                  top: containerSize / 2,
                  transformOrigin: 'center center',
                  transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px)) scale(${zoomLevel})`,
                }}
              >
                <img
                  src={imageUrl}
                  alt="Original"
                  width={displayWidth}
                  height={displayHeight}
                  draggable={false}
                  style={{ display: 'block' }}
                />
              </div>
              {selectionBoxStyle && (
                <div
                  style={{
                    position: 'absolute',
                    left: selectionBoxStyle.left,
                    top: selectionBoxStyle.top,
                    width: selectionBoxStyle.width,
                    height: selectionBoxStyle.height,
                    border: '2px solid #1890ff',
                    background: 'rgba(24, 144, 255, 0.1)',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            {cropPercent && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                选中: {cropPercent.x}% × {cropPercent.y}%, 尺寸: {cropPercent.width}% × {cropPercent.height}%
              </p>
            )}
            <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              尺寸: {imageWidth} × {imageHeight}px | 显示: {displayWidth.toFixed(0)} × {displayHeight.toFixed(0)}px
            </p>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>像素化预览 ({pixelationCanvasSize}×{pixelationCanvasSize})</label>
            <div
              style={{
                width: containerSize,
                height: containerSize,
                border: '1px solid #e8e8e8',
                borderRadius: 4,
                overflow: 'hidden',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isProcessing ? (
                <Spin tip="处理中..." />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pixelated Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span style={{ color: '#999' }}>等待处理...</span>
              )}
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              尺寸: {pixelationCanvasSize} × {pixelationCanvasSize} 颗粒 | 抖动: {enableDithering ? '启用' : '关闭'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}