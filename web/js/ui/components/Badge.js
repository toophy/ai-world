import { BaseComponent } from './BaseComponent.js';

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

    // Fallback for invalid variant/size
    const variantClass = variants[variant] || variants.default;
    const sizeClass = sizes[size] || sizes.md;
    const classes = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();

    // 构建内容 - 逃逸所有动态值以防止XSS
    const iconHtml = icon ? `<span class="opacity-70 pointer-events-none">${escapeHtml(icon)}</span>` : '';
    const labelHtml = label ? `<span class="text-game-text-dim pointer-events-none">${escapeHtml(label)}</span>` : '';
    const valueHtml = value !== undefined ? `<span class="font-bold pointer-events-none">${escapeHtml(String(value))}</span>` : '';

    return `<div class="${classes}" data-component="badge">${iconHtml}${labelHtml}${valueHtml}</div>`;
  }
}
