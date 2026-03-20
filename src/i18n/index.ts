import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import jaJP from './locales/ja-JP';
import koKR from './locales/ko-KR';
import esES from './locales/es-ES';
import viVN from './locales/vi-VN';
import thTH from './locales/th-TH';
import idID from './locales/id-ID';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'ja-JP': { translation: jaJP },
  'ko-KR': { translation: koKR },
  'es-ES': { translation: esES },
  'vi-VN': { translation: viVN },
  'th-TH': { translation: thTH },
  'id-ID': { translation: idID },
};

i18n.use(initReactI18next).init({
  resources,
  lng: navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US',
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
