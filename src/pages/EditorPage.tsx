import { useEffect, useState, useCallback, useRef } from 'react';
import { ConfigProvider, App as AntdApp, Button, Space, Modal, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { ColorPalette } from '@/components/editor/ColorPalette';
import { HistoryControls } from '@/components/editor/HistoryControls';
import { CanvasSizeSelector } from '@/components/editor/CanvasSizeSelector';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { PixelationPreview } from '@/components/upload/PixelationPreview';
import { LLMProviderManager } from '@/components/llm/LLMProviderManager';
import { useEditorStore } from '@/store/editorStore';
import { useUploadStore } from '@/store/uploadStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { exportToPNG, exportToJSON, downloadFile, downloadImage } from '@/utils/exportUtils';
import theme from '@/theme';
import type { CanvasData, CanvasSize } from '@/types/editor';

export function EditorPage() {
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
    isDirty,
    lastSavedAt,
    loadCanvas,
  } = useEditorStore();

  const { status, importedImage, reset: resetUpload } = useUploadStore();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const timeUpdateRef = useRef<number | null>(null);

  useAutoSave();

  const handlePixelationConfirm = useCallback((pixelData: CanvasData, size: CanvasSize) => {
    loadCanvas(pixelData, size);
    resetUpload();
    message.success('图片已应用到画布');
  }, [loadCanvas, resetUpload]);

  const handlePixelationCancel = useCallback(() => {
    resetUpload();
  }, [resetUpload]);

  const showPixelationModal = status === 'ready' && importedImage !== null;

  useEffect(() => {
    timeUpdateRef.current = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current);
      }
    };
  }, []);

  const handleExportPNG = useCallback((pixelSize: number) => {
    try {
      const dataUrl = exportToPNG({
        canvasData,
        canvasSize,
        pixelSize,
        backgroundColor: '#FFFFFF',
      });
      downloadImage(dataUrl, `${projectName}_${canvasSize}x${canvasSize}.png`);
      message.success('PNG 导出成功');
    } catch {
      message.error('PNG 导出失败');
    }
  }, [canvasData, canvasSize, projectName]);

  const handleExportJSON = useCallback(() => {
    try {
      const json = exportToJSON(canvasData, canvasSize, projectName);
      downloadFile(json, `${projectName}.json`, 'application/json');
      message.success('JSON 导出成功');
    } catch {
      message.error('JSON 导出失败');
    }
  }, [canvasData, canvasSize, projectName]);

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'png-1x',
      label: 'PNG (1x)',
      onClick: () => handleExportPNG(1),
    },
    {
      key: 'png-2x',
      label: 'PNG (2x)',
      onClick: () => handleExportPNG(2),
    },
    {
      key: 'png-4x',
      label: 'PNG (4x)',
      onClick: () => handleExportPNG(4),
    },
    {
      key: 'png-8x',
      label: 'PNG (8x)',
      onClick: () => handleExportPNG(8),
    },
    { type: 'divider' },
    {
      key: 'json',
      label: 'JSON (项目文件)',
      onClick: handleExportJSON,
    },
  ];

  const getSaveStatusText = useCallback(() => {
    if (isDirty) {
      return '未保存';
    }
    if (lastSavedAt) {
      const diff = currentTime - lastSavedAt;
      if (diff < 60000) {
        return '已保存';
      }
      const minutes = Math.floor(diff / 60000);
      return `已保存 (${minutes}分钟前)`;
    }
    return '未保存';
  }, [isDirty, lastSavedAt, currentTime]);

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
            height: '100vh',
            background: '#f5f5f5',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 280,
              borderRight: '1px solid #e8e8e8',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>拼豆编辑器</h1>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#999' }}>
                    Perler Beads Editor
                  </p>
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setShowSettingsModal(true);
                  }}
                  style={{ fontSize: 16 }}
                >
                  ⚙️
                </Button>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                {getSaveStatusText()}
              </div>
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <CanvasSizeSelector />
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <Toolbar />
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <ImageUploader />
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <HistoryControls />
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
                  <Button style={{ width: '100%' }}>导出作品</Button>
                </Dropdown>
              </Space>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <ColorPalette />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: 32,
            }}
          >
            <EditorCanvas showGrid={showGrid} gridColor={gridColor} />
          </div>
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
          title="设置"
          open={showSettingsModal}
          onCancel={() => setShowSettingsModal(false)}
          footer={null}
          width={600}
        >
          <LLMProviderManager />
        </Modal>
      </AntdApp>
    </ConfigProvider>
  );
}