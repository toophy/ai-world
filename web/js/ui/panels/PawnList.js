import { BaseComponent } from '../components/BaseComponent.js';

export class PawnList extends BaseComponent {
  constructor(props) {
    super(props);
    this.pawnCards = [];
  }

  _pawnItem(pawn) {
    const selected = this.props.selectedPawn?.id === pawn.id;
    const hpPct = Math.max(0, Math.min(100, ((pawn.hp || 0) / (pawn.maxHp || 100)) * 100));
    return `
      <button class="pawn-chip ${selected ? 'selected' : ''}" data-pawn-id="${pawn.id}" type="button">
        <span class="avatar" style="background: #${pawn.color.toString(16).padStart(6, '0')}"></span>
        <span class="name">${pawn.name}</span>
        <span class="hpbar"><span class="fill" style="width:${hpPct}%"></span></span>
      </button>
    `;
  }

  render() {
    const { pawns = [] } = this.props;
    this.pawnCards = pawns;

    return `
      <div class="pawn-strip" data-component="pawn-list">
        <div class="pawn-strip-inner" data-section="pawns">
          ${pawns.map(p => this._pawnItem(p)).join('')}
        </div>
      </div>
    `;
  }

  componentDidMount() {
    this.querySelectorAll('.pawn-chip').forEach((card) => {
      this.on(card, 'click', () => {
        const pawn = this.pawnCards.find(p => p.id === card.dataset.pawnId);
        if (pawn) this.props.onPawnClick?.(pawn);
      });
    });
  }

  update(newProps) {
    if (!newProps.pawns) return;
    this.props = { ...this.props, ...newProps };
    const container = this.querySelector('[data-section="pawns"]');
    if (!container) return;

    this.pawnCards = newProps.pawns;
    container.innerHTML = this.pawnCards.map(p => this._pawnItem(p)).join('');

    this.querySelectorAll('.pawn-chip').forEach((card) => {
      this.on(card, 'click', () => {
        const pawn = this.pawnCards.find(p => p.id === card.dataset.pawnId);
        if (pawn) this.props.onPawnClick?.(pawn);
      });
    });
  }
}
