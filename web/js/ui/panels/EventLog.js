import { BaseComponent } from '../components/BaseComponent.js';

/**
 * EventLog - 事件日志组件
 * 显示游戏事件历史
 */
export class EventLog extends BaseComponent {
  render() {
    const { logs = [] } = this.props;

    const logItems = [...logs].reverse().map(log => `
      <div class="text-xs pl-2 border-l-2 border-game-accent/65 text-game-text log-line">${log}</div>
    `).join('');

    return `
      <div class="absolute top-[250px] right-[310px] w-[320px] max-h-[300px] p-3 overflow-y-auto rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg pointer-events-auto" data-component="event-log">
        <h3 class="text-sm font-semibold text-game-accent mb-2 pb-1 border-b border-game-border">日志</h3>
        <div class="flex flex-col-reverse gap-1 min-h-[140px]">
          ${logItems || '<div class="text-xs text-game-text-dim text-center py-4">暂无日志</div>'}
        </div>
      </div>
    `;
  }

  update(newProps) {
    if (!newProps.logs) return;

    // 只在有新日志时更新
    const oldLogs = this.props.logs || [];
    const newLogs = newProps.logs;

    if (newLogs.length === oldLogs.length) return;

    this.props = { ...this.props, ...newProps };

    const container = this.querySelector('.flex-col-reverse');
    if (container) {
      const logItems = [...newLogs].reverse().map(log => `
        <div class="text-xs pl-2 border-l-2 border-game-accent/65 text-game-text log-line">${log}</div>
      `).join('');

      container.innerHTML = logItems || '<div class="text-xs text-game-text-dim text-center py-4">暂无日志</div>';
    }
  }
}
