import type { CanvasData, CanvasSize } from '@/types/editor';

interface ExportOptions {
  canvasData: CanvasData;
  canvasSize: CanvasSize;
  pixelSize?: number;
  backgroundColor?: string;
}

export function exportToPNG(options: ExportOptions): string {
  const { canvasData, canvasSize, pixelSize = 10, backgroundColor = '#FFFFFF' } = options;

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize * pixelSize;
  canvas.height = canvasSize * pixelSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const pixel = canvasData[y]?.[x];
      if (pixel?.filled && pixel.color) {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

export function exportToJSON(
  canvasData: CanvasData,
  canvasSize: CanvasSize,
  projectName: string
): string {
  const project = {
    name: projectName,
    canvasSize,
    canvas: canvasData,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  return JSON.stringify(project, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateThumbnail(canvasData: CanvasData, canvasSize: CanvasSize): string {
  return exportToPNG({
    canvasData,
    canvasSize,
    pixelSize: 1,
    backgroundColor: '#FFFFFF',
  });
}
