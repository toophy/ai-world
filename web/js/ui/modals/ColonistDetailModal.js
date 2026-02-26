import { SKILL_LABELS } from '../../config.js';

export class ColonistDetailModal {
  constructor(pawn, taskSystem) {
    this.pawn = pawn;
    this.taskSystem = taskSystem;
    this.element = null;
    this.currentTab = 'status';
  }

  show() {
    if (this.element) {
      this.close();
    }

    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.innerHTML = `
      <div class="modal-content colonist-detail">
        <button class="modal-close">&times;</button>

        <div class="colonist-header">
          <div class="colonist-avatar" style="background: #${this.pawn.color.toString(16).padStart(6, '0')}"></div>
          <div class="colonist-info">
            <h2>${this.pawn.name}</h2>
            <div class="colonist-status">
              ${this.pawn.task ? `正在: ${this.pawn.task.label}` : '空闲'}
            </div>
          </div>
        </div>

        <div class="colonist-tabs">
          <button class="tab-btn active" data-tab="status">状态</button>
          <button class="tab-btn" data-tab="skills">技能</button>
          <button class="tab-btn" data-tab="history">历史</button>
          <button class="tab-btn" data-tab="actions">操作</button>
        </div>

        <div class="colonist-tab-content">
          ${this.renderStatusTab()}
          ${this.renderSkillsTab()}
          ${this.renderHistoryTab()}
          ${this.renderActionsTab()}
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    this.setupEventListeners();
    this.showTab('status');
  }

  renderStatusTab() {
    return `
      <div class="tab-pane" data-tab="status">
        <div class="stat-bars">
          <div class="stat-bar">
            <label>生命值</label>
            <div class="bar-container">
              <div class="bar-fill hp" style="width: ${(this.pawn.hp / this.pawn.maxHp) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.hp}/${this.pawn.maxHp}</span>
          </div>
          <div class="stat-bar">
            <label>饥饿值</label>
            <div class="bar-container">
              <div class="bar-fill hunger" style="width: ${(this.pawn.hunger / this.pawn.maxHunger) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.hunger}/${this.pawn.maxHunger}</span>
          </div>
          <div class="stat-bar">
            <label>精力值</label>
            <div class="bar-container">
              <div class="bar-fill energy" style="width: ${(this.pawn.energy / this.pawn.maxEnergy) * 100}%"></div>
            </div>
            <span class="stat-value">${this.pawn.energy}/${this.pawn.maxEnergy}</span>
          </div>
        </div>
        <div class="desires-section">
          <h3>当前需求</h3>
          ${this.pawn.desires.length > 0
            ? this.pawn.desires.map(d => `<span class="desire-tag">${this.getDesireLabel(d.type)}</span>`).join('')
            : '<span class="no-desires">无特殊需求</span>'}
        </div>
      </div>
    `;
  }

  renderSkillsTab() {
    return `
      <div class="tab-pane" data-tab="skills">
        <div class="skills-list">
          ${Object.entries(this.pawn.skills).map(([skill, level]) => `
            <div class="skill-item">
              <span class="skill-name">${SKILL_LABELS[skill]}</span>
              <div class="skill-bar">
                <div class="skill-fill" style="width: ${Math.min(100, level * 5)}%"></div>
              </div>
              <span class="skill-level">${level.toFixed(1)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderHistoryTab() {
    return `
      <div class="tab-pane" data-tab="history">
        <div class="task-history">
          ${this.pawn.taskHistory.length > 0
            ? this.pawn.taskHistory.map(entry => `
              <div class="history-entry">
                <span class="history-time">${entry.time}</span>
                <span class="history-action">${entry.action}</span>
              </div>
            `).join('')
            : '<p class="no-history">暂无历史记录</p>'}
        </div>
      </div>
    `;
  }

  renderActionsTab() {
    return `
      <div class="tab-pane" data-tab="actions">
        <h3>强制派发任务</h3>
        <div class="action-buttons">
          <button class="action-btn" data-action="assign-build">指派建造任务</button>
          <button class="action-btn" data-action="assign-mine">指派采矿任务</button>
          <button class="action-btn" data-action="assign-haul">指派搬运任务</button>
          <button class="action-btn danger" data-action="cancel-current">取消当前任务</button>
        </div>
        <div id="assign-task-panel" class="assign-panel" style="display: none;">
          <p>选择地图上的位置来派发任务...</p>
        </div>
      </div>
    `;
  }

  getDesireLabel(type) {
    const labels = { eat: '进食', sleep: '休息', heal: '治疗' };
    return labels[type] || type;
  }

  setupEventListeners() {
    // Close button
    this.element.querySelector('.modal-close').addEventListener('click', () => this.close());

    // Close on overlay click
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });

    // Tab buttons
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.showTab(e.target.dataset.tab);
      });
    });

    // Action buttons
    this.element.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleAction(e.target.dataset.action);
      });
    });

    // Escape key to close
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this.escapeHandler);
  }

  showTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    this.element.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show/hide tab panes
    this.element.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = pane.dataset.tab === tabName ? 'block' : 'none';
    });
  }

  handleAction(action) {
    switch (action) {
      case 'assign-build':
        this.enterAssignMode('build_wall');
        break;
      case 'assign-mine':
        this.enterAssignMode('mine_ore');
        break;
      case 'assign-haul':
        this.enterAssignMode('haul');
        break;
      case 'cancel-current':
        if (this.pawn.task) {
          this.pawn.task.cancel();
          this.pawn.task = null;
          this.pawn.targetPath = [];
          this.close();
        }
        break;
    }
  }

  enterAssignMode(taskType) {
    // Emit custom event for InputManager to handle
    document.dispatchEvent(new CustomEvent('enter-assign-mode', {
      detail: { pawnId: this.pawn.id, taskType }
    }));
    this.close();
  }

  close() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    if (this.escapeHandler) {
      window.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
  }
}
