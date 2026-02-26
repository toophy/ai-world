/**
 * BaseComponent - 所有UI组件的基类
 * 提供生命周期、状态管理、事件绑定
 */
export class BaseComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.children = [];
    this._eventHandlers = [];
  }

  // ========== 生命周期钩子 ==========

  /** 挂载前调用 */
  componentWillMount() {}

  /** 挂载后调用 */
  componentDidMount() {}

  /** 更新前调用，返回false阻止更新 */
  shouldUpdate(newProps) { return true; }

  /** 更新前调用 */
  componentWillUpdate(newProps) {}

  /** 更新后调用 */
  componentDidUpdate() {}

  /** 卸载时调用 */
  componentWillUnmount() {}

  // ========== 渲染方法 ==========

  /**
   * 渲染组件HTML
   * 子类必须实现此方法
   * @returns {string|HTMLElement} HTML字符串或DOM元素
   */
  render() {
    throw new Error('BaseComponent.render() must be implemented by subclass');
  }

  /**
   * 将组件挂载到DOM
   * @param {HTMLElement} parent - 父容器
   * @returns {BaseComponent} 返回this以支持链式调用
   */
  mount(parent) {
    this.componentWillMount();
    const html = this.render();

    // 支持两种方式：字符串模板或直接创建元素
    if (typeof html === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = html.trim();
      this.element = temp.firstChild;
    } else {
      this.element = html;
    }

    if (!this.element) {
      throw new Error('Render returned null or empty content');
    }

    parent.appendChild(this.element);
    this.bindEvents();
    this.componentDidMount();
    return this;
  }

  /**
   * 更新组件
   * @param {Object} newProps - 新的props
   */
  update(newProps) {
    if (!this.shouldUpdate(newProps)) return;

    const oldElement = this.element;
    if (!oldElement || !oldElement.parentNode) return;

    const parent = oldElement.parentNode;

    // Call new lifecycle hook
    this.componentWillUpdate(newProps);

    // Clear old events first
    this.unbindEvents();

    try {
      const html = this.render();

      // 支持两种方式：字符串模板或直接创建元素
      if (typeof html === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = html.trim();
        this.element = temp.firstChild;
      } else {
        this.element = html;
      }

      if (this.element) {
        parent.replaceChild(this.element, oldElement);
        this.bindEvents();
        this.componentDidUpdate();
      }

      this.props = { ...this.props, ...newProps };
    } catch (error) {
      // Re-bind old events on failure
      this.bindEvents();
      console.error('Component update failed:', error);
      throw error;
    }
  }

  /**
   * 绑定DOM事件
   * 子类覆盖此方法绑定事件
   */
  bindEvents() {}

  /**
   * 解绑事件（内部使用）
   */
  unbindEvents() {
    this._eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._eventHandlers = [];
  }

  /**
   * 注册事件处理器（自动清理）
   */
  on(element, event, handler) {
    this._eventHandlers.push({ element, event, handler });
    element.addEventListener(event, handler);
  }

  /**
   * 设置状态并触发重新渲染
   * @param {Object} newState - 新的状态
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this.element?.parentNode && this.shouldUpdate(this.props)) {
      this.update(this.props);
    }
  }

  /**
   * 卸载组件
   */
  unmount() {
    this.componentWillUnmount();
    this.unbindEvents();
    this.children.forEach(c => {
      if (c && typeof c.unmount === 'function') {
        c.unmount();
      }
    });
    this.children = [];
    this.element?.remove();
    this.element = null;
  }

  /**
   * 查找子元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement|null}
   */
  querySelector(selector) {
    return this.element?.querySelector(selector) || null;
  }

  /**
   * 查找所有匹配的子元素
   * @param {string} selector - CSS选择器
   * @returns {HTMLElement[]}
   */
  querySelectorAll(selector) {
    return this.element?.querySelectorAll(selector) || [];
  }
}
