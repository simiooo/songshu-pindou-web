// ========== 画布相关类型 ==========

/** 画布尺寸选项 (单位: 颗粒数) */
export type CanvasSize = 29 | 36 | 52 | 72 | 104 | 156 | 200;

/** 单个像素颜色数据 */
export interface PixelData {
  color: string | null;
  filled: boolean;
}

/** 画布数据 - 二维数组 [y][x] */
export type CanvasData = PixelData[][];

// ========== 工具相关类型 ==========

/** 编辑工具类型 */
export type EditorTool = 'brush' | 'eraser' | 'selection' | 'fill';

/** 编辑操作类型 */
export type OperationType = 'fill' | 'erase' | 'fillArea';

/** 单次编辑操作记录 */
export interface EditorOperation {
  type: OperationType;
  x: number;
  y: number;
  previousColor: string | null;
  newColor: string | null;
}

/** 区域选择数据 */
export interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ========== 颜色相关类型 ==========

/** 颜色分类 */
export type ColorCategory =
  | 'solid'
  | 'pearl'
  | 'neon'
  | 'glow'
  | 'glitter'
  | 'translucent';

/** 色号组 - 一组相关的颜色集合 */
export interface ColorGroup {
  id: string;
  name: string;
  brand: 'Perler' | 'Artkal' | 'Hama' | 'Custom';
  beadSize: '5mm' | '3mm' | '2.6mm';
  category: ColorCategory;
  colors: ColorItem[];
}

export interface ColorItem {
  code: string;
  hex: string;
  name?: string;
}

// ========== 图片相关类型 ==========

/** 像素化配置 */
export interface PixelationConfig {
  targetSize: CanvasSize;
  colorGroupId: string;
  enableDithering: boolean;
}

/** 导入的图片原始数据 */
export interface ImportedImage {
  dataUrl: string;
  width: number;
  height: number;
}

// ========== LLM Provider 相关类型 ==========

/** LLM Provider 配置 */
export interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

// ========== 保存相关类型 ==========

/** 项目保存数据 */
export interface ProjectData {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  canvas: CanvasData;
  activeColorGroupId: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

// ========== 上传相关类型 ==========

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

// ========== 工具选项 ==========

export interface ToolOption {
  key: EditorTool;
  icon: string;
  label: string;
  shortcut: string;
}
