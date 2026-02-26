import { TaskCounterPanel } from './panels/TaskCounterPanel.js';
import { ColonistDetailModal } from './modals/ColonistDetailModal.js';

export class UIManager {
  constructor(state, taskSystem) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.taskCounterPanel = new TaskCounterPanel(taskSystem);
    this.colonistDetailModal = null;
    this.selectedPawn = null;
  }

  init() {
    this.taskCounterPanel.init();
    this.setupPawnClickHandlers();
    this.updateAll();
  }

  setupPawnClickHandlers() {
    // Click on pawn mesh to show detail modal
    this.state.pawns.forEach(pawn => {
      if (pawn.mesh) {
        pawn.mesh.userData.pawnId = pawn.id;
      }
    });
  }

  updateAll() {
    this.taskCounterPanel.render();
    this.updateResourcePanel();
    this.updatePawnList();
  }

  updateResourcePanel() {
    const resourcePanel = document.getElementById('resources');
    if (!resourcePanel) return;

    const resources = this.state.resources || {};
    resourcePanel.innerHTML = Object.entries(resources).map(([name, amount]) => `
      <div class="resource">
        <span class="resource-name">${this.getResourceLabel(name)}</span>
        <span class="resource-amount">${Math.floor(amount)}</span>
      </div>
    `).join('');
  }

  getResourceLabel(name) {
    const labels = { wood: '木材', ore: '矿石', berry: '浆果', food: '食物' };
    return labels[name] || name;
  }

  updatePawnList() {
    const pawnList = document.getElementById('pawn-list');
    if (!pawnList) return;

    // Remove existing event listener if any (stored on element)
    if (this._pawnListHandler) {
      pawnList.removeEventListener('click', this._pawnListHandler);
    }

    pawnList.innerHTML = this.state.pawns.map(pawn => `
      <div class="pawn-card ${this.selectedPawn?.id === pawn.id ? 'selected' : ''}" data-pawn-id="${pawn.id}">
        <div class="pawn-card-header">
          <div class="pawn-avatar-small" style="background: #${pawn.color.toString(16).padStart(6, '0')}"></div>
          <span class="pawn-name">${pawn.name}</span>
        </div>
        <div class="pawn-status">${pawn.currentTask ? pawn.currentTask.label : '空闲'}</div>
        ${pawn.desires.length > 0 ? `
          <div class="pawn-desires">
            ${pawn.desires.map(d => `<span class="desire-icon">${this.getDesireIcon(d.type)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Event delegation - single listener on parent
    this._pawnListHandler = (e) => {
      const card = e.target.closest('.pawn-card');
      if (card) {
        const pawnId = card.dataset.pawnId;
        const pawn = this.state.pawns.find(p => p.id === pawnId);
        if (pawn) {
          this.showColonistDetail(pawn);
        }
      }
    };
    pawnList.addEventListener('click', this._pawnListHandler);
  }

  getDesireIcon(type) {
    const icons = { eat: '🍖', sleep: '💤', heal: '💊' };
    return icons[type] || '❓';
  }

  showColonistDetail(pawn) {
    if (this.colonistDetailModal) {
      this.colonistDetailModal.close();
    }
    this.colonistDetailModal = new ColonistDetailModal(pawn, this.taskSystem);
    this.colonistDetailModal.show();
  }

  setSelectedPawn(pawn) {
    this.selectedPawn = pawn;
    this.updatePawnList();
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 16px;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 4000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  destroy() {
    if (this.colonistDetailModal) {
      this.colonistDetailModal.close();
    }
    if (this.taskCounterPanel && typeof this.taskCounterPanel.destroy === 'function') {
      this.taskCounterPanel.destroy();
    }
    // Remove pawn list listener
    const pawnList = document.getElementById('pawn-list');
    if (pawnList && this._pawnListHandler) {
      pawnList.removeEventListener('click', this._pawnListHandler);
    }
  }
}
