# UI重构 - Tailwind + DaisyUI 组件化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-step.

**目标:** 将Frontier Colony游戏的UI从纯CSS迁移到Tailwind + DaisyUI，实现全量组件化架构，提升开发效率和视觉效果。

**架构:** 采用BaseComponent基类 + 模板字符串渲染的组件系统，保留纯JavaScript架构无需构建工具。所有面板封装为独立组件类，通过UIManager统一管理。

**技术栈:** Tailwind CSS (CDN), DaisyUI (CDN), 纯JavaScript ES6, Three.js (保持不变)

---

## 阶段1: 基础设施搭建 (第1周)

### Task 1: 更新 index.html 引入 Tailwind + DaisyUI

**Files:**
- Modify: `web/index.html:1-18`

**Step 1: 在 `<head>` 中添加 Tailwind 和 DaisyUI CDN**

在现有的 `<link rel="stylesheet" href="./styles.css" />` 之前添加：

```html
<!-- Tailwind + DaisyUI CDN -->
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.6.0/dist/full.min.css" rel="stylesheet" type="text/css" />
<script src="https://cdn.tailwindcss.com"></script>
```

**Step 2: 添加 Tailwind 配置脚本**

在 DaisyUI link 之后添加：

```html
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          game: {
            bg: '#0f141f',
            panel: 'rgba(23, 26, 33, 0.88)',
            border: 'rgba(132, 158, 210, 0.42)',
            'border-hover': 'rgba(121, 176, 255, 0.6)',
            text: '#dde8ff',
            'text-dim': '#b0bfd8',
            accent: {
              DEFAULT: '#79b0ff',
              hover: '#8fc0ff',
              glow: 'rgba(121, 176, 255, 0.3)',
            },
            danger: '#e86a7c',
            success: '#78d17a',
            warning: '#f5a623',
          },
          wood: '#d4a574',
          ore: '#a8b5c4',
          berry: '#c06c84',
          food: '#f4a261',
        },
        backdropBlur: {
          xs: '2px',
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'slide-in': 'slideIn 0.3s ease-out',
          'fade-out': 'fadeOut 0.3s ease-in',
          'bounce-subtle': 'bounceSubtle 0.3s ease-out',
        },
        keyframes: {
          slideIn: {
            '0%': { transform: 'translateX(100%)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
          fadeOut: {
            '0%': { transform: 'translateX(0)', opacity: '1' },
            '100%': { transform: 'translateX(100%)', opacity: '0' },
          },
          bounceSubtle: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-2px)' },
          },
        },
      },
    },
    daisyui: {
      themes: ['dark'],
      darkTheme: 'dark',
    },
  };
</script>
```

**Step 3: 验证页面加载正常**

打开 `web/index.html` 在浏览器中，检查控制台无错误。

**Step 4: 提交**

```bash
git add web/index.html
git commit -m "feat: add Tailwind CSS and DaisyUI CDN"
```

---

### Task 2: 创建 UI 组件目录结构

**Files:**
- Create: `web/js/ui/components/.gitkeep`
- Create: `web/js/ui/panels/.gitkeep`
- Create: `web/js/ui/modals/.gitkeep`

**Step 1: 创建目录结构**

运行命令：

```bash
mkdir -p web/js/ui/components
mkdir -p web/js/ui/panels
mkdir -p web/js/ui/modals
touch web/js/ui/components/.gitkeep
touch web/js/ui/panels/.gitkeep
touch web/js/ui/modals/.gitkeep
```

**Step 2: 验证目录创建**

运行: `ls -la web/js/ui/`

预期输出: 包含 components/, panels/, modals/ 三个目录

**Step 3: 提交**

```bash
git add web/js/ui/
git commit -m "feat: create UI component directory structure"
```

---

### Task 3: 实现 BaseComponent 基类

**Files:**
- Create: `web/js/ui/components/BaseComponent.js`

**Step 1: 创建 BaseComponent.js**

```javascript
/**
 * BaseComponent - 所有UI组件的基类
 * 提供生命周期、状态管理、事件绑定
 */
export class BaseComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.children = [];
    this._eventHandlers = [];
  }

  // ========== 生命周期钩子 ==========

  /** 挂载前调用 */
  componentWillMount() {}

  /** 挂载后调用 */
  componentDidMount() {}

  /** 更新前调用，返回false阻止更新 */
  shouldUpdate(newProps) { return true; }

  /** 卸载时调用 */
  componentWillUnmount() {}

  // ========== 渲染方法 ==========

  /**
   * 渲染组件HTML
   * 子类必须实现此方法
   * @returns {string|HTMLElement} HTML字符串或DOM元素
   */
  render() {
    throw new Error('BaseComponent.render() must be implemented by subclass');
  }

  /**
   * 将组件挂载到DOM
   * @param {HTMLElement} parent - 父容器
   * @returns {BaseComponent} 返回this以支持链式调用
   */
  mount(parent) {
    this.componentWillMount();
    const html = this.render();

    // 支持两种方式：字符串模板或直接创建元素
    if (typeof html === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      this.element = temp.firstChild;
    } else {
      this.element = html;
    }

    if (!this.element) {
      throw new Error('Render returned null or empty content');
    }

    parent.appendChild(this.element);
    this.bindEvents();
    this.componentDidMount();
    return this;
  }

  /**
   * 更新组件
   * @param {Object} newProps - 新的props
   */
  update(newProps) {
    if (!this.shouldUpdate(newProps)) return;

    const oldElement = this.element;
    if (!oldElement || !oldElement.parentNode) return;

    const parent = oldElement.parentNode;
    this.props = { ...this.props, ...newProps };

    // 清理旧事件
    this.unbindEvents();

    this.componentWillMount();
    const html = this.render();

    if (typeof html === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      this.element = temp.firstChild;
    } else {
      this.element = html;
    }

    if (this.element) {
      parent.replaceChild(this.element, oldElement);
      this.bindEvents();
    }
  }

  /**
   * 绑定DOM事件
   * 子类覆盖此方法绑定事件
   */
  bindEvents() {}

  /**
   * 解绑事件（内部使用）
   */
  unbindEvents() {
    this._eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._eventHandlers = [];
  }

  /**
   * 注册事件处理器（自动清理）
   */
  on(element, event, handler) {
    this._eventHandlers.push({ element, event, handler });
    element.addEventListener(event, handler);
  }

  /**
   * 设置状态并触发重新渲染
   * @param {Object} newState - 新的状态
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this.element?.parentNode) {
      this.update(this.props);
    }
  }

  /**
   * 卸载组件
   */
  unmount() {
    this.componentWillUnmount();
    this.unbindEvents();
    this.children.forEach(c => {
      if (c && typeof c.unmount === 'function') {
        c.unmount();
      }
    });
    this.children = [];
    this.element?.remove();
    this.element = null;
  }

  /**
   * 查找子元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement|null}
   */
  querySelector(selector) {
    return this.element?.querySelector(selector) || null;
  }

  /**
   * 查找所有匹配的子元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement[]}
   */
  querySelectorAll(selector) {
    return this.element?.querySelectorAll(selector) || [];
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/components/BaseComponent.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/components/BaseComponent.js
git commit -m "feat: implement BaseComponent base class"
```

