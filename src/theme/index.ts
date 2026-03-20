import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#C4956A',
    colorInfo: '#C4956A',
    colorSuccess: '#7DB88F',
    colorWarning: '#E5B567',
    colorError: '#D47070',
    colorTextBase: '#4A4A4A',
    colorBgBase: '#FDFCFA',
    colorBgLayout: '#F7F5F2',
    colorBorder: '#EBEBEB',
    colorBorderSecondary: '#F0F0F0',
    borderRadius: 12,
    borderRadiusSM: 8,
    borderRadiusLG: 16,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    wireframe: false,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Button: {
      primaryShadow: '0 2px 6px rgba(196, 149, 106, 0.3)',
      defaultShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
    },
    Input: {
      borderRadiusSM: 8,
    },
    Select: {
      borderRadiusSM: 8,
    },
    Tooltip: {
      borderRadiusSM: 6,
      paddingSM: 8,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Menu: {
      borderRadiusSM: 8,
      itemBorderRadius: 8,
    },
    Dropdown: {
      borderRadiusSM: 8,
    },
    Divider: {
      margin: 12,
    },
  },
};

export default theme;
