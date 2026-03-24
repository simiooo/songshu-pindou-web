import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Spin,
  Alert,
  Input,
  message,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Image,
  Flex,
  Badge,
  Divider,
  Segmented,
  ConfigProvider,
  Form,
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  EditOutlined,
  RobotOutlined,
  AppstoreOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CanvasSize, CanvasData, ColorGroup } from '@/types/editor';
import { useUploadStore } from '@/store/uploadStore';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import { useEditorStore } from '@/store/editorStore';
import {
  useImageGeneration,
  generateGridPrompt,
  isVolcesAPI,
  calculateImageSize,
} from '@/hooks/useImageGeneration';

const { Title, Text } = Typography;

interface ImageProcessingPreviewProps {
  open: boolean;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onConfirm: (canvasData: CanvasData, canvasSize: CanvasSize) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

const GRID_SIZES = [29, 52, 72] as const;

const sizeLabels: Record<number, { label: string; desc: string }> = {
  29: { label: '29×29', desc: '迷你' },
  52: { label: '52×52', desc: '中型' },
  72: { label: '72×72', desc: '大型' },
};

interface FormValues {
  colorGroupId: string;
  prompt: string;
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
  const {
    setPixelationCanvasSize,
    selectedColorGroupId,
    setSelectedColorGroupId,
    cacheAIImage,
    cacheCanvasData,
  } = useUploadStore();
  const { getImageProcessor } = useLLMProviderStore();
  const { generateImage, isGenerating } = useImageGeneration();
  const { colorGroups } = useEditorStore();
  const [form] = Form.useForm<FormValues>();

  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedGridSize, setSelectedGridSize] = useState<CanvasSize | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const activeColorGroup =
    colorGroups.find((g) => g.id === selectedColorGroupId) || colorGroups[0];
  const imageProcessor = getImageProcessor();
  const hasImageProcessor = !!imageProcessor;