---

### Task 4: 实现 Icon 组件

**Files:**
- Create: `web/js/ui/components/Icon.js`

**Step 1: 创建 Icon.js**

```javascript
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
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/components/Icon.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/components/Icon.js
git commit -m "feat: implement Icon component with SVG icons"
```

---

### Task 5: 实现 Badge 组件

**Files:**
- Create: `web/js/ui/components/Badge.js`

**Step 1: 创建 Badge.js**

```javascript
import { BaseComponent } from './BaseComponent.js';

/**
 * Badge - 徽章组件
 * 用于显示资源数量、状态标签等
 */
export class Badge extends BaseComponent {
  render() {
    const {
      variant = 'default',
      label,
      value,
      icon,
      size = 'md',
      className = '',
    } = this.props;

    // 基础类
    const baseClasses = 'inline-flex items-center gap-2 rounded-lg border text-sm font-medium backdrop-blur-xs transition-colors';

    // 变体样式
    const variants = {
      default: 'bg-black/20 border-game-border text-game-text hover:border-game-accent/60 hover:bg-game-accent/10',
      wood: 'bg-wood/10 border-wood/30 text-wood',
      ore: 'bg-ore/10 border-ore/30 text-ore',
      berry: 'bg-berry/10 border-berry/30 text-berry',
      food: 'bg-food/10 border-food/30 text-food',
    };

    // 尺寸样式
    const sizes = {
      sm: 'px-2 py-1 text-xs gap-1.5',
      md: 'px-3 py-1.5 text-sm gap-2',
      lg: 'px-4 py-2 text-base gap-2.5',
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    // 构建内容
    const iconHtml = icon ? `<span class="opacity-70 pointer-events-none">${icon}</span>` : '';
    const labelHtml = label ? `<span class="text-game-text-dim pointer-events-none">${label}</span>` : '';
    const valueHtml = value !== undefined ? `<span class="font-bold pointer-events-none">${value}</span>` : '';

    return `<div class="${classes}" data-component="badge">${iconHtml}${labelHtml}${valueHtml}</div>`;
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/components/Badge.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/components/Badge.js
git commit -m "feat: implement Badge component"
```

---

### Task 6: 实现 Button 组件

**Files:**
- Create: `web/js/ui/components/Button.js`

**Step 1: 创建 Button.js**

```javascript
import { BaseComponent } from './BaseComponent.js';
import { renderIcon } from './Icon.js';

/**
 * Button - 按钮组件
 * 支持多种变体、尺寸、状态
 */
export class Button extends BaseComponent {
  render() {
    const {
      variant = 'primary',
      size = 'md',
      icon,
      label,
      active = false,
      disabled = false,
      className = '',
    } = this.props;

    // 基础类
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 border select-none';

    // 变体样式
    const variants = {
      primary: 'bg-game-accent/20 border-game-accent/50 text-game-text hover:bg-game-accent/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-game-accent/20 active:scale-95 active:translate-y-0',
      secondary: 'bg-gray-700/40 border-gray-600/50 text-game-text hover:bg-gray-600/50 hover:-translate-y-0.5 active:scale-95',
      danger: 'bg-game-danger/20 border-game-danger/50 text-game-danger hover:bg-game-danger/30 hover:-translate-y-0.5 active:scale-95',
      ghost: 'bg-transparent border-transparent text-game-text-dim hover:bg-game-accent/10 hover:text-game-accent active:scale-95',
    };

    // 尺寸样式
    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[28px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[36px]',
      lg: 'px-5 py-2.5 text-base gap-2 min-h-[44px]',
    };

    // 状态样式
    const activeClasses = active
      ? 'bg-game-accent/30 border-game-accent shadow-lg shadow-game-accent/20'
      : '';

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed pointer-events-none hover:translate-y-0 active:scale-100'
      : 'cursor-pointer';

    // 纵向布局类（用于建造按钮）
    const layoutClasses = this.props.vertical ? 'flex-col' : '';

    const classes = [
      baseClasses,
      variants[variant],
      sizes[size],
      activeClasses,
      disabledClasses,
      layoutClasses,
      className
    ].filter(Boolean).join(' ');

    // 构建内容
    const iconHtml = icon ? `<span class="pointer-events-none flex-shrink-0">${renderIcon(icon)}</span>` : '';
    const labelHtml = label ? `<span class="pointer-events-none">${label}</span>` : '';

    return `<button class="${classes}" data-component="button" type="button">${iconHtml}${labelHtml}</button>`;
  }

  bindEvents() {
    if (this.props.onClick && !this.props.disabled) {
      this.on(this.element, 'click', (e) => {
        this.props.onClick(e);
      });
    }
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/components/Button.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/components/Button.js
git commit -m "feat: implement Button component"
```

---

### Task 7: 实现 ProgressBar 组件

**Files:**
- Create: `web/js/ui/components/ProgressBar.js`

**Step 1: 创建 ProgressBar.js**

