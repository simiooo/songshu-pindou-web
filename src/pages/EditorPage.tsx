import { useEffect, useState, useCallback, useMemo } from 'react';
import { ConfigProvider, App as AntdApp, Button, Modal, Dropdown, message, Space, Tooltip, Drawer, Upload } from 'antd';
import type { MenuProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useTranslation } from 'react-i18next';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { ColorPalette } from '@/components/editor/ColorPalette';
import { CanvasSizeSelector } from '@/components/editor/CanvasSizeSelector';
import { PixelationPreview } from '@/components/upload/PixelationPreview';
import { LLMProviderManager } from '@/components/llm/LLMProviderManager';
import { AppHeader } from '@/components/layout/AppHeader';
import { useEditorStore } from '@/store/editorStore';
import { useUploadStore } from '@/store/uploadStore';
import { useUIStore } from '@/store/uiStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { exportToPNG, exportToJSON, downloadFile, downloadImage } from '@/utils/exportUtils';
import { getTheme } from '@/theme';
import { CANVAS_SIZES } from '@/constants/colorGroups';
import type { CanvasData, CanvasSize, EditorTool } from '@/types/editor';
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

function MobileToolPanel() {
  const { t } = useTranslation();
  const {
    currentTool,
    setTool,
    showGrid,
    toggleGrid,
    undo,
    redo,
    historyStack,
    redoStack,
    currentColor,
    setColor,
    colorGroups,
    activeColorGroupId,
    canvasSize,
    setCanvasSize,
  } = useEditorStore();

  const tools: { key: EditorTool; icon: React.ReactNode; label: string }[] = [
    { key: 'brush', icon: <EditOutlined />, label: t('editor.brush') },
    { key: 'eraser', icon: <DeleteOutlined />, label: t('editor.eraser') },
    { key: 'fill', icon: <BgColorsOutlined />, label: t('editor.fill') },
    { key: 'selection', icon: <BorderOutlined />, label: t('editor.selection') },
  ];

  const canUndo = historyStack.length > 0;
  const canRedo = redoStack.length > 0;

  const activeGroup = colorGroups.find((g) => g.id === activeColorGroupId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {t('editor.tools')}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {tools.map((tool) => (
            <Tooltip key={tool.key} title={tool.label}>
              <button
                onClick={() => setTool(tool.key)}
                style={{
                  width: 52,
                  height: 52,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background:
                    currentTool === tool.key ? 'var(--color-primary-bg)' : 'var(--color-bg-secondary)',
                  color:
                    currentTool === tool.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  transition: 'all 0.2s ease',
                  boxShadow: currentTool === tool.key ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tool.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <Tooltip title={`${t('editor.undo')} (${t('shortcuts.undo')})`}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              flex: 1,
              height: 44,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: canUndo ? 'var(--color-bg)' : 'var(--color-bg-secondary)',
              color: canUndo ? 'var(--color-text)' : 'var(--color-text-secondary)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-xs)',
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
          >
            <UndoOutlined />
            {t('editor.undo')}
          </button>
        </Tooltip>
        <Tooltip title={`${t('editor.redo')} (${t('shortcuts.redo')})`}>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              flex: 1,
              height: 44,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: canRedo ? 'var(--color-bg)' : 'var(--color-bg-secondary)',
              color: canRedo ? 'var(--color-text)' : 'var(--color-text-secondary)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-xs)',
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
          >
            <RedoOutlined />
            {t('editor.redo')}
          </button>
        </Tooltip>
        <Tooltip title={`${t('editor.toggleGrid')} (${t('shortcuts.grid')})`}>
          <button
            onClick={toggleGrid}
            style={{
              width: 52,
              height: 44,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: showGrid ? 'var(--color-primary-bg)' : 'var(--color-bg-secondary)',
              color: showGrid ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'all 0.2s ease',
            }}
          >
            {showGrid ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </button>
        </Tooltip>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {t('color.selectColor')}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: currentColor,
              border: '2px solid var(--color-bg)',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--color-text)',
            }}
          >
            {currentColor.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 'var(--space-xs)',
          }}
        >
          {activeGroup?.colors.slice(0, 24).map((color) => (
            <Tooltip key={color.code} title={`${color.code}`}>
              <button
                onClick={() => setColor(color.hex)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: color.hex,
                  border:
                    currentColor === color.hex
                      ? '3px solid var(--color-primary)'
                      : '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: currentColor === color.hex ? 'var(--shadow-sm)' : 'none',
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {t('pixelation.canvasSize')}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-xs)',
          }}
        >
          {CANVAS_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setCanvasSize(size.value)}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: canvasSize === size.value ? 'var(--color-primary-bg)' : 'var(--color-bg)',
                color: canvasSize === size.value ? 'var(--color-primary)' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: 12,
                transition: 'all 0.15s ease',
              }}
            >
              {size.value}×{size.value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {t('upload.title')}
        </div>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file: RcFile) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              const img = new Image();
              img.onload = () => {
                useUploadStore.getState().setImportedImage({
                  dataUrl,
                  width: img.width,
                  height: img.height,
                });
                useUploadStore.getState().setStatus('ready');
                message.success(t('upload.imageLoaded'));
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
            {t('upload.uploadImage')}
          </Button>
        </Upload>
      </div>
    </div>
  );
}

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

  const { status, importedImage, reset: resetUpload, setImportedImage, setStatus: setUploadStatus } = useUploadStore();
  const { theme: currentTheme } = useUIStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(true);

  const hasImage = useMemo(() => {
    return canvasData.some((row) => row.some((pixel) => pixel.filled));
  }, [canvasData]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error(t('upload.invalidFile'));
      return;
    }
    setUploadStatus('uploading');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImportedImage({
          dataUrl,
          width: img.width,
          height: img.height,
        });
        setUploadStatus('ready');
        message.success(t('upload.imageLoaded'));
      };
      img.onerror = () => {
        message.error(t('upload.uploadFailed'));
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      message.error(t('upload.uploadFailed'));
    };
    reader.readAsDataURL(file);
  }, [t, setImportedImage, setUploadStatus]);

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
    <ConfigProvider theme={getTheme(currentTheme)}>
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
          <AppHeader onSettingsClick={() => setShowSettingsModal(true)} />

          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
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
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    background: currentTheme === 'dark' ? '#2a2a2a' : '#e8e8e8',
                    padding: isMobile ? 8 : 24,
                  }}
                >
                  {hasImage ? (
                    <EditorCanvas showGrid={showGrid} gridColor={gridColor} />
                  ) : (
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file: RcFile) => {
                        handleFileUpload(file);
                        return false;
                      }}
                    >
                      <button
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--space-md)',
                          width: 280,
                          height: 280,
                          border: '2px dashed var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--color-bg)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.background = 'var(--color-primary-bg)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.background = 'var(--color-bg)';
                        }}
                      >
                        <UploadOutlined style={{ fontSize: 48, color: 'var(--color-text-secondary)' }} />
                        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text)' }}>
                          {t('upload.addPhoto')}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          {t('upload.dropOrClick')}
                        </span>
                      </button>
                    </Upload>
                  )}
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
            <>
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'var(--color-bg)',
                  borderTop: '1px solid var(--color-border-light)',
                  padding: 'var(--space-sm)',
                  paddingBottom: 'calc(var(--space-sm) + env(safe-area-inset-bottom, 0px))',
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  zIndex: 100,
                }}
              >
                <Button
                  onClick={() => setShowColorPalette(true)}
                  style={{ flex: 1, height: 50, fontSize: 15 }}
                >
                  {t('editor.tools')}
                </Button>
                <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
                  <Button icon={<UploadOutlined />} style={{ flex: 1, height: 50, fontSize: 15 }}>
                    {t('export.exportProject')}
                  </Button>
                </Dropdown>
              </div>

              <Drawer
                title={t('editor.tools')}
                placement="bottom"
                onClose={() => setShowColorPalette(false)}
                open={showColorPalette}
                height="60vh"
                styles={{
                  root: { borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' },
                  wrapper: { 
                    borderTopLeftRadius: 'var(--radius-lg)', 
                    borderTopRightRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  },
                  body: { padding: 'var(--space-md)', overflow: 'auto' },
                  header: { borderBottom: '1px solid var(--color-border-light)', padding: 'var(--space-sm) var(--space-md)' },
                }}
                closeIcon={null}
              >
                <MobileToolPanel />
              </Drawer>
            </>
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
