import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { Analytics } from '@vercel/analytics';
import theme from './theme';
import './i18n';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={theme}>
      <App />
      <Analytics />
    </ConfigProvider>
  </StrictMode>,
);