```javascript
import { BaseComponent } from './BaseComponent.js';

/**
 * ProgressBar - 进度条组件
 * 用于显示任务进度、建造进度、血量等
 */
export class ProgressBar extends BaseComponent {
  render() {
    const {
      value = 0,        // 0-100
      max = 100,
      variant = 'default',
      size = 'md',
      showLabel = false,
      label,
      animated = true,
      className = '',
    } = this.props;

    const percent = Math.max(0, Math.min(100, (value / max) * 100));

    // 基础类
    const baseClasses = 'w-full overflow-hidden rounded-full';

    // 变体颜色
    const variants = {
      default: 'bg-game-accent',
      danger: 'bg-game-danger',
      success: 'bg-game-success',
      warning: 'bg-game-warning',
      hp: 'bg-game-danger',
      hunger: 'bg-wood',
      energy: 'bg-purple-500',
    };

    // 尺寸
    const sizes = {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
    };

    const barColor = variants[variant] || variants.default;
    const animationClass = animated ? 'transition-all duration-300 ease-out' : '';

    // 标签HTML
    let labelHtml = '';
    if (showLabel || label) {
      const labelText = label || `${Math.round(percent)}%`;
      labelHtml = `<span class="text-xs text-game-text-dim min-w-[3rem] text-right">${labelText}</span>`;
    }

    return `
      <div class="flex items-center gap-2 ${className}" data-component="progress">
        ${labelHtml ? labelHtml : ''}
        <div class="${baseClasses} ${sizes[size]} bg-black/30">
          <div class="${barColor} ${animationClass} h-full" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }

  // 高效更新：只更新宽度
  update(newProps) {
    if (!this.element) return;

    const { value = 0, max = 100 } = { ...this.props, ...newProps };
    const percent = Math.max(0, Math.min(100, (value / max) * 100));

    const bar = this.element.querySelector('[style*="width"]');
    if (bar) {
      bar.style.width = `${percent}%`;
    }

    // 更新标签
    if (newProps.showLabel || newProps.label) {
      const label = this.element.querySelector('span');
      if (label) {
        const labelText = newProps.label || `${Math.round(percent)}%`;
        label.textContent = labelText;
      }
    }

    this.props = { ...this.props, ...newProps };
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/components/ProgressBar.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/components/ProgressBar.js
git commit -m "feat: implement ProgressBar component"
```

---

## 阶段2: 面板组件实现 (第2周)

### Task 8: 实现 ResourcePanel 组件

**Files:**
- Create: `web/js/ui/panels/ResourcePanel.js`

**Step 1: 创建 ResourcePanel.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';
import { Badge } from '../components/Badge.js';

/**
 * ResourcePanel - 资源显示面板
 * 显示木材、矿石、浆果、食物等资源
 */
export class ResourcePanel extends BaseComponent {
  constructor(props) {
    super(props);
    this.badgeInstances = [];
  }

  render() {
    const { resources = {} } = this.props;

    // 资源配置
    const resourceConfig = {
      wood: { icon: '🪵', variant: 'wood', label: '木材' },
      ore: { icon: '⛏️', variant: 'ore', label: '矿石' },
      berry: { icon: '🫐', variant: 'berry', label: '浆果' },
      food: { icon: '🍖', variant: 'food', label: '食物' },
    };

    // 创建Badge组件实例
    this.badgeInstances = [];
    const badgeWrappers = [];

    Object.entries(resources).forEach(([key, value]) => {
      if (value <= 0) return;

      const config = resourceConfig[key] || { icon: '📦', variant: 'default', label: key };
      const badge = new Badge({
        icon: config.icon,
        label: config.label,
        value: Math.floor(value),
        variant: config.variant,
      });
      this.badgeInstances.push({ badge, key, value });
      badgeWrappers.push('<span data-resource-badge></span>');
    });

    return `
      <div class="flex gap-2 flex-wrap items-center" data-component="resource-panel">
        ${badgeWrappers.join('')}
      </div>
    `;
  }

  componentDidMount() {
    // 挂载Badge子组件
    const wrappers = this.querySelectorAll('[data-resource-badge]');
    wrappers.forEach((wrapper, i) => {
      if (this.badgeInstances[i]) {
        this.badgeInstances[i].badge.mount(wrapper);
      }
    });
  }

  // 高效更新：只更新变化的值
  update(newProps) {
    if (!newProps.resources) return;

    const oldResources = this.props.resources || {};
    const newResources = newProps.resources;

    // 检查是否有变化
    const hasChanged = Object.keys(newResources).some(
      key => (oldResources[key] || 0) !== (newResources[key] || 0)
    );

    if (!hasChanged) return;

    // 更新现有badge或创建新的
    const resourceConfig = {
      wood: { icon: '🪵', variant: 'wood', label: '木材' },
      ore: { icon: '⛏️', variant: 'ore', label: '矿石' },
      berry: { icon: '🫐', variant: 'berry', label: '浆果' },
      food: { icon: '🍖', variant: 'food', label: '食物' },
    };

    // 更新现有badge
    this.badgeInstances.forEach(({ badge, key }) => {
      const newValue = newResources[key] || 0;
      if (newValue > 0) {
        badge.update({ value: Math.floor(newValue) });
        if (badge.element) {
          badge.element.style.display = '';
        }
      } else {
        if (badge.element) {
          badge.element.style.display = 'none';
        }
      }
    });

    this.props = newProps;
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/panels/ResourcePanel.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/panels/ResourcePanel.js
git commit -m "feat: implement ResourcePanel component"
```

---

### Task 9: 实现 TopBar 组件

**Files:**
- Create: `web/js/ui/panels/TopBar.js`

**Step 1: 创建 TopBar.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';
import { ResourcePanel } from './ResourcePanel.js';
import { renderIcon } from '../components/Icon.js';

/**
 * TopBar - 顶部导航栏
 * 包含Logo、资源显示、游戏控制（暂停/速度）
 */
export class TopBar extends BaseComponent {
  constructor(props) {
    super(props);
    this.resourcePanel = null;
    this.pauseButton = null;
    this.speedButton = null;
  }

  render() {
    const {
      state,
      gameSpeed = 1,
      isPaused = false,
      onSpeedChange,
      onPause
    } = this.props;

    // 创建资源面板
    this.resourcePanel = new ResourcePanel({
      resources: state?.resources || {},
    });

    // 创建控制按钮
    this.pauseButton = new Button({
      variant: isPaused ? 'danger' : 'secondary',
      size: 'sm',
      icon: isPaused ? 'play' : 'pause',
      className: 'min-w-[40px]',
      onClick: () => onPause?.(),
    });

    this.speedButton = new Button({
      variant: 'secondary',
      size: 'sm',
      label: isPaused ? '⏸️' : `▶️ ${gameSpeed}x`,
      className: 'min-w-[60px]',
      onClick: () => {
        const speeds = [0, 1, 2, 3];
        const currentIndex = speeds.indexOf(gameSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        onSpeedChange?.(nextSpeed);
      },
    });

    return `
      <header class="absolute top-2.5 left-2.5 right-2.5 h-[58px] flex items-center gap-3.5 px-3.5 py-2 rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg" data-component="top-bar">
        <!-- Logo -->
        <div class="text-lg font-bold text-game-accent tracking-wider">Frontier Colony</div>

        <!-- 资源面板 -->
        <div class="flex gap-2 flex-wrap flex-1" data-section="resources"></div>

        <!-- 游戏控制 -->
        <div class="flex items-center gap-2.5 ml-auto">
          <span data-section="pause-btn"></span>
          <span class="text-base font-semibold text-game-text min-w-[50px] text-center" data-clock="06:00">06:00</span>
          <span class="text-sm text-game-text-dim">Day <span class="text-game-accent font-semibold" data-day="1">1</span></span>
          <span data-section="speed-btn"></span>
        </div>
      </header>
    `;
  }

  componentDidMount() {
    // 挂载资源面板
    const resourceContainer = this.querySelector('[data-section="resources"]');
    if (resourceContainer && this.resourcePanel) {
      this.resourcePanel.mount(resourceContainer);
    }

    // 挂载控制按钮
    const pauseBtnContainer = this.querySelector('[data-section="pause-btn"]');
    if (pauseBtnContainer && this.pauseButton) {
      this.pauseButton.mount(pauseBtnContainer);
    }

    const speedBtnContainer = this.querySelector('[data-section="speed-btn"]');
    if (speedBtnContainer && this.speedButton) {
      this.speedButton.mount(speedBtnContainer);
    }
  }

  update(newProps) {
    // 更新资源面板
    if (newProps.state?.resources && this.resourcePanel) {
      this.resourcePanel.update({ resources: newProps.state.resources });
    }

    // 更新控制按钮
    if (newProps.isPaused !== undefined && this.pauseButton) {
      this.pauseButton.update({
        variant: newProps.isPaused ? 'danger' : 'secondary',
        icon: newProps.isPaused ? 'play' : 'pause',
      });
    }

    if (newProps.gameSpeed !== undefined && this.speedButton) {
      const label = newProps.isPaused ? '⏸️' : `▶️ ${newProps.gameSpeed}x`;
      this.speedButton.update({ label });
    }

    // 更新时钟显示
    if (newProps.timeString) {
      const clockEl = this.querySelector('[data-clock]');
      if (clockEl) clockEl.textContent = newProps.timeString;
    }

    if (newProps.day !== undefined) {
      const dayEl = this.querySelector('[data-day]');
      if (dayEl) dayEl.textContent = newProps.day;
    }

    this.props = { ...this.props, ...newProps };
  }

  unmount() {
    if (this.resourcePanel) {
      this.resourcePanel.unmount();
    }
    if (this.pauseButton) {
      this.pauseButton.unmount();
    }
    if (this.speedButton) {
      this.speedButton.unmount();
    }
    super.unmount();
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/panels/TopBar.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/panels/TopBar.js
git commit -m "feat: implement TopBar component"
```

---

### Task 10: 实现 BuildPanel 组件

**Files:**
- Create: `web/js/ui/panels/BuildPanel.js`

**Step 1: 创建 BuildPanel.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';
import { BUILDING_TYPES } from '../../config.js';
import { renderIcon } from '../components/Icon.js';

/**
 * BuildPanel - 建造面板
 * 包含建筑按钮、资源操作、优先级选择
 */
export class BuildPanel extends BaseComponent {
  constructor(props) {
    super(props);
    this.activeBuilding = null;
    this.activeMode = null;
    this.buildingButtons = [];
    this.actionButtons = [];
    this.priorityButtons = [];
  }

  render() {
    const { priority = 5 } = this.props;

    // 建筑列表（排除house，使用专门的building类型）
    const buildingTypes = Object.entries(BUILDING_TYPES)
      .filter(([key]) => key !== 'house')
      .map(([key, config]) => ({
        key,
        label: config.label,
        icon: this.getBuildingIcon(key),
      }));

    // 创建建筑按钮
    this.buildingButtons = buildingTypes.map(({ key, label, icon }) =>
      new Button({
        variant: 'secondary',
        size: 'sm',
        icon,
        label,
        vertical: true,
        className: 'flex-col gap-1 p-2.5 min-w-[70px]',
        onClick: () => this.selectBuilding(key),
      })
    );

    // 操作按钮
    const actions = [
      { mode: 'mine', icon: 'mine', label: '采矿' },
      { mode: 'harvest', icon: 'harvest', label: '收获' },
      { mode: 'plant', icon: 'plant', label: '种植' },
      { mode: 'demolish', icon: 'demolish', label: '拆除' },
    ];

    this.actionButtons = actions.map(({ mode, icon, label }) =>
      new Button({
        variant: 'secondary',
        size: 'sm',
        icon,
        label,
        vertical: true,
        className: 'flex-col gap-1 p-2.5 min-w-[70px]',
        onClick: () => this.selectMode(mode),
      })
    );

    // 优先级按钮
    const priorities = [
      { value: 3, label: '低' },
      { value: 5, label: '中' },
      { value: 9, label: '高' },
    ];

    this.priorityButtons = priorities.map(({ value, label }) =>
      new Button({
        variant: priority === value ? 'primary' : 'secondary',
        size: 'sm',
        label,
        className: 'flex-1',
        onClick: () => this.setPriority(value),
      })
    );

    return `
      <div class="absolute top-[78px] right-2.5 w-[280px] max-h-[calc(100vh-200px)] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="build-panel">
        <!-- 建筑区 -->
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">建造</h3>
        <div class="grid grid-cols-2 gap-2 mb-4" data-section="buildings">
          ${this.buildingButtons.map(() => '<span data-component-wrapper></span>').join('')}
        </div>

        <!-- 资源操作 -->
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">资源</h3>
        <div class="grid grid-cols-2 gap-2 mb-4" data-section="actions">
          ${this.actionButtons.map(() => '<span data-component-wrapper></span>').join('')}
        </div>

        <!-- 优先级 -->
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">优先级</h3>
        <div class="flex gap-2" data-section="priority">
          ${this.priorityButtons.map(() => '<span data-component-wrapper></span>').join('')}
        </div>
      </div>
    `;
  }

  componentDidMount() {
    // 挂载建筑按钮
    const buildingWrappers = this.querySelectorAll('[data-section="buildings"] [data-component-wrapper]');
    buildingWrappers.forEach((wrapper, i) => {
      if (this.buildingButtons[i]) {
        this.buildingButtons[i].mount(wrapper);
      }
    });

    // 挂载操作按钮
    const actionWrappers = this.querySelectorAll('[data-section="actions"] [data-component-wrapper]');
    actionWrappers.forEach((wrapper, i) => {
      if (this.actionButtons[i]) {
        this.actionButtons[i].mount(wrapper);
      }
    });

    // 挂载优先级按钮
    const priorityWrappers = this.querySelectorAll('[data-section="priority"] [data-component-wrapper]');
    priorityWrappers.forEach((wrapper, i) => {
      if (this.priorityButtons[i]) {
        this.priorityButtons[i].mount(wrapper);
      }
    });
  }

  getBuildingIcon(type) {
    const iconMap = {
      wall: 'square',
      door: 'door',
      bed: 'bed',
      storage: 'storage',
      workbench: 'workbench',
      medical_bed: 'medical_bed',
    };
    return iconMap[type] || 'square';
  }

  selectBuilding(buildingType) {
    this.activeBuilding = buildingType;
    this.activeMode = null;

    // 更新按钮状态
    this.buildingButtons.forEach(btn => {
      const isActive = btn.props.label === BUILDING_TYPES[buildingType]?.label;
      btn.update({ variant: isActive ? 'primary' : 'secondary' });
    });
    this.actionButtons.forEach(btn => {
      btn.update({ variant: 'secondary' });
    });

    this.notifyModeChange('build', buildingType);
  }

  selectMode(mode) {
    this.activeMode = mode;
    this.activeBuilding = null;

    // 更新按钮状态
    this.actionButtons.forEach(btn => {
      const isActive = btn.props.label === this.getModeLabel(mode);
      btn.update({ variant: isActive ? 'danger' : 'secondary' });
    });
    this.buildingButtons.forEach(btn => {
      btn.update({ variant: 'secondary' });
    });

    this.notifyModeChange(mode);
  }

  getModeLabel(mode) {
    const labels = { mine: '采矿', harvest: '收获', plant: '种植', demolish: '拆除' };
    return labels[mode];
  }

  setPriority(value) {
    this.priorityButtons.forEach(btn => {
      btn.update({ variant: btn.props.label === this.getPriorityLabel(value) ? 'primary' : 'secondary' });
    });
    this.props.onPriorityChange?.(value);
  }

  getPriorityLabel(value) {
    const labels = { 3: '低', 5: '中', 9: '高' };
    return labels[value];
  }

  notifyModeChange(mode, buildingType = null) {
    this.props.onModeChange?.(mode, buildingType);
  }

  unmount() {
    [...this.buildingButtons, ...this.actionButtons, ...this.priorityButtons].forEach(btn => {
      if (btn) btn.unmount();
    });
    super.unmount();
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/panels/BuildPanel.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/panels/BuildPanel.js
git commit -m "feat: implement BuildPanel component"
```

---

### Task 11: 重构 UIManager 集成新组件

**Files:**
- Modify: `web/js/ui/UIManager.js:1-147`

**Step 1: 备份原有 UIManager**

运行: `cp web/js/ui/UIManager.js web/js/ui/UIManager.js.backup`

**Step 2: 完全重写 UIManager.js**

```javascript
import { TopBar } from './panels/TopBar.js';
import { BuildPanel } from './panels/BuildPanel.js';
import { ResourcePanel } from './panels/ResourcePanel.js';
// 其他面板将在后续任务中添加

/**
 * UIManager - UI组件管理器
 * 统一管理所有UI面板的渲染、更新、事件
 */
export class UIManager {
  constructor(state, taskSystem) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.root = null;
    this.panels = new Map();
    this.selectedPawn = null;
  }

  /**
   * 初始化UI系统
   */
  init() {
    this.root = document.getElementById('ui-root');
    if (!this.root) {
      // 如果ui-root不存在，创建它
      this.root = document.createElement('div');
      this.root.id = 'ui-root';
      this.root.className = 'absolute inset-0 pointer-events-none';
      document.getElementById('game-root')?.appendChild(this.root);
    }

    this.renderAll();
    this.bindEvents();
  }

  /**
   * 渲染所有面板
   */
  renderAll() {
    this.root.innerHTML = '';

    // 顶部栏
    const topBar = new TopBar({
      state: this.state,
      gameSpeed: this.state.gameSpeed,
      isPaused: false,
      onSpeedChange: (speed) => this.handleSpeedChange(speed),
      onPause: () => this.handlePause(),
    });
    topBar.mount(this.root);
    this.panels.set('topBar', topBar);

    // 建造面板
    const buildPanel = new BuildPanel({
      priority: 5,
      onModeChange: (mode, building) => this.handleModeChange(mode, building),
      onPriorityChange: (p) => this.handlePriorityChange(p),
    });
    buildPanel.mount(this.root);
    this.panels.set('buildPanel', buildPanel);
  }

  /**
   * 更新所有面板
   */
  updateAll() {
    // 更新顶部栏
    const topBar = this.panels.get('topBar');
    if (topBar) {
      topBar.update({
        state: this.state,
        timeString: this.getTimeString(),
        day: this.state.day,
      });
    }
  }

  /**
   * 获取格式化的时间字符串
   */
  getTimeString() {
    const hour = Math.floor(this.state.hour);
    return `${String(hour).padStart(2, '0')}:00`;
  }

  /**
   * 处理模式切换
   */
  handleModeChange(mode, building = null) {
    if (this.state.inputManager) {
      this.state.inputManager.setMode(mode, building);
    }
  }

  /**
   * 处理速度变化
   */
  handleSpeedChange(speed) {
    if (this.state.timeSystem) {
      this.state.timeSystem.setSpeed(speed);
    }
    this.state.gameSpeed = speed;
    this.updateAll();
  }

  /**
   * 处理暂停
   */
  handlePause() {
    if (this.state.timeSystem) {
      const paused = this.state.timeSystem.togglePause();
      const topBar = this.panels.get('topBar');
      if (topBar) {
        topBar.update({ isPaused: paused });
      }
    }
  }

  /**
   * 处理优先级变化
   */
  handlePriorityChange(priority) {
    if (this.state.inputManager?.modeHandler) {
      this.state.inputManager.modeHandler.setPriority(priority);
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      error: 'bg-game-danger/20 border-game-danger',
      success: 'bg-game-success/20 border-game-success',
      warning: 'bg-game-warning/20 border-game-warning',
      info: 'bg-game-accent/20 border-game-accent',
    };

    notification.className = `fixed top-20 right-5 px-4 py-3 rounded-lg border shadow-lg animate-slide-in pointer-events-auto ${colors[type] || colors.info}`;
    notification.innerHTML = `<span class="text-sm">${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 设置选中的殖民者
   */
  setSelectedPawn(pawn) {
    this.selectedPawn = pawn;
    // TODO: 实现PawnList的更新
  }

  /**
   * 绑定全局事件
   */
  bindEvents() {
    // 键盘快捷键在InputManager中处理
  }

  /**
   * 清理资源
   */
  destroy() {
    this.panels.forEach(panel => {
      if (panel && typeof panel.unmount === 'function') {
        panel.unmount();
      }
    });
    this.panels.clear();
    this.root.innerHTML = '';
  }
}
```

**Step 3: 更新 index.html 添加 ui-root**

在 `web/index.html` 中，找到 `<div id="game-root">`，在canvas后添加：

```html
<div id="ui-root" class="absolute inset-0 pointer-events-none"></div>
```

**Step 4: 测试游戏加载**

打开 `web/index.html`，检查：
- 控制台无错误
- 新的UI组件正确显示
- 资源面板显示资源
- 建造面板显示按钮

**Step 5: 提交**

```bash
git add web/js/ui/UIManager.js web/index.html
git commit -m "feat: refactor UIManager to use new component system"
```

---

## 阶段3: 其他面板组件 (第3周)

### Task 12: 实现 PawnList 组件

**Files:**
- Create: `web/js/ui/panels/PawnList.js`

**Step 1: 创建 PawnList.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';

/**
 * PawnList - 殖民者列表组件
 * 显示所有殖民者的状态和需求
 */
export class PawnList extends BaseComponent {
  constructor(props) {
    super(props);
    this.pawnCards = [];
  }

  render() {
    const { pawns = [] } = this.props;

    this.pawnCards = pawns.map(pawn => {
      const desires = pawn.desires || [];
      const desireIcons = desires.map(d => this.getDesireIcon(d.type)).join(' ');

      return {
        pawn,
        element: `
          <div class="pawn-card p-2 mb-1.5 rounded border border-game-border hover:border-game-accent hover:bg-game-accent/10 cursor-pointer transition-all" data-pawn-id="${pawn.id}">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-6 h-6 rounded-full border-2 border-game-border" style="background: #${pawn.color.toString(16).padStart(6, '0')}"></div>
              <span class="text-sm font-semibold text-game-text">${pawn.name}</span>
            </div>
            <div class="text-xs text-game-text-dim">${pawn.currentTask ? pawn.currentTask.label : '空闲'}</div>
            ${desireIcons ? `<div class="flex gap-1 mt-1">${desireIcons}</div>` : ''}
          </div>
        `,
      };
    });

    return `
      <div class="left-panel absolute top-[78px] left-2.5 w-[280px] bottom-[120px] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="pawn-list">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">殖民者</h3>
        <div class="flex flex-col gap-1" data-section="pawns">
          ${this.pawnCards.map(c => c.element).join('')}
        </div>
      </div>
    `;
  }

  componentDidMount() {
    // 绑定点击事件
    this.querySelectorAll('.pawn-card').forEach((card, index) => {
      this.on(card, 'click', () => {
        const pawn = this.pawnCards[index]?.pawn;
        if (pawn) {
          this.props.onPawnClick?.(pawn);
        }
      });
    });
  }

  getDesireIcon(type) {
    const icons = { eat: '🍖', sleep: '💤', heal: '💊' };
    return `<span class="text-xs">${icons[type] || '❓'}</span>`;
  }

  update(newProps) {
    if (!newProps.pawns) return;

    // 简单实现：完全重新渲染
    // TODO: 优化为增量更新
    this.props = { ...this.props, ...newProps };

    const container = this.querySelector('[data-section="pawns"]');
    if (container) {
      this.pawnCards = newProps.pawns.map(pawn => {
        const desires = pawn.desires || [];
        const desireIcons = desires.map(d => this.getDesireIcon(d.type)).join(' ');
        const selected = this.props.selectedPawn?.id === pawn.id;

        return {
          pawn,
          element: `
            <div class="pawn-card p-2 mb-1.5 rounded border ${selected ? 'border-game-accent bg-game-accent/15' : 'border-game-border'} hover:border-game-accent hover:bg-game-accent/10 cursor-pointer transition-all" data-pawn-id="${pawn.id}">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 rounded-full border-2 border-game-border" style="background: #${pawn.color.toString(16).padStart(6, '0')}"></div>
                <span class="text-sm font-semibold text-game-text">${pawn.name}</span>
              </div>
              <div class="text-xs text-game-text-dim">${pawn.currentTask ? pawn.currentTask.label : '空闲'}</div>
              ${desireIcons ? `<div class="flex gap-1 mt-1">${desireIcons}</div>` : ''}
            </div>
          `,
        };
      });

      container.innerHTML = this.pawnCards.map(c => c.element).join('');

      // 重新绑定事件
      this.querySelectorAll('.pawn-card').forEach((card, index) => {
        // 移除旧监听器（通过克隆节点）
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        this.on(newCard, 'click', () => {
          const pawn = this.pawnCards[index]?.pawn;
          if (pawn) {
            this.props.onPawnClick?.(pawn);
          }
        });
      });
    }
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/panels/PawnList.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/panels/PawnList.js
git commit -m "feat: implement PawnList component"
```

---

### Task 13: 实现 TaskList 组件

**Files:**
- Create: `web/js/ui/panels/TaskList.js`

**Step 1: 创建 TaskList.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';

/**
 * TaskList - 任务队列组件
 * 显示所有待处理的任务
 */
export class TaskList extends BaseComponent {
  render() {
    const { tasks = [] } = this.props;

    // 过滤并排序任务
    const activeTasks = tasks
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => b.priority - a.priority);

    const taskItems = activeTasks.map(task => {
      const statusColors = {
        queued: 'text-game-text-dim',
        assigned: 'text-game-accent',
        in_progress: 'text-game-success',
      };

      return `
        <div class="p-2 mb-1 rounded border border-game-border hover:bg-game-accent/5 transition-colors" data-task-id="${task.id}">
          <div class="flex justify-between items-center">
            <span class="text-sm text-game-text">${task.label || task.type}</span>
            <span class="text-xs text-game-text-dim">P${task.priority}</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-game-text-dim">(${task.x}, ${task.z})</span>
            <span class="text-xs ${statusColors[task.status] || ''}">${this.getStatusLabel(task.status)}</span>
          </div>
          ${task.progress !== undefined ? `
            <div class="mt-1.5 h-1 bg-black/30 rounded-full overflow-hidden">
              <div class="h-full bg-game-accent transition-all duration-300" style="width: ${task.progress}%"></div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="absolute top-[78px] left-2.5 w-[280px] top-[200px] max-h-[calc(100vh-320px)] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="task-list">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">任务队列</h3>
        <div class="flex flex-col gap-1">
          ${activeTasks.length > 0 ? taskItems : '<div class="text-sm text-game-text-dim text-center py-4">暂无任务</div>'}
        </div>
      </div>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      queued: '排队中',
      assigned: '已分配',
      in_progress: '进行中',
    };
    return labels[status] || status;
  }

  update(newProps) {
    if (!newProps.tasks) return;

    // 简单实现：完全重新渲染
    this.props = { ...this.props, ...newProps };

    // TODO: 优化为增量更新
    const parent = this.element?.parentNode;
    if (parent) {
      this.unbindEvents();
      const oldElement = this.element;
      this.componentWillMount();
      const html = this.render();
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      this.element = temp.firstChild;
      parent.replaceChild(this.element, oldElement);
      this.bindEvents();
      this.componentDidMount();
    }
  }
}
```

**Step 2: 验证语法**

运行: `node -c web/js/ui/panels/TaskList.js`

预期输出: 无错误

**Step 3: 提交**

```bash
git add web/js/ui/panels/TaskList.js
git commit -m "feat: implement TaskList component"
```

---

### Task 14: 实现 Inspector 和 EventLog 组件

**Files:**
- Create: `web/js/ui/panels/Inspector.js
- Create: `web/js/ui/panels/EventLog.js`

**Step 1: 创建 Inspector.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';

/**
 * Inspector - 检视器组件
 * 显示选中对象的详细信息
 */
export class Inspector extends BaseComponent {
  render() {
    const { entity = null } = this.props;

    let content = '';

    if (!entity) {
      content = '<div class="text-sm text-game-text-dim">点击地图单位查看详情</div>';
    } else if (entity instanceof Pawn) {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">${entity.name}</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div><span class="text-game-text-dim">HP:</span> ${entity.hp}/${entity.maxHp}</div>
            <div><span class="text-game-text-dim">饥饿:</span> ${Math.floor(entity.hunger)}</div>
            <div><span class="text-game-text-dim">能量:</span> ${Math.floor(entity.energy)}</div>
            <div><span class="text-game-text-dim">位置:</span> (${entity.pos.x}, ${entity.pos.z})</div>
          </div>
          <div class="mt-2 pt-2 border-t border-game-border">
            <div class="text-game-text-dim text-xs mb-1">技能</div>
            ${Object.entries(entity.skills || {}).map(([skill, level]) => `
              <div class="flex justify-between text-xs">
                <span class="text-game-text-dim">${this.getSkillLabel(skill)}:</span>
                <span class="text-game-accent">${level.toFixed(1)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (entity.type && BUILDING_TYPES[entity.type]) {
      const config = BUILDING_TYPES[entity.type];
      const stateLabel = entity.isComplete ? '完成' : `建造中 ${entity.progress?.toFixed(0) || 0}%`;

      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">${config.label}</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">状态:</span> ${stateLabel}</div>
            <div><span class="text-game-text-dim">耐久:</span> ${entity.hp}</div>
            <div><span class="text-game-text-dim">坐标:</span> (${entity.x}, ${entity.z})</div>
          </div>
        </div>
      `;
    } else {
      content = `<div class="text-sm text-game-text-dim">未知对象类型</div>`;
    }

    return `
      <div class="absolute top-[78px] right-[310px] w-[320px] max-h-[calc(100vh-200px)] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="inspector">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">检视器</h3>
        <div class="min-h-[96px]">${content}</div>
      </div>
    `;
  }

  getSkillLabel(skill) {
    const labels = {
      building: '建造',
      mining: '采矿',
      planting: '种植',
      hauling: '搬运',
      medicine: '医疗',
    };
    return labels[skill] || skill;
  }

  update(newProps) {
    this.props = { ...this.props, ...newProps };
    // 重新渲染
    const parent = this.element?.parentNode;
    if (parent) {
      this.unbindEvents();
      const oldElement = this.element;
      this.componentWillMount();
      const html = this.render();
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      this.element = temp.firstChild;
      parent.replaceChild(this.element, oldElement);
      this.bindEvents();
      this.componentDidMount();
    }
  }
}
```

**Step 2: 创建 EventLog.js**

```javascript
import { BaseComponent } from '../components/BaseComponent.js';

/**
 * EventLog - 事件日志组件
 * 显示游戏事件历史
 */
export class EventLog extends BaseComponent {
  render() {
    const { logs = [] } = this.props;

    const logItems = [...logs].reverse().map(log => `
      <div class="text-xs pl-2 border-l-2 border-game-accent/65 text-game-text log-line">${log}</div>
    `).join('');

    return `
      <div class="absolute top-[250px] right-[310px] w-[320px] max-h-[300px] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="event-log">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">日志</h3>
        <div class="flex flex-col-reverse gap-1 min-h-[140px]">
          ${logItems || '<div class="text-xs text-game-text-dim text-center py-4">暂无日志</div>'}
        </div>
      </div>
    `;
  }

  update(newProps) {
    if (!newProps.logs) return;

    // 只在有新日志时更新
    const oldLogs = this.props.logs || [];
    const newLogs = newProps.logs;

    if (newLogs.length === oldLogs.length) return;

    this.props = { ...this.props, ...newProps };

    const container = this.querySelector('.flex-col-reverse');
    if (container) {
      const logItems = [...newLogs].reverse().map(log => `
        <div class="text-xs pl-2 border-l-2 border-game-accent/65 text-game-text log-line">${log}</div>
      `).join('');

      container.innerHTML = logItems || '<div class="text-xs text-game-text-dim text-center py-4">暂无日志</div>';
    }
  }
}
```

**Step 3: 验证语法**

运行: `node -c web/js/ui/panels/Inspector.js && node -c web/js/ui/panels/EventLog.js`

预期输出: 无错误

**Step 4: 提交**

```bash
git add web/js/ui/panels/Inspector.js web/js/ui/panels/EventLog.js
git commit -m "feat: implement Inspector and EventLog components"
```

---

## 阶段4: 最终整合 (第4周)

### Task 15: 更新 UIManager 集成所有新组件

**Files:**
- Modify: `web/js/ui/UIManager.js`

**Step 1: 在 UIManager 顶部添加导入**

在现有导入后添加：

```javascript
import { PawnList } from './panels/PawnList.js';
import { TaskList } from './panels/TaskList.js';
import { Inspector } from './panels/Inspector.js';
import { EventLog } from './panels/EventLog.js';
```

**Step 2: 在 UIManager.renderAll() 中添加新面板**

在现有的 `this.panels.set('buildPanel', buildPanel);` 后添加：

```javascript
// 殖民者列表
const pawnList = new PawnList({
  pawns: this.state.pawns,
  selectedPawn: this.selectedPawn,
  onPawnClick: (pawn) => this.showPawnDetail(pawn),
});
pawnList.mount(this.root);
this.panels.set('pawnList', pawnList);

// 任务列表
const taskList = new TaskList({
  tasks: this.state.tasks || [],
});
taskList.mount(this.root);
this.panels.set('taskList', taskList);

// 检视器
const inspector = new Inspector({
  entity: this.state.selectedEntity,
});
inspector.mount(this.root);
this.panels.set('inspector', inspector);

// 事件日志
const eventLog = new EventLog({
  logs: this.state.logs || [],
});
eventLog.mount(this.root);
this.panels.set('eventLog', eventLog);
```

**Step 3: 在 UIManager.updateAll() 中添加更新逻辑**

在现有的更新逻辑后添加：

```javascript
// 更新殖民者列表
const pawnList = this.panels.get('pawnList');
if (pawnList) {
  pawnList.update({
    pawns: this.state.pawns,
    selectedPawn: this.selectedPawn,
  });
}

// 更新任务列表
const taskList = this.panels.get('taskList');
if (taskList) {
  const tasks = this.state.taskSystem?.tasks || this.state.tasks || [];
  taskList.update({ tasks });
}

// 更新检视器
const inspector = this.panels.get('inspector');
if (inspector && this.state.selectedEntity) {
  inspector.update({ entity: this.state.selectedEntity });
}

// 更新事件日志
const eventLog = this.panels.get('eventLog');
if (eventLog) {
  eventLog.update({ logs: this.state.logs });
}
```

**Step 4: 添加 showPawnDetail 方法**

在 UIManager 类中添加：

```javascript
/**
 * 显示殖民者详情
 */
showPawnDetail(pawn) {
  this.selectedPawn = pawn;

  // 更新选中状态
  const pawnList = this.panels.get('pawnList');
  if (pawnList) {
    pawnList.update({ selectedPawn: pawn });
  }

  // 更新检视器
  const inspector = this.panels.get('inspector');
  if (inspector) {
    inspector.update({ entity: pawn });
  }

  // TODO: 打开详情模态框
}
```

**Step 5: 测试所有组件**

打开 `web/index.html`，检查：
- 所有面板正确显示
- 资源更新正常
- 任务列表更新
- 殖民者列表可点击
- 事件日志显示

**Step 6: 提交**

```bash
git add web/js/ui/UIManager.js
git commit -m "feat: integrate all new UI components into UIManager"
```

---

### Task 16: 清理旧的HTML结构

**Files:**
- Modify: `web/index.html:19-134`

**Step 1: 删除旧的HTML面板元素**

在 `index.html` 中，删除以下部分（保留 canvas 和 ui-root）：
- `<header class="top-bar panel">` 整个块
- `<aside class="left-panel panel">` 整个块
- `<div id="task-counter">` 整个块
- `<aside class="right-panel panel">` 整个块
- `<div class="panel build-mode-panel">` 整个块
- `<footer class="bottom-bar panel">` 整个块
- `<div class="minimap panel">` 整个块

**Step 2: 简化 body 内容**

将 body 简化为：

```html
<body class="bg-game-bg text-game-text overflow-hidden">
  <div id="game-root" class="relative w-screen h-screen">
    <canvas id="game-canvas" class="absolute inset-0"></canvas>
    <div id="ui-root" class="absolute inset-0 pointer-events-none"></div>
  </div>
  <script type="module" src="./game.js"></script>
</body>
```

**Step 3: 删除旧的样式文件中的面板样式**

在 `web/styles.css` 中，删除所有 `.panel`、`.top-bar`、`.left-panel` 等面板相关样式，只保留必要的全局变量和重置样式。

**Step 4: 测试游戏正常运行**

打开 `web/index.html`，确保：
- 游戏画面正常显示
- 新UI组件正常工作
- 控制台无错误

**Step 5: 提交**

```bash
git add web/index.html web/styles.css
git commit -m "refactor: remove old HTML structure, use new component-based UI"
```

---

### Task 17: 优化 styles.css

**Files:**
- Modify: `web/styles.css:1-865`

**Step 1: 简化 CSS 为仅保留必要部分**

将整个文件替换为：

```css
/* Frontier Colony - Global Styles */
/* Tailwind CSS 处理大部分样式，这里只保留特殊需求 */

:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
  font-family: "Segoe UI", "PingFang SC", sans-serif;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#game-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 游戏面板基础样式（被Tailwind类取代，保留用于兼容） */
.panel {
  position: absolute;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  backdrop-filter: blur(2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* 选择框样式（游戏内使用） */
.selection-box {
  position: absolute;
  border: 2px dashed rgba(121, 176, 255, 0.7);
  background: rgba(121, 176, 255, 0.1);
  pointer-events: none;
  z-index: 1000;
}

/* 兼容性保留 */
.game-panel {
  background: rgba(23, 26, 33, 0.88);
  border: 1px solid rgba(132, 158, 210, 0.42);
}

/* 小地图canvas */
#minimap {
  border: 1px solid rgba(121, 176, 255, 0.35);
}
```

**Step 2: 提交**

```bash
git add web/styles.css
git commit -m "refactor: simplify styles.css for Tailwind compatibility"
```

---

### Task 18: 最终测试和修复

**Files:**
- Test: `web/index.html`

**Step 1: 全面功能测试**

在浏览器中打开 `web/index.html`，测试以下功能：

| 功能 | 测试点 | 预期结果 |
|------|--------|----------|
| 资源显示 | 初始资源正确显示 | ✅ |
| 建造按钮 | 点击按钮进入建造模式 | ✅ |
| 操作按钮 | 点击采矿/收获/种植 | ✅ |
| 优先级 | 切换优先级 | ✅ |
| 殖民者列表 | 显示所有殖民者 | ✅ |
| 任务列表 | 显示待处理任务 | ✅ |
| 事件日志 | 显示游戏事件 | ✅ |
| 暂停/速度 | 点击暂停和速度按钮 | ✅ |
| 键盘快捷键 | 空格暂停、F跟随、R旋转 | ✅ |

**Step 2: 检查控制台错误**

打开开发者工具，检查是否有：
- JavaScript错误
- 组件未定义
- 样式加载失败

**Step 3: 性能检查**

使用 Performance API 监控：
- UI更新耗时 < 16ms
- 内存使用稳定
- 无内存泄漏

**Step 4: 修复发现的问题**

记录并修复任何发现的问题。

**Step 5: 最终提交**

```bash
git add -A
git commit -m "fix: final polish and bug fixes for UI refactor"
```

---

## 阶段5: 文档和收尾

### Task 19: 更新项目文档

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 更新项目架构说明**

在 CLAUDE.md 中，更新架构描述：

```markdown
### Module Structure
- **lib.js** - Public API exports
- **web/** - Web游戏前端
  - **js/ui/** - UI组件系统 (Tailwind + DaisyUI)
    - **components/** - 基础UI组件 (Button, Badge, Icon, etc.)
    - **panels/** - 面板组件 (TopBar, BuildPanel, PawnList, etc.)
    - **UIManager.js** - UI组件管理器
  - **js/entities/** - 游戏实体 (Pawn, Building, Task)
  - **js/systems/** - 游戏系统
  - **index.html** - 入口文件 (使用Tailwind CDN)
```

**Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update architecture description for new UI system"
```

---

### Task 20: 创建UI组件使用指南

**Files:**
- Create: `web/js/ui/README.md`

**Step 1: 创建组件使用指南**

```markdown
# Frontier Colony UI 组件系统

## 概述

基于 BaseComponent 的轻量级组件系统，使用 Tailwind CSS 和 DaisyUI。

## 基础组件

### Button

```javascript
import { Button } from './components/Button.js';

const button = new Button({
  variant: 'primary',  // primary, secondary, danger, ghost
  size: 'md',          // sm, md, lg
  icon: 'wall',
  label: '墙壁',
  onClick: () => console.log('clicked'),
});
button.mount(container);
```

### Badge

```javascript
import { Badge } from './components/Badge.js';

const badge = new Badge({
  variant: 'wood',
  label: '木材',
  value: 100,
});
badge.mount(container);
```

### ProgressBar

```javascript
import { ProgressBar } from './components/ProgressBar.js';

const bar = new ProgressBar({
  value: 50,
  max: 100,
  variant: 'success',
  showLabel: true,
});
bar.mount(container);
```

## 面板组件

### TopBar

顶部导航栏，包含资源显示和游戏控制。

### BuildPanel

建造面板，包含建筑按钮和操作按钮。

### PawnList

殖民者列表，显示状态和需求。

## 创建新组件

继承 BaseComponent：

```javascript
import { BaseComponent } from './BaseComponent.js';

export class MyComponent extends BaseComponent {
  render() {
    return `<div class="p-4">Hello ${this.props.name}</div>`;
  }

  bindEvents() {
    this.on(this.element, 'click', () => {
      this.props.onClick?.();
    });
  }
}
```
```

**Step 2: 提交**

```bash
git add web/js/ui/README.md
git commit -m "docs: add UI component usage guide"
```

---

## 总结

完成此实施计划后，您将拥有：

1. ✅ 基于 Tailwind + DaisyUI 的现代化UI系统
2. ✅ 完整的组件化架构
3. ✅ 保持纯JavaScript无需构建工具
4. ✅ 延续深色主题和动画交互
5. ✅ 提升开发效率的组件复用

**预估完成时间:** 3-4周
**代码变更:** ~2000行新增，~800行删除
**风险:** 低（渐进式迁移，可随时回退）
