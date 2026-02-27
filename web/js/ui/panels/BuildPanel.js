import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';
import { BUILDING_TYPES } from '../../config.js';

/**
 * BuildPanel - 建造面板组件
 */
export class BuildPanel extends BaseComponent {
  constructor(props = {}) {
    super(props);
    this.state.priority = props.priority ?? 5;
    this.state.selectedBuilding = null;
    this.state.selectedMode = null;
    this.buildingButtons = {};
    this.actionButtons = {};
    this.priorityButtons = {};
  }

  componentDidMount() {
    this.mountBuildingButtons();
    this.mountActionButtons();
    this.mountPriorityButtons();
    this.updateBuildingInfoPanel();
  }

  mountBuildingButtons() {
    if (!this.element) return;
    const container = this.element.querySelector('[data-section="building-buttons"]');
    if (!container) return;

    const buildings = [
      { type: 'wall', label: '墙壁' },
      { type: 'door', label: '门' },
      { type: 'bed', label: '床铺' },
      { type: 'storage', label: '储物箱' },
      { type: 'workbench', label: '工作台' },
      { type: 'medical_bed', label: '医务床' },
    ];

    buildings.forEach(building => {
      const button = new Button({
        variant: 'secondary',
        size: 'md',
        icon: building.type,
        label: building.label,
        vertical: true,
        active: this.state.selectedBuilding === building.type,
        onClick: () => this.selectBuilding(building.type),
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'building-button-wrapper';
      wrapper.dataset.building = building.type;
      container.appendChild(wrapper);

      button.mount(wrapper);
      this.buildingButtons[building.type] = button;
    });
  }

  mountActionButtons() {
    if (!this.element) return;
    const container = this.element.querySelector('[data-section="action-buttons"]');
    if (!container) return;

    const actions = [
      { mode: 'mine', label: '开采', icon: 'mine' },
      { mode: 'harvest', label: '收获', icon: 'harvest' },
      { mode: 'demolish', label: '拆除', icon: 'demolish' },
    ];

    actions.forEach(action => {
      const button = new Button({
        variant: 'secondary',
        size: 'md',
        icon: action.icon,
        label: action.label,
        vertical: true,
        active: this.state.selectedMode === action.mode,
        onClick: () => this.selectMode(action.mode),
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'action-button-wrapper';
      wrapper.dataset.action = action.mode;
      container.appendChild(wrapper);

      button.mount(wrapper);
      this.actionButtons[action.mode] = button;
    });
  }

  mountPriorityButtons() {
    if (!this.element) return;
    const container = this.element.querySelector('[data-section="priority-buttons"]');
    if (!container) return;

    const priorities = [
      { value: 3, label: '低' },
      { value: 5, label: '中' },
      { value: 7, label: '高' },
    ];

    priorities.forEach(priority => {
      const button = new Button({
        variant: this.state.priority === priority.value ? 'primary' : 'ghost',
        size: 'sm',
        label: priority.label,
        active: this.state.priority === priority.value,
        onClick: () => this.setPriority(priority.value),
      });

      const wrapper = document.createElement('div');
      wrapper.className = 'priority-button-wrapper';
      wrapper.dataset.priority = priority.value;
      container.appendChild(wrapper);

      button.mount(wrapper);
      this.priorityButtons[priority.value] = button;
    });
  }

  selectBuilding(buildingType) {
    this.state.selectedMode = null;
    this.state.selectedBuilding = buildingType;
    this.updateBuildingButtons();
    this.updateActionButtons();
    this.updateBuildingInfoPanel();

    if (this.props.onModeChange) {
      this.props.onModeChange('build', buildingType);
    }
  }

  selectMode(mode) {
    this.state.selectedBuilding = null;
    this.state.selectedMode = mode;
    this.updateBuildingButtons();
    this.updateActionButtons();
    this.updateBuildingInfoPanel();

    if (this.props.onModeChange) {
      this.props.onModeChange(mode, null);
    }
  }

  setPriority(priority) {
    this.state.priority = priority;
    this.updatePriorityButtons();

    if (this.props.onPriorityChange) {
      this.props.onPriorityChange(priority);
    }
  }

  updateBuildingButtons() {
    Object.entries(this.buildingButtons).forEach(([type, button]) => {
      button.update({ active: this.state.selectedBuilding === type });
    });
  }

  updateActionButtons() {
    Object.entries(this.actionButtons).forEach(([mode, button]) => {
      button.update({ active: this.state.selectedMode === mode });
    });
  }

  updatePriorityButtons() {
    Object.entries(this.priorityButtons).forEach(([value, button]) => {
      const isActive = parseInt(value) === this.state.priority;
      button.update({
        active: isActive,
        variant: isActive ? 'primary' : 'ghost',
      });
    });
  }

  updateBuildingInfoPanel() {
    const container = this.element?.querySelector('[data-section="building-info"]');
    if (!container) return;

    const type = this.state.selectedBuilding;
    if (!type || !BUILDING_TYPES[type]) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    const cfg = BUILDING_TYPES[type];
    const resText = Object.entries(cfg.resources || {})
      .map(([k, v]) => `${k}:${v}`)
      .join(' / ') || '无';
    const rules = cfg.placementRules || {};
    const terrain = (rules.allowedTerrain || []).join(', ') || '任意';

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="text-xs text-game-text-dim border border-game-border rounded-md p-2 bg-black/20">
        <div class="text-sm text-game-text font-semibold mb-1">${cfg.label}</div>
        <div>尺寸: ${cfg.width} x ${cfg.height}</div>
        <div>资源: ${resText}</div>
        <div>可放置地形: ${terrain}</div>
        <div>需求邻居数: ${rules.minNeighbors ?? 0}</div>
      </div>
    `;
  }

  render() {
    const { className = '' } = this.props;

    return `
      <div class="build-panel ${className}" data-component="build-panel">
        <div class="build-panel-header">
          <h3 class="build-panel-title">建造</h3>
        </div>

        <div class="build-panel-section">
          <div class="build-panel-section-label">建筑</div>
          <div class="build-panel-buttons" data-section="building-buttons"></div>
          <div class="mt-2 hidden" data-section="building-info"></div>
        </div>

        <div class="build-panel-section">
          <div class="build-panel-section-label">操作</div>
          <div class="build-panel-buttons" data-section="action-buttons"></div>
        </div>

        <div class="build-panel-section">
          <div class="build-panel-section-label">优先级</div>
          <div class="build-panel-priority" data-section="priority-buttons"></div>
        </div>
      </div>
    `;
  }

  unmount() {
    Object.values(this.buildingButtons).forEach(button => button.unmount?.());
    this.buildingButtons = {};
    Object.values(this.actionButtons).forEach(button => button.unmount?.());
    this.actionButtons = {};
    Object.values(this.priorityButtons).forEach(button => button.unmount?.());
    this.priorityButtons = {};
    super.unmount();
  }
}
