/**
 * Icon - SVG图标组件
 * 使用Lucide风格的路径数据
 */

// 图标路径定义
const ICON_PATHS = {
  // 建筑图标
  wall: 'M4 4h16v16H4z',
  door: 'M12 4v16 M4 12h16',
  bed: 'M4 8h16v8H4z M4 12h16 M8 12v-4h8v4',
  storage: 'M6 4h12v16H6z M6 8h12 M6 12h12 M6 16h12',
  workbench: 'M4 12h16v8H4z M4 6h3v6h3V6h3v6h3V6h3',
  medical_bed: 'M4 8h16v8H4z M8 8v-4c0-2 2-2 2-2s2 0 2 2v4',

  // 操作图标
  mine: 'M12 2L2 22h20L12 2z M12 6l-6 12h12L12 6z',
  harvest: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 6a6 6 0 110 12 6 6 0 010-12z',
  plant: 'M12 2v20 M4 12h16 M8 8l8 8 M16 8l-8 8',
  demolish: 'M4 4l16 16 M20 4L4 20',

  // UI图标
  pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
  play: 'M8 5v14l11-7z',
  clock: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 6v6l4 2',
  close: 'M18 6L6 18 M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 2L1 21h22L12 2z M12 9v4 M12 17h.01',

  // 默认图标
  square: 'M4 4h16v16H4z',
};

/**
 * 渲染SVG图标
 * @param {string} name - 图标名称
 * @param {string} className - CSS类名
 * @returns {string} SVG HTML字符串
 */
export function renderIcon(name, className = 'w-5 h-5') {
  const path = ICON_PATHS[name] || ICON_PATHS.square;

  return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/>
  </svg>`;
}

/**
 * Icon组件类
 */
export class Icon {
  constructor(name, props = {}) {
    this.name = name;
    this.props = props;
  }

  render() {
    const { className = 'w-5 h-5', ...attrs } = this.props;
    const path = ICON_PATHS[this.name] || ICON_PATHS.square;
    const attrString = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');

    return `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24" ${attrString}>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"/>
    </svg>`;
  }
}

// 导出图标列表供参考
export const AVAILABLE_ICONS = Object.keys(ICON_PATHS);
