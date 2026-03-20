# 拼豆编辑器 (Perler Beads Editor) - 技术规格文档

> 本文档为最终版规范，作为开发基准参考。

---

## 1. 项目概述

### 1.1 核心功能
一个基于浏览器的拼豆图案编辑器，允许用户：
- 上传图片并将其像素化处理（方案B：像素聚合并匹配色号库）
- 在网格画布上编辑像素颜色（以像素为最小填充单元）
- 使用预设色号组绘制
- 通过 LLM 处理选中区域
- 自动/手动保存作品到本地

### 1.2 术语定义
| 术语 | 定义 |
|------|------|
| **颗粒** | 拼豆的最小物理单元，本项目预设 **5mm** 直径（最常见尺寸） |
| **画布尺寸** | 画布的颗粒数量，如 `52` 表示 52×52 颗粒的画布 |
| **色号** | 预设的拼豆颜色编号，如 `S01`, `19001` |
| **像素** | 画布上的最小编辑单元，对应一个颗粒 |

### 1.3 颗粒与实际尺寸对照表（5mm 颗粒）

| 画布尺寸 | 实际尺寸 (cm) | 建议用途 |
|---------|--------------|---------|
| 29×29 | 14.5×14.5 | 迷你钥匙扣 |
| 36×36 | 18×18 | 小型挂件 |
| 52×52 | 26×26 | 中型图案 |
| 72×72 | 36×36 | 大型图案 |
| 104×104 | 52×52 | 超大挂画 |
| 156×156 | 78×78 | 专业级 |

---

## 2. 核心类型定义

```typescript
// ========== 画布相关类型 ==========

/** 画布尺寸选项 (单位: 颗粒数) */
type CanvasSize = 29 | 36 | 52 | 72 | 104 | 156 | 200;

/** 单个像素颜色数据 */
interface PixelData {
  color: string;      // HEX 颜色值，如 '#FF5733'，空值为 null
  filled: boolean;   // 是否已填充
}

/** 画布数据 - 二维数组 [y][x] */
type CanvasData = PixelData[][];

// ========== 工具相关类型 ==========

/** 编辑工具类型 */
type EditorTool = 'brush' | 'eraser' | 'selection' | 'fill';

/** 编辑操作类型 */
type OperationType = 'fill' | 'erase' | 'fillArea';

/** 单次编辑操作记录 */
interface EditorOperation {
  type: OperationType;
  x: number;
  y: number;
  previousColor: string | null;
  newColor: string | null;
}

/** 区域选择数据 */
interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ========== 颜色相关类型 ==========

/** 颜色分类 */
type ColorCategory = 
  | 'solid'      // 实色
  | 'pearl'      // 珠光/珍珠色
  | 'neon'       // 霓虹色
  | 'glow'       // 夜光色
  | 'glitter'    // 闪光色
  | 'translucent'; // 透明色

/** 色号组 - 一组相关的颜色集合 */
interface ColorGroup {
  id: string;
  name: string;
  brand: 'Perler' | 'Artkal' | 'Hama' | 'Custom';
  beadSize: '5mm' | '3mm' | '2.6mm';
  category: ColorCategory;
  colors: ColorItem[];
}

interface ColorItem {
  code: string;      // 色号编码，如 '19001', 'S01'
  hex: string;       // HEX 值
  name?: string;     // 颜色名称（可选）
}

// ========== 图片相关类型 ==========

/** 像素化配置 */
interface PixelationConfig {
  targetSize: CanvasSize;
  colorGroupId: string;    // 用于匹配的目标色号组
  enableDithering: boolean; // 是否启用抖动
}

// ========== LLM Provider 相关类型 ==========

/** LLM Provider 配置 */
interface LLMProvider {
  id: string;
  name: string;                    // 显示名称
  provider: string;                 // provider 名称 (openai, anthropic, etc.)
  model: string;                    // 模型名称
  apiKey?: string;                 // API Key (可空)
  baseUrl?: string;                // 自定义端点
  enabled: boolean;                 // 是否启用
  isDefault: boolean;               // 是否为默认 provider
  createdAt: number;
  updatedAt: number;
}

// ========== 保存相关类型 ==========

/** 项目保存数据 */
interface ProjectData {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  canvas: CanvasData;
  activeColorGroupId: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}
```

