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

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
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
    cropRegion: storeCropRegion,
    setPixelationCanvasSize,
    setSelectedColorGroupId,
    setCropRegion,
  } = useUploadStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const processingRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const dpr = useRef(window.devicePixelRatio || 1).current;

  const stateRef = useRef({
    isDragging: false,
    isPanning: false,
    isMoving: false,
    dragStart: null as { imageX: number; imageY: number } | null,
    panStart: null as { clientX: number; clientY: number; panX: number; panY: number } | null,
    panOffset: { x: 0, y: 0 },
    cropRegion: null as CropRegion | null,
    zoomLevel: 1,
    moveStart: null as { imageX: number; imageY: number; cropX: number; cropY: number } | null,
  });

  const [cropRegion, setCropRegionState] = useState<CropRegion | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [displayZoom, setDisplayZoom] = useState(100);

  const containerSize = 400;

  const { displayWidth, displayHeight } = useMemo(() => {
    const aspectRatio = imageWidth && imageHeight ? imageWidth / imageHeight : 1;
    const dw = aspectRatio >= 1 ? containerSize : containerSize * aspectRatio;
    const dh = aspectRatio >= 1 ? containerSize / aspectRatio : containerSize;
    return { displayWidth: dw, displayHeight: dh };
  }, [imageWidth, imageHeight]);

  const containerToImage = useCallback((containerX: number, containerY: number) => {
    const { panOffset, zoomLevel } = stateRef.current;
    const imageLeft = panOffset.x + (containerSize - displayWidth * zoomLevel) / 2;
    const imageTop = panOffset.y + (containerSize - displayHeight * zoomLevel) / 2;
    const imgX = (containerX - imageLeft) / zoomLevel;
    const imgY = (containerY - imageTop) / zoomLevel;
    return { imageX: imgX, imageY: imgY };
  }, [displayWidth, displayHeight]);

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

      const effectiveCrop = stateRef.current.cropRegion || storeCropRegion;
      if (effectiveCrop && effectiveCrop.width > 0 && effectiveCrop.height > 0) {
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;
        const sx = Math.floor(effectiveCrop.x * scaleX);
        const sy = Math.floor(effectiveCrop.y * scaleY);
        const sw = Math.floor(effectiveCrop.width * scaleX);
        const sh = Math.floor(effectiveCrop.height * scaleY);
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

      const previewUrl = exportToPNG({
        canvasData,
        canvasSize: pixelationCanvasSize,
        pixelSize: 8,
        backgroundColor: '#FFFFFF',
      });

      const previewImg = new Image();
      previewImg.src = previewUrl;
      previewImg.onload = () => {
        previewImageRef.current = previewImg;
      };
      setIsProcessing(false);
      processingRef.current = false;
    } catch {
      setError('Image processing failed');
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [pixelationCanvasSize, selectedColorGroupId, enableDithering, storeCropRegion, displayWidth, displayHeight]);

  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        stateRef.current = {
          isDragging: false,
          isPanning: false,
          isMoving: false,
          dragStart: null,
          panStart: null,
          panOffset: { x: 0, y: 0 },
          cropRegion: null,
          zoomLevel: 1,
          moveStart: null,
        };
        setDisplayZoom(100);
        setCropRegionState(null);
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

  const drawCanvas = useCallback(() => {
    const canvas = imageCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidthPx = containerSize * dpr;
    const displayHeightPx = containerSize * dpr;

    if (canvas.width !== displayWidthPx || canvas.height !== displayHeightPx) {
      canvas.width = displayWidthPx;
      canvas.height = displayHeightPx;
      canvas.style.width = `${containerSize}px`;
      canvas.style.height = `${containerSize}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, containerSize, containerSize);

    const { panOffset, zoomLevel, cropRegion: currentCrop } = stateRef.current;

    ctx.save();
    ctx.translate(containerSize / 2 + panOffset.x, containerSize / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
    ctx.restore();

    if (currentCrop && currentCrop.width > 0 && currentCrop.height > 0) {
      const selLeft = containerSize / 2 + panOffset.x + (currentCrop.x - displayWidth / 2) * zoomLevel;
      const selTop = containerSize / 2 + panOffset.y + (currentCrop.y - displayHeight / 2) * zoomLevel;
      const selWidth = currentCrop.width * zoomLevel;
      const selHeight = currentCrop.height * zoomLevel;

      ctx.fillStyle = 'rgba(196, 149, 106, 0.2)';
      ctx.fillRect(selLeft, selTop, selWidth, selHeight);

      ctx.strokeStyle = '#c4956a';
      ctx.lineWidth = 2;
      ctx.strokeRect(selLeft, selTop, selWidth, selHeight);

      const handleSize = 8;
      ctx.fillStyle = '#c4956a';
      ctx.fillRect(selLeft - handleSize / 2, selTop - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(selLeft + selWidth - handleSize / 2, selTop - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(selLeft - handleSize / 2, selTop + selHeight - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(selLeft + selWidth - handleSize / 2, selTop + selHeight - handleSize / 2, handleSize, handleSize);
    }
  }, [displayWidth, displayHeight, dpr]);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const previewImg = previewImageRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidthPx = containerSize * dpr;
    const displayHeightPx = containerSize * dpr;

    if (canvas.width !== displayWidthPx || canvas.height !== displayHeightPx) {
      canvas.width = displayWidthPx;
      canvas.height = displayHeightPx;
      canvas.style.width = `${containerSize}px`;
      canvas.style.height = `${containerSize}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, containerSize, containerSize);

    if (previewImg && previewImg.complete) {
      const srcWidth = previewImg.width;
      const srcHeight = previewImg.height;
      const srcSize = Math.min(srcWidth, srcHeight);
      const scale = containerSize / srcSize;
      const scaledSize = srcSize * scale;
      const sx = (srcWidth - srcSize) / 2;
      const sy = (srcHeight - srcSize) / 2;
      const dx = (containerSize - scaledSize) / 2;
      const dy = (containerSize - scaledSize) / 2;
      ctx.drawImage(previewImg, sx, sy, srcSize, srcSize, dx, dy, scaledSize, scaledSize);
    }
  }, [dpr]);

  useEffect(() => {
    if (!open) return;

    const render = () => {
      drawCanvas();
      drawPreview();
      animationFrameRef.current = requestAnimationFrame(render);
    };
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, drawCanvas, drawPreview]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      imageRef.current = null;
      previewImageRef.current = null;
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    const { imageX, imageY } = containerToImage(containerX, containerY);

    if (e.altKey) {
      setIsPanning(true);
      stateRef.current.isPanning = true;
      stateRef.current.panStart = { clientX: e.clientX, clientY: e.clientY, panX: stateRef.current.panOffset.x, panY: stateRef.current.panOffset.y };
    } else {
      const existingCrop = stateRef.current.cropRegion;
      if (existingCrop && existingCrop.width > 0 && existingCrop.height > 0) {
        if (imageX >= existingCrop.x && imageX <= existingCrop.x + existingCrop.width &&
            imageY >= existingCrop.y && imageY <= existingCrop.y + existingCrop.height) {
          setIsDragging(true);
          stateRef.current.isMoving = true;
          stateRef.current.moveStart = { 
            imageX, 
            imageY, 
            cropX: existingCrop.x, 
            cropY: existingCrop.y 
          };
          return;
        }
      }
      setIsDragging(true);
      stateRef.current.isDragging = true;
      stateRef.current.dragStart = { imageX, imageY };
      stateRef.current.cropRegion = { x: imageX, y: imageY, width: 0, height: 0 };
    }
  }, [containerToImage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    const { imageX, imageY } = containerToImage(containerX, containerY);

    if (stateRef.current.isPanning && stateRef.current.panStart) {
      const dx = e.clientX - stateRef.current.panStart.clientX;
      const dy = e.clientY - stateRef.current.panStart.clientY;
      const newOffset = { x: stateRef.current.panStart.panX + dx, y: stateRef.current.panStart.panY + dy };
      stateRef.current.panOffset = newOffset;
    } else if (stateRef.current.isMoving && stateRef.current.moveStart) {
      const deltaX = imageX - stateRef.current.moveStart.imageX;
      const deltaY = imageY - stateRef.current.moveStart.imageY;
      const newX = stateRef.current.moveStart.cropX + deltaX;
      const newY = stateRef.current.moveStart.cropY + deltaY;
      stateRef.current.cropRegion = {
        x: newX,
        y: newY,
        width: stateRef.current.cropRegion?.width || 0,
        height: stateRef.current.cropRegion?.height || 0,
      };
    } else if (stateRef.current.isDragging && stateRef.current.dragStart) {
      const startX = stateRef.current.dragStart.imageX;
      const startY = stateRef.current.dragStart.imageY;
      const deltaX = imageX - startX;
      const deltaY = imageY - startY;
      const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
      const x = deltaX < 0 ? startX - size : startX;
      const y = deltaY < 0 ? startY - size : startY;
      stateRef.current.cropRegion = { x, y, width: size, height: size };
    }
  }, [containerToImage]);

  const handleMouseUp = useCallback(() => {
    const crop = stateRef.current.cropRegion;
    if (stateRef.current.isMoving && crop) {
      setCropRegionState({ ...crop });
      setCropRegion({ ...crop });
    } else if (stateRef.current.isDragging && crop) {
      if (crop.width > 5 && crop.height > 5) {
        setCropRegionState(crop);
        setCropRegion(crop);
      }
    }
    setIsDragging(false);
    setIsPanning(false);
    stateRef.current.isDragging = false;
    stateRef.current.isPanning = false;
    stateRef.current.isMoving = false;
    stateRef.current.dragStart = null;
    stateRef.current.panStart = null;
    stateRef.current.moveStart = null;
  }, [setCropRegion]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(stateRef.current.zoomLevel * delta, 0.5), 5);
    stateRef.current.zoomLevel = newZoom;
    setDisplayZoom(Math.round(newZoom * 100));
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(stateRef.current.zoomLevel * 1.2, 5);
    stateRef.current.zoomLevel = newZoom;
    setDisplayZoom(Math.round(newZoom * 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(stateRef.current.zoomLevel * 0.8, 0.5);
    stateRef.current.zoomLevel = newZoom;
    setDisplayZoom(Math.round(newZoom * 100));
  }, []);

  const handleResetView = useCallback(() => {
    stateRef.current.zoomLevel = 1;
    stateRef.current.panOffset = { x: 0, y: 0 };
    stateRef.current.cropRegion = null;
    setDisplayZoom(100);
    setCropRegionState(null);
    setCropRegion(null);
  }, [setCropRegion]);

  const handleConfirm = useCallback(() => {
    if (!imageRef.current) return;

    setIsProcessing(true);

    const img = imageRef.current;

    let processWidth: number;
    let processHeight: number;
    let sx = 0;
    let sy = 0;

    const crop = stateRef.current.cropRegion || storeCropRegion;
    if (crop && crop.width > 0 && crop.height > 0) {
      const scaleX = img.width / displayWidth;
      const scaleY = img.height / displayHeight;
      sx = Math.floor(crop.x * scaleX);
      sy = Math.floor(crop.y * scaleY);
      processWidth = Math.floor(crop.width * scaleX);
      processHeight = Math.floor(crop.height * scaleY);
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
  }, [pixelationCanvasSize, selectedColorGroupId, enableDithering, storeCropRegion, displayWidth, displayHeight, onConfirm]);

  const effectiveCrop = cropRegion;
  const cropPercent = effectiveCrop && displayWidth > 0 && displayHeight > 0
    ? {
        x: ((effectiveCrop.x / displayWidth) * 100).toFixed(1),
        y: ((effectiveCrop.y / displayHeight) * 100).toFixed(1),
        width: ((effectiveCrop.width / displayWidth) * 100).toFixed(1),
        height: ((effectiveCrop.height / displayHeight) * 100).toFixed(1),
      }
    : null;

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
                  {displayZoom}%
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
              <canvas
                ref={imageCanvasRef}
                style={{
                  display: 'block',
                  width: containerSize,
                  height: containerSize,
                }}
              />
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
            <div
              style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                background: 'var(--color-primary-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
              }}
            >
              <div><strong>{t('pixelation.dragSelect')}</strong></div>
              <div>{t('pixelation.altDragPan')}</div>
              <div>{t('pixelation.scrollZoom')}</div>
            </div>
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
                position: 'relative',
              }}
            >
              {isProcessing ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin tip={t('pixelation.processing')} />
                </div>
              ) : (
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    display: 'block',
                    width: containerSize,
                    height: containerSize,
                  }}
                />
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
