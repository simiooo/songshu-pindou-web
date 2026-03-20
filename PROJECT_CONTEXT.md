# 拼豆编辑器 - 项目背景与设计决策

本文档记录项目的原始需求、设计决策和技术方案，为后续开发提供上下文参考。

---

## 一、项目起源

### 1.1 用户故事 (User Story)

用户需要一个基于浏览器的**拼豆图案编辑器**，主要用途是：

> 玩家使用镊子将五颜六色的塑料小豆子按照图纸摆放在模板上，拼出心仪的图案，随后用熨斗高温烫平使其连接定型。

核心需求：
- 将数字图片转换为拼豆图案
- 编辑像素化的拼豆图案
- 使用预设色号绘制
- 通过 AI 智能处理图案
- 保存和导出作品

### 1.2 拼豆背景知识

**拼豆 (Fuse Beads / Perler Beads)**

一种风靡的手工 DIY 活动，玩家使用镊子将彩色塑料小豆子按照图纸摆放在模板上，用熨斗烫平使其连接定型。

**常见类型**：

| 类型 | 直径 | 特点 |
|------|------|------|
| 小豆 (Mini) | 2.6mm | 更细腻，适合精细图案 |
| 中豆 (Classic/Midi) | 5mm | 最常见，适合大多数作品 |
| 大豆 (Biggie/Maxi) | 10mm | 适合初学者，快速完成 |

**本项目选择**：5mm 颗粒（最常见的标准尺寸）

---

## 二、核心概念定义

### 2.1 术语对照

| 数字世界 | 物理世界 | 说明 |
|---------|---------|------|
| 像素 (Pixel) | 颗粒 (Bead) | 最小单元 |
| 像素网格 | 模板 (Pegboard) | 放置颗粒的板子 |
| 图片编辑 | 镊子夹取放置 | 实际操作 |
| 锁定像素 | 熨斗烫制定型 | 定型步骤 |

### 2.2 画布尺寸

画布尺寸 = 颗粒数量（如 52 = 52×52 颗粒）

| 画布尺寸 | 颗粒数 | 实际尺寸 (5mm) | 建议用途 |
|---------|--------|---------------|---------|
| 29 | 29×29 | 14.5cm | 迷你钥匙扣 |
| 36 | 36×36 | 18cm | 小型挂件 |
| 52 | 52×52 | 26cm | 中型图案 |
| 72 | 72×72 | 36cm | 大型图案 |
| 104 | 104×104 | 52cm | 超大挂画 |
| 156 | 156×156 | 78cm | 专业级 |

---

## 三、预设色号库

### 3.1 支持的品牌