---

## 3. 状态管理 (Zustand Store)

### 3.1 EditorStore

```typescript
interface EditorStore {
  // ========== 画布状态 ==========
  canvasSize: CanvasSize;
  canvasData: CanvasData;
  
  // ========== 工具状态 ==========
  currentTool: EditorTool;
  currentColor: string;
  brushSize: number;
  
  // ========== 选中状态 ==========
  selection: SelectionRect | null;
  
  // ========== 历史记录 ==========
  historyStack: EditorOperation[][];
  redoStack: EditorOperation[][];
  
  // ========== 色号组 ==========
  colorGroups: ColorGroup[];
  activeColorGroupId: string;
  
  // ========== UI 状态 ==========
  showGrid: boolean;
  gridColor: 'dark' | 'light';
  
  // ========== 项目信息 ==========
  projectId: string | null;
  projectName: string;
  isDirty: boolean;
  lastSavedAt: number | null;
  
  // ========== Actions ==========
  setCanvasSize: (size: CanvasSize) => void;
  initializeCanvas: () => void;
  setPixel: (x: number, y: number, color: string) => void;
  erasePixel: (x: number, y: number) => void;
  fillArea: (x: number, y: number, color: string) => void;
  setTool: (tool: EditorTool) => void;
  setColor: (color: string) => void;
  setSelection: (rect: SelectionRect | null) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (operations: EditorOperation[]) => void;
  toggleGrid: () => void;
  setGridColor: (color: 'dark' | 'light') => void;
  setColorGroups: (groups: ColorGroup[]) => void;
  setActiveColorGroup: (id: string) => void;
  newProject: () => void;
  markDirty: () => void;
  markSaved: () => void;
}
```

### 3.2 LLMProviderStore

```typescript
interface LLMProviderStore {
  providers: LLMProvider[];
  activeProviderId: string | null;
  
  // Actions
  addProvider: (provider: Omit<LLMProvider, 'id' | 'createdAt' | 'updatedAt'>) => LLMProvider;
  updateProvider: (id: string, updates: Partial<LLMProvider>) => void;
  deleteProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  getActiveProvider: () => LLMProvider | null;
  listProviders: () => LLMProvider[];
}
```

---

## 4. 组件架构

```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx         # 顶部导航栏（含 Logo 和语言切换）
│   │   └── Sidebar.tsx           # 侧边栏（工具、视图、历史记录）
│   ├── editor/
│   │   ├── EditorCanvas.tsx       # 画布主组件
│   │   ├── PixelGrid.tsx          # 像素网格
│   │   ├── GridOverlay.tsx        # 网格辅助线
│   │   ├── SelectionOverlay.tsx  # 选中区域
│   │   ├── Toolbar.tsx            # 工具栏（已废弃，请使用 Sidebar）
│   │   ├── ColorPalette.tsx       # 色号面板
│   │   ├── HistoryControls.tsx    # 撤销/重做（已废弃，请使用 Sidebar）
│   │   ├── CanvasSizeSelector.tsx  # 画布尺寸选择
│   │   └── SelectionPopup.tsx     # 选中区域操作弹窗
│   │
│   ├── upload/
│   │   ├── ImageUploader.tsx      # 图片上传
│   │   └── PixelationPreview.tsx  # 像素化预览
│   │
│   ├── llm/
│   │   ├── LLMProviderManager.tsx # Provider 管理
│   │   └── LLMProcessPanel.tsx    # LLM 处理面板
│   │
│   └── common/
│
├── pages/
│   └── EditorPage.tsx
│
├── store/
│   ├── editorStore.ts
│   ├── llmProviderStore.ts
│   └── uploadStore.ts
│
├── hooks/
│   ├── useAutoSave.ts
│   ├── usePixelation.ts
│   └── useLLMProcess.ts
│
├── i18n/
│   ├── index.ts                  # i18n 配置
│   └── locales/
│       ├── zh-CN.ts              # 中文翻译
│       └── en-US.ts              # 英文翻译
│
├── theme/
│   └── index.ts                  # Ant Design 主题配置
│
├── utils/
│   ├── pixelation.ts
│   ├── colorMatching.ts
│   ├── dithering.ts
│   ├── exportUtils.ts
│   └── dexieDb.ts
│
├── types/
│   └── editor.ts
│
└── constants/
    ├── colorGroups.ts            # 预设色号组
    └── beadSizes.ts             # 颗粒尺寸配置
```

