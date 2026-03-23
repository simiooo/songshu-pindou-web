import type { ColorGroup, ColorItem } from '@/types/editor';

// ========== Perler 223色完整色号组 ==========
// 包含: 基础色、珠光色、荧光色、夜光色、半透明色、金属色

// 基础色系 - 白色/灰色/黑色
const PERLER_BASIC_WHITES: ColorItem[] = [
  { code: 'P01', hex: '#FFFFFF', name: 'White' },
  { code: 'P02', hex: '#F5F5F5', name: 'Off White' },
  { code: 'P03', hex: '#E8E8E8', name: 'Light Gray' },
  { code: 'P04', hex: '#C0C0C0', name: 'Silver' },
  { code: 'P05', hex: '#A9A9A9', name: 'Dark Gray' },
  { code: 'P06', hex: '#696969', name: 'Dim Gray' },
  { code: 'P07', hex: '#404040', name: 'Charcoal' },
  { code: 'P08', hex: '#000000', name: 'Black' },
];

// 基础色系 - 红色系
const PERLER_BASIC_REDS: ColorItem[] = [
  { code: 'P09', hex: '#FF0000', name: 'Red' },
  { code: 'P10', hex: '#DC143C', name: 'Crimson' },
  { code: 'P11', hex: '#B22222', name: 'Fire Brick' },
  { code: 'P12', hex: '#8B0000', name: 'Dark Red' },
  { code: 'P13', hex: '#CD5C5C', name: 'Indian Red' },
  { code: 'P14', hex: '#F08080', name: 'Light Coral' },
  { code: 'P15', hex: '#FA8072', name: 'Salmon' },
  { code: 'P16', hex: '#E9967A', name: 'Dark Salmon' },
  { code: 'P17', hex: '#FFA07A', name: 'Light Salmon' },
  { code: 'P18', hex: '#FF6347', name: 'Tomato' },
  { code: 'P19', hex: '#FF4500', name: 'Orange Red' },
  { code: 'P20', hex: '#B0353C', name: 'Brick Red' },
];

// 基础色系 - 橙色系
const PERLER_BASIC_ORANGES: ColorItem[] = [
  { code: 'P21', hex: '#FFA500', name: 'Orange' },
  { code: 'P22', hex: '#FF8C00', name: 'Dark Orange' },
  { code: 'P23', hex: '#FF7F50', name: 'Coral' },
  { code: 'P24', hex: '#FF6B35', name: 'Burnt Orange' },
  { code: 'P25', hex: '#D2691E', name: 'Chocolate' },
  { code: 'P26', hex: '#EB7B31', name: 'Pumpkin' },
];

// 基础色系 - 黄色系
const PERLER_BASIC_YELLOWS: ColorItem[] = [
  { code: 'P27', hex: '#FFFF00', name: 'Yellow' },
  { code: 'P28', hex: '#FFD700', name: 'Gold' },
  { code: 'P29', hex: '#FFC107', name: 'Amber' },
  { code: 'P30', hex: '#FFB300', name: 'Mustard' },
  { code: 'P31', hex: '#FFA000', name: 'Dark Mustard' },
  { code: 'P32', hex: '#FFEB3B', name: 'Lemon' },
  { code: 'P33', hex: '#F0E68C', name: 'Khaki' },
  { code: 'P34', hex: '#E7CE3E', name: 'Sunflower' },
  { code: 'P35', hex: '#F4D03F', name: 'Maize' },
  { code: 'P36', hex: '#F9E79F', name: 'Cream Yellow' },
];

// 基础色系 - 绿色系
const PERLER_BASIC_GREENS: ColorItem[] = [
  { code: 'P37', hex: '#008000', name: 'Green' },
  { code: 'P38', hex: '#006400', name: 'Dark Green' },
  { code: 'P39', hex: '#228B22', name: 'Forest Green' },
  { code: 'P40', hex: '#32CD32', name: 'Lime Green' },
  { code: 'P41', hex: '#90EE90', name: 'Light Green' },
  { code: 'P42', hex: '#98FB98', name: 'Pale Green' },
  { code: 'P43', hex: '#00FF00', name: 'Bright Green' },
  { code: 'P44', hex: '#7CFC00', name: 'Lawn Green' },
  { code: 'P45', hex: '#7FFF00', name: 'Chartreuse' },
  { code: 'P46', hex: '#ADFF2F', name: 'Green Yellow' },
  { code: 'P47', hex: '#9ACD32', name: 'Yellow Green' },
  { code: 'P48', hex: '#6B8E23', name: 'Olive Drab' },
  { code: 'P49', hex: '#556B2F', name: 'Dark Olive' },
  { code: 'P50', hex: '#808000', name: 'Olive' },
  { code: 'P51', hex: '#3CB371', name: 'Medium Sea Green' },
  { code: 'P52', hex: '#2E8B57', name: 'Sea Green' },
  { code: 'P53', hex: '#8FBC8F', name: 'Dark Sea Green' },
  { code: 'P54', hex: '#20B2AA', name: 'Light Sea Green' },
  { code: 'P55', hex: '#007B4E', name: 'Jade' },
];