根据调研，主流拼豆品牌色号数据来源于 GitHub 开源项目 [maxcleme/beadcolors](https://github.com/maxcleme/beadcolors)。

| 品牌 | 颗粒尺寸 | 色号数 | 分类 |
|------|---------|--------|------|
| Perler | 5mm | 103 色 | 基础实色、珠光、荧光、条纹 |
| Artkal S | 5mm | 199 色 | 基础、柔和、夜光、闪光、霓虹、珠光、透明 |
| Artkal M | 2.6mm | 220 色 | 按色系分组 |
| Hama | 5mm | 80 色 | 基础色 |

### 3.2 色号分类

| 分类 | 代码前缀 | 说明 |
|------|---------|------|
| 实色 (Solid) | 无 | 标准不透明颜色 |
| 珠光 (Pearl) | P | 珍珠光泽效果 |
| 霓虹 (Neon) | N | 高亮荧光色 |
| 夜光 (Glow) | G | 暗处发光效果 |
| 闪光 (Glitter) | L | 带闪光颗粒 |
| 透明 (Transparent) | T | 半透明效果 |

### 3.3 数据来源

色号数据存储在 `src/constants/colorGroups.ts`

**格式**：
```typescript
{
  code: 'S01',      // 色号编码
  hex: '#EAEEF3',   // HEX 值
  name: 'White'     // 英文名称
}
```

---

## 四、图片像素化方案

### 4.1 方案选择：方案 B - 像素聚合法

**流程**：
```
上传图片 → 等比例缩放到目标尺寸 → 颜色量化(K-Means) → 匹配最近色号 → 输出 CanvasData
```

**对比**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| A: 比例缩放 | 简单快速 | 颜色可能不匹配色号 |
| **B: 像素聚合** | 颜色精确匹配 | 实现复杂 |

### 4.2 抖动算法

可选启用**弗洛伊德-斯坦伯格抖动 (Floyd-Steinberg Dithering)**

**效果**：
- 渐变更平滑，减少色块感
- 使用误差扩散原理

### 4.3 颜色匹配算法

**加权欧几里得距离**：
```
ΔE = √(0.299×ΔR² + 0.587×ΔG² + 0.114×ΔB²)
```

人眼对绿色最敏感，对蓝色最不敏感，所以绿色权重最高。

---

## 五、功能架构

### 5.1 编辑器核心功能

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 画笔 | B | 填充像素 |
| 橡皮擦 | E | 清除像素 |
| 填充 | F | 洪水填充 (Flood Fill) |
| 选择 | S | 框选区域 |
| 撤销 | Ctrl+Z | 撤销上一步 |
| 重做 | Ctrl+Y | 重做 |
| 网格 | G | 切换网格显示 |

### 5.2 图片功能

| 方式 | 实现 |
|------|------|
| 点击上传 | antd Upload 组件 |
| 拖拽上传 | DropZone |
| 粘贴上传 | paste 事件监听 |

### 5.3 LLM 集成 (Vercel AI SDK)

**支持的 Providers**：
- OpenAI (GPT-4o, GPT-4V)
- Anthropic (Claude 3.5)
- Google (Gemini)
- DeepSeek
- Moonshot (Kimi)
- Qwen (通义)
- Ollama (本地)
- 其他 OpenAI 兼容接口

**LLM Provider 管理功能**：
- 新增 Provider
- 删除 Provider
- 编辑 Provider
- 设置默认 Provider
- 列表查询

**处理流程**：
```
用户框选区域 → 提取区域图片 → 用户输入指令 → 调用 LLM → 返回处理结果 → 更新画布
```

### 5.4 保存与导出

**自动保存**：
- 每 30 秒自动保存到 IndexedDB (Dexie)
- 仅在有更改时保存

**导出格式**：

| 格式 | 说明 |
|------|------|
| PNG | 无损像素图 (1x, 2x, 4x 分辨率) |
| JSON | 项目文件，包含所有数据 |

---

## 六、技术架构

### 6.1 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite + React Compiler |
| UI | Ant Design 5 |
| 状态管理 | Zustand |
| 本地存储 | Dexie (IndexedDB) |
| AI | Vercel AI SDK |
| 路由 | React Router DOM 6 |

### 6.2 目录结构

```
src/
├── components/
│   ├── editor/           # 编辑器组件
│   │   ├── EditorCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── ColorPalette.tsx
│   │   ├── HistoryControls.tsx
│   │   └── CanvasSizeSelector.tsx
│   ├── upload/           # 上传组件
│   │   └── ImageUploader.tsx
│   └── llm/             # LLM 组件
│       └── LLMProviderManager.tsx
├── hooks/
│   ├── useAutoSave.ts
│   └── useLLMProcess.ts
├── pages/
│   └── EditorPage.tsx
├── store/
│   ├── editorStore.ts
│   ├── llmProviderStore.ts
│   └── uploadStore.ts
├── utils/
│   ├── colorMatching.ts
│   ├── pixelation.ts
│   ├── dexieDb.ts
│   └── exportUtils.ts
├── types/
│   └── editor.ts
└── constants/
    └── colorGroups.ts
```

### 6.3 数据库设计 (Dexie)

**表结构**：

```typescript
// projects - 项目表
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

// llm_providers - LLM 配置表
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

// customColorGroups - 自定义色号组表
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

## 七、设计决策记录

### 7.1 已确认的决策

| 决策项 | 选择 | 原因 |
|--------|------|------|
| 颗粒直径 | 5mm | 最常见的标准尺寸 |
| 画布尺寸单位 | 颗粒数量 | 用户提供的尺寸理解为颗粒数 |
| 像素化方案 | 方案B (K-Means + 色号匹配) | 需要匹配预设色号 |
| 抖动支持 | 需要 | 使渐变更平滑 |
| 颜色限制 | 仅预设色号 | 拼豆物理限制 |
| 透明/闪光色 | 支持 | 预设色号包含 |
| LLM Provider | Vercel AI SDK | 支持多 Provider |

### 7.2 色号提取策略

| 场景 | 方案 |
|------|------|
| 图片主色提取 | 算法 (K-Means) |
| 配色建议 | LLM |
| 智能修复/风格化 | LLM |
| 文字生成图案 | LLM |

### 7.3 未来可能扩展

- [ ] 3mm 小豆支持
- [ ] 更多品牌色号
- [ ] 社区分享功能
- [ ] 多人协作
- [ ] AR 预览（拍照看成品效果）

---

## 八、相关文档

| 文档 | 说明 |
|------|------|
| `SPEC.md` | 技术规格文档（详细类型定义） |
| `TODO.md` | 待完善功能清单 |
| `README.md` | 项目说明文档 |

---

## 九、团队注意事项

### 9.1 开发规范

- 使用 pnpm（不是 npm/yarn）
- 遵守 React Hooks 规则
- 使用 TypeScript 严格模式
- 运行 `pnpm run lint` 后提交

### 9.2 分支命名

```
feature/xxx    - 新功能
fix/xxx        - 修复
chore/xxx      - 杂项
```

### 9.3 提交规范

使用 Conventional Commits：
```
feat: xxx
fix: xxx
docs: xxx
chore: xxx
```

---

*最后更新: 2026-03-20*
