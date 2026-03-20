import { Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import type { EditorTool } from '@/types/editor';

interface Tool {
  key: EditorTool;
  icon: string;
  label: string;
  shortcut: string;
}

const tools: Tool[] = [
  { key: 'brush', icon: '🖌️', label: '画笔', shortcut: 'B' },
  { key: 'eraser', icon: '🧽', label: '橡皮擦', shortcut: 'E' },
  { key: 'fill', icon: '🪣', label: '填充', shortcut: 'F' },
  { key: 'selection', icon: '⬚', label: '选择', shortcut: 'S' },
];

export function Toolbar() {
  const { currentTool, setTool, showGrid, toggleGrid } = useEditorStore();

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>工具</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {tools.map((tool) => (
            <Tooltip key={tool.key} title={`${tool.label} (${tool.shortcut})`}>
              <button
                onClick={() => setTool(tool.key)}
                style={{
                  width: 40,
                  height: 40,
                  border:
                    currentTool === tool.key
                      ? '2px solid #D4763B'
                      : '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: currentTool === tool.key ? '#FFF7ED' : '#fff',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {tool.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>视图</div>
        <Tooltip title="切换网格 (G)">
          <button
            onClick={toggleGrid}
            style={{
              width: 40,
              height: 40,
              border: showGrid ? '2px solid #D4763B' : '1px solid #d9d9d9',
              borderRadius: 4,
              background: showGrid ? '#FFF7ED' : '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            格
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
