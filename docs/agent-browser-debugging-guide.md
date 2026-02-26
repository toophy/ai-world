# Agent-Browser 网页调试指南

**日期**: 2026-02-26
**工具**: agent-browser CLI
**用途**: 网页自动化测试和调试

## 简介

agent-browser 是一个基于 Playwright 的浏览器自动化 CLI 工具，非常适合用于：
- 端到端测试
- 网页自动化截图
- UI 元素验证
- 表单自动填充
- 数据抓取

## 安装

```bash
npm install -g agent-browser
```

## 基础命令

### 导航

```bash
# 打开网页
agent-browser open https://example.com

# 别名
agent-browser goto https://example.com
agent-browser navigate https://example.com

# 关闭浏览器
agent-browser close
```

### 快照 (Snapshot) - 获取元素引用

**核心概念**: 快照会给每个可交互元素分配引用（如 `@e1`, `@e2`），用于后续操作。

```bash
# 获取所有可交互元素
agent-browser snapshot -i

# 输出示例:
# button "提交" [ref=e1]
# input[type="email"] [ref=e2]
# input[type="password"] [ref=e3]

# 包含鼠标可交互的 div (onclick, cursor:pointer)
agent-browser snapshot -i -C

# 限定选择器范围
agent-browser snapshot -s "#form-container"
```

**重要**: 快照中的引用在页面变化后会失效，需要重新获取。

### 交互操作

```bash
# 点击元素
agent-browser click @e1

# 填写输入框 (清空后输入)
agent-browser fill @e2 "user@example.com"

# 追加文本 (不清空)
agent-browser type @e2 " more text"

# 选择下拉选项
agent-browser select @e1 "选项名"

# 勾选复选框
agent-browser check @e1

# 按键
agent-browser press Enter

# 滚动
agent-browser scroll down 500
```

### 获取信息

```bash
# 获取元素文本
agent-browser get text @e1

# 获取当前 URL
agent-browser get url

# 获取页面标题
agent-browser get title

# 获取整个页面文本
agent-browser get text body > output.txt

# JSON 输出
agent-browser get text @e1 --json
```

### 等待

```bash
# 等待元素出现
agent-browser wait @e1

# 等待网络空闲
agent-browser wait --load networkidle

# 等待 URL 匹配
agent-browser wait --url "**/dashboard"

# 等待毫秒数
agent-browser wait 2000
```

### 截图和导出

```bash
# 截图到临时目录
agent-browser screenshot

# 指定文件名
agent-browser screenshot output.png

# 全页面截图
agent-browser screenshot --full

# 保存为 PDF
agent-browser pdf output.pdf
```

## 常用模式

### 表单提交

```bash
agent-browser open https://example.com/signup
agent-browser snapshot -i
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser select @e3 "California"
agent-browser click @e4
agent-browser wait --load networkidle
```

### 数据提取

```bash
# 获取产品列表
agent-browser open https://example.com/products
agent-browser snapshot -i
agent-browser get text @e5

# 批量提取
agent-browser get text body > products.txt
```

### 状态持久化

```bash
# 登录并保存状态
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$USERNAME"
agent-browser fill @e2 "$PASSWORD"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
agent-browser state save auth.json

# 后续使用保存的状态
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

## 调试技巧

### 1. 元素找不到？

**问题**: 快照中看不到元素

**解决方案**:
```bash
# 使用 -C 选项包含更多元素
agent-browser snapshot -i -C

# 使用语义定位器作为备选
agent-browser find text "登录" click
```

### 2. 动态内容加载

**问题**: 元素需要时间加载

**解决方案**:
```bash
# 等待特定元素
agent-browser wait --load networkidle

# 或等待特定选择器
agent-browser wait "#dynamic-content"
```

### 3. iframe 处理

**问题**: 元素在 iframe 内

**解决方案**:
```bash
# 切换到 iframe (需要使用 frame 选择器)
agent-browser snapshot -s "iframe#myframe"
```

### 4. 调试输出

```bash
# 获取页面 HTML 查看结构
agent-browser get text body > page.html

