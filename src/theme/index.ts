import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#D4763B',
    colorInfo: '#D4763B',
    colorSuccess: '#6B9B37',
    colorWarning: '#E6A23C',
    colorError: '#C75B5B',
    colorTextBase: '#2D2A26',
    colorBgBase: '#FDFBF7',
    borderRadius: 2,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.6,
    borderRadiusSM: 2,
    borderRadiusLG: 4,
    wireframe: true,
  },
  components: {
    Button: {
      primaryShadow: '2px 2px 0 #2D2A26',
      defaultBorderColor: '#2D2A26',
      defaultBg: '#FDFBF7',
      defaultColor: '#2D2A26',
    },
    Card: {
      borderRadiusLG: 4,
    },
    Input: {
      borderRadiusSM: 2,
    },
    Select: {
      borderRadiusSM: 2,
    },
  },
};

export default theme;