---

## 5. UI 设计系统

### 5.1 设计理念
- **去线留白**: 极简风格，减少视觉噪音，突出内容
- **柔和色调**: 使用温暖的米色、浅驼色作为主色调
- **松鼠品牌元素**: Logo 融入松鼠造型，呼应品牌
- **响应式设计**: 支持桌面、平板和移动端

### 5.2 色彩系统
```
--color-primary: #C4956A      # 温暖驼色（主色调）
--color-primary-hover: #B8875D # 主色悬停
--color-primary-bg: rgba(196, 149, 106, 0.08) # 主色背景
--color-success: #7DB88F       # 柔和绿色
--color-warning: #E5B567       # 温暖黄色
--color-error: #D47070         # 柔和红色
--color-text: #4A4A4A          # 主文字
--color-text-secondary: #8A8A8A # 次要文字
--color-bg: #FDFCFA           # 主背景（温暖米白）
--color-bg-secondary: #F7F5F2  # 次要背景
--color-border: #EBEBEB       # 边框
--color-border-light: #F0F0F0  # 浅边框
```

### 5.3 圆角系统
```
--radius-sm: 8px    # 小圆角（按钮、输入框）
--radius-md: 12px   # 中圆角（卡片、面板）
--radius-lg: 16px   # 大圆角（模态框）
```

