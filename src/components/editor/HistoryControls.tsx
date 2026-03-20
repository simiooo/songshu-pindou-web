import { Button, Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';

export function HistoryControls() {
  const { undo, redo, historyStack, redoStack } = useEditorStore();

  const canUndo = historyStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>历史记录</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button disabled={!canUndo} onClick={undo}>
            ↩️ 撤销
          </Button>
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Y)">
          <Button disabled={!canRedo} onClick={redo}>
            ↪️ 重做
          </Button>
        </Tooltip>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
        {historyStack.length} 步操作 / {redoStack.length} 步重做
      </div>
    </div>
  );
}
