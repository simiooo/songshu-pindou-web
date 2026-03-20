import { useTranslation } from 'react-i18next';
import { Select, Space, Button, Tooltip } from 'antd';
import { useUIStore } from '@/store/uiStore';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';

interface AppHeaderProps {
  collapsed?: boolean;
  onSettingsClick?: () => void;
}

export function AppHeader({ collapsed, onSettingsClick }: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useUIStore();

  const languageOptions = [
    { value: 'zh-CN', label: '中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'ko-KR', label: '한국어' },
    { value: 'es-ES', label: 'Español' },
    { value: 'vi-VN', label: 'Tiếng Việt' },
    { value: 'th-TH', label: 'ไทย' },
    { value: 'id-ID', label: 'Bahasa Indonesia' },
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <Logo size={collapsed ? 28 : 32} />
        {!collapsed && (
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--color-text)',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {t('app.name')}
            </h1>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.5px',
              }}
            >
              {t('app.subtitle')}
            </span>
          </div>
        )}
      </div>

      <Space size="middle">
        <Tooltip title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}>
          <Button
            type="text"
            icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>
        {onSettingsClick && (
          <Tooltip title={t('common.settings')}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={onSettingsClick}
            />
          </Tooltip>
        )}
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          options={languageOptions}
          variant="borderless"
          style={{ width: 100 }}
          popupMatchSelectWidth={false}
        />
      </Space>
    </header>
  );
}

interface LogoProps {
  size?: number;
  showBeads?: boolean;
}

export function Logo({ size = 32, showBeads = false }: LogoProps) {
  const primaryColor = '#C4956A';
  const secondaryColor = '#E8C4A0';
  const darkColor = '#8B6914';
  const beadColors = ['#E57373', '#81C784', '#64B5F6', '#FFD54F'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="24" cy="20" r="10" fill={primaryColor} />
      <ellipse cx="24" cy="20" rx="6" ry="5" fill={secondaryColor} opacity="0.6" />
      <circle cx="20" cy="18" r="2" fill={darkColor} />
      <circle cx="28" cy="18" r="2" fill={darkColor} />
      <ellipse cx="24" cy="22" rx="2" ry="1.5" fill={darkColor} />
      <path
        d="M16 12C14 8 12 6 12 6C12 6 14 10 16 12Z"
        fill={primaryColor}
      />
      <path
        d="M32 12C34 8 36 6 36 6C36 6 34 10 32 12Z"
        fill={primaryColor}
      />
      <path
        d="M20 30C18 32 14 38 14 42C14 44 16 46 20 44C22 42 24 38 24 34C24 38 26 42 28 44C32 46 34 44 34 42C34 38 30 32 28 30"
        fill={primaryColor}
        stroke={secondaryColor}
        strokeWidth="1"
      />
      {showBeads && (
        <>
          <circle cx="36" cy="8" r="3" fill={beadColors[0]} />
          <circle cx="40" cy="12" r="3" fill={beadColors[1]} />
          <circle cx="38" cy="18" r="3" fill={beadColors[2]} />
          <circle cx="40" cy="24" r="3" fill={beadColors[3]} />
        </>
      )}
    </svg>
  );
}
