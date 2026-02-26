// ProgressBar component for displaying progress bars
// Extends BaseComponent for consistent lifecycle management

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export class ProgressBar extends BaseComponent {
  static defaultProps = {
    value: 0,
    max: 100,
    variant: 'default',
    size: 'md',
    showLabel: true,
    label: null,
    animated: false,
    className: ''
  };

  constructor(container, props) {
    super(container, props);
    this.value = Math.max(0, Math.min(this.props.value, this.props.max));
    this.max = this.props.max;
  }

  render() {
    const percent = (this.value / this.max) * 100;
    const { variant, size, showLabel, label, animated, className } = this.props;

    const variants = {
      default: 'bg-blue-500',
      danger: 'bg-red-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      hp: 'bg-red-600',
      hunger: 'bg-orange-500',
      energy: 'bg-yellow-400'
    };

    const barColor = variants[variant] || variants.default;

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const barHeight = sizes[size] || sizes.md;

    const animationClass = animated ? 'transition-all duration-300 ease-out' : '';

    let labelHtml = '';
    if (showLabel) {
      const labelText = label || `${Math.round(percent)}%`;
      labelHtml = `<span class="text-xs text-game-text-dim min-w-[3rem] text-right">${escapeHtml(labelText)}</span>`;
    }

    const html = `
      <div class="flex items-center gap-2 ${className}">
        <div class="flex-1 bg-game-bg-muted rounded-full overflow-hidden ${barHeight}">
          <div class="progress-bar-fill ${barColor} ${animationClass}" style="width: ${percent}%"></div>
        </div>
        ${labelHtml}
      </div>
    `;

    this.container.innerHTML = html;
  }

  // Custom update method for efficient width-only updates
  update(newValue) {
    this.value = Math.max(0, Math.min(newValue, this.max));
    const percent = (this.value / this.max) * 100;

    const fillElement = this.container.querySelector('.progress-bar-fill');
    if (fillElement) {
      fillElement.style.width = `${percent}%`;
    }

    // Update label if present
    if (this.props.showLabel) {
      const labelElement = this.container.querySelector('span.text-xs');
      if (labelElement) {
        const labelText = this.props.label || `${Math.round(percent)}%`;
        labelElement.textContent = labelText;
      }
    }
  }

  setValue(value) {
    this.update(value);
  }

  getValue() {
    return this.value;
  }
}
