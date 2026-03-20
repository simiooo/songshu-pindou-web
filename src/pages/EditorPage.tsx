import { useEffect, useState, useCallback } from 'react';
import { ConfigProvider, App as AntdApp, Button, Modal, Dropdown, message, Space } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { ColorPalette } from '@/components/editor/ColorPalette';
import { CanvasSizeSelector } from '@/components/editor/CanvasSizeSelector';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { PixelationPreview } from '@/components/upload/PixelationPreview';
import { LLMProviderManager } from '@/components/llm/LLMProviderManager';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { useEditorStore } from '@/store/editorStore';
import { useUploadStore } from '@/store/uploadStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { exportToPNG, exportToJSON, downloadFile, downloadImage } from '@/utils/exportUtils';
import theme from '@/theme';
import type { CanvasData, CanvasSize } from '@/types/editor';
import { UploadOutlined } from '@ant-design/icons';

export function EditorPage() {
  const { t } = useTranslation();
  const {
    showGrid,
    gridColor,
    toggleGrid,
    setTool,
    undo,
    redo,
    canvasData,
    canvasSize,
    projectName,
    loadCanvas,
  } = useEditorStore();

  const { status, importedImage, reset: resetUpload } = useUploadStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(true);

  useAutoSave();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowColorPalette(window.innerWidth >= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePixelationConfirm = useCallback((pixelData: CanvasData, size: CanvasSize) => {
    loadCanvas(pixelData, size);
    resetUpload();
    message.success(t('upload.imageLoaded'));
  }, [loadCanvas, resetUpload, t]);

  const handlePixelationCancel = useCallback(() => {
    resetUpload();
  }, [resetUpload]);

  const showPixelationModal = status === 'ready' && importedImage !== null;

  const handleExportPNG = useCallback((pixelSize: number) => {
    try {
      const dataUrl = exportToPNG({
        canvasData,
        canvasSize,
        pixelSize,
        backgroundColor: '#FFFFFF',
      });
      downloadImage(dataUrl, `${projectName}_${canvasSize}x${canvasSize}.png`);
      message.success(t('export.exportSuccess'));
    } catch {
      message.error(t('export.exportFailed'));
    }
  }, [canvasData, canvasSize, projectName, t]);

  const handleExportJSON = useCallback(() => {
    try {
      const json = exportToJSON(canvasData, canvasSize, projectName);
      downloadFile(json, `${projectName}.json`, 'application/json');
      message.success(t('export.exportSuccess'));
    } catch {
      message.error(t('export.exportFailed'));
    }
  }, [canvasData, canvasSize, projectName, t]);

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'png-1x',
      label: t('export.png1x'),
      onClick: () => handleExportPNG(1),
    },
    {
      key: 'png-2x',
      label: t('export.png2x'),
      onClick: () => handleExportPNG(2),
    },
    {
      key: 'png-4x',
      label: t('export.png4x'),
      onClick: () => handleExportPNG(4),
    },
    {
      key: 'png-8x',
      label: t('export.png8x'),
      onClick: () => handleExportPNG(8),
    },
    { type: 'divider' },
    {
      key: 'json',
      label: t('export.json'),
      onClick: handleExportJSON,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.ctrlKey || e.metaKey) {
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((key === 'z' && e.shiftKey) || key === 'y') {
          e.preventDefault();
          redo();
        }
        return;
      }

      switch (key) {
        case 'b':
          setTool('brush');
          break;
        case 'e':
          setTool('eraser');
          break;
        case 'f':
          setTool('fill');
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('selection');
          }
          break;
        case 'g':
          toggleGrid();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, toggleGrid, undo, redo]);

  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--color-bg-secondary)',
          }}
        >
          <AppHeader />

          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <Sidebar onSettingsClick={() => setShowSettingsModal(true)} />

            <main
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
                  }}
                >
                  <EditorCanvas showGrid={showGrid} gridColor={gridColor} />
                </div>

                {showColorPalette && !isMobile && (
                  <aside
                    style={{
                      width: 300,
                      background: 'var(--color-bg)',
                      borderLeft: '1px solid var(--color-border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: 'var(--space-md)',
                        borderBottom: '1px solid var(--color-border-light)',
                      }}
                    >
                      <CanvasSizeSelector />
                    </div>

                    <div
                      style={{
                        padding: 'var(--space-md)',
                        borderBottom: '1px solid var(--color-border-light)',
                      }}
                    >
                      <ImageUploader />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: 'var(--space-md)',
                      }}
                    >
                      <ColorPalette />
                    </div>

                    <div
                      style={{
                        padding: 'var(--space-md)',
                        borderTop: '1px solid var(--color-border-light)',
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
                          <Button style={{ width: '100%' }} icon={<UploadOutlined />}>
                            {t('export.exportProject')}
                          </Button>
                        </Dropdown>
                      </Space>
                    </div>
                  </aside>
                )}
              </div>
            </main>
          </div>

          {isMobile && (
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-bg)',
                borderTop: '1px solid var(--color-border-light)',
                padding: 'var(--space-sm)',
                display: 'flex',
                gap: 'var(--space-sm)',
                zIndex: 100,
              }}
            >
              <Button
                onClick={() => setShowColorPalette(!showColorPalette)}
                style={{ flex: 1 }}
              >
                {showColorPalette ? t('editor.tools') : t('color.palette')}
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
                <Button icon={<UploadOutlined />} style={{ flex: 1 }}>
                  {t('common.export')}
                </Button>
              </Dropdown>
            </div>
          )}
        </div>

        <PixelationPreview
          open={showPixelationModal}
          imageUrl={importedImage?.dataUrl || ''}
          imageWidth={importedImage?.width || 0}
          imageHeight={importedImage?.height || 0}
          onConfirm={handlePixelationConfirm}
          onCancel={handlePixelationCancel}
        />

        <Modal
          title={t('common.settings')}
          open={showSettingsModal}
          onCancel={() => setShowSettingsModal(false)}
          footer={null}
          width={600}
          styles={{ body: { padding: 'var(--space-md)' } }}
        >
          <LLMProviderManager />
        </Modal>
      </AntdApp>
    </ConfigProvider>
  );
}
