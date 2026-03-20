import type { ColorItem } from '@/types/editor';

interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
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

export function colorDistance(c1: RGB, c2: RGB): number {
  const rWeight = 0.299;
  const gWeight = 0.587;
  const bWeight = 0.114;

  return Math.sqrt(
    rWeight * Math.pow(c1.r - c2.r, 2) +
      gWeight * Math.pow(c1.g - c2.g, 2) +
      bWeight * Math.pow(c1.b - c2.b, 2)
  );
}

export function findClosestColor(hex: string, colors: ColorItem[]): ColorItem {
  const target = hexToRgb(hex);

  let closest = colors[0];
  let minDistance = Infinity;

  for (const color of colors) {
    const rgb = hexToRgb(color.hex);
    const distance = colorDistance(target, rgb);

    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }

  return closest;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getColorName(hex: string): string {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);

  if (l < 10) return 'Black';
  if (l > 90 && s < 10) return 'White';
  if (s < 10) return l < 50 ? 'Gray' : 'Light Gray';

  if (h < 15 || h >= 345) return l < 50 ? 'Dark Red' : 'Red';
  if (h < 45) return l < 50 ? 'Brown' : 'Orange';
  if (h < 75) return l < 50 ? 'Olive' : 'Yellow';
  if (h < 150) return l < 50 ? 'Dark Green' : 'Green';
  if (h < 210) return l < 50 ? 'Dark Cyan' : 'Cyan';
  if (h < 270) return l < 50 ? 'Dark Blue' : 'Blue';
  if (h < 315) return l < 50 ? 'Dark Magenta' : 'Magenta';
  return l < 50 ? 'Dark Pink' : 'Pink';
}

export function kMeansColors(
  imageData: ImageData,
  k: number,
  maxIterations: number = 10
): RGB[] {
  const pixels: RGB[] = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push({
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
    });
  }

  let centroids: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let clusterIdx = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = i;
        }
      }

      clusters[clusterIdx].push(pixel);
    }

    const newCentroids: RGB[] = [];
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) {
        newCentroids.push(centroids[i]);
        continue;
      }

      const avgR = clusters[i].reduce((sum, p) => sum + p.r, 0) / clusters[i].length;
      const avgG = clusters[i].reduce((sum, p) => sum + p.g, 0) / clusters[i].length;
      const avgB = clusters[i].reduce((sum, p) => sum + p.b, 0) / clusters[i].length;

      newCentroids.push({ r: avgR, g: avgG, b: avgB });
    }

    centroids = newCentroids;
  }

  return centroids;
}

export function extractDominantColors(imageData: ImageData, count: number = 10): string[] {
  const centroids = kMeansColors(imageData, count);
  return centroids.map((c) => rgbToHex(c.r, c.g, c.b));
}
