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
    } else if (entity.type === 'pawn') {
      // 新的数据格式 (来自 inspectAt)
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">殖民者</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">名称:</span> ${entity.name || '未知'}</div>
            <div><span class="text-game-text-dim">HP:</span> ${entity.hp || 'N/A'}</div>
            <div><span class="text-game-text-dim">饥饿:</span> ${entity.hunger || 'N/A'}</div>
            <div><span class="text-game-text-dim">位置:</span> ${entity.position || 'N/A'}</div>
          </div>
        </div>
      `;
    } else if (entity.type === 'berry') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">浆果灌木</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">成熟度:</span> ${entity.growth || 0}%</div>
            <div><span class="text-game-text-dim">可收获:</span> ${entity.berryCount || 0}</div>
          </div>
        </div>
      `;
    } else if (entity.type === 'ore') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">矿脉节点</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">储量:</span> ${entity.amount || 0}</div>
          </div>
        </div>
      `;
    } else if (entity.type === 'house') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">房屋</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">耐久:</span> ${entity.hp || 0}</div>
            <div><span class="text-game-text-dim">坐标:</span> ${entity.position || 'N/A'}</div>
          </div>
        </div>
      `;
    } else if (entity.type === 'building') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">${entity.label || '建筑'}</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">状态:</span> ${entity.state || '未知'}</div>
            <div><span class="text-game-text-dim">耐久:</span> ${entity.hp || 0}</div>
            <div><span class="text-game-text-dim">坐标:</span> ${entity.position || 'N/A'}</div>
          </div>
        </div>
      `;
    } else if (entity.type === 'tile') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">地块</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div><span class="text-game-text-dim">地形:</span> ${entity.terrain || '未知'}</div>
            <div><span class="text-game-text-dim">坐标:</span> ${entity.position || 'N/A'}</div>
          </div>
        </div>
      `;
    } else {
      // 旧格式 (直接的 Pawn 或 Building 对象)
      content = `<div class="text-sm text-game-text-dim">未知对象类型: ${JSON.stringify(entity).substring(0, 50)}</div>`;
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
