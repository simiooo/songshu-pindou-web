import { Select, Radio, Space, Button, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/store/editorStore';
import { useUploadStore } from '@/store/uploadStore';
import { CANVAS_SIZES } from '@/constants/colorGroups';
import { processImageToCanvasData } from '@/hooks/useImageGeneration';
import { useCallback, useState } from 'react';
import type { CanvasSize } from '@/types/editor';
import { ReloadOutlined } from '@ant-design/icons';

interface CanvasSizeSelectorProps {
  variant?: 'select' | 'radio';
  enableReprocess?: boolean;
}

export function CanvasSizeSelector({ variant = 'select', enableReprocess = false }: CanvasSizeSelectorProps) {
  const { t } = useTranslation();
  const { canvasSize, setCanvasSize, loadCanvas } = useEditorStore();
  const { getCachedCanvasData, getCachedAIImage } = useUploadStore();
  const [isReprocessing, setIsReprocessing] = useState(false);

  const handleSizeChange = useCallback(async (newSize: CanvasSize) => {
    if (!enableReprocess) {
      // 不启用后处理模式，直接设置尺寸
      setCanvasSize(newSize);
      return;
    }

    // 后处理模式：检查是否有缓存的AI图片或Canvas数据
    const cachedData = getCachedCanvasData();
    
    if (cachedData) {
      // 如果有缓存的canvas数据，尝试根据缓存的AI图片重新处理
      setIsReprocessing(true);
      try {
        // 构建缓存键（与ImageProcessingPreview一致，不包含size）
        const cacheKey = `${cachedData.imageUrl}-${useEditorStore.getState().activeColorGroupId}`;
        const cachedAIImage = getCachedAIImage(cacheKey);
        
        if (cachedAIImage) {
          // 使用缓存的AI图片重新处理
          const newCanvasData = await processImageToCanvasData(cachedAIImage.imageUrl, newSize);
          loadCanvas(newCanvasData, newSize);
          message.success(t('editor.sizeReprocessed') || '尺寸已调整并重新处理');
        } else {
          // 没有缓存的AI图片，只调整尺寸（会清空画布）
          setCanvasSize(newSize);
        }
      } catch (error) {
        console.error('Reprocessing failed:', error);
        message.error(t('editor.reprocessFailed') || '重新处理失败，仅调整尺寸');
        setCanvasSize(newSize);
      } finally {
        setIsReprocessing(false);
      }
    } else {
      // 没有缓存数据，直接设置尺寸
      setCanvasSize(newSize);
    }
  }, [enableReprocess, getCachedCanvasData, getCachedAIImage, setCanvasSize, loadCanvas, t]);

  const handleReprocess = useCallback(async () => {
    const cachedData = getCachedCanvasData();
    if (!cachedData) {
      message.warning(t('editor.noCachedData') || '没有可重新处理的数据');
      return;
    }

    setIsReprocessing(true);
    try {
      const cacheKey = `${cachedData.imageUrl}-${useEditorStore.getState().activeColorGroupId}`;
      const cachedAIImage = getCachedAIImage(cacheKey);
      
      if (cachedAIImage) {
        const newCanvasData = await processImageToCanvasData(cachedAIImage.imageUrl, canvasSize);
        loadCanvas(newCanvasData, canvasSize);
        message.success(t('editor.reprocessed') || '已重新处理');
      } else {
        message.warning(t('editor.noCachedAIImage') || '没有缓存的AI图片');
      }
    } catch (error) {
      console.error('Reprocessing failed:', error);
      message.error(t('editor.reprocessFailed') || '重新处理失败');
    } finally {
      setIsReprocessing(false);
    }
  }, [getCachedCanvasData, getCachedAIImage, canvasSize, loadCanvas, t]);

  if (variant === 'radio') {
    return (
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {t('editor.canvasSize')}
        </div>
        <Radio.Group
          value={canvasSize}
          onChange={(e) => handleSizeChange(e.target.value as CanvasSize)}
          style={{ width: '100%' }}
          optionType="button"
          buttonStyle="solid"
          disabled={isReprocessing}
        >
          <Space wrap style={{ width: '100%' }}>
            {CANVAS_SIZES.map((item) => (
              <Radio.Button
                key={item.value}
                value={item.value}
                style={{
                  minWidth: 80,
                  textAlign: 'center',
                }}
              >
                {item.label}
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
        {enableReprocess && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReprocess}
            loading={isReprocessing}
            disabled={isReprocessing}
            style={{ marginTop: 'var(--space-sm)', width: '100%' }}
          >
            {isReprocessing ? (t('editor.reprocessing') || '重新处理中...') : (t('editor.reprocess') || '重新处理当前尺寸')}
          </Button>
        )}
        {isReprocessing && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            <Spin size="small" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 'var(--space-sm)',
        }}
      >
        {t('editor.canvasSize')}
      </div>
      <Select
        value={canvasSize}
        onChange={(value) => handleSizeChange(value)}
        style={{ width: '100%' }}
        disabled={isReprocessing}
        options={CANVAS_SIZES.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
      />
      {enableReprocess && (
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleReprocess}
          loading={isReprocessing}
          disabled={isReprocessing}
          style={{ marginTop: 'var(--space-sm)', width: '100%' }}
        >
          {isReprocessing ? (t('editor.reprocessing') || '重新处理中...') : (t('editor.reprocess') || '重新处理当前尺寸')}
        </Button>
      )}
      {isReprocessing && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
}
