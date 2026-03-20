import { Select, Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';

export function ColorPalette() {
  const {
    colorGroups,
    activeColorGroupId,
    setActiveColorGroup,
    currentColor,
    setColor,
  } = useEditorStore();

  const activeGroup = colorGroups.find((g) => g.id === activeColorGroupId);

  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>色号组</div>

      <Select
        value={activeColorGroupId}
        onChange={setActiveColorGroup}
        style={{ width: '100%', marginBottom: 16 }}
        options={colorGroups.map((group) => ({
          value: group.id,
          label: `${group.name} (${group.colors.length}色)`,
        }))}
      />

      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>当前色号</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: currentColor,
            border: '2px solid #D4763B',
          }}
        />
        <span style={{ fontFamily: 'monospace' }}>{currentColor.toUpperCase()}</span>
      </div>

      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>选择颜色</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 4,
        }}
      >
        {activeGroup?.colors.map((color) => (
          <Tooltip key={color.code} title={`${color.code} - ${color.name || ''}`}>
            <div
              onClick={() => setColor(color.hex)}
              style={{
                width: '100%',
                aspectRatio: '1',
                background: color.hex,
                border:
                  currentColor === color.hex
                    ? '2px solid #D4763B'
                    : '1px solid #e8e8e8',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
