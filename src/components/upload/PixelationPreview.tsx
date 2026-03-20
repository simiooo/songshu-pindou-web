import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, Button, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CanvasSize, ColorGroup, CanvasData } from '@/types/editor';
import { DEFAULT_COLOR_GROUPS } from '@/constants/colorGroups';
import { imageDataToCanvasData } from '@/utils/pixelation';
import { exportToPNG } from '@/utils/exportUtils';
import { useUploadStore } from '@/store/uploadStore';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';

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
  const { t } = useTranslation();
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
        setError('Unable to create canvas context');
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
        setError('No color group selected');
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
      setError('Image processing failed');
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
      setError('Failed to load image');
    };
    img.src = imageUrl;
  }, [open, imageUrl, processImage, setCropRegion]);

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
      setError('Unable to create canvas context');
      setIsProcessing(false);
      return;
    }
    ctx.drawImage(img, sx, sy, processWidth, processHeight, 0, 0, processWidth, processHeight);
    const imageData = ctx.getImageData(0, 0, processWidth, processHeight);

    const colorGroup = DEFAULT_COLOR_GROUPS.find(
      (g: ColorGroup) => g.id === selectedColorGroupId
    );
    if (!colorGroup) {
      setError('No color group selected');
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
      title={t('pixelation.preview')}
      open={open}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel')}
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} disabled={isProcessing || !!error}>
          {t('pixelation.apply')}
        </Button>,
      ]}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        {error && <Alert type="error" message={error} />}

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 500,
                marginRight: 'var(--space-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
              }}
            >
              {t('pixelation.canvasSize')}:
            </span>
            <Button.Group>
              {[29, 52, 72, 104].map((size) => (
                <Button
                  key={size}
                  type={pixelationCanvasSize === size ? 'primary' : 'default'}
                  onClick={() => setPixelationCanvasSize(size as CanvasSize)}
                  size="small"
                >
                  {size}
                </Button>
              ))}
            </Button.Group>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 500,
                marginRight: 'var(--space-sm)',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
              }}
            >
              {t('pixelation.colorGroup')}:
            </span>
            <Button.Group>
              {DEFAULT_COLOR_GROUPS.map((group: ColorGroup) => (
                <Button
                  key={group.id}
                  type={selectedColorGroupId === group.id ? 'primary' : 'default'}
                  onClick={() => setSelectedColorGroupId(group.id)}
                  size="small"
                >
                  {group.name}
                </Button>
              ))}
            </Button.Group>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-sm)',
              }}
            >
              <label
                style={{
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  fontSize: 13,
                }}
              >
                {t('pixelation.originalImage')}
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-xs)',
                  alignItems: 'center',
                }}
              >
                <Button
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                />
                <span
                  style={{
                    lineHeight: '24px',
                    minWidth: 50,
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <Button
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                />
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleResetView}
                />
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
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg-secondary)',
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
                    border: '2px solid var(--color-primary)',
                    background: 'rgba(196, 149, 106, 0.15)',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
            {cropPercent && (
              <p
                style={{
                  marginTop: 'var(--space-sm)',
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {t('pixelation.selected')}: {cropPercent.x}% × {cropPercent.y}%, {t('pixelation.size')}: {cropPercent.width}% × {cropPercent.height}%
              </p>
            )}
            <p
              style={{
                marginTop: 'var(--space-xs)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('pixelation.dimensions')}: {imageWidth} × {imageHeight}px | {t('pixelation.display')}: {displayWidth.toFixed(0)} × {displayHeight.toFixed(0)}px
            </p>
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                fontWeight: 500,
                color: 'var(--color-text)',
                fontSize: 13,
                display: 'block',
                marginBottom: 'var(--space-sm)',
              }}
            >
              {t('pixelation.pixelatedPreview')} ({pixelationCanvasSize}×{pixelationCanvasSize})
            </label>
            <div
              style={{
                width: containerSize,
                height: containerSize,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isProcessing ? (
                <Spin tip={t('pixelation.processing')} />
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
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  {t('pixelation.waitProcess')}
                </span>
              )}
            </div>
            <p
              style={{
                marginTop: 'var(--space-sm)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('pixelation.size')}: {pixelationCanvasSize} × {pixelationCanvasSize} {t('pixelation.pixelUnit')} | {t('pixelation.dithering')}: {enableDithering ? t('pixelation.enabled') : t('pixelation.disabled')}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
