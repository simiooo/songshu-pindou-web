import type { CanvasData, ColorItem, CanvasSize } from '@/types/editor';
import { findClosestColor, hexToRgb } from './colorMatching';

interface PixelationOptions {
  targetSize: CanvasSize;
  colorPalette: ColorItem[];
  enableDithering: boolean;
}

export function pixelateImage(
  imageData: ImageData,
  options: PixelationOptions
): CanvasData {
  const { targetSize, colorPalette, enableDithering } = options;

  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const result: CanvasData = [];

  const scaleX = srcWidth / targetSize;
  const scaleY = srcHeight / targetSize;

  for (let y = 0; y < targetSize; y++) {
    const row: { color: string | null; filled: boolean }[] = [];
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);

      const idx = (srcY * srcWidth + srcX) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];

      const hex = rgbToHexSimple(r, g, b);
      const matchedColor = findClosestColor(hex, colorPalette);

      row.push({
        color: matchedColor.hex,
        filled: true,
      });
    }
    result.push(row);
  }

  if (enableDithering) {
    return applyFloydSteinbergDithering(result, imageData, colorPalette, targetSize, scaleX, scaleY);
  }

  return result;
}

function applyFloydSteinbergDithering(
  canvas: CanvasData,
  originalImageData: ImageData,
  colorPalette: ColorItem[],
  targetSize: number,
  scaleX: number,
  scaleY: number
): CanvasData {
  const result: CanvasData = canvas.map((row) =>
    row.map((pixel) => ({ ...pixel }))
  );

  const srcWidth = originalImageData.width;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);

      const idx = (srcY * srcWidth + srcX) * 4;
      const r = originalImageData.data[idx];
      const g = originalImageData.data[idx + 1];
      const b = originalImageData.data[idx + 2];

      const oldHex = rgbToHexSimple(r, g, b);
      const oldRgb = hexToRgb(oldHex);
      const newColor = findClosestColor(oldHex, colorPalette);
      const newRgb = hexToRgb(newColor.hex);

      result[y][x] = {
        color: newColor.hex,
        filled: true,
      };

      const errR = oldRgb.r - newRgb.r;
      const errG = oldRgb.g - newRgb.g;
      const errB = oldRgb.b - newRgb.b;

      diffuseError(result, x + 1, y, errR, errG, errB, 7 / 16, colorPalette, originalImageData, targetSize, scaleX, scaleY);
      diffuseError(result, x - 1, y + 1, errR, errG, errB, 3 / 16, colorPalette, originalImageData, targetSize, scaleX, scaleY);
      diffuseError(result, x, y + 1, errR, errG, errB, 5 / 16, colorPalette, originalImageData, targetSize, scaleX, scaleY);
      diffuseError(result, x + 1, y + 1, errR, errG, errB, 1 / 16, colorPalette, originalImageData, targetSize, scaleX, scaleY);
    }
  }

  return result;
}

function diffuseError(
  canvas: CanvasData,
  x: number,
  y: number,
  errR: number,
  errG: number,
  errB: number,
  factor: number,
  colorPalette: ColorItem[],
  originalImageData: ImageData,
  targetSize: number,
  scaleX: number,
  scaleY: number
): void {
  if (x < 0 || x >= targetSize || y < 0 || y >= targetSize) {
    return;
  }

  const srcWidth = originalImageData.width;
  const srcX = Math.floor(x * scaleX);
  const srcY = Math.floor(y * scaleY);

  if (srcX >= srcWidth || srcY >= originalImageData.height) {
    return;
  }

  const idx = (srcY * srcWidth + srcX) * 4;
  const r = originalImageData.data[idx] + errR * factor;
  const g = originalImageData.data[idx + 1] + errG * factor;
  const b = originalImageData.data[idx + 2] + errB * factor;

  const hex = rgbToHexSimple(
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b)))
  );

  const newColor = findClosestColor(hex, colorPalette);
  canvas[y][x] = {
    color: newColor.hex,
    filled: true,
  };
}

function rgbToHexSimple(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

export function imageDataToCanvasData(
  imageData: ImageData,
  targetSize: CanvasSize,
  colorPalette: ColorItem[],
  enableDithering: boolean = false
): CanvasData {
  return pixelateImage(imageData, {
    targetSize,
    colorPalette,
    enableDithering,
  });
}
