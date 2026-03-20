import { Upload, Button, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useUploadStore } from '@/store/uploadStore';
import { useEffect, useCallback } from 'react';

interface ImageUploaderProps {
  onImageLoaded?: (dataUrl: string, width: number, height: number) => void;
}

export function ImageUploader({ onImageLoaded }: ImageUploaderProps) {
  const { setStatus, setImportedImage, setError } = useUploadStore();

  const handleFileChange = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片文件');
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
          onImageLoaded?.(dataUrl, img.width, img.height);
          message.success('图片加载成功');
        };

        img.onerror = () => {
          setError('图片加载失败');
          message.error('图片加载失败');
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        setError('文件读取失败');
        message.error('文件读取失败');
      };

      reader.readAsDataURL(file);
      return false;
    },
    [setStatus, setImportedImage, setError, onImageLoaded]
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
      <Button>上传图片</Button>
    </Upload>
  );
}