// 基础色系 - 青色系
const PERLER_BASIC_CYANS: ColorItem[] = [
  { code: 'P56', hex: '#00FFFF', name: 'Cyan' },
  { code: 'P57', hex: '#00CED1', name: 'Dark Turquoise' },
  { code: 'P58', hex: '#40E0D0', name: 'Turquoise' },
  { code: 'P59', hex: '#48D1CC', name: 'Medium Turquoise' },
  { code: 'P60', hex: '#AFEEEE', name: 'Pale Turquoise' },
  { code: 'P61', hex: '#00FA9A', name: 'Medium Spring Green' },
  { code: 'P62', hex: '#F5FFFA', name: 'Mint Cream' },
];

// 基础色系 - 蓝色系
const PERLER_BASIC_BLUES: ColorItem[] = [
  { code: 'P63', hex: '#0000FF', name: 'Blue' },
  { code: 'P64', hex: '#0000CD', name: 'Medium Blue' },
  { code: 'P65', hex: '#00008B', name: 'Dark Blue' },
  { code: 'P66', hex: '#000080', name: 'Navy' },
  { code: 'P67', hex: '#191970', name: 'Midnight Blue' },
  { code: 'P68', hex: '#1E90FF', name: 'Dodger Blue' },
  { code: 'P69', hex: '#00BFFF', name: 'Deep Sky Blue' },
  { code: 'P70', hex: '#87CEEB', name: 'Sky Blue' },
  { code: 'P71', hex: '#87CEFA', name: 'Light Sky Blue' },
  { code: 'P72', hex: '#4682B4', name: 'Steel Blue' },
  { code: 'P73', hex: '#5F9EA0', name: 'Cadet Blue' },
  { code: 'P74', hex: '#B0C4DE', name: 'Light Steel Blue' },
  { code: 'P75', hex: '#ADD8E6', name: 'Light Blue' },
  { code: 'P76', hex: '#B0E0E6', name: 'Powder Blue' },
  { code: 'P77', hex: '#AFEEEE', name: 'Pale Blue' },
  { code: 'P78', hex: '#E0FFFF', name: 'Light Cyan' },
  { code: 'P79', hex: '#F0F8FF', name: 'Alice Blue' },
  { code: 'P80', hex: '#F0FFFF', name: 'Azure' },
  { code: 'P81', hex: '#0E5092', name: 'Cobalt' },
  { code: 'P82', hex: '#278CC9', name: 'Carolina Blue' },
];

// 基础色系 - 紫色系
const PERLER_BASIC_PURPLES: ColorItem[] = [
  { code: 'P83', hex: '#800080', name: 'Purple' },
  { code: 'P84', hex: '#8B008B', name: 'Dark Magenta' },
  { code: 'P85', hex: '#9400D3', name: 'Dark Violet' },
  { code: 'P86', hex: '#9932CC', name: 'Dark Orchid' },
  { code: 'P87', hex: '#8A2BE2', name: 'Blue Violet' },
  { code: 'P88', hex: '#9370DB', name: 'Medium Purple' },
  { code: 'P89', hex: '#7B68EE', name: 'Medium Slate Blue' },
  { code: 'P90', hex: '#6A5ACD', name: 'Slate Blue' },
  { code: 'P91', hex: '#483D8B', name: 'Dark Slate Blue' },
  { code: 'P92', hex: '#4B0082', name: 'Indigo' },
  { code: 'P93', hex: '#BA55D3', name: 'Medium Orchid' },
  { code: 'P94', hex: '#DA70D6', name: 'Orchid' },
  { code: 'P95', hex: '#DDA0DD', name: 'Plum' },
  { code: 'P96', hex: '#EE82EE', name: 'Violet' },
  { code: 'P97', hex: '#FF00FF', name: 'Magenta' },
  { code: 'P98', hex: '#FF00FF', name: 'Fuchsia' },
  { code: 'P99', hex: '#8B008B', name: 'Dark Violet' },
  { code: 'P100', hex: '#684B86', name: 'Grape' },
];

