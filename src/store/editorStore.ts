import { create } from 'zustand';
import type {
  CanvasSize,
  CanvasData,
  EditorTool,
  EditorOperation,
  SelectionRect,
  ColorGroup,
  PixelData,
} from '@/types/editor';
import { DEFAULT_COLOR_GROUPS } from '@/constants/colorGroups';

const MAX_HISTORY_SIZE = 50;

interface EditorStore {
  canvasSize: CanvasSize;
  canvasData: CanvasData;
  currentTool: EditorTool;
  currentColor: string;
  brushSize: number;
  selection: SelectionRect | null;
  historyStack: EditorOperation[][];
  redoStack: EditorOperation[][];
  colorGroups: ColorGroup[];
  activeColorGroupId: string;
  showGrid: boolean;
  gridColor: 'dark' | 'light';
  showColorLabels: boolean;
  projectId: string | null;
  projectName: string;
  isDirty: boolean;
  lastSavedAt: number | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPanningMode: boolean;

  setCanvasSize: (size: CanvasSize) => void;
  initializeCanvas: () => void;
  setPixel: (x: number, y: number, color: string) => EditorOperation | null;
  erasePixel: (x: number, y: number) => EditorOperation | null;
  fillArea: (x: number, y: number, color: string) => EditorOperation[];
  setTool: (tool: EditorTool) => void;
  setColor: (color: string) => void;
  setSelection: (rect: SelectionRect | null) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (operations: EditorOperation[]) => void;
  toggleGrid: () => void;
  setGridColor: (color: 'dark' | 'light') => void;
  toggleColorLabels: () => void;
  setColorGroups: (groups: ColorGroup[]) => void;
  setActiveColorGroup: (id: string) => void;
  newProject: () => void;
  markDirty: () => void;
  markSaved: () => void;
  loadCanvas: (data: CanvasData, size: CanvasSize) => void;
  applyOperations: (operations: EditorOperation[]) => void;
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setIsPanningMode: (value: boolean) => void;
  resetView: () => void;
}

