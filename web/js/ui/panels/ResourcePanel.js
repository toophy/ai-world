import { BaseComponent } from '../components/BaseComponent.js';
import { Badge } from '../components/Badge.js';
import { renderIcon } from '../components/Icon.js';

/**
 * ResourcePanel - 资源面板组件
 * 显示游戏资源数量（木材、矿石、浆果、食物）
 */
export class ResourcePanel extends BaseComponent {
  constructor(props = {}) {
    super(props);
    this.badges = {}; // Track badge instances for efficient updates
  }

  componentDidMount() {
    // Mount Badge children when component is first rendered
    this.mountBadges();
  }

  mountBadges() {
    if (!this.element) return;

    const container = this.querySelector('[data-resource-container]');
    if (!container) return;

    // Clear any existing badges
    Object.values(this.badges).forEach(badge => badge.unmount?.());
    this.badges = {};

    // Get current resources
    const resources = this.props.resources || {};

    // Resource config with Icon names instead of emojis
    const resourceConfig = {
      wood: { icon: 'wood', variant: 'wood', label: '木材' },
      ore: { icon: 'ore', variant: 'ore', label: '矿石' },
      berry: { icon: 'harvest', variant: 'berry', label: '浆果' },
      food: { icon: 'food', variant: 'food', label: '食物' },
    };

    // Create and mount badges for each resource
    Object.entries(resourceConfig).forEach(([key, config]) => {
      const value = resources[key];

      // Hide resources with value <= 0
      if (value === undefined || value <= 0) return;

      const badge = new Badge({
        icon: renderIcon(config.icon, 'w-4 h-4'),
        label: config.label,
        value: Math.floor(value),
        variant: config.variant,
      });

      const badgeWrapper = document.createElement('div');
      badgeWrapper.className = 'resource-badge-wrapper';
      badgeWrapper.dataset.resource = key;
      container.appendChild(badgeWrapper);

      badge.mount(badgeWrapper);
      this.badges[key] = badge;
    });
  }

  /**
   * Custom update method for efficient updates
   * Only updates badge values, doesn't remount components
   */
  update(newProps) {
    const oldResources = this.props.resources || {};
    const newResources = newProps.resources || {};

    // Update props
    this.props = { ...this.props, ...newProps };

    // Check if we need to remount (resource types changed)
    const oldKeys = Object.keys(oldResources).filter(k => oldResources[k] > 0);
    const newKeys = Object.keys(newResources).filter(k => newResources[k] > 0);

    const keysChanged =
      oldKeys.length !== newKeys.length ||
      oldKeys.some(k => !newKeys.includes(k)) ||
      newKeys.some(k => !oldKeys.includes(k));

    if (keysChanged) {
      // Resource types changed, need to remount badges
      this.mountBadges();
    } else {
      // Only values changed, update badges efficiently
      Object.entries(this.badges).forEach(([key, badge]) => {
        const newValue = newResources[key];
        if (newValue !== undefined && badge.update) {
          badge.update({ value: Math.floor(newValue) });
        }
      });
    }

    this.componentDidUpdate();
  }

  render() {
    const { className = '' } = this.props;

    return `
      <div class="resource-panel ${className}" data-component="resource-panel">
        <div class="resource-panel-header">
          <h3 class="resource-panel-title">资源</h3>
        </div>
        <div class="resource-panel-content" data-resource-container>
          <!-- Badges will be mounted here by componentDidMount -->
        </div>
      </div>
    `;
  }

  componentWillUnmount() {
    // Clean up badge instances
    Object.values(this.badges).forEach(badge => {
      if (badge && typeof badge.unmount === 'function') {
        badge.unmount();
      }
    });
    this.badges = {};
  }
}