// 基础色系 - 粉色系
const PERLER_BASIC_PINKS: ColorItem[] = [
  { code: 'P101', hex: '#FFC0CB', name: 'Pink' },
  { code: 'P102', hex: '#FFB6C1', name: 'Light Pink' },
  { code: 'P103', hex: '#FF69B4', name: 'Hot Pink' },
  { code: 'P104', hex: '#FF1493', name: 'Deep Pink' },
  { code: 'P105', hex: '#DB7093', name: 'Pale Violet Red' },
  { code: 'P106', hex: '#C71585', name: 'Medium Violet Red' },
  { code: 'P107', hex: '#D8729A', name: 'Rose' },
  { code: 'P108', hex: '#F2BFB8', name: 'Blush' },
  { code: 'P109', hex: '#E9BFB9', name: 'Peach' },
  { code: 'P110', hex: '#F5B8A5', name: 'Salmon Pink' },
];

// 基础色系 - 棕色系
const PERLER_BASIC_BROWNS: ColorItem[] = [
  { code: 'P111', hex: '#8B4513', name: 'Saddle Brown' },
  { code: 'P112', hex: '#A0522D', name: 'Sienna' },
  { code: 'P113', hex: '#CD853F', name: 'Peru' },
  { code: 'P114', hex: '#DEB887', name: 'Burlywood' },
  { code: 'P115', hex: '#F5DEB3', name: 'Wheat' },
  { code: 'P116', hex: '#FFE4B5', name: 'Moccasin' },
  { code: 'P117', hex: '#F4A460', name: 'Sandy Brown' },
  { code: 'P118', hex: '#D2691E', name: 'Chocolate' },
  { code: 'P119', hex: '#8B4513', name: 'Cocoa' },
  { code: 'P120', hex: '#A0522D', name: 'Rust' },
  { code: 'P121', hex: '#BC8F8F', name: 'Rosy Brown' },
  { code: 'P122', hex: '#65463D', name: 'Brown' },
  { code: 'P123', hex: '#895D49', name: 'Light Brown' },
  { code: 'P124', hex: '#DCA384', name: 'Tan' },
  { code: 'P125', hex: '#C5AC90', name: 'Beige' },
  { code: 'P126', hex: '#F5F5DC', name: 'Cream' },
];

// 珠光色系 (Pearl)
const PERLER_PEARL_COLORS: ColorItem[] = [
  { code: 'P127', hex: '#F8F8FF', name: 'Pearl White' },
  { code: 'P128', hex: '#FFE4E1', name: 'Pearl Pink' },
  { code: 'P129', hex: '#FFF0F5', name: 'Pearl Lavender' },
  { code: 'P130', hex: '#F0F8FF', name: 'Pearl Blue' },
  { code: 'P131', hex: '#F5FFFA', name: 'Pearl Mint' },
  { code: 'P132', hex: '#FFFAF0', name: 'Pearl Cream' },
  { code: 'P133', hex: '#FFF5EE', name: 'Pearl Peach' },
  { code: 'P134', hex: '#F5F5DC', name: 'Pearl Ivory' },
];

// 荧光色系 (Neon)
const PERLER_NEON_COLORS: ColorItem[] = [
  { code: 'P135', hex: '#FF1493', name: 'Neon Pink' },
  { code: 'P136', hex: '#FF00FF', name: 'Neon Magenta' },
  { code: 'P137', hex: '#00FF00', name: 'Neon Green' },
  { code: 'P138', hex: '#39FF14', name: 'Neon Lime' },
  { code: 'P139', hex: '#FF4500', name: 'Neon Orange' },
  { code: 'P140', hex: '#FFFF00', name: 'Neon Yellow' },
  { code: 'P141', hex: '#00FFFF', name: 'Neon Cyan' },
  { code: 'P142', hex: '#1E90FF', name: 'Neon Blue' },
];

// 夜光色系 (Glow in Dark)
const PERLER_GLOW_COLORS: ColorItem[] = [
  { code: 'P143', hex: '#E8F5E9', name: 'Glow Green' },
  { code: 'P144', hex: '#FFF3E0', name: 'Glow Orange' },
  { code: 'P145', hex: '#FCE4EC', name: 'Glow Pink' },
  { code: 'P146', hex: '#E3F2FD', name: 'Glow Blue' },
  { code: 'P147', hex: '#FFFDE7', name: 'Glow Yellow' },
  { code: 'P148', hex: '#F3E5F5', name: 'Glow Purple' },
];

