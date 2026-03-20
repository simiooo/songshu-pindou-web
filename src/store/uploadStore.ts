import { create } from 'zustand';
import type { UploadStatus, ImportedImage, CanvasSize } from '@/types/editor';

interface UploadStore {
  status: UploadStatus;
  importedImage: ImportedImage | null;
  error: string | null;
  pixelationCanvasSize: CanvasSize;
  selectedColorGroupId: string;
  enableDithering: boolean;
  cropRegion: { x: number; y: number; width: number; height: number } | null;
  zoomLevel: number;

  setStatus: (status: UploadStatus) => void;
  setImportedImage: (image: ImportedImage | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setPixelationCanvasSize: (size: CanvasSize) => void;
  setSelectedColorGroupId: (id: string) => void;
  setEnableDithering: (enabled: boolean) => void;
  setCropRegion: (region: { x: number; y: number; width: number; height: number } | null) => void;
  setZoomLevel: (level: number) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  status: 'idle',
  importedImage: null,
  error: null,
  pixelationCanvasSize: 52,
  selectedColorGroupId: 'perler-5mm',
  enableDithering: true,
  cropRegion: null,
  zoomLevel: 1,

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
    }),

  setPixelationCanvasSize: (size) => set({ pixelationCanvasSize: size }),

  setSelectedColorGroupId: (id) => set({ selectedColorGroupId: id }),

  setEnableDithering: (enabled) => set({ enableDithering: enabled }),

  setCropRegion: (region) => set({ cropRegion: region }),

  setZoomLevel: (level) => set({ zoomLevel: level }),
}));