# 截图查看实际渲染
agent-browser screenshot debug.png
```

### 5. 引用失效

**问题**: 页面变化后引用无效

**解决方案**:
```bash
# 操作后立即重新快照
agent-browser click @e5
agent-browser snapshot -i  # 重新获取引用
agent-browser click @e1    # 使用新引用
```

## Shell 脚本集成

```bash
#!/bin/bash
# test_feature.sh

GAME_URL="http://localhost:8000"
RESULT_FILE="results.txt"

echo "=== 测试开始 ===" > "$RESULT_FILE"

# 打开页面
agent-browser open "$GAME_URL"

# 获取快照
SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# 检查元素是否存在
if echo "$SNAPSHOT" | grep -q "button.*开始"; then
    echo "✓ 开始按钮存在" >> "$RESULT_FILE"
else
    echo "✗ 开始按钮缺失" >> "$RESULT_FILE"
fi

# 关闭浏览器
agent-browser close
```

## 测试实战

### 检查 THREE.js 加载

```bash
agent-browser open http://localhost:8000
agent-browser screenshot game.png

# 检查页面是否有 canvas
PAGE_TEXT=$(agent-browser get text body 2>&1)
if echo "$PAGE_TEXT" | grep -q "game-canvas"; then
    echo "✓ Canvas 元素存在"
else
    echo "✗ Canvas 元素缺失"
fi
```

### 测试按钮交互

```bash
agent-browser open http://localhost:8000
agent-browser snapshot -i

# 获取暂停按钮引用
PAUSE_REF=$(agent-browser snapshot -i 2>&1 | grep 'button "⏸️"' | sed 's/.*\[ref=\(e[0-9]*\)\].*/\1/')

# 点击暂停
agent-browser click "@$PAUSE_REF"

# 重新快照验证图标变化
AFTER_SNAP=$(agent-browser snapshot -i 2>&1)
if echo "$AFTER_SNAP" | grep -q 'button "▶️"'; then
    echo "✓ 暂停按钮切换成功"
else
    echo "✗ 暂停按钮切换失败"
fi
```

### 验证资源加载

```bash
agent-browser open http://localhost:8000

# 获取资源面板文本
RESOURCES=$(agent-browser get text '#resources' 2>&1)

if echo "$RESOURCES" | grep -q "木材"; then
    echo "✓ 木材资源显示"
else
    echo "✗ 木材资源未显示"
fi
```

## 高级技巧

### JSON 输出解析

```bash
# 获取元素属性的 JSON
agent-browser get text @e1 --json > element.json

# 使用 jq 解析
jq '.text' element.json
```

### 会话管理

```bash
# 并行会话
agent-browser --session site1 open https://site-a.com
agent-browser --session site2 open https://site-b.com

agent-browser --session site1 snapshot -i
agent-browser --session site2 snapshot -i

# 列出会话
agent-browser session list
```

### 视觉调试

```bash
# 使用有头模式查看实际操作
agent-browser --headed open https://example.com

# 高亮元素
agent-browser highlight @e1

# 录制会话
agent-browser record start demo.webm
# ... 操作 ...
agent-browser record stop
```

## 限制和注意事项

1. **Canvas 元素**: `<canvas>` 标签不会出现在 `snapshot -i` 中，因为不是交互元素
2. **引用生命周期**: 页面导航后引用失效，需要重新快照
3. **异步操作**: 使用 `wait --load networkidle` 确保页面完全加载
4. **权限问题**: Windows 上可能遇到 EPERM 错误，尝试以管理员权限运行

## 参考资料

- agent-browser GitHub: https://github.com/...
- Playwright 文档: https://playwright.dev/
- 模板脚本: `templates/` 目录

## 示例项目

本项目中的完整测试套件:
- `tests/browser/test_01_ui_elements.sh` - UI 元素检测
- `tests/browser/test_02_button_interactions.sh` - 按钮交互测试
- `tests/browser/test_03_game_state.sh` - 游戏状态测试
- `tests/browser/run_all.sh` - 主测试运行器

运行方式:
```bash
cd tests/browser
./run_all.sh
```