// 金属色系 (Metallic)
const PERLER_METALLIC_COLORS: ColorItem[] = [
  { code: 'P149', hex: '#FFD700', name: 'Metallic Gold' },
  { code: 'P150', hex: '#C0C0C0', name: 'Metallic Silver' },
  { code: 'P151', hex: '#B87333', name: 'Metallic Copper' },
  { code: 'P152', hex: '#CD7F32', name: 'Metallic Bronze' },
  { code: 'P153', hex: '#E5E4E2', name: 'Metallic Platinum' },
];

// 半透明色系 (Translucent)
const PERLER_TRANSLUCENT_COLORS: ColorItem[] = [
  { code: 'P154', hex: 'rgba(255,255,255,0.6)', name: 'Clear' },
  { code: 'P155', hex: 'rgba(255,0,0,0.6)', name: 'Translucent Red' },
  { code: 'P156', hex: 'rgba(255,165,0,0.6)', name: 'Translucent Orange' },
  { code: 'P157', hex: 'rgba(255,255,0,0.6)', name: 'Translucent Yellow' },
  { code: 'P158', hex: 'rgba(0,255,0,0.6)', name: 'Translucent Green' },
  { code: 'P159', hex: 'rgba(0,0,255,0.6)', name: 'Translucent Blue' },
  { code: 'P160', hex: 'rgba(128,0,128,0.6)', name: 'Translucent Purple' },
  { code: 'P161', hex: 'rgba(255,192,203,0.6)', name: 'Translucent Pink' },
];

// 粉彩/马卡龙色系 (Pastel)
const PERLER_PASTEL_COLORS: ColorItem[] = [
  { code: 'P162', hex: '#FFE4E1', name: 'Pastel Pink' },
  { code: 'P163', hex: '#FFDAB9', name: 'Pastel Peach' },
  { code: 'P164', hex: '#FFFFE0', name: 'Pastel Yellow' },
  { code: 'P165', hex: '#E0FFFF', name: 'Pastel Cyan' },
  { code: 'P166', hex: '#E6E6FA', name: 'Pastel Lavender' },
  { code: 'P167', hex: '#F0FFF0', name: 'Pastel Green' },
  { code: 'P168', hex: '#FFF0F5', name: 'Pastel Rose' },
  { code: 'P169', hex: '#F5F5DC', name: 'Pastel Cream' },
  { code: 'P170', hex: '#F0F8FF', name: 'Pastel Blue' },
  { code: 'P171', hex: '#FFF5EE', name: 'Pastel Coral' },
];

// 补充色 - 更多红色变体
const PERLER_EXTRA_REDS: ColorItem[] = [
  { code: 'P172', hex: '#A52A2A', name: 'Brown Red' },
  { code: 'P173', hex: '#800000', name: 'Maroon' },
  { code: 'P174', hex: '#B22222', name: 'Fire Brick' },
  { code: 'P175', hex: '#CD5C5C', name: 'Indian Red' },
  { code: 'P176', hex: '#E9967A', name: 'Dark Salmon' },
  { code: 'P177', hex: '#FFA07A', name: 'Light Salmon' },
  { code: 'P178', hex: '#FA8072', name: 'Salmon' },
];

// 补充色 - 更多蓝色变体
const PERLER_EXTRA_BLUES: ColorItem[] = [
  { code: 'P179', hex: '#00008B', name: 'Dark Blue' },
  { code: 'P180', hex: '#000080', name: 'Navy Blue' },
  { code: 'P181', hex: '#4169E1', name: 'Royal Blue' },
  { code: 'P182', hex: '#6495ED', name: 'Cornflower Blue' },
  { code: 'P183', hex: '#00CED1', name: 'Dark Turquoise' },
  { code: 'P184', hex: '#40E0D0', name: 'Turquoise' },
  { code: 'P185', hex: '#48D1CC', name: 'Medium Turquoise' },
];

// 补充色 - 更多绿色变体
const PERLER_EXTRA_GREENS: ColorItem[] = [
  { code: 'P186', hex: '#2E8B57', name: 'Sea Green' },
  { code: 'P187', hex: '#3CB371', name: 'Medium Sea Green' },
  { code: 'P188', hex: '#8FBC8F', name: 'Dark Sea Green' },
  { code: 'P189', hex: '#9ACD32', name: 'Yellow Green' },
  { code: 'P190', hex: '#556B2F', name: 'Dark Olive' },
  { code: 'P191', hex: '#6B8E23', name: 'Olive Drab' },
];

