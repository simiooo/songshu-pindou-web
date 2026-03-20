import { Select } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { CANVAS_SIZES } from '@/constants/colorGroups';

export function CanvasSizeSelector() {
  const { canvasSize, setCanvasSize } = useEditorStore();

  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>画布尺寸</div>
      <Select
        value={canvasSize}
        onChange={(value) => setCanvasSize(value)}
        style={{ width: '100%' }}
        options={CANVAS_SIZES.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
      />
    </div>
  );
}
