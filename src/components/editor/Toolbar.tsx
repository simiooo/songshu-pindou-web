import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useEditorStore } from '@/store/editorStore';
import type { EditorTool } from '@/types/editor';
import {
  EditOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  TagOutlined,
  UploadOutlined,
} from '@ant-design/icons';

interface FloatingToolbarProps {
  position?: 'top-left' | 'top-right';
  onUpload?: (file: RcFile) => void;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ToolButton({ icon, tooltip, onClick, disabled, active }: ToolButtonProps) {
  return (
    <Tooltip title={tooltip}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: 36,
          height: 36,
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: active ? 'var(--color-primary-bg)' : 'transparent',
          color: active
            ? 'var(--color-primary)'
            : disabled
              ? 'var(--color-text-secondary)'
              : 'var(--color-text)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: 'var(--color-border-light)',
        margin: '0 var(--space-xs)',
      }}
    />
  );
}

export function FloatingToolbar({ position = 'top-left', onUpload }: FloatingToolbarProps) {
  const { t } = useTranslation();
  const [compact, setCompact] = useState(false);

  const {
    currentTool,
    setTool,
    showGrid,
    toggleGrid,
    showColorLabels,
    toggleColorLabels,
    undo,
    redo,
    historyStack,
    redoStack,
    zoomLevel,
    setZoomLevel,
    resetView,
  } = useEditorStore();

  const tools: {
    key: EditorTool;
    icon: React.ReactNode;
    label: string;
    shortcut: string;
    hint?: string;
  }[] = [
    {
      key: 'brush',
      icon: <EditOutlined />,
      label: t('editor.brush'),
      shortcut: t('shortcuts.brush'),
    },
    {
      key: 'eraser',
      icon: <DeleteOutlined />,
      label: t('editor.eraser'),
      shortcut: t('shortcuts.eraser'),
    },
    {
      key: 'fill',
      icon: <BgColorsOutlined />,
      label: t('editor.fill'),
      shortcut: t('shortcuts.fill'),
    },
    {
      key: 'selection',
      icon: <BorderOutlined />,
      label: t('editor.selection'),
      shortcut: t('shortcuts.selection'),
      hint: t('editor.selectionHint'),
    },
  ];

  const canUndo = historyStack.length > 0;
  const canRedo = redoStack.length > 0;

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel * 0.8, 0.5));
  };

  const positionStyles: Record<typeof position, React.CSSProperties> = {
    'top-left': {
      top: 16,
      left: 16,
    },
    'top-right': {
      top: 16,
      right: 16,
    },
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs)',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border-light)',
        zIndex: 50,
      }}
    >
      {tools.map((tool) => (
        <ToolButton
          key={tool.key}
          icon={tool.icon}
          tooltip={
            tool.hint
              ? `${tool.label} (${tool.shortcut}) - ${tool.hint}`
              : `${tool.label} (${tool.shortcut})`
          }
          onClick={() => setTool(tool.key)}
          active={currentTool === tool.key}
        />
      ))}

      <Divider />

      <ToolButton
        icon={<UndoOutlined />}
        tooltip={`${t('editor.undo')} (${t('shortcuts.undo')})`}
        onClick={undo}
        disabled={!canUndo}
      />
      <ToolButton
        icon={<RedoOutlined />}
        tooltip={`${t('editor.redo')} (${t('shortcuts.redo')})`}
        onClick={redo}
        disabled={!canRedo}
      />

      {!compact && (
        <>
          <Divider />

          <ToolButton
            icon={<ZoomOutOutlined />}
            tooltip={t('pixelation.scrollZoom')}
            onClick={handleZoomOut}
          />
          <span
            style={{
              minWidth: 44,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {(zoomLevel * 100).toFixed(0)}%
          </span>
          <ToolButton
            icon={<ZoomInOutlined />}
            tooltip={t('pixelation.scrollZoom')}
            onClick={handleZoomIn}
          />
          <ToolButton
            icon={<ReloadOutlined />}
            tooltip={t('editor.resetView')}
            onClick={resetView}
          />

          <Divider />

          <ToolButton
            icon={showGrid ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            tooltip={`${t('editor.toggleGrid')} (${t('shortcuts.grid')})`}
            onClick={toggleGrid}
            active={showGrid}
          />

          <ToolButton
            icon={<TagOutlined />}
            tooltip={t('pixelation.showLabels')}
            onClick={toggleColorLabels}
            active={showColorLabels}
          />

          {onUpload && (
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file: RcFile) => {
                onUpload(file);
                return false;
              }}
            >
              <ToolButton
                icon={<UploadOutlined />}
                tooltip={t('upload.uploadImage')}
              />
            </Upload>
          )}
        </>
      )}

      <Divider />

      <Tooltip title={compact ? t('common.expand') : t('common.collapse')}>
        <button
          onClick={() => setCompact(!compact)}
          style={{
            width: 36,
            height: 36,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s ease',
            padding: 0,
          }}
        >
          {compact ? <ExpandOutlined /> : <ShrinkOutlined />}
        </button>
      </Tooltip>
    </div>
  );
}