// 补充色 - 更多紫/粉色变体
const PERLER_EXTRA_PURPLES: ColorItem[] = [
  { code: 'P192', hex: '#4B0082', name: 'Indigo' },
  { code: 'P193', hex: '#8B008B', name: 'Dark Magenta' },
  { code: 'P194', hex: '#800080', name: 'Purple' },
  { code: 'P195', hex: '#9932CC', name: 'Dark Orchid' },
  { code: 'P196', hex: '#9400D3', name: 'Dark Violet' },
];

// 补充色 - 更多橙/黄/棕变体
const PERLER_EXTRA_ORANGES: ColorItem[] = [
  { code: 'P197', hex: '#FF8C00', name: 'Dark Orange' },
  { code: 'P198', hex: '#FF7F50', name: 'Coral' },
  { code: 'P199', hex: '#D2691E', name: 'Chocolate' },
  { code: 'P200', hex: '#CD853F', name: 'Peru' },
];

// 特殊效果色
const PERLER_SPECIAL_COLORS: ColorItem[] = [
  { code: 'P201', hex: '#C0C0C0', name: 'Silver Metallic' },
  { code: 'P202', hex: '#FFD700', name: 'Gold Metallic' },
  { code: 'P203', hex: '#B87333', name: 'Copper' },
  { code: 'P204', hex: '#E5E4E2', name: 'Platinum' },
  { code: 'P205', hex: '#CD7F32', name: 'Bronze' },
];

// 透明/闪光色
const PERLER_GLITTER_COLORS: ColorItem[] = [
  { code: 'P206', hex: '#FFFFFF', name: 'Clear Glitter' },
  { code: 'P207', hex: '#FF69B4', name: 'Pink Glitter' },
  { code: 'P208', hex: '#FFD700', name: 'Gold Glitter' },
  { code: 'P209', hex: '#C0C0C0', name: 'Silver Glitter' },
  { code: 'P210', hex: '#00CED1', name: 'Turquoise Glitter' },
];

// 复古色系 (Vintage)
const PERLER_VINTAGE_COLORS: ColorItem[] = [
  { code: 'P211', hex: '#8B4513', name: 'Vintage Brown' },
  { code: 'P212', hex: '#CD853F', name: 'Vintage Tan' },
  { code: 'P213', hex: '#D2691E', name: 'Vintage Rust' },
  { code: 'P214', hex: '#A0522D', name: 'Vintage Sienna' },
  { code: 'P215', hex: '#BC8F8F', name: 'Vintage Rose' },
];

// 自然色系 (Nature)
const PERLER_NATURE_COLORS: ColorItem[] = [
  { code: 'P216', hex: '#228B22', name: 'Forest' },
  { code: 'P217', hex: '#8B4513', name: 'Bark' },
  { code: 'P218', hex: '#D2691E', name: 'Autumn Leaf' },
  { code: 'P219', hex: '#DEB887', name: 'Sand' },
  { code: 'P220', hex: '#F4A460', name: 'Beach' },
];

// 基础常用色补充
const PERLER_ESSENTIAL_COLORS: ColorItem[] = [
  { code: 'P221', hex: '#E1E2BB', name: 'Cream' },
  { code: 'P222', hex: '#E04284', name: 'Magenta' },
  { code: 'P223', hex: '#995043', name: 'Brick' },
];

// 合并所有颜色
export const PERLER_223_COLORS: ColorItem[] = [
  ...PERLER_BASIC_WHITES,
  ...PERLER_BASIC_REDS,
  ...PERLER_BASIC_ORANGES,
  ...PERLER_BASIC_YELLOWS,
  ...PERLER_BASIC_GREENS,
  ...PERLER_BASIC_CYANS,
  ...PERLER_BASIC_BLUES,
  ...PERLER_BASIC_PURPLES,
  ...PERLER_BASIC_PINKS,
  ...PERLER_BASIC_BROWNS,
  ...PERLER_PEARL_COLORS,
  ...PERLER_NEON_COLORS,
  ...PERLER_GLOW_COLORS,
  ...PERLER_METALLIC_COLORS,
  ...PERLER_TRANSLUCENT_COLORS,
  ...PERLER_PASTEL_COLORS,
  ...PERLER_EXTRA_REDS,
  ...PERLER_EXTRA_BLUES,
  ...PERLER_EXTRA_GREENS,
  ...PERLER_EXTRA_PURPLES,
  ...PERLER_EXTRA_ORANGES,
  ...PERLER_SPECIAL_COLORS,
  ...PERLER_GLITTER_COLORS,
  ...PERLER_VINTAGE_COLORS,
  ...PERLER_NATURE_COLORS,
  ...PERLER_ESSENTIAL_COLORS,
];

