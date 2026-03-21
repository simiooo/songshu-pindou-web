import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, Button, Spin, Alert, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CanvasSize, CanvasData } from '@/types/editor';
import { useUploadStore } from '@/store/uploadStore';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import { useImageGeneration, PERLER_BEAD_PROMPT_TEMPLATE, isVolcesAPI, calculateImageSize } from '@/hooks/useImageGeneration';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';

interface ImageProcessingPreviewProps {
  open: boolean;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (canvasData: CanvasData, canvasSize: CanvasSize) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

export function ImageProcessingPreview({
  open,
  imageUrl,
  imageWidth,
  imageHeight,
  onConfirm,
  onCancel,
  onOpenSettings,
}: ImageProcessingPreviewProps) {
  const { t } = useTranslation();
  const { pixelationCanvasSize, setPixelationCanvasSize } = useUploadStore();
  const { getImageProcessor } = useLLMProviderStore();
  const { generateImage, isGenerating, error } = useImageGeneration();

  const [prompt, setPrompt] = useState('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // Use ref to track if we've generated for this open
  const hasGeneratedRef = useRef(false);

  const imageProcessor = getImageProcessor();
  const hasImageProcessor = !!imageProcessor;

  // Reset ref when modal closes
  useEffect(() => {
    if (!open) {
      hasGeneratedRef.current = false;
    }
  }, [open]);

  const performGeneration = useCallback(async (userPrompt: string) => {
    if (!imageProcessor || isGenerating) return;

    setProcessingError(null);

    try {
      // 检测是否是字节跳动 API
      const isVolces = isVolcesAPI(imageProcessor.baseUrl || '');
      
      // 构建最终 prompt：用户输入 + 拼豆模板
      const finalPrompt = userPrompt 
        ? `${userPrompt}\n\n${PERLER_BEAD_PROMPT_TEMPLATE}`
        : PERLER_BEAD_PROMPT_TEMPLATE;

      // 根据原图比例自动计算尺寸
      const size = calculateImageSize(imageWidth, imageHeight, isVolces);
      
      // 字节跳动特有参数
      const additionalParams = isVolces ? {
        sequential_image_generation: 'disabled',
        stream: false,
        watermark: false,
      } : {
        stream: false,
      };
      
      const result = await generateImage(imageProcessor, {
        prompt: finalPrompt,
        imageUrl,
        size,
        responseFormat: 'url',
        additionalParams,
      });
      
      if (result?.imageUrl) {
        setProcessedImageUrl(result.imageUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('upload.processingFailed');
      setProcessingError(errorMessage);
    }
  }, [generateImage, imageProcessor, imageUrl, imageWidth, imageHeight, t, isGenerating]);

  // Handle auto-generation on first open
  const handleAfterOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && !hasGeneratedRef.current) {
      setPrompt('');
      setProcessedImageUrl(null);
      setProcessingError(null);
      hasGeneratedRef.current = true;
      
      if (hasImageProcessor) {
        void performGeneration('');
      }
    }
  }, [hasImageProcessor, performGeneration]);

  const handleGenerate = useCallback(() => {
    void performGeneration(prompt);
  }, [prompt, performGeneration]);

  const handleConfirm = useCallback(async () => {
    if (!processedImageUrl) return;

    try {
      // 使用代理获取图片，避免 CORS 问题
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(processedImageUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelationCanvasSize;
        canvas.height = pixelationCanvasSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          message.error(t('upload.processingFailed'));
          URL.revokeObjectURL(blobUrl);
          return;
        }

        // Draw image to fit the canvas size (maintaining aspect ratio)
        const scale = Math.min(
          pixelationCanvasSize / img.width,
          pixelationCanvasSize / img.height
        );
        const x = (pixelationCanvasSize - img.width * scale) / 2;
        const y = (pixelationCanvasSize - img.height * scale) / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pixelationCanvasSize, pixelationCanvasSize);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Get image data
        const imageData = ctx.getImageData(0, 0, pixelationCanvasSize, pixelationCanvasSize);

        // Convert to CanvasData
        const canvasData: CanvasData = [];
        for (let y = 0; y < pixelationCanvasSize; y++) {
          const row = [];
          for (let x = 0; x < pixelationCanvasSize; x++) {
            const idx = (y * pixelationCanvasSize + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const a = imageData.data[idx + 3];

            const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

            row.push({
              color: a > 128 ? hex : null,
              filled: a > 128,
            });
          }
          canvasData.push(row);
        }

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
        onConfirm(canvasData, pixelationCanvasSize);
      };

      img.onerror = () => {
        message.error(t('upload.processingFailed'));
        URL.revokeObjectURL(blobUrl);
      };

      img.src = blobUrl;
    } catch (error) {
      message.error(t('upload.processingFailed'));
    }
  }, [processedImageUrl, pixelationCanvasSize, onConfirm, t]);

  return (
    <Modal
      title={t('upload.imageProcessing')}
      open={open}
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!processedImageUrl || isGenerating}
        >
          {t('upload.applyToCanvas')}
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {!hasImageProcessor && (
          <Alert
            type="error"
            message={t('upload.noImageProcessor')}
            description={
              <div>
                <p>{t('upload.configureImageProcessor')}</p>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={onOpenSettings}
                  size="small"
                >
                  {t('upload.openSettings')}
                </Button>
              </div>
            }
            showIcon
          />
        )}

        {(processingError || error) && (
          <Alert
            type="error"
            message={t('upload.processingFailed')}
            description={processingError || (error instanceof Error ? error.message : String(error))}
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleGenerate}
                disabled={!hasImageProcessor || isGenerating}
              >
                {t('common.retry')}
              </Button>
            }
          />
        )}

        <div>
          <span style={{ fontWeight: 500, marginRight: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
            {t('pixelation.canvasSize')}:
          </span>
          <Button.Group>
            {[29, 52, 72, 104].map((size) => (
              <Button
                key={size}
                type={pixelationCanvasSize === size ? 'primary' : 'default'}
                onClick={() => setPixelationCanvasSize(size as CanvasSize)}
                size="small"
                disabled={isGenerating}
              >
                {size}
              </Button>
            ))}
          </Button.Group>
        </div>

        {hasImageProcessor && (
          <div>
            <Input.TextArea
              placeholder={t('upload.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              disabled={isGenerating}
            />
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)' }}>
              <Button
                type="primary"
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={!hasImageProcessor}
              >
                {processedImageUrl ? t('upload.regenerate') : t('upload.generate')}
              </Button>
              {processedImageUrl && (
                <Button onClick={() => setProcessedImageUrl(null)}>
                  {t('upload.clear')}
                </Button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
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
              {t('pixelation.originalImage')}
            </label>
            <div
              style={{
                width: 360,
                height: 360,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={imageUrl}
                alt="Original"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
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
              {t('upload.processedPreview')} ({pixelationCanvasSize}×{pixelationCanvasSize})
            </label>
            <div
              style={{
                width: 360,
                height: 360,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isGenerating ? (
                <div style={{ textAlign: 'center' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>
                    {t('upload.processing')}
                  </p>
                </div>
              ) : processedImageUrl ? (
                <img
                  src={processedImageUrl}
                  alt="Processed"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <p>{hasImageProcessor ? t('upload.clickGenerate') : t('upload.configureFirst')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
