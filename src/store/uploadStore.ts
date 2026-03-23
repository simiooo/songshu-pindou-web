import { create } from 'zustand';
import type { UploadStatus, ImportedImage, CanvasSize, CanvasData } from '@/types/editor';

// 缓存的AI图片数据
interface CachedAIImage {
  imageUrl: string;
  gridSize: CanvasSize;
  timestamp: number;
}

interface UploadStore {
  status: UploadStatus;
  importedImage: ImportedImage | null;
  error: string | null;
  pixelationCanvasSize: CanvasSize;
  selectedColorGroupId: string;
  enableDithering: boolean;
  cropRegion: { x: number; y: number; width: number; height: number } | null;
  zoomLevel: number;
  // AI生成图片缓存
  cachedAIImages: Map<string, CachedAIImage>;
  cachedCanvasData: CanvasData | null;
  originalCanvasSize: CanvasSize | null;
  originalImageUrl: string | null;

  setStatus: (status: UploadStatus) => void;
  setImportedImage: (image: ImportedImage | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setPixelationCanvasSize: (size: CanvasSize) => void;
  setSelectedColorGroupId: (id: string) => void;
  setEnableDithering: (enabled: boolean) => void;
  setCropRegion: (region: { x: number; y: number; width: number; height: number } | null) => void;
  setZoomLevel: (level: number) => void;
  // 重置上传状态但保留缓存
  resetUploadOnly: () => void;
  // 缓存AI图片的方法
  cacheAIImage: (cacheKey: string, imageUrl: string, gridSize: CanvasSize) => void;
  getCachedAIImage: (cacheKey: string) => CachedAIImage | undefined;
  cacheCanvasData: (data: CanvasData, size: CanvasSize, imageUrl: string) => void;
  getCachedCanvasData: () => { data: CanvasData; size: CanvasSize; imageUrl: string } | null;
  clearCache: () => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  status: 'idle',
  importedImage: null,
  error: null,
  pixelationCanvasSize: 52,
  selectedColorGroupId: 'perler-223',
  enableDithering: true,
  cropRegion: null,
  zoomLevel: 1,
  cachedAIImages: new Map(),
  cachedCanvasData: null,
  originalCanvasSize: null,
  originalImageUrl: null,

  setStatus: (status) => set({ status }),

  setImportedImage: (image) =>
    set({
      importedImage: image,
      status: image ? 'ready' : 'idle',
    }),

  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),

  reset: () =>
    set({
      status: 'idle',
      importedImage: null,
      error: null,
      cropRegion: null,
      zoomLevel: 1,
      cachedAIImages: new Map(),
      cachedCanvasData: null,
      originalCanvasSize: null,
      originalImageUrl: null,
    }),

  setPixelationCanvasSize: (size) => set({ pixelationCanvasSize: size }),

  setSelectedColorGroupId: (id) => set({ selectedColorGroupId: id }),

  setEnableDithering: (enabled) => set({ enableDithering: enabled }),

  setCropRegion: (region) => set({ cropRegion: region }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  resetUploadOnly: () =>
    set({
      status: 'idle',
      importedImage: null,
      error: null,
      cropRegion: null,
      zoomLevel: 1,
    }),

  cacheAIImage: (cacheKey, imageUrl, gridSize) => {
    const { cachedAIImages } = get();
    const newMap = new Map(cachedAIImages);
    newMap.set(cacheKey, {
      imageUrl,
      gridSize,
      timestamp: Date.now(),
    });
    set({ cachedAIImages: newMap });
  },

  getCachedAIImage: (cacheKey) => {
    return get().cachedAIImages.get(cacheKey);
  },

  cacheCanvasData: (data, size, imageUrl) => {
    set({
      cachedCanvasData: data,
      originalCanvasSize: size,
      originalImageUrl: imageUrl,
    });
  },

  getCachedCanvasData: () => {
    const { cachedCanvasData, originalCanvasSize, originalImageUrl } = get();
    if (cachedCanvasData && originalCanvasSize && originalImageUrl) {
      return { data: cachedCanvasData, size: originalCanvasSize, imageUrl: originalImageUrl };
    }
    return null;
  },

  clearCache: () =>
    set({
      cachedAIImages: new Map(),
      cachedCanvasData: null,
      originalCanvasSize: null,
      originalImageUrl: null,
    }),
}));
