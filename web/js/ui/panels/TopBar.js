import { BaseComponent } from '../components/BaseComponent.js';
import { Button } from '../components/Button.js';
import { ResourcePanel } from './ResourcePanel.js';
import { renderIcon } from '../components/Icon.js';

/**
 * TopBar - 顶部导航栏
 * 包含Logo、资源显示、游戏控制（暂停/速度）
 */
export class TopBar extends BaseComponent {
  constructor(props) {
    super(props);
    this.resourcePanel = null;
    this.pauseButton = null;
    this.speedButton = null;
  }

  render() {
    const {
      state,
      gameSpeed = 1,
      isPaused = false,
      onSpeedChange,
      onPause
    } = this.props;

    // 创建资源面板
    this.resourcePanel = new ResourcePanel({
      resources: state?.resources || {},
    });

    // 创建控制按钮
    this.pauseButton = new Button({
      variant: isPaused ? 'danger' : 'secondary',
      size: 'sm',
      icon: isPaused ? 'play' : 'pause',
      className: 'min-w-[40px]',
      onClick: () => onPause?.(),
    });

    this.speedButton = new Button({
      variant: 'secondary',
      size: 'sm',
      label: isPaused ? 'PAUSED' : `${gameSpeed}x`,
      className: 'min-w-[60px]',
      onClick: () => {
        const speeds = [0, 1, 2, 3];
        const currentIndex = speeds.indexOf(gameSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        onSpeedChange?.(nextSpeed);
      },
    });

    return `
      <header class="absolute top-2.5 left-2.5 right-2.5 h-[58px] flex items-center gap-3.5 px-3.5 py-2 rounded-lg bg-game-panel border border-game-border backdrop-blur-xs shadow-lg" data-component="top-bar">
        <!-- Logo -->
        <div class="text-lg font-bold text-game-accent tracking-wider">Frontier Colony</div>

        <!-- 资源面板 -->
        <div class="flex gap-2 flex-wrap flex-1" data-section="resources"></div>

        <!-- 游戏控制 -->
        <div class="flex items-center gap-2.5 ml-auto">
          <span data-section="pause-btn"></span>
          <span class="text-base font-semibold text-game-text min-w-[50px] text-center" data-clock="06:00">06:00</span>
          <span class="text-sm text-game-text-dim">Day <span class="text-game-accent font-semibold" data-day="1">1</span></span>
          <span data-section="speed-btn"></span>
        </div>
      </header>
    `;
  }

  componentDidMount() {
    // 挂载资源面板
    const resourceContainer = this.querySelector('[data-section="resources"]');
    if (resourceContainer && this.resourcePanel) {
      this.resourcePanel.mount(resourceContainer);
    }

    // 挂载控制按钮
    const pauseBtnContainer = this.querySelector('[data-section="pause-btn"]');
    if (pauseBtnContainer && this.pauseButton) {
      this.pauseButton.mount(pauseBtnContainer);
    }

    const speedBtnContainer = this.querySelector('[data-section="speed-btn"]');
    if (speedBtnContainer && this.speedButton) {
      this.speedButton.mount(speedBtnContainer);
    }
  }

  update(newProps) {
    // 更新资源面板
    if (newProps.state?.resources && this.resourcePanel) {
      this.resourcePanel.update({ resources: newProps.state.resources });
    }

    // 更新控制按钮
    if (newProps.isPaused !== undefined && this.pauseButton) {
      this.pauseButton.update({
        variant: newProps.isPaused ? 'danger' : 'secondary',
        icon: newProps.isPaused ? 'play' : 'pause',
      });
    }

    if (newProps.gameSpeed !== undefined && this.speedButton) {
      const label = newProps.isPaused ? 'PAUSED' : `${newProps.gameSpeed}x`;
      this.speedButton.update({ label });
    }

    // 更新时钟显示
    if (newProps.timeString) {
      const clockEl = this.querySelector('[data-clock]');
      if (clockEl) clockEl.textContent = newProps.timeString;
    }

    if (newProps.day !== undefined) {
      const dayEl = this.querySelector('[data-day]');
      if (dayEl) dayEl.textContent = newProps.day;
    }

    this.props = { ...this.props, ...newProps };
  }

  unmount() {
    if (this.resourcePanel) {
      this.resourcePanel.unmount();
    }
    if (this.pauseButton) {
      this.pauseButton.unmount();
    }
    if (this.speedButton) {
      this.speedButton.unmount();
    }
    super.unmount();
  }
}
