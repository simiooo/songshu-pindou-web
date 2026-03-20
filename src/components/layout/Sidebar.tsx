import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import type { EditorTool } from '@/types/editor';
import {
  EditOutlined,
  DeleteOutlined,
  BgColorsOutlined,
  BorderOutlined,
  UndoOutlined,
  RedoOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

interface SidebarProps {
  onSettingsClick?: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
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
    isDirty,
  } = useEditorStore();

  const tools: { key: EditorTool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { key: 'brush', icon: <EditOutlined />, label: t('editor.brush'), shortcut: t('shortcuts.brush') },
    { key: 'eraser', icon: <DeleteOutlined />, label: t('editor.eraser'), shortcut: t('shortcuts.eraser') },
    { key: 'fill', icon: <BgColorsOutlined />, label: t('editor.fill'), shortcut: t('shortcuts.fill') },
    { key: 'selection', icon: <BorderOutlined />, label: t('editor.selection'), shortcut: t('shortcuts.selection') },
  ];

  const canUndo = historyStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--color-bg)',
        borderRight: '1px solid var(--color-border-light)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <SidebarSection>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          <SectionLabel>{t('editor.tools')}</SectionLabel>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              flexWrap: 'wrap',
            }}
          >
            {tools.map((tool) => (
              <Tooltip key={tool.key} title={`${tool.label} (${tool.shortcut})`}>
                <button
                  onClick={() => setTool(tool.key)}
                  style={{
                    width: 44,
                    height: 44,
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: currentTool === tool.key ? 'var(--color-primary-bg)' : 'transparent',
                    color: currentTool === tool.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tool.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection>
        <Tooltip title={`${t('editor.toggleGrid')} (${t('shortcuts.grid')})`}>
          <button
            onClick={toggleGrid}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: showGrid ? 'var(--color-primary-bg)' : 'transparent',
              color: showGrid ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
          >
            <AppstoreOutlined />
            {t('editor.toggleGrid')}
          </button>
        </Tooltip>
      </SidebarSection>

      <SidebarSection>
        <SectionLabel>{t('editor.history')}</SectionLabel>
        <div
          style={{
            maxHeight: 120,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Tooltip title={`${t('editor.undo')} (${t('shortcuts.undo')})`}>
              <button
                onClick={undo}
                disabled={!canUndo}
                style={{
                  flex: 1,
                  padding: 'var(--space-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: canUndo ? 'var(--color-bg)' : 'var(--color-bg-secondary)',
                  color: canUndo ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  opacity: canUndo ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-xs)',
                  fontSize: 13,
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
                  padding: 'var(--space-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: canRedo ? 'var(--color-bg)' : 'var(--color-bg-secondary)',
                  color: canRedo ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  opacity: canRedo ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-xs)',
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                <RedoOutlined />
                {t('editor.redo')}
              </button>
            </Tooltip>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
            }}
          >
            {historyStack.length} {t('editor.steps')} / {redoStack.length} {t('editor.redoSteps')}
          </div>
        </div>
      </SidebarSection>

      <SidebarSection>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s ease',
            }}
          >
            {t('common.settings')}
          </button>
        )}
      </SidebarSection>

      {isDirty && (
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-xs)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-warning)',
              flexShrink: 0,
            }}
          />
          {t('save.unsaved')}
        </div>
      )}
    </aside>
  );
}

function SidebarSection({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--color-border-light)',
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 'var(--space-xs)',
      }}
    >
      {children}
    </div>
  );
}
