import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/store/editorStore';
import { CANVAS_SIZES } from '@/constants/colorGroups';

export function CanvasSizeSelector() {
  const { t } = useTranslation();
  const { canvasSize, setCanvasSize } = useEditorStore();

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 'var(--space-sm)',
        }}
      >
        {t('editor.canvasSize')}
      </div>
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