const createEmptyCanvas = (size: CanvasSize): CanvasData => {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (): PixelData => ({
      color: null,
      filled: false,
    }))
  );
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvasSize: 52,
  canvasData: createEmptyCanvas(52),
  currentTool: 'brush',
  currentColor: '#FF0000',
  brushSize: 1,
  selection: null,
  historyStack: [],
  redoStack: [],
  colorGroups: DEFAULT_COLOR_GROUPS,
  activeColorGroupId: 'perler-223',
  showGrid: true,
  gridColor: 'dark',
  showColorLabels: true,
  projectId: null,
  projectName: '未命名项目',
  isDirty: false,
  lastSavedAt: null,
  zoomLevel: 1,
  panOffset: { x: 0, y: 0 },
  isPanningMode: false,

  setCanvasSize: (size) => {
    set({ canvasSize: size });
    get().initializeCanvas();
  },

  initializeCanvas: () => {
    const { canvasSize } = get();
    set({
      canvasData: createEmptyCanvas(canvasSize),
      historyStack: [],
      redoStack: [],
      isDirty: false,
    });
  },

  setPixel: (x, y, color) => {
    const { canvasData } = get();
    if (x < 0 || y < 0 || y >= canvasData.length || x >= canvasData[0].length) {
      return null;
    }

    const previousColor = canvasData[y][x].color;

    if (previousColor === color) {
      return null;
    }

    const newCanvasData = canvasData.map((row, rowIdx) =>
      rowIdx === y
        ? row.map((pixel, colIdx) =>
            colIdx === x ? { color, filled: true } : pixel
          )
        : row
    );

    set({ canvasData: newCanvasData, isDirty: true });

    return {
      type: 'fill',
      x,
      y,
      previousColor,
      newColor: color,
    };
  },

  erasePixel: (x, y) => {
    const { canvasData } = get();
    if (x < 0 || y < 0 || y >= canvasData.length || x >= canvasData[0].length) {
      return null;
    }

    const previousColor = canvasData[y][x].color;
    if (!previousColor) {
      return null;
    }

    const newCanvasData = canvasData.map((row, rowIdx) =>
      rowIdx === y
        ? row.map((pixel, colIdx) =>
            colIdx === x ? { color: null, filled: false } : pixel
          )
        : row
    );

    set({ canvasData: newCanvasData, isDirty: true });

    return {
      type: 'erase',
      x,
      y,
      previousColor,
      newColor: null,
    };
  },

  fillArea: (startX, startY, color) => {
    const { canvasData } = get();
    const targetColor = canvasData[startY]?.[startX]?.color;
    const operations: EditorOperation[] = [];

    if (targetColor === color) {
      return operations;
    }

    const visited = new Set<string>();
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (
        x < 0 ||
        y < 0 ||
        y >= canvasData.length ||
        x >= canvasData[0].length ||
        visited.has(key)
      ) {
        continue;
      }

      const pixelColor = canvasData[y][x].color;
      if (pixelColor !== targetColor) {
        continue;
      }

      visited.add(key);

      const op = get().setPixel(x, y, color);
      if (op) {
        operations.push(op);
      }

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return operations;
  },

  setTool: (tool) => set({ currentTool: tool }),

  setColor: (color) => set({ currentColor: color }),

  setSelection: (rect) => set({ selection: rect }),

  undo: () => {
    const { historyStack, redoStack, canvasData } = get();
    if (historyStack.length === 0) {
      return;
    }

    const previousState = historyStack[historyStack.length - 1];
    const newHistoryStack = historyStack.slice(0, -1);

    const revertedOperations: EditorOperation[] = previousState.map((op) => ({
      ...op,
      previousColor: op.newColor,
      newColor: op.previousColor,
    }));

    let newCanvasData = canvasData;
    for (const op of revertedOperations) {
      newCanvasData = newCanvasData.map((row, rowIdx) =>
        rowIdx === op.y
          ? row.map((pixel, colIdx) =>
              colIdx === op.x
                ? { color: op.newColor, filled: op.newColor !== null }
                : pixel
            )
          : row
      );
    }

    set({
      historyStack: newHistoryStack,
      redoStack: [...redoStack, previousState],
      canvasData: newCanvasData,
      isDirty: true,
    });
  },

  redo: () => {
    const { historyStack, redoStack, canvasData } = get();
    if (redoStack.length === 0) {
      return;
    }

    const operationsToRedo = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    let newCanvasData = canvasData;
    for (const op of operationsToRedo) {
      newCanvasData = newCanvasData.map((row, rowIdx) =>
        rowIdx === op.y
          ? row.map((pixel, colIdx) =>
              colIdx === op.x
                ? { color: op.newColor, filled: op.newColor !== null }
                : pixel
            )
          : row
      );
    }

    set({
      historyStack: [...historyStack, operationsToRedo],
      redoStack: newRedoStack,
      canvasData: newCanvasData,
      isDirty: true,
    });
  },

  pushHistory: (operations) => {
    if (operations.length === 0) {
      return;
    }

    const { historyStack } = get();
    let newHistoryStack = [...historyStack, operations];

    if (newHistoryStack.length > MAX_HISTORY_SIZE) {
      newHistoryStack = newHistoryStack.slice(-MAX_HISTORY_SIZE);
    }

    set({
      historyStack: newHistoryStack,
      redoStack: [],
    });
  },

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  setGridColor: (color) => set({ gridColor: color }),

  toggleColorLabels: () => set((state) => ({ showColorLabels: !state.showColorLabels })),

  setColorGroups: (groups) => set({ colorGroups: groups }),

  setActiveColorGroup: (id) => set({ activeColorGroupId: id }),

  newProject: () => {
    const { canvasSize } = get();
    set({
      projectId: generateId(),
      projectName: '未命名项目',
      canvasData: createEmptyCanvas(canvasSize),
      historyStack: [],
      redoStack: [],
      isDirty: false,
      lastSavedAt: null,
    });
  },

  markDirty: () => set({ isDirty: true }),

  markSaved: () =>
    set({
      isDirty: false,
      lastSavedAt: Date.now(),
    }),

  loadCanvas: (data, size) => {
    set({
      canvasData: data,
      canvasSize: size,
      historyStack: [],
      redoStack: [],
      isDirty: false,
    });
  },

  applyOperations: (operations) => {
    const { canvasData } = get();
    let newCanvasData = canvasData;

    for (const op of operations) {
      newCanvasData = newCanvasData.map((row, rowIdx) =>
        rowIdx === op.y
          ? row.map((pixel, colIdx) =>
              colIdx === op.x
                ? { color: op.newColor, filled: op.newColor !== null }
                : pixel
            )
          : row
      );
    }

    set({ canvasData: newCanvasData, isDirty: true });
  },

  setZoomLevel: (level) => set({ zoomLevel: Math.min(Math.max(level, 0.5), 5) }),

  setPanOffset: (offset) => set({ panOffset: offset }),

  setIsPanningMode: (value) => set({ isPanningMode: value }),

  resetView: () => set({ zoomLevel: 1, panOffset: { x: 0, y: 0 }, isPanningMode: false }),
}));