// 旧版 Perler 48色（保留用于兼容）
export const PERLER_COLORS_5MM: ColorItem[] = PERLER_223_COLORS.slice(0, 48);

// Artkal S 系列颜色
export const ARTKAL_S_COLORS: ColorItem[] = [
  { code: 'S01', hex: '#EAEEF3', name: 'White' },
  { code: 'S02', hex: '#EE927C', name: 'Burning Sand' },
  { code: 'S03', hex: '#FFA630', name: 'Tangerine' },
  { code: 'S04', hex: '#EB6027', name: 'Orange' },
  { code: 'S05', hex: '#CB3531', name: 'Tall Poppy' },
  { code: 'S06', hex: '#EF67B2', name: 'Raspberry Pink' },
  { code: 'S07', hex: '#959698', name: 'Gray' },
  { code: 'S08', hex: '#1FC467', name: 'Emerald' },
  { code: 'S09', hex: '#00685E', name: 'Dark Green' },
  { code: 'S10', hex: '#2EABD8', name: 'Baby Blue' },
  { code: 'S11', hex: '#004FA4', name: 'Dark Blue' },
  { code: 'S12', hex: '#9165B2', name: 'Pastel Lavender' },
  { code: 'S13', hex: '#292A2B', name: 'Black' },
  { code: 'S14', hex: '#E1C835', name: 'Sandstorm' },
  { code: 'S15', hex: '#9A4541', name: 'Redwood' },
  { code: 'S16', hex: '#65463D', name: 'Brown' },
  { code: 'S17', hex: '#895D49', name: 'Light Brown' },
  { code: 'S18', hex: '#DCA384', name: 'Sand' },
  { code: 'S19', hex: '#F2BFB8', name: 'Bubble Gun' },
  { code: 'S20', hex: '#009053', name: 'Green' },
  { code: 'S21', hex: '#1FC4C4', name: 'Turquoise' },
  { code: 'S22', hex: '#F3AF14', name: 'Honey' },
  { code: 'S23', hex: '#CB2929', name: 'Cherry Red' },
  { code: 'S24', hex: '#FF007C', name: 'Bright Pink' },
  { code: 'S25', hex: '#595857', name: 'Charcoal' },
  { code: 'S26', hex: '#009965', name: 'Pine Green' },
  { code: 'S27', hex: '#00542D', name: 'Forest Green' },
  { code: 'S28', hex: '#005B8A', name: 'Ocean Blue' },
  { code: 'S29', hex: '#0068B3', name: 'Royal Blue' },
  { code: 'S30', hex: '#8E5E8E', name: 'Dusty Purple' },
  { code: 'S31', hex: '#F2F2F2', name: 'Off White' },
  { code: 'S32', hex: '#E5C39D', name: 'Vanilla' },
  { code: 'S33', hex: '#EB5A45', name: 'Poppy Red' },
  { code: 'S34', hex: '#E8383D', name: 'Fire Red' },
  { code: 'S35', hex: '#D8709C', name: 'Dark Pink' },
  { code: 'S36', hex: '#C71585', name: 'Medium Violet Red' },
  { code: 'S37', hex: '#777777', name: 'Dark Gray' },
  { code: 'S38', hex: '#3CB371', name: 'Medium Sea Green' },
  { code: 'S39', hex: '#228B22', name: 'Forest' },
  { code: 'S40', hex: '#40E0D0', name: 'Turquoise' },
  { code: 'S41', hex: '#008080', name: 'Teal' },
  { code: 'S42', hex: '#6A5ACD', name: 'Slate Blue' },
  { code: 'S43', hex: '#483D8B', name: 'Dark Slate Blue' },
  { code: 'S44', hex: '#FFE4B5', name: 'Moccasin' },
  { code: 'S45', hex: '#DEB887', name: 'Burlywood' },
  { code: 'S46', hex: '#F4A460', name: 'Sandy Brown' },
  { code: 'S47', hex: '#BC8F8F', name: 'Rosy Brown' },
  { code: 'S48', hex: '#CD853F', name: 'Peru' },
  { code: 'S49', hex: '#8B4513', name: 'Saddle Brown' },
  { code: 'S50', hex: '#FFF8DC', name: 'Cornsilk' },
];

