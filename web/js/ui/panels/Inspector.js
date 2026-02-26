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
