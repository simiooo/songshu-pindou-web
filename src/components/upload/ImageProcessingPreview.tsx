import { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Spin, Alert, Input, message, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CanvasSize, CanvasData, ColorGroup } from '@/types/editor';
import { useUploadStore } from '@/store/uploadStore';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import { useEditorStore } from '@/store/editorStore';
import { useImageGeneration, generateGridPrompt, isVolcesAPI, calculateImageSize } from '@/hooks/useImageGeneration';
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

// 可用的网格尺寸选项 - 精简为3种主流尺寸
const GRID_SIZES = [29, 52, 72] as const;

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
  const { setPixelationCanvasSize, selectedColorGroupId, setSelectedColorGroupId, cacheAIImage, cacheCanvasData } = useUploadStore();
  const { getImageProcessor } = useLLMProviderStore();
  const { generateImage, isGenerating } = useImageGeneration();
  const { colorGroups } = useEditorStore();

  const [prompt, setPrompt] = useState('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedGridSize, setSelectedGridSize] = useState<CanvasSize | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const activeColorGroup = colorGroups.find((g) => g.id === selectedColorGroupId) || colorGroups[0];

  const imageProcessor = getImageProcessor();
  const hasImageProcessor = !!imageProcessor;

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setProcessedImageUrl(null);
      setProcessingError(null);
      setSelectedGridSize(null);
      setIsConfirmed(false);
      setIsApplying(false);
    }
  }, [open]);

  const performGeneration = useCallback(async (userPrompt: string, gridSize: CanvasSize, colorGroup: ColorGroup) => {
    if (!imageProcessor || isGenerating) return;

    setProcessingError(null);

    try {
      // 检测是否是字节跳动 API
      const isVolces = isVolcesAPI(imageProcessor.baseUrl || '');

      // 构建带网格参数的最终 prompt，包含色号组信息
      const finalPrompt = generateGridPrompt(userPrompt, gridSize, {
        name: colorGroup.name,
        brand: colorGroup.brand,
        beadSize: colorGroup.beadSize,
        colorCount: colorGroup.colors.length,
      });

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
        // 缓存AI生成的图片（不包含gridSize，这样可以用同一张图重新处理成不同尺寸）
        const cacheKey = `${imageUrl}-${colorGroup.id}`;
        cacheAIImage(cacheKey, result.imageUrl, gridSize);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('upload.processingFailed');
      setProcessingError(errorMessage);
    }
  }, [generateImage, imageProcessor, imageUrl, imageWidth, imageHeight, t, isGenerating, cacheAIImage]);

  const handleGridSizeSelect = useCallback((size: CanvasSize) => {
    setSelectedGridSize(size);
    setPixelationCanvasSize(size);
    // 选择尺寸后直接进入处理预览界面
    setIsConfirmed(true);
    // 自动开始生成
    if (hasImageProcessor && imageProcessor) {
      void performGeneration(prompt, size, activeColorGroup);
    }
  }, [setPixelationCanvasSize, hasImageProcessor, imageProcessor, prompt, performGeneration, activeColorGroup]);

  const handleGenerate = useCallback(() => {
    if (selectedGridSize) {
      void performGeneration(prompt, selectedGridSize, activeColorGroup);
    }
  }, [prompt, selectedGridSize, performGeneration, activeColorGroup]);

  const handleConfirm = useCallback(async () => {
    if (!processedImageUrl || !selectedGridSize) return;

    setIsApplying(true);

    try {
      // 使用代理获取图片，避免 CORS 问题
      // 如果已经是代理 URL，直接使用；否则添加代理前缀
      const proxyUrl = processedImageUrl.startsWith('/api/')
        ? processedImageUrl
        : `/api/proxy-image?url=${encodeURIComponent(processedImageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        // 创建与原图相同尺寸的 canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          message.error(t('upload.processingFailed'));
          URL.revokeObjectURL(blobUrl);
          setIsApplying(false);
          return;
        }

        // 绘制原图
        ctx.drawImage(img, 0, 0);

        // 获取完整图像数据
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const canvasData: CanvasData = [];

        // 将原图划分为 gridSize x gridSize 的网格，每个网格取中心点像素
        const cellWidth = img.width / selectedGridSize;
        const cellHeight = img.height / selectedGridSize;

        for (let gridY = 0; gridY < selectedGridSize; gridY++) {
          const row = [];
          for (let gridX = 0; gridX < selectedGridSize; gridX++) {
            // 计算该网格单元中心点在原图中的坐标
            const centerX = Math.floor(gridX * cellWidth + cellWidth / 2);
            const centerY = Math.floor(gridY * cellHeight + cellHeight / 2);

            // 确保坐标在有效范围内
            const safeX = Math.min(centerX, img.width - 1);
            const safeY = Math.min(centerY, img.height - 1);

            // 读取中心点像素
            const idx = (safeY * img.width + safeX) * 4;
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
        setIsApplying(false);
        // 缓存canvas数据供后处理使用
        cacheCanvasData(canvasData, selectedGridSize, imageUrl);
        onConfirm(canvasData, selectedGridSize);
      };

      img.onerror = () => {
        message.error(t('upload.processingFailed'));
        URL.revokeObjectURL(blobUrl);
        setIsApplying(false);
      };

      img.src = blobUrl;
    } catch {
      message.error(t('upload.processingFailed'));
      setIsApplying(false);
    }
  }, [processedImageUrl, selectedGridSize, onConfirm, t, cacheCanvasData, imageUrl]);

  // 渲染网格尺寸选择界面
  const renderGridSelection = () => (
    <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
      <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text)' }}>
        {t('upload.selectGridSize') || '请选择网格尺寸'}
      </h3>
      <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-secondary)' }}>
        {t('upload.gridSizeDescription') || '选择拼豆画布的网格尺寸，这将决定最终图案的精细程度'}
      </p>

      {/* 色号组选择 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {t('color.colorGroup') || '色号组'}:
        </span>
        <Select
          value={selectedColorGroupId}
          onChange={(value) => {
            setSelectedColorGroupId(value);
          }}
          style={{ minWidth: 200 }}
          options={colorGroups.map((group) => ({
            value: group.id,
            label: `${group.name} (${group.brand} ${group.beadSize}) - ${group.colors.length} ${t('pixelation.colors') || '色'}`
          }))}
        />
      </div>

      {/* 自定义 Prompt 输入 */}
      <div style={{ marginBottom: 'var(--space-lg)', maxWidth: 500, margin: '0 auto var(--space-lg)' }}>
        <Input.TextArea
          placeholder={t('upload.promptPlaceholder') || '输入自定义提示词（可选），描述你想要的图案效果...'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          disabled={isGenerating}
        />
      </div>

      <div style={{
        marginBottom: 'var(--space-xl)',
        padding: 'var(--space-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 'var(--space-sm)',
        }}>
          {t('upload.gridSizeLabel') || '画布尺寸'}
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {GRID_SIZES.map((size) => (
            <Button
              key={size}
              type={selectedGridSize === size ? 'primary' : 'default'}
              onClick={() => handleGridSizeSelect(size as CanvasSize)}
              size="large"
              style={{
                minWidth: 100,
                height: 60,
                fontSize: 16,
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{size}×{size}</div>
                   <div style={{ fontSize: 12, opacity: 0.7 }}>
                   {size === 29 && (t('upload.gridSizeSmall') || '迷你')}
                   {size === 52 && (t('upload.gridSizeMedium') || '中型')}
                   {size === 72 && (t('upload.gridSizeLarge') || '大型')}
                 </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染图片处理和预览界面
  const renderProcessingPreview = () => (
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

      {processingError && (
        <Alert
          type="error"
          message={t('upload.processingFailed')}
          description={processingError}
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

      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {t('upload.selectedGridSize') || '已选网格尺寸'}:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Select
            value={selectedGridSize!}
            onChange={(value) => {
              setSelectedGridSize(value);
              setPixelationCanvasSize(value);
            }}
            size="small"
            style={{ width: 120 }}
            options={GRID_SIZES.map((size) => ({
              value: size,
              label: `${size}×${size}`,
            }))}
          />
        </div>
      </div>

      {hasImageProcessor && (
        <div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 13 }}>
                {t('color.colorGroup') || '色号组'}:
              </span>
              <Select
                value={selectedColorGroupId}
                onChange={(value) => {
                  setSelectedColorGroupId(value);
                }}
                style={{ minWidth: 200 }}
                options={colorGroups.map((group) => ({
                  value: group.id,
                  label: `${group.name} (${group.brand} ${group.beadSize}) - ${group.colors.length} ${t('pixelation.colors') || '色'}`
                }))}
              />
            </div>
            <Input.TextArea
              placeholder={t('upload.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              disabled={isGenerating}
            />
          </div>
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
            {t('upload.processedPreview')} ({selectedGridSize}×{selectedGridSize})
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
  );

  return (
    <Modal
      title={t('upload.imageProcessing')}
      open={open}
      onCancel={onCancel}
      width={800}
      footer={isConfirmed ? [
        <Button key="cancel" onClick={onCancel} disabled={isApplying}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!processedImageUrl || isGenerating || isApplying}
          loading={isApplying}
        >
          {t('upload.applyToCanvas')}
        </Button>,
      ] : [
        <Button key="cancel" onClick={onCancel} disabled={isApplying}>
          {t('common.cancel')}
        </Button>,
      ]}
    >
      {!isConfirmed ? renderGridSelection() : renderProcessingPreview()}
    </Modal>
  );
}
