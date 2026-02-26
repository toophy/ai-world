import { TopBar } from './panels/TopBar.js';
import { BuildPanel } from './panels/BuildPanel.js';
import { ResourcePanel } from './panels/ResourcePanel.js';
import { PawnList } from './panels/PawnList.js';
import { TaskList } from './panels/TaskList.js';
import { Inspector } from './panels/Inspector.js';
import { EventLog } from './panels/EventLog.js';

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

    // 资源面板
    const resourcePanel = new ResourcePanel({
      resources: this.state.resources || [],
    });
    resourcePanel.mount(this.root);
    this.panels.set('resourcePanel', resourcePanel);

    // 殖民者列表
    const pawnList = new PawnList({
      pawns: this.state.pawns || [],
      selectedPawn: this.selectedPawn,
      onPawnClick: (pawn) => this.setSelectedPawn(pawn),
    });
    pawnList.mount(this.root);
    this.panels.set('pawnList', pawnList);

    // 任务列表
    const taskList = new TaskList({
      tasks: this.state.tasks || [],
    });
    taskList.mount(this.root);
    this.panels.set('taskList', taskList);

    // 检视器
    const inspector = new Inspector({
      entity: this.selectedPawn || null,
    });
    inspector.mount(this.root);
    this.panels.set('inspector', inspector);

    // 事件日志
    const eventLog = new EventLog({
      logs: this.state.logs || [],
    });
    eventLog.mount(this.root);
    this.panels.set('eventLog', eventLog);

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

    // 更新资源面板
    const resourcePanel = this.panels.get('resourcePanel');
    if (resourcePanel && this.state.resources) {
      resourcePanel.update({
        resources: this.state.resources,
      });
    }
  }

  /**
   * 更新殖民者列表
   */
  updatePawns(pawns) {
    const pawnList = this.panels.get('pawnList');
    if (pawnList) {
      pawnList.update({
        pawns: pawns || this.state.pawns || [],
        selectedPawn: this.selectedPawn,
      });
    }
  }

  /**
   * 更新任务列表
   */
  updateTasks(tasks) {
    const taskList = this.panels.get('taskList');
    if (taskList) {
      taskList.update({
        tasks: tasks || this.state.tasks || [],
      });
    }
  }

  /**
   * 显示检视器
   */
  showInspector(entity) {
    const inspector = this.panels.get('inspector');
    if (inspector) {
      inspector.update({
        entity: entity || null,
      });
    }
  }

  /**
   * 显示事件日志
   */
  showEventLog(logs) {
    const eventLog = this.panels.get('eventLog');
    if (eventLog) {
      eventLog.update({
        logs: logs || this.state.logs || [],
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

    // 更新殖民者列表
    const pawnList = this.panels.get('pawnList');
    if (pawnList) {
      pawnList.update({
        pawns: this.state.pawns || [],
        selectedPawn: pawn,
      });
    }

    // 更新检视器
    this.showInspector(pawn);
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