// Artkal M 系列颜色
export const ARTKAL_M_COLORS: ColorItem[] = [
  { code: 'MA1', hex: '#FFF6D4', name: 'Light Yellow' },
  { code: 'MA2', hex: '#F6F9E5', name: 'Pale Green Yellow' },
  { code: 'MA3', hex: '#FFFBAA', name: 'Light Lemon' },
  { code: 'MA4', hex: '#FFF0A0', name: 'Cream Yellow' },
  { code: 'MA5', hex: '#FFE066', name: 'Canary Yellow' },
  { code: 'MA6', hex: '#FFD700', name: 'Gold' },
  { code: 'MA7', hex: '#FFC107', name: 'Amber' },
  { code: 'MA8', hex: '#FFB300', name: 'Mustard' },
  { code: 'MA9', hex: '#FFA000', name: 'Dark Mustard' },
  { code: 'MA10', hex: '#FF8C00', name: 'Dark Orange' },
  { code: 'MB1', hex: '#D2E318', name: 'Lime' },
  { code: 'MB2', hex: '#79CD41', name: 'Light Green' },
  { code: 'MB3', hex: '#82D7A1', name: 'Mint Green' },
  { code: 'MB4', hex: '#3CB371', name: 'Sea Green' },
  { code: 'MB5', hex: '#228B22', name: 'Forest Green' },
  { code: 'MB6', hex: '#006400', name: 'Dark Green' },
  { code: 'MB7', hex: '#004D00', name: 'Deep Green' },
  { code: 'MB8', hex: '#228B22', name: 'Hunter Green' },
  { code: 'MB9', hex: '#32CD32', name: 'Lime Green' },
  { code: 'MB10', hex: '#90EE90', name: 'Light Green' },
  { code: 'MC1', hex: '#D5E3DE', name: 'Pale Cyan' },
  { code: 'MC2', hex: '#BBF1F4', name: 'Light Cyan' },
  { code: 'MC3', hex: '#73C0DF', name: 'Sky Blue' },
  { code: 'MC4', hex: '#5CACEE', name: 'Light Sky Blue' },
  { code: 'MC5', hex: '#4169E1', name: 'Royal Blue' },
  { code: 'MC6', hex: '#0000CD', name: 'Medium Blue' },
  { code: 'MC7', hex: '#00008B', name: 'Dark Blue' },
  { code: 'MC8', hex: '#000066', name: 'Navy' },
  { code: 'MC9', hex: '#1E90FF', name: 'Dodger Blue' },
  { code: 'MC10', hex: '#87CEEB', name: 'Sky Blue' },
  { code: 'MD1', hex: '#7292E2', name: 'Pastel Blue' },
  { code: 'MD2', hex: '#6E8CCC', name: 'Slate Blue' },
  { code: 'MD3', hex: '#13419A', name: 'Royal Blue' },
  { code: 'MD4', hex: '#6A5ACD', name: 'Slate Blue' },
  { code: 'MD5', hex: '#483D8B', name: 'Dark Slate Blue' },
  { code: 'MD6', hex: '#7B68EE', name: 'Medium Slate Blue' },
  { code: 'MD7', hex: '#9370DB', name: 'Medium Purple' },
  { code: 'MD8', hex: '#8A2BE2', name: 'Blue Violet' },
  { code: 'MD9', hex: '#9400D3', name: 'Dark Violet' },
  { code: 'MD10', hex: '#FF00FF', name: 'Magenta' },
  { code: 'ME1', hex: '#F2BFB8', name: 'Light Pink' },
  { code: 'ME2', hex: '#EF67B2', name: 'Pink' },
  { code: 'ME3', hex: '#D8729A', name: 'Dusty Rose' },
  { code: 'ME4', hex: '#DB7093', name: 'Pale Violet Red' },
  { code: 'ME5', hex: '#C71585', name: 'Medium Violet Red' },
  { code: 'ME6', hex: '#8B008B', name: 'Dark Magenta' },
  { code: 'ME7', hex: '#FF1493', name: 'Deep Pink' },
  { code: 'ME8', hex: '#FF69B4', name: 'Hot Pink' },
  { code: 'ME9', hex: '#FFB6C1', name: 'Light Pink' },
  { code: 'ME10', hex: '#FFC0CB', name: 'Pink' },
  { code: 'MF1', hex: '#B0353C', name: 'Red' },
  { code: 'MF2', hex: '#CB3531', name: 'Tall Poppy' },
  { code: 'MF3', hex: '#EB7B31', name: 'Orange Red' },
  { code: 'MF4', hex: '#FF4500', name: 'Orange Red' },
  { code: 'MF5', hex: '#DC143C', name: 'Crimson' },
  { code: 'MF6', hex: '#B22222', name: 'Fire Brick' },
  { code: 'MF7', hex: '#8B0000', name: 'Dark Red' },
  { code: 'MF8', hex: '#FF0000', name: 'Red' },
  { code: 'MF9', hex: '#CD5C5C', name: 'Indian Red' },
  { code: 'MF10', hex: '#F08080', name: 'Light Coral' },
  { code: 'MG1', hex: '#65463D', name: 'Brown' },
  { code: 'MG2', hex: '#895D49', name: 'Light Brown' },
  { code: 'MG3', hex: '#DCA384', name: 'Tan' },
  { code: 'MG4', hex: '#D2691E', name: 'Chocolate' },
  { code: 'MG5', hex: '#A0522D', name: 'Sienna' },
  { code: 'MG6', hex: '#8B4513', name: 'Saddle Brown' },
  { code: 'MG7', hex: '#A0522D', name: 'Sienna' },
  { code: 'MG8', hex: '#CD853F', name: 'Peru' },
  { code: 'MG9', hex: '#DEB887', name: 'Burlywood' },
  { code: 'MG10', hex: '#F5DEB3', name: 'Wheat' },
  { code: 'MH1', hex: '#EAEFEE', name: 'White' },
  { code: 'MH2', hex: '#909497', name: 'Gray' },
  { code: 'MH3', hex: '#323234', name: 'Black' },
  { code: 'MH4', hex: '#C0C0C0', name: 'Silver' },
  { code: 'MH5', hex: '#A9A9A9', name: 'Dark Gray' },
  { code: 'MH6', hex: '#808080', name: 'Gray' },
  { code: 'MH7', hex: '#696969', name: 'Dim Gray' },
  { code: 'MH8', hex: '#778899', name: 'Light Slate Gray' },
  { code: 'MH9', hex: '#708090', name: 'Slate Gray' },
  { code: 'MH10', hex: '#2F4F4F', name: 'Dark Slate Gray' },
  { code: 'MM1', hex: '#FFD700', name: 'Gold' },
  { code: 'MM2', hex: '#C0C0C0', name: 'Silver' },
  { code: 'MM3', hex: '#B76E79', name: 'Rose Gold' },
  { code: 'MM4', hex: '#E6E6FA', name: 'Lavender' },
  { code: 'MM5', hex: '#F0FFF0', name: 'Honeydew' },
  { code: 'MM6', hex: '#FFF0F5', name: 'Lavender Blush' },
  { code: 'MM7', hex: '#F5FFFA', name: 'Mint Cream' },
  { code: 'MM8', hex: '#FFEFD5', name: 'Papaya Whip' },
  { code: 'MM9', hex: '#FFE4E1', name: 'Misty Rose' },
  { code: 'MM10', hex: '#FDF5E6', name: 'Old Lace' },
];

