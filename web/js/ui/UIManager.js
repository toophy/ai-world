import { TopBar } from './panels/TopBar.js';
import { BuildPanel } from './panels/BuildPanel.js';
import { ResourcePanel } from './panels/ResourcePanel.js';
// 其他面板将在后续任务中添加

/**
 * UIManager - UI组件管理器
 * 统一管理所有UI面板的渲染、更新、事件
 */
export class UIManager {
  constructor(state, taskSystem) {
    this.state = state;
    this.taskSystem = taskSystem;
    this.root = null;
    this.panels = new Map();
    this.selectedPawn = null;
  }

  /**
   * 初始化UI系统
   */
  init() {
    this.root = document.getElementById('ui-root');
    if (!this.root) {
      // 如果ui-root不存在，创建它
      this.root = document.createElement('div');
      this.root.id = 'ui-root';
      this.root.className = 'absolute inset-0 pointer-events-none';
      document.getElementById('game-root')?.appendChild(this.root);
    }

    this.renderAll();
    this.bindEvents();
  }

  /**
   * 渲染所有面板
   */
  renderAll() {
    this.root.innerHTML = '';

    // 顶部栏
    const topBar = new TopBar({
      state: this.state,
      gameSpeed: this.state.gameSpeed,
      isPaused: false,
      onSpeedChange: (speed) => this.handleSpeedChange(speed),
      onPause: () => this.handlePause(),
    });
    topBar.mount(this.root);
    this.panels.set('topBar', topBar);

    // 建造面板
    const buildPanel = new BuildPanel({
      priority: 5,
      onModeChange: (mode, building) => this.handleModeChange(mode, building),
      onPriorityChange: (p) => this.handlePriorityChange(p),
    });
    buildPanel.mount(this.root);
    this.panels.set('buildPanel', buildPanel);
  }

  /**
   * 更新所有面板
   */
  updateAll() {
    // 更新顶部栏
    const topBar = this.panels.get('topBar');
    if (topBar) {
      topBar.update({
        state: this.state,
        timeString: this.getTimeString(),
        day: this.state.day,
      });
    }
  }

  /**
   * 获取格式化的时间字符串
   */
  getTimeString() {
    const hour = Math.floor(this.state.hour);
    return `${String(hour).padStart(2, '0')}:00`;
  }

  /**
   * 处理模式切换
   */
  handleModeChange(mode, building = null) {
    if (this.state.inputManager) {
      this.state.inputManager.setMode(mode, building);
    }
  }

  /**
   * 处理速度变化
   */
  handleSpeedChange(speed) {
    if (this.state.timeSystem) {
      this.state.timeSystem.setSpeed(speed);
    }
    this.state.gameSpeed = speed;
    this.updateAll();
  }

  /**
   * 处理暂停
   */
  handlePause() {
    if (this.state.timeSystem) {
      const paused = this.state.timeSystem.togglePause();
      const topBar = this.panels.get('topBar');
      if (topBar) {
        topBar.update({ isPaused: paused });
      }
    }
  }

  /**
   * 处理优先级变化
   */
  handlePriorityChange(priority) {
    if (this.state.inputManager?.modeHandler) {
      this.state.inputManager.modeHandler.setPriority(priority);
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      error: 'bg-game-danger/20 border-game-danger',
      success: 'bg-game-success/20 border-game-success',
      warning: 'bg-game-warning/20 border-game-warning',
      info: 'bg-game-accent/20 border-game-accent',
    };

    notification.className = `fixed top-20 right-5 px-4 py-3 rounded-lg border shadow-lg animate-slide-in pointer-events-auto ${colors[type] || colors.info}`;
    notification.innerHTML = `<span class="text-sm">${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 设置选中的殖民者
   */
  setSelectedPawn(pawn) {
    this.selectedPawn = pawn;
    // TODO: 实现PawnList的更新
  }

  /**
   * 绑定全局事件
   */
  bindEvents() {
    // 键盘快捷键在InputManager中处理
  }

  /**
   * 清理资源
   */
  destroy() {
    this.panels.forEach(panel => {
      if (panel && typeof panel.unmount === 'function') {
        panel.unmount();
      }
    });
    this.panels.clear();
    this.root.innerHTML = '';
  }
}
