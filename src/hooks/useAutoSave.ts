import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { saveProject, type ProjectRecord } from '@/utils/dexieDb';

const AUTO_SAVE_INTERVAL = 30000;

export function useAutoSave() {
  const {
    canvasData,
    canvasSize,
    activeColorGroupId,
    projectId,
    projectName,
    isDirty,
    lastSavedAt,
    markSaved,
  } = useEditorStore();

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const save = async () => {
      const now = Date.now();
      const thumbnail = generateThumbnail(canvasData, canvasSize);

      const projectData: Omit<ProjectRecord, 'id'> = {
        uuid: projectId || generateUUID(),
        name: projectName,
        canvasSize,
        canvasData,
        activeColorGroupId,
        thumbnail,
        createdAt: lastSavedAt || now,
        updatedAt: now,
      };

      try {
        await saveProject(projectData);
        markSaved();
        console.log('Project auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    timerRef.current = window.setTimeout(save, AUTO_SAVE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, canvasData, canvasSize, activeColorGroupId, projectId, projectName, lastSavedAt, markSaved]);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateThumbnail(
  canvasData: { color: string | null; filled: boolean }[][],
  canvasSize: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const pixel = canvasData[y]?.[x];
      if (pixel?.filled && pixel.color) {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
