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
