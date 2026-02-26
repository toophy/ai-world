import { TASK_TYPES } from '../../config.js';

export class TaskCounterPanel {
  constructor(taskSystem) {
    this.taskSystem = taskSystem;
    this.element = null;
    this.tooltip = null;
  }

  init() {
    this.element = document.getElementById('task-counter');
    if (!this.element) {
      console.warn('Task counter element not found');
      return;
    }
    this.render();
  }

  render() {
    if (!this.element) return;

    const counts = this.taskSystem.getTaskCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    this.element.innerHTML = `
      <div class="task-counter-header">
        <span class="task-counter-title">任务队列</span>
        <span class="total-count">${total}</span>
      </div>
      <div class="task-counts">
        ${Object.entries(counts).length > 0 ? Object.entries(counts).map(([type, count]) => `
          <div class="task-count-item" data-task-type="${type}">
            <span class="task-label">${this.getTaskLabel(type)}</span>
            <span class="task-count">${count}</span>
          </div>
        `).join('') : '<div class="no-tasks">暂无任务</div>'}
      </div>
    `;

    this.setupTooltips();
  }

  getTaskLabel(type) {
    return TASK_TYPES[type.toUpperCase()]?.label || type;
  }

  setupTooltips() {
    if (!this.element) return;

    this.element.querySelectorAll('.task-count-item').forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const taskType = e.currentTarget.dataset.taskType;
        this.showTooltip(taskType, e);
      });
      item.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(taskType, event) {
    const tasks = this.taskSystem.getTasksByType(taskType);
    if (tasks.length === 0) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'task-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">${this.getTaskLabel(taskType)}</div>
      <div class="tooltip-tasks">
        ${tasks.map(t => `
          <div class="tooltip-task">
            <span class="task-location">(${t.x}, ${t.z})</span>
            <span class="task-status status-${t.status}">${this.getStatusLabel(t.status)}</span>
            ${t.assignee ? `<span class="task-assignee">${this.getPawnName(t.assignee)}</span>` : '<span class="task-unassigned">未分配</span>'}
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(tooltip);
    this.positionTooltip(tooltip, event);
    this.tooltip = tooltip;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  positionTooltip(tooltip, event) {
    const rect = tooltip.getBoundingClientRect();
    let x = event.clientX + 10;
    let y = event.clientY + 10;

    // Keep tooltip on screen
    if (x + rect.width > window.innerWidth) {
      x = event.clientX - rect.width - 10;
    }
    if (y + rect.height > window.innerHeight) {
      y = event.clientY - rect.height - 10;
    }

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  getStatusLabel(status) {
    const labels = {
      queued: '等待中',
      assigned: '已分配',
      in_progress: '进行中',
    };
    return labels[status] || status;
  }

  getPawnName(pawnId) {
    const pawn = this.taskSystem.state?.pawns?.find(p => p.id === pawnId);
    return pawn?.name || '未知';
  }
}