// ========== 色号组定义 ==========

// Perler 223色完整版（设为默认）
export const PERLER_223_COLOR_GROUP: ColorGroup = {
  id: 'perler-223',
  name: 'Perler 223色完整版',
  brand: 'Perler',
  beadSize: '5mm',
  category: 'solid',
  colors: PERLER_223_COLORS,
};

// Perler 经典48色
export const PERLER_COLOR_GROUP: ColorGroup = {
  id: 'perler-5mm',
  name: 'Perler Classic (48色)',
  brand: 'Perler',
  beadSize: '5mm',
  category: 'solid',
  colors: PERLER_COLORS_5MM,
};

// Artkal S 系列
export const ARTKAL_S_COLOR_GROUP: ColorGroup = {
  id: 'artkal-s-5mm',
  name: 'Artkal S',
  brand: 'Artkal',
  beadSize: '5mm',
  category: 'solid',
  colors: ARTKAL_S_COLORS,
};

// Artkal M 系列
export const ARTKAL_M_COLOR_GROUP: ColorGroup = {
  id: 'artkal-m-26mm',
  name: 'Artkal M',
  brand: 'Artkal',
  beadSize: '2.6mm',
  category: 'solid',
  colors: ARTKAL_M_COLORS,
};

// 默认色号组 - 223色为默认
export const DEFAULT_COLOR_GROUPS: ColorGroup[] = [
  PERLER_223_COLOR_GROUP,
  PERLER_COLOR_GROUP,
  ARTKAL_S_COLOR_GROUP,
  ARTKAL_M_COLOR_GROUP,
];

// 画布尺寸 - 精简为3种主流尺寸
export const CANVAS_SIZES: { value: 29 | 52 | 72; label: string }[] = [
  { value: 29, label: '29×29 (迷你)' },
  { value: 52, label: '52×52 (中型)' },
  { value: 72, label: '72×72 (大型)' },
];