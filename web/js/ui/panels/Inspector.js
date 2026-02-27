import { BaseComponent } from '../components/BaseComponent.js';
import { SKILL_LABELS } from '../../config.js';

export class Inspector extends BaseComponent {
  _renderPawn(entity) {
    const skills = entity.skills || {};
    const taskHistory = entity.taskHistory || [];
    const inventory = entity.inventory || [];
    const currentTask = entity.task?.label || entity.currentTask?.label || '空闲';

    return `
      <div class="text-sm space-y-2">
        <div class="flex items-center justify-between">
          <div class="font-semibold text-game-text">${entity.name || '殖民者'}</div>
          <button type="button" class="text-xs px-2 py-1 rounded border border-game-border" data-action="close-pawn-panel">关闭</button>
        </div>
        <div class="text-xs text-game-text-dim">HP: ${Math.round(entity.hp || 0)} / ${Math.round(entity.maxHp || 100)}</div>
        <div class="text-xs text-game-text-dim">能量: ${Math.round(entity.energy || 0)} / ${Math.round(entity.maxEnergy || 100)}</div>
        <div class="text-xs text-game-text-dim">饥饿: ${Math.round(entity.hunger || 0)} / ${Math.round(entity.maxHunger || 100)}</div>
        <div class="text-xs text-game-text-dim">当前任务: ${currentTask}</div>

        <div>
          <div class="text-xs font-semibold text-game-text mb-1">能力</div>
          <div class="grid grid-cols-2 gap-1 text-xs text-game-text-dim">
            ${Object.entries(skills).map(([k, v]) => `<div>${SKILL_LABELS[k] || k}: ${v.toFixed ? v.toFixed(1) : v}</div>`).join('')}
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold text-game-text mb-1">道具</div>
          <div class="text-xs text-game-text-dim">${inventory.length ? inventory.map(i => `${i.name || i}`).join(' / ') : '无'}</div>
        </div>

        <div>
          <div class="text-xs font-semibold text-game-text mb-1">临时任务历史</div>
          <div class="text-xs text-game-text-dim space-y-1 max-h-24 overflow-y-auto">
            ${taskHistory.length ? taskHistory.slice(0, 6).map(h => `<div>${h.time || '--:--'} ${h.action}</div>`).join('') : '<div>暂无</div>'}
          </div>
        </div>
      </div>
    `;
  }

  _renderTile(entity) {
    const marks = entity.surfaceMarks || [];
    return `
      <div class="text-sm space-y-2">
        <div class="font-semibold text-game-text mb-1">地块 ${entity.position || ''}</div>
        <div class="text-xs text-game-text-dim">地形: ${entity.terrain || '未知'}</div>
        <div class="text-xs text-game-text-dim">山脉: ${entity.hasMountain ? '有' : '无'}</div>
        <div>
          <div class="text-xs font-semibold text-game-text mb-1">地表痕迹</div>
          <div class="text-xs text-game-text-dim space-y-1">
            ${marks.length ? marks.map(item => `<div>- ${item}</div>`).join('') : '<div>无</div>'}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const { entity = null } = this.props;

    if (entity && (entity.type === 'pawn' || entity.skills)) {
      return `
        <div class="absolute right-2.5 bottom-[120px] w-[340px] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="inspector" data-mode="pawn-detail">
          ${this._renderPawn(entity)}
        </div>
      `;
    }

    let content = '';
    if (!entity) {
      content = '<div class="text-sm text-game-text-dim">点击地块查看地形与地表信息</div>';
    } else if (entity.type === 'tile') {
      content = this._renderTile(entity);
    } else if (entity.type === 'berry') {
      content = `<div class="text-sm text-game-text-dim">浆果灌木：可收获 ${entity.berryCount || 0}</div>`;
    } else if (entity.type === 'ore') {
      content = `<div class="text-sm text-game-text-dim">矿脉节点：储量 ${entity.amount || 0}</div>`;
    } else if (entity.type === 'building' || entity.type === 'house') {
      content = `
        <div class="text-sm">
          <div class="font-semibold text-game-text mb-2">${entity.label || '建筑'}</div>
          <div class="text-xs text-game-text-dim space-y-1">
            <div>状态: ${entity.state || '未知'}</div>
            <div>耐久: ${entity.hp || 0}</div>
            <div>坐标: ${entity.position || 'N/A'}</div>
          </div>
        </div>
      `;
    } else {
      content = `<div class="text-sm text-game-text-dim">未知对象类型</div>`;
    }

    return `
      <div class="absolute right-2.5 top-[78px] w-[340px] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="inspector" data-mode="tile-inspector">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">检视器</h3>
        ${content}
      </div>
    `;
  }

  bindEvents() {
    super.bindEvents?.();
    const closeBtn = this.querySelector('[data-action="close-pawn-panel"]');
    if (closeBtn) {
      this.on(closeBtn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.onClosePawnPanel?.();
      });
    }
  }
}
