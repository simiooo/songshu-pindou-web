import { Upload, Button, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useTranslation } from 'react-i18next';
import { useUploadStore } from '@/store/uploadStore';
import { useEffect, useCallback } from 'react';
import { UploadOutlined } from '@ant-design/icons';

export function ImageUploader() {
  const { t } = useTranslation();
  const { setStatus, setImportedImage, setError } = useUploadStore();

  const handleFileChange = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        message.error(t('upload.invalidFile'));
        return;
      }

      setStatus('uploading');

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = () => {
          setImportedImage({
            dataUrl,
            width: img.width,
            height: img.height,
          });
          setStatus('ready');
          message.success(t('upload.imageLoaded'));
        };

        img.onerror = () => {
          setError(t('upload.uploadFailed'));
          message.error(t('upload.uploadFailed'));
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        setError(t('upload.uploadFailed'));
        message.error(t('upload.uploadFailed'));
      };

      reader.readAsDataURL(file);
      return false;
    },
    [setStatus, setImportedImage, setError, t]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileChange(file);
            break;
          }
        }
      }
    },
    [handleFileChange]
  );

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={(file: RcFile) => {
        handleFileChange(file);
        return false;
      }}
    >
      <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
        {t('upload.uploadImage')}
      </Button>
    </Upload>
  );
}
