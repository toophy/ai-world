import { BaseComponent } from './BaseComponent.js';
import { renderIcon } from './Icon.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Button - 按钮组件
 * 支持多种变体、尺寸、图标和状态
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
      vertical = false,
    } = this.props;

    // 基础类
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium backdrop-blur-xs transition-all border';

    // Focus styles for accessibility
    const focusClass = 'focus-visible:ring-2 focus-visible:ring-game-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none';

    // 变体样式
    const variants = {
      primary: 'bg-game-accent/20 border-game-accent text-game-accent hover:bg-game-accent/30 hover:border-game-accent',
      secondary: 'bg-black/20 border-game-border text-game-text hover:bg-game-accent/10 hover:border-game-accent/60',
      danger: 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 hover:border-danger/50',
      ghost: 'bg-transparent border-transparent text-game-text-dim hover:bg-game-accent/10 hover:text-game-text',
    };

    // 尺寸样式
    const sizes = {
      sm: 'px-2 py-1 text-xs gap-1.5',
      md: 'px-3 py-1.5 text-sm gap-2',
      lg: 'px-4 py-2 text-base gap-2.5',
    };

    // Fallback for invalid variant/size
    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    // 状态样式
    const activeClass = active ? 'bg-game-accent/30 border-game-accent ring-1 ring-game-accent/50' : '';
    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    const directionClass = vertical ? 'flex-col' : 'flex-row';

    const classes = [
      baseClasses,
      focusClass,
      variantClass,
      sizeClass,
      activeClass,
      disabledClass,
      directionClass,
      className
    ].filter(Boolean).join(' ');

    // 构建内容 - 逃逸所有动态值以防止XSS
    const iconHtml = icon ? `<span class="pointer-events-none">${renderIcon(icon)}</span>` : '';
    const labelHtml = label ? `<span class="pointer-events-none">${escapeHtml(label)}</span>` : '';

    // Build ARIA attributes for accessibility
    const ariaDisabled = disabled ? 'aria-disabled="true"' : '';
    const ariaPressed = active ? 'aria-pressed="true"' : '';
    const ariaLabel = (!label && icon) ? `aria-label="${variant} button"` : '';

    return `<button type="button" class="${classes}" data-component="button" ${ariaDisabled} ${ariaPressed} ${ariaLabel}>${iconHtml}${labelHtml}</button>`;
  }

  /**
   * 绑定点击事件
   */
  bindEvents() {
    const { onClick } = this.props;
    if (onClick && this.element) {
      this.on(this.element, 'click', (e) => {
        if (!this.props.disabled) {
          onClick(e);
        }
      });
    }
  }
}