### 5.4 间距系统
```
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

### 5.5 响应式断点
```
移动端: < 768px
平板端: 768px - 1024px
桌面端: >= 1024px
超大屏: >= 1440px
```

### 5.6 i18n 支持
项目内置中文（zh-CN）和英文（en-US）支持，通过 `react-i18next` 实现。
- 语言切换位于顶部导航栏
- 所有 UI 文本均通过翻译 key 引用

---

## 6. 预设色号组数据

### 6.1 Perler Beads (5mm)
- **总数**: 103 色
- **格式**: 5位数字编码 (如 `19001` = White)
- **分类**: 基础实色、珠光色、荧光色、条纹色

### 6.2 Artkal S Beads (5mm)
- **总数**: 199 色
- **格式**: `S` + 数字 (如 `S01` = White)
- **分类**:
  | 系列 | 色号范围 | 说明 |
  |------|---------|------|
  | S01-S159 | 基础色系 | 标准实色 |
  | SE1-SE15 | 柔和色系 | Pastel 柔和色调 |
  | SG1-SG3 | 夜光色系 | 暗处发光效果 |
  | SL1-SL4 | 闪光色系 | 带闪光颗粒 |
  | SN1-SN4 | 霓虹色系 | 荧光高亮色 |
  | SP1-SP8 | 珠光色系 | 珍珠光泽 |
  | ST1-ST6 | 透明色系 | 半透明效果 |

### 6.3 Artkal M Beads (2.6mm Mini)
- **总数**: 220 色
- **格式**: `M` + 字母 + 数字 (如 `MA1`, `MB1`)
- **分类**: 按色系分组 (黄/橙、绿、蓝、紫、粉/玫红、红、棕/米、灰/白)

---

## 7. 功能详细设计

### 7.1 图片上传与像素化

#### 上传方式
| 方式 | 实现 |
|------|------|
| 点击上传 | antd Upload 组件 |
| 拖拽上传 | DropZone |
| 粘贴上传 | `paste` 事件监听 |

#### 像素化流程 (方案B)
```
上传图片 → 等比例缩放到目标尺寸 → 颜色量化(K-Means) → 匹配最近色号 → 输出 CanvasData
```

#### 抖动支持
- 可选启用弗洛伊德-斯坦伯格抖动
- 抖动可使渐变更平滑，减少色块感

### 7.2 画布编辑

#### 工具
| 工具 | 快捷键 | 功能 |
|------|--------|------|
| 画笔 | B | 填充像素 |
| 橡皮擦 | E | 清除像素 |
| 填充 | F | 洪水填充 |
| 选择 | S | 框选区域 |
| 撤销 | Ctrl+Z | 撤销上一步 |
| 重做 | Ctrl+Y | 重做 |
| 网格 | G | 切换网格显示 |

#### 网格辅助线
- 默认显示
- 支持深色/浅色切换
- 网格线宽度 1px

### 7.3 LLM Provider 管理

#### 功能列表
| 功能 | 说明 |
|------|------|
| 新增 Provider | 添加新的 LLM 配置 |
| 删除 Provider | 移除 LLM 配置 |
| 编辑 Provider | 修改 Provider 信息 |
| 设置默认 | 设定默认使用的 Provider |
| 列表查询 | 查看所有已配置的 Provider |

#### 支持的 Providers (via Vercel AI SDK)
- OpenAI (GPT-4o, GPT-4V)
- Anthropic (Claude 3.5)
- Google (Gemini)
- DeepSeek
- Moonshot (Kimi)
- Qwen (通义)
- Ollama (本地)
- 以及其他 OpenAI 兼容接口

#### LLM 处理流程
```
用户框选区域 → 提取区域图片 → 用户输入指令 → 调用 LLM → 返回处理结果 → 更新画布
```

### 7.4 保存功能

#### 自动保存
- 每 30 秒自动保存到 IndexedDB (Dexie)
- 仅在有更改时保存

#### 手动导出
| 格式 | 说明 |
|------|------|
| PNG | 无损像素图 (1x, 2x, 4x 分辨率选项) |
| JSON | 项目文件 (包含所有数据) |

---

## 8. 数据库设计 (Dexie)

```typescript
// projects 表
interface ProjectRecord {
  id?: number;
  uuid: string;
  name: string;
  canvasSize: CanvasSize;
  canvasData: CanvasData;
  activeColorGroupId: string;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
}

// llm_providers 表
interface LLMProviderRecord {
  id?: number;
  uuid: string;
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

// color_groups 表 (用户自定义色号组)
interface CustomColorGroupRecord {
  id?: number;
  uuid: string;
  name: string;
  colors: ColorItem[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 9. 技术依赖

```json
{
  "dependencies": {
    "react": "^19.2.4",
    "antd": "latest",
    "react-router-dom": "latest",
    "ahooks": "latest",
    "zustand": "latest",
    "dexie": "latest",
    "uuid": "latest",
    "ai": "latest",
    "@ai-sdk/provider-utils": "latest",
    "i18next": "latest",
    "react-i18next": "latest"
  }
}
```

---

## 10. 开发优先级

### Phase 1: 基础编辑功能
1. 项目脚手架 + 路由
2. EditorStore 状态管理
3. 画布渲染 (PixelGrid)
4. 工具栏 + 快捷键
5. 撤销/重做

### Phase 2: 颜色系统
6. 预设色号组数据
7. ColorPalette 组件
8. 颜色匹配算法

### Phase 3: 图片功能
9. 图片上传组件
10. 像素化算法
11. 抖动算法

### Phase 4: LLM 集成
12. LLMProviderStore
13. Provider 管理界面
14. LLM 处理流程

### Phase 5: 保存与导出
15. Dexie 数据库
16. 自动保存
17. 导出功能 (PNG/JSON)

---

## 11. 色号数据文件

完整的色号数据将存储在 `src/constants/colorGroups.ts` 中，包含：
- `PERLER_COLORS`: Perler 103 色
- `ARTKAL_S_COLORS`: Artkal S 199 色
- `ARTKAL_M_COLORS`: Artkal M 220 色

每个色号包含:
```typescript
{
  code: string;   // 色号编码
  hex: string;     // HEX 值
  name: string;   // 英文名称
}
```
