import { useState } from 'react';
import { Modal, Checkbox, Button, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import type { CanvasData, CanvasSize, ColorGroup } from '@/types/editor';
import {
  exportToPatternImage,
  exportToColorAnnotatedImage,
  exportToMaterialsListImage,
  downloadImage,
} from '@/utils/exportUtils';

interface ExportModalProps {
  open: boolean;
  canvasData: CanvasData;
  canvasSize: CanvasSize;
  projectName: string;
  colorGroup: ColorGroup;
  onClose: () => void;
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob());
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportModal({
  open,
  canvasData,
  canvasSize,
  projectName,
  colorGroup,
  onClose,
}: ExportModalProps) {
  const { t } = useTranslation();
  const [selectedExports, setSelectedExports] = useState<string[]>(['colorCodes']);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      key: 'pattern',
      label: t('export.exportPattern'),
      description: t('export.exportPatternDesc'),
    },
    {
      key: 'colorCodes',
      label: t('export.exportColorCodes'),
      description: t('export.exportColorCodesDesc'),
    },
    {
      key: 'materials',
      label: t('export.exportMaterials'),
      description: t('export.exportMaterialsDesc'),
    },
  ];

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      message.warning(t('export.selectAtLeastOne'));
      return;
    }

    setIsExporting(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timestampStr = `${year}${month}${day}${hours}${minutes}`;
      const zipBaseName = `${t('export.zipFileName')}-${timestampStr}`;
      const safeName = projectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');

      if (selectedExports.length === 1) {
        const key = selectedExports[0];
        if (key === 'pattern') {
          const dataUrl = exportToPatternImage(canvasData, canvasSize, 20);
          downloadImage(dataUrl, `${safeName}_pattern.png`);
        } else if (key === 'colorCodes') {
          const dataUrl = exportToColorAnnotatedImage(canvasData, canvasSize, colorGroup, 20);
          downloadImage(dataUrl, `${safeName}_colorcodes.png`);
        } else if (key === 'materials') {
          const dataUrl = exportToMaterialsListImage(canvasData, canvasSize, colorGroup, projectName);
          downloadImage(dataUrl, `${safeName}_materials.png`);
        }
      } else {
        const zip = new JSZip();
        const folder = zip.folder(zipBaseName);

        if (!folder) {
          throw new Error('Failed to create zip folder');
        }

        if (selectedExports.includes('pattern')) {
          const blob = await dataUrlToBlob(exportToPatternImage(canvasData, canvasSize, 20));
          folder.file(`${t('export.zipFileName')}_pattern.png`, blob);
        }

        if (selectedExports.includes('colorCodes')) {
          const blob = await dataUrlToBlob(exportToColorAnnotatedImage(canvasData, canvasSize, colorGroup, 20));
          folder.file(`${t('export.zipFileName')}_colorcodes.png`, blob);
        }

        if (selectedExports.includes('materials')) {
          const blob = await dataUrlToBlob(exportToMaterialsListImage(canvasData, canvasSize, colorGroup, projectName));
          folder.file(`${t('export.zipFileName')}_materials.png`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${zipBaseName}.zip`);
      }

      message.success(t('export.exportSuccess'));
      onClose();
    } catch {
      message.error(t('export.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCheckboxChange = (checked: boolean, key: string) => {
    if (checked) {
      setSelectedExports([...selectedExports, key]);
    } else {
      setSelectedExports(selectedExports.filter((k) => k !== key));
    }
  };

  return (
    <Modal
      title={t('export.exportModalTitle')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
        {exportOptions.map((option) => (
          <Checkbox
            key={option.key}
            checked={selectedExports.includes(option.key)}
            onChange={(e) => handleCheckboxChange(e.target.checked, option.key)}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500 }}>{option.label}</span>
              <span style={{ color: '#8A8A8A', fontSize: 12 }}>{option.description}</span>
            </div>
          </Checkbox>
        ))}

        <Button
          type="primary"
          onClick={handleExport}
          loading={isExporting}
          disabled={selectedExports.length === 0}
          block
          style={{ marginTop: 8 }}
        >
          {isExporting ? t('export.exporting') : t('common.export')}
        </Button>
      </Space>
    </Modal>
  );
}
