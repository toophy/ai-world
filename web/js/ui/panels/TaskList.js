import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';

/**
 * TaskList - 任务队列组件
 * 显示所有待处理的任务
 */
export class TaskList extends BaseComponent {
  render() {
    const { tasks = [] } = this.props;

    // 过滤并排序任务
    const activeTasks = tasks
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => b.priority - a.priority);

    const taskItems = activeTasks.map(task => {
      const statusColors = {
        queued: 'text-game-text-dim',
        assigned: 'text-game-accent',
        in_progress: 'text-game-success',
      };

      return `
        <div class="p-2 mb-1 rounded border border-game-border hover:bg-game-accent/5 transition-colors" data-task-id="${task.id}">
          <div class="flex justify-between items-center">
            <span class="text-sm text-game-text">${task.label || task.type}</span>
            <span class="text-xs text-game-text-dim">P${task.priority}</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-game-text-dim">(${task.x}, ${task.z})</span>
            <span class="text-xs ${statusColors[task.status] || ''}">${this.getStatusLabel(task.status)}</span>
          </div>
          ${task.progress !== undefined ? `
            <div class="mt-1.5 h-1 bg-black/30 rounded-full overflow-hidden">
              <div class="h-full bg-game-accent transition-all duration-300" style="width: ${task.progress}%"></div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="absolute top-[78px] left-2.5 w-[280px] top-[200px] max-h-[calc(100vh-320px)] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="task-list">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">任务队列</h3>
        <div class="flex flex-col gap-1">
          ${activeTasks.length > 0 ? taskItems : '<div class="text-sm text-game-text-dim text-center py-4">暂无任务</div>'}
        </div>
      </div>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      queued: '排队中',
      assigned: '已分配',
      in_progress: '进行中',
    };
    return labels[status] || status;
  }

  update(newProps) {
    if (!newProps.tasks) return;

    // 简单实现：完全重新渲染
    this.props = { ...this.props, ...newProps };

    // TODO: 优化为增量更新
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
