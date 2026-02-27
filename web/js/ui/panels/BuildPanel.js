import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';
import { renderIcon } from '../components/Icon.js';

/**
 * BuildPanel - 建造面板组件
 * 显示建筑和操作按钮（建造、采矿、收获、种植、拆除）
 * 以及优先级设置
 */
export class BuildPanel extends BaseComponent {
  constructor(props = {}) {
    super(props);
    // 默认优先级为5
    this.state.priority = props.priority ?? 5;
    // 当前选中的建筑类型
    this.state.selectedBuilding = null;
    // 当前选中的操作模式
    this.state.selectedMode = null;
    // 按钮实例
    this.buildingButtons = {};
    this.actionButtons = {};
    this.priorityButtons = {};
  }

  componentDidMount() {
    // 挂载建筑按钮
    this.mountBuildingButtons();
    // 挂载操作按钮
    this.mountActionButtons();
    // 挂载优先级按钮
    this.mountPriorityButtons();
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
      { mode: 'plant', label: '种植', icon: 'plant' },
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

  /**
   * 选择建筑类型
   */
  selectBuilding(buildingType) {
    // 清除操作模式选择
    this.state.selectedMode = null;
    this.state.selectedBuilding = buildingType;

    // 更新按钮状态
    this.updateBuildingButtons();
    this.updateActionButtons();

    // 触发回调
    if (this.props.onModeChange) {
      this.props.onModeChange('build', buildingType);
    }
  }

  /**
   * 选择操作模式
   */
  selectMode(mode) {
    // 清除建筑选择
    this.state.selectedBuilding = null;
    this.state.selectedMode = mode;

    // 更新按钮状态
    this.updateBuildingButtons();
    this.updateActionButtons();

    // 触发回调
    if (this.props.onModeChange) {
      this.props.onModeChange(mode, null);
    }
  }

  /**
   * 设置优先级
   */
  setPriority(priority) {
    this.state.priority = priority;

    // 更新按钮状态
    this.updatePriorityButtons();

    // 触发回调
    if (this.props.onPriorityChange) {
      this.props.onPriorityChange(priority);
    }
  }

  /**
   * 更新建筑按钮状态
   */
  updateBuildingButtons() {
    Object.entries(this.buildingButtons).forEach(([type, button]) => {
      button.update({ active: this.state.selectedBuilding === type });
    });
  }

  /**
   * 更新操作按钮状态
   */
  updateActionButtons() {
    Object.entries(this.actionButtons).forEach(([mode, button]) => {
      button.update({ active: this.state.selectedMode === mode });
    });
  }

  /**
   * 更新优先级按钮状态
   */
  updatePriorityButtons() {
    Object.entries(this.priorityButtons).forEach(([value, button]) => {
      const isActive = parseInt(value) === this.state.priority;
      button.update({
        active: isActive,
        variant: isActive ? 'primary' : 'ghost',
      });
    });
  }

  /**
   * 获取建筑图标
   */
  getBuildingIcon(buildingType) {
    return renderIcon(buildingType, 'w-5 h-5');
  }

  /**
   * 获取模式标签
   */
  getModeLabel(mode) {
    const labels = {
      mine: '开采',
      harvest: '收获',
      plant: '种植',
      demolish: '拆除',
    };
    return labels[mode] || mode;
  }

  /**
   * 获取优先级标签
   */
  getPriorityLabel(priority) {
    if (priority <= 3) return '低';
    if (priority >= 7) return '高';
    return '中';
  }

  render() {
    const { className = '' } = this.props;

    return `
      <div class="build-panel ${className}" data-component="build-panel">
        <div class="build-panel-header">
          <h3 class="build-panel-title">建造</h3>
        </div>

        <!-- 建筑按钮 -->
        <div class="build-panel-section">
          <div class="build-panel-section-label">建筑</div>
          <div class="build-panel-buttons" data-section="building-buttons">
            <!-- 建筑按钮将在这里挂载 -->
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="build-panel-section">
          <div class="build-panel-section-label">操作</div>
          <div class="build-panel-buttons" data-section="action-buttons">
            <!-- 操作按钮将在这里挂载 -->
          </div>
        </div>

        <!-- 优先级 -->
        <div class="build-panel-section">
          <div class="build-panel-section-label">优先级</div>
          <div class="build-panel-priority" data-section="priority-buttons">
            <!-- 优先级按钮将在这里挂载 -->
          </div>
        </div>
      </div>
    `;
  }

  unmount() {
    // 清理所有按钮
    Object.values(this.buildingButtons).forEach(button => {
      if (button && typeof button.unmount === 'function') {
        button.unmount();
      }
    });
    this.buildingButtons = {};

    Object.values(this.actionButtons).forEach(button => {
      if (button && typeof button.unmount === 'function') {
        button.unmount();
      }
    });
    this.actionButtons = {};

    Object.values(this.priorityButtons).forEach(button => {
      if (button && typeof button.unmount === 'function') {
        button.unmount();
      }
    });
    this.priorityButtons = {};

    super.unmount();
  }
}
