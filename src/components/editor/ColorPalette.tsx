import { Select, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/store/editorStore';

export function ColorPalette() {
  const { t } = useTranslation();
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
        {t('color.colorGroup')}
      </div>

      <Select
        value={activeColorGroupId}
        onChange={setActiveColorGroup}
        style={{ width: '100%', marginBottom: 'var(--space-md)' }}
        options={colorGroups.map((group) => ({
          value: group.id,
          label: (
            <span>
              {group.name} ({group.colors.length} {t('color.colors')})
            </span>
          ),
        }))}
      />

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
        {t('color.currentColor')}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: currentColor,
            border: '2px solid var(--color-bg)',
            boxShadow: 'var(--shadow-md)',
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
          fontSize: 11,
          fontWeight: 500,
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
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 'var(--space-sm)',
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
                    ? '3px solid var(--color-primary)'
                    : '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: currentColor === color.hex ? 'var(--shadow-sm)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = currentColor === color.hex ? 'var(--shadow-sm)' : 'none';
              }}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
