import type { CanvasData, CanvasSize, ColorGroup } from '@/types/editor';
import { findClosestColor } from './colorMatching';

interface ExportOptions {
  canvasData: CanvasData;
  canvasSize: CanvasSize;
  pixelSize?: number;
  backgroundColor?: string;
}

interface BeadCount {
  code: string;
  hex: string;
  name: string;
  count: number;
}

export function countBeadsByColor(
  canvasData: CanvasData,
  canvasSize: CanvasSize,
  colorGroup: ColorGroup
): BeadCount[] {
  const counts = new Map<string, { code: string; hex: string; name: string; count: number }>();

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const pixel = canvasData[y]?.[x];
      if (pixel?.filled && pixel.color) {
        const matched = findClosestColor(pixel.color, colorGroup.colors);
        const existing = counts.get(matched.code);
        if (existing) {
          existing.count++;
        } else {
          counts.set(matched.code, {
            code: matched.code,
            hex: matched.hex,
            name: matched.name || matched.code,
            count: 1,
          });
        }
      }
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
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

export function exportToPatternImage(
  canvasData: CanvasData,
  canvasSize: CanvasSize,
  pixelSize: number = 20,
  backgroundColor: string = '#FFFFFF',
  gridColor: string = '#CCCCCC'
): string {
  const canvas = document.createElement('canvas');
  const borderSize = 40;
  canvas.width = canvasSize * pixelSize + borderSize * 2;
  canvas.height = canvasSize * pixelSize + borderSize * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const pixel = canvasData[y]?.[x];
      const px = borderSize + x * pixelSize;
      const py = borderSize + y * pixelSize;

      if (pixel?.filled && pixel.color) {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(px, py, pixelSize, pixelSize);

        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, pixelSize, pixelSize);
      } else {
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(px, py, pixelSize, pixelSize);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, pixelSize, pixelSize);
      }
    }
  }

  for (let i = 0; i <= canvasSize; i++) {
    const pos = borderSize + i * pixelSize;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = i % 10 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(pos, borderSize);
    ctx.lineTo(pos, borderSize + canvasSize * pixelSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(borderSize, pos);
    ctx.lineTo(borderSize + canvasSize * pixelSize, pos);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

export function exportToColorAnnotatedImage(
  canvasData: CanvasData,
  canvasSize: CanvasSize,
  colorGroup: ColorGroup,
  pixelSize: number = 20
): string {
  const beadCounts = countBeadsByColor(canvasData, canvasSize, colorGroup);

  const borderSize = 40;
  const labelWidth = 120;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize * pixelSize + borderSize * 2 + labelWidth;
  canvas.height = canvasSize * pixelSize + borderSize * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const pixel = canvasData[y]?.[x];
      const px = borderSize + x * pixelSize;
      const py = borderSize + y * pixelSize;

      if (pixel?.filled && pixel.color) {
        const matched = findClosestColor(pixel.color, colorGroup.colors);
        ctx.fillStyle = pixel.color;
        ctx.fillRect(px, py, pixelSize, pixelSize);

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, pixelSize, pixelSize);

        if (pixelSize >= 16) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.font = `${Math.max(8, pixelSize / 3)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const shortCode = matched.code.length > 4 ? matched.code.slice(0, 4) : matched.code;
          ctx.fillText(shortCode, px + pixelSize / 2, py + pixelSize / 2);
        }
      } else {
        ctx.fillStyle = '#F8F8F8';
        ctx.fillRect(px, py, pixelSize, pixelSize);
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, pixelSize, pixelSize);
      }
    }
  }

  const startX = borderSize + canvasSize * pixelSize + 10;
  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Color Codes', startX, borderSize - 10);

  let yOffset = borderSize + 10;
  for (const bead of beadCounts) {
    ctx.fillStyle = bead.hex;
    ctx.fillRect(startX, yOffset, 16, 16);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, yOffset, 16, 16);

    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${bead.code}`, startX + 22, yOffset + 12);

    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText(`x${bead.count}`, startX + 60, yOffset + 12);

    yOffset += 22;
    if (yOffset > canvas.height - 20) break;
  }

  return canvas.toDataURL('image/png');
}

export function exportToMaterialsListImage(
  canvasData: CanvasData,
  canvasSize: CanvasSize,
  colorGroup: ColorGroup,
  projectName: string
): string {
  const beadCounts = countBeadsByColor(canvasData, canvasSize, colorGroup);
  const totalBeads = beadCounts.reduce((sum, b) => sum + b.count, 0);

  const lineHeight = 28;
  const headerHeight = 100;
  const colorBoxWidth = 120;
  const countBoxWidth = 80;
  const canvas = document.createElement('canvas');

  canvas.width = colorBoxWidth + countBoxWidth + 60;
  canvas.height = headerHeight + beadCounts.length * lineHeight + 40;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#4A4A4A';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(projectName, canvas.width / 2, 30);

  ctx.fillStyle = '#8A8A8A';
  ctx.font = '12px Arial';
  ctx.fillText(`Bead Size: ${colorGroup.beadSize}  |  Brand: ${colorGroup.brand}`, canvas.width / 2, 52);

  ctx.fillStyle = '#C4956A';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`${totalBeads} beads`, canvas.width / 2, 80);

  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, headerHeight - 10);
  ctx.lineTo(canvas.width - 20, headerHeight - 10);
  ctx.stroke();

  ctx.fillStyle = '#8A8A8A';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('COLOR', 30, headerHeight + 15);
  ctx.textAlign = 'right';
  ctx.fillText('COUNT', canvas.width - 30, headerHeight + 15);

  let yOffset = headerHeight + 30;
  for (const bead of beadCounts) {
    ctx.fillStyle = bead.hex;
    ctx.fillRect(30, yOffset - 12, 20, 20);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, yOffset - 12, 20, 20);

    ctx.fillStyle = '#4A4A4A';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${bead.code} ${bead.name}`, 58, yOffset + 2);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${bead.count}`, canvas.width - 30, yOffset + 2);

    yOffset += lineHeight;
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