  // Use ref to access current form values in callbacks
  const formValuesRef = useRef<FormValues>({
    colorGroupId: selectedColorGroupId,
    prompt: '',
  });

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        colorGroupId: selectedColorGroupId,
        prompt: '',
      });
      formValuesRef.current = {
        colorGroupId: selectedColorGroupId,
        prompt: '',
      };
    } else {
      setProcessedImageUrl(null);
      setProcessingError(null);
      setSelectedGridSize(null);
      setIsConfirmed(false);
      setIsApplying(false);
      form.resetFields();
    }
  }, [open, selectedColorGroupId, form]);

  const performGeneration = useCallback(
    async (userPrompt: string, gridSize: CanvasSize, colorGroup: ColorGroup) => {
      if (!imageProcessor || isGenerating) return;

      setProcessingError(null);

      try {
        const isVolces = isVolcesAPI(imageProcessor.baseUrl || '');
        const finalPrompt = generateGridPrompt(userPrompt, gridSize, {
          name: colorGroup.name,
          brand: colorGroup.brand,
          beadSize: colorGroup.beadSize,
          colorCount: colorGroup.colors.length,
        });
        const size = calculateImageSize(imageWidth, imageHeight, isVolces);
        const additionalParams = isVolces
          ? {
              sequential_image_generation: 'disabled',
              stream: false,
              watermark: false,
            }
          : { stream: false };

        const result = await generateImage(imageProcessor, {
          prompt: finalPrompt,
          imageUrl,
          size,
          responseFormat: 'url',
          additionalParams,
        });

        if (result?.imageUrl) {
          setProcessedImageUrl(result.imageUrl);
          const cacheKey = `${imageUrl}-${colorGroup.id}`;
          cacheAIImage(cacheKey, result.imageUrl, gridSize);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t('upload.processingFailed');
        setProcessingError(errorMessage);
      }
    },
    [
      generateImage,
      imageProcessor,
      imageUrl,
      imageWidth,
      imageHeight,
      t,
      isGenerating,
      cacheAIImage,
    ]
  );

  const handleGridSizeSelect = useCallback(
    (size: CanvasSize) => {
      setSelectedGridSize(size);
      setPixelationCanvasSize(size);
      setIsConfirmed(true);
      if (hasImageProcessor && imageProcessor) {
        const { prompt } = formValuesRef.current;
        void performGeneration(prompt, size, activeColorGroup);
      }
    },
    [
      setPixelationCanvasSize,
      hasImageProcessor,
      imageProcessor,
      performGeneration,
      activeColorGroup,
    ]
  );

  const handleGenerate = useCallback(() => {
    if (selectedGridSize) {
      const { prompt } = formValuesRef.current;
      void performGeneration(prompt, selectedGridSize, activeColorGroup);
    }
  }, [selectedGridSize, performGeneration, activeColorGroup]);

  const handleValuesChange = useCallback(
    (changedValues: Partial<FormValues>, allValues: FormValues) => {
      formValuesRef.current = allValues;
      if (changedValues.colorGroupId) {
        setSelectedColorGroupId(changedValues.colorGroupId);
      }
    },
    [setSelectedColorGroupId]
  );

  const handleConfirm = useCallback(async () => {
    if (!processedImageUrl || !selectedGridSize) return;

    setIsApplying(true);

    try {
      const proxyUrl = processedImageUrl.startsWith('/api/')
        ? processedImageUrl
        : `/api/proxy-image?url=${encodeURIComponent(processedImageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch image through proxy');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const img = document.createElement('img');
      img.onload = () => {
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

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const canvasData: CanvasData = [];
        const cellWidth = img.width / selectedGridSize;
        const cellHeight = img.height / selectedGridSize;

        for (let gridY = 0; gridY < selectedGridSize; gridY++) {
          const row = [];
          for (let gridX = 0; gridX < selectedGridSize; gridX++) {
            const centerX = Math.floor(gridX * cellWidth + cellWidth / 2);
            const centerY = Math.floor(gridY * cellHeight + cellHeight / 2);
            const safeX = Math.min(centerX, img.width - 1);
            const safeY = Math.min(centerY, img.height - 1);
            const idx = (safeY * img.width + safeX) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const a = imageData.data[idx + 3];
            const hex = `#${[r, g, b]
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('')}`.toUpperCase();

            row.push({
              color: a > 128 ? hex : null,
              filled: a > 128,
            });
          }
          canvasData.push(row);
        }

        URL.revokeObjectURL(blobUrl);
        setIsApplying(false);
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

  const renderGridSelection = () => (
    <ConfigProvider
      theme={{
        components: {
          Segmented: {
            itemSelectedBg: 'var(--color-primary)',
            itemSelectedColor: '#fff',
          },
        },
      }}
    >
      <Flex vertical align="center" gap="large" style={{ padding: '32px 0' }}>
        <Flex vertical align="center" gap="small">
          <Title level={5} style={{ margin: 0, color: 'var(--color-text)' }}>
            {t('upload.selectGridSize') || '请选择网格尺寸'}
          </Title>
          <Text type="secondary" style={{ textAlign: 'center' }}>
            {t('upload.gridSizeDescription') ||
              '选择拼豆画布的网格尺寸，这将决定最终图案的精细程度'}
          </Text>
        </Flex>

        <Card
          size="small"
          style={{ width: '100%', maxWidth: 520 }}
          styles={{ body: { padding: 16 } }}
        >
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            initialValues={{
              colorGroupId: selectedColorGroupId,
              prompt: '',
            }}
          >
            <Form.Item
              name="colorGroupId"
              label={
                <Flex align="center" gap="small">
                  <AppstoreOutlined />
                  <span>{t('color.colorGroup') || '色号组'}</span>
                </Flex>
              }
            >
              <Select
                options={colorGroups.map((group) => ({
                  value: group.id,
                  label: `${group.name} (${group.brand} ${group.beadSize}) - ${group.colors.length}${t('pixelation.colors') || '色'}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="prompt"
              label={
                <Flex align="center" gap="small">
                  <EditOutlined />
                  <span>{t('upload.customPrompt') || '自定义提示词'}</span>
                </Flex>
              }
            >
              <Input.TextArea
                placeholder={
                  t('upload.promptPlaceholder') ||
                  '输入自定义提示词（可选），描述你想要的图案效果...'
                }
                rows={2}
                disabled={isGenerating}
              />
            </Form.Item>
          </Form>
        </Card>

        <Card
          title={
            <Flex align="center" gap="small">
              <CheckCircleOutlined style={{ color: 'var(--color-primary)' }} />
              <span>{t('upload.gridSizeLabel') || '画布尺寸'}</span>
            </Flex>
          }
          size="small"
          style={{ width: '100%', maxWidth: 520 }}
        >
          <Segmented
            block
            value={selectedGridSize || undefined}
            onChange={(value) => handleGridSizeSelect(value as CanvasSize)}
            options={GRID_SIZES.map((size) => ({
              value: size,
              label: (
                <Flex vertical align="center" gap={2}>
                  <Text strong style={{ fontSize: 16 }}>
                    {size}×{size}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {sizeLabels[size].desc}
                  </Text>
                </Flex>
              ),
            }))}
          />
        </Card>
      </Flex>
    </ConfigProvider>
  );

  const renderProcessingPreview = () => (
    <Flex vertical gap="middle" style={{ padding: '8px 0' }}>
      {!hasImageProcessor && (
        <Alert
          type="error"
          message={t('upload.noImageProcessor')}
          description={
            <Flex vertical gap="small">
              <Text>{t('upload.configureImageProcessor')}</Text>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={onOpenSettings}
                size="small"
              >
                {t('upload.openSettings')}
              </Button>
            </Flex>
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

      <Card
        size="small"
        styles={{ body: { padding: '12px 16px' } }}
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <Row justify="space-between" align="middle">
          <Flex align="center" gap="small">
            <Badge status="processing" color="var(--color-primary)" />
            <Text strong>{t('upload.selectedGridSize') || '已选网格尺寸'}</Text>
          </Flex>
          <Select
            value={selectedGridSize!}
            onChange={(value) => {
              setSelectedGridSize(value);
              setPixelationCanvasSize(value);
            }}
            size="small"
            style={{ width: 110 }}
            options={GRID_SIZES.map((size) => ({
              value: size,
              label: `${size}×${size}`,
            }))}
          />
        </Row>
      </Card>

      {hasImageProcessor && (
        <Card size="small">
          <Form
            layout="vertical"
            initialValues={{
              colorGroupId: selectedColorGroupId,
              prompt: formValuesRef.current.prompt,
            }}
          >
            <Form.Item
              label={
                <Flex align="center" gap="small">
                  <AppstoreOutlined />
                  <span>{t('color.colorGroup') || '色号组'}</span>
                </Flex>
              }
            >
              <Select
                value={selectedColorGroupId}
                onChange={setSelectedColorGroupId}
                options={colorGroups.map((group) => ({
                  value: group.id,
                  label: `${group.name} (${group.brand} ${group.beadSize}) - ${group.colors.length}${t('pixelation.colors') || '色'}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={
                <Flex align="center" gap="small">
                  <EditOutlined />
                  <span>{t('upload.customPrompt') || '自定义提示词'}</span>
                </Flex>
              }
            >
              <Input.TextArea
                value={formValuesRef.current.prompt}
                onChange={(e) => {
                  const newPrompt = e.target.value;
                  formValuesRef.current.prompt = newPrompt;
                  form.setFieldsValue({ prompt: newPrompt });
                }}
                placeholder={t('upload.promptPlaceholder')}
                rows={2}
                disabled={isGenerating}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Flex gap="small">
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!hasImageProcessor}
                >
                  {processedImageUrl ? t('upload.regenerate') : t('upload.generate')}
                </Button>
                {processedImageUrl && (
                  <Button icon={<EditOutlined />} onClick={() => setProcessedImageUrl(null)}>
                    {t('upload.clear')}
                  </Button>
                )}
              </Flex>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Row gutter={16}>
        <Col span={12} xs={24} sm={12}>
          <Card
            title={
              <Flex align="center" gap="small">
                <PictureOutlined style={{ color: 'var(--color-primary)' }} />
                <span>{t('pixelation.originalImage')}</span>
              </Flex>
            }
            size="small"
            styles={{ body: { padding: 0 } }}
          >
            <Flex
              justify="center"
              align="center"
              style={{
                height: 320,
                background: 'var(--color-bg-secondary)',
                overflow: 'hidden',
              }}
            >
              <Image
                src={imageUrl}
                alt={t('pixelation.originalImage')}
                style={{ maxHeight: 320, objectFit: 'contain' }}
                preview={false}
              />
            </Flex>
          </Card>
        </Col>

        <Col span={12} xs={24} sm={12}>
          <Card
            title={
              <Flex align="center" gap="small">
                <AimOutlined style={{ color: 'var(--color-primary)' }} />
                <span>
                  {t('upload.processedPreview')} ({selectedGridSize}×{selectedGridSize})
                </span>
              </Flex>
            }
            size="small"
            styles={{ body: { padding: 0 } }}
          >
            <Flex
              justify="center"
              align="center"
              style={{
                height: 320,
                background: 'var(--color-bg)',
                position: 'relative',
              }}
            >
              {isGenerating ? (
                <Flex vertical align="center" gap="middle">
                  <Spin size="large" />
                  <Text type="secondary">{t('upload.processing')}</Text>
                </Flex>
              ) : processedImageUrl ? (
                <Image
                  src={processedImageUrl}
                  alt={t('upload.processedPreview')}
                  style={{ maxHeight: 320, objectFit: 'contain' }}
                  preview={{ mask: t('common.preview') || '预览' }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    hasImageProcessor
                      ? t('upload.clickGenerate')
                      : t('upload.configureFirst')
                  }
                />
              )}
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  );

  return (
    <Modal
      title={
        <Flex align="center" gap="small">
          <RobotOutlined style={{ color: 'var(--color-primary)' }} />
          <span>{t('upload.imageProcessing')}</span>
        </Flex>
      }
      open={open}
      onCancel={onCancel}
      width={840}
      styles={{ body: { padding: '0 24px 24px' } }}
      footer={
        isConfirmed
          ? [
              <Button key="cancel" onClick={onCancel} disabled={isApplying}>
                {t('common.cancel')}
              </Button>,
              <Button
                key="confirm"
                type="primary"
                onClick={handleConfirm}
                disabled={!processedImageUrl || isGenerating || isApplying}
                loading={isApplying}
                icon={<CheckCircleOutlined />}
              >
                {t('upload.applyToCanvas')}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel} disabled={isApplying}>
                {t('common.cancel')}
              </Button>,
            ]
      }
    >
      <Divider style={{ margin: '0 0 24px 0' }} />
      {!isConfirmed ? renderGridSelection() : renderProcessingPreview()}
    </Modal>
  );
}
