# UI Components Usage Guide

This guide documents all UI components in the Frontier Colony web interface, including usage examples and API documentation.

## Table of Contents

- [BaseComponent](#basecomponent)
- [Button](#button)
- [Badge](#badge)
- [ProgressBar](#progressbar)
- [Icon](#icon)
- [ResourcePanel](#resourcepanel)
- [TopBar](#topbar)
- [BuildPanel](#buildpanel)
- [PawnList](#pawnlist)
- [TaskList](#tasklist)
- [Inspector](#inspector)
- [EventLog](#eventlog)

---

## BaseComponent

The foundation class for all UI components. Provides lifecycle management, state handling, and event binding.

### API

```javascript
class BaseComponent {
  constructor(props = {})
  mount(parent)              // Mount to DOM parent
  update(newProps)           // Update with new props
  unmount()                  // Clean up and remove
  setState(newState)         // Update internal state
  querySelector(selector)    // Query within component
  querySelectorAll(selector) // Query all matches
}
```

### Lifecycle Hooks

```javascript
componentWillMount()    // Before initial mount
componentDidMount()     // After initial mount
shouldUpdate(newProps)  // Return false to skip update
componentWillUpdate(newProps) // Before update
componentDidUpdate()    // After update
componentWillUnmount()  // Before cleanup
```

### Event Handling

```javascript
// Register event (auto-cleanup on unmount)
this.on(element, 'click', handler);

// Bind events in bindEvents() method
bindEvents() {
  this.on(this.element, 'click', (e) => {
    // Handle click
  });
}
```

### Usage Example

```javascript
import { BaseComponent } from './ui/components/BaseComponent.js';

class MyComponent extends BaseComponent {
  render() {
    return `<div class="my-component">Hello ${this.props.name}</div>`;
  }

  bindEvents() {
    this.on(this.element, 'click', () => {
      this.props.onClick?.();
    });
  }
}

// Use
const comp = new MyComponent({ name: 'World', onClick: () => console.log('clicked') });
comp.mount(document.body);
```

---

## Button

Interactive button component with variants, sizes, and icons.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'primary'` | Style variant: `primary`, `secondary`, `danger`, `ghost` |
| `size` | string | `'md'` | Size: `sm`, `md`, `lg` |
| `icon` | string | - | Icon name (see Icon component) |
| `label` | string | - | Button text |
| `active` | boolean | `false` | Active state |
| `disabled` | boolean | `false` | Disabled state |
| `vertical` | boolean | `false` | Stack icon above label |
| `onClick` | function | - | Click handler |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { Button } from './ui/components/Button.js';

// Primary button
const btn = new Button({
  variant: 'primary',
  size: 'md',
  label: 'Build',
  onClick: () => console.log('Build clicked')
});
btn.mount(container);

// Icon button with vertical layout
const iconBtn = new Button({
  variant: 'secondary',
  size: 'md',
  icon: 'hammer',
  label: 'Construct',
  vertical: true,
  active: false,
  onClick: () => toggleMode()
});
iconBtn.mount(container);

// Danger button
const deleteBtn = new Button({
  variant: 'danger',
  size: 'sm',
  icon: 'trash',
  label: 'Delete',
  onClick: () => deleteItem()
});
deleteBtn.mount(container);

// Update existing button
btn.update({ active: true, disabled: false });
```

---

## Badge

Small indicator for resources, counts, or status labels.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'default'` | Style: `default`, `wood`, `ore`, `berry`, `food` |
| `size` | string | `'md'` | Size: `sm`, `md`, `lg` |
| `icon` | string | - | Icon HTML or name |
| `label` | string | - | Label text |
| `value` | number|string | - | Value to display |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { Badge } from './ui/components/Badge.js';
import { renderIcon } from './ui/components/Icon.js';

// Resource badge
const woodBadge = new Badge({
  icon: renderIcon('wood', 'w-4 h-4'),
  label: 'Wood',
  value: 150,
  variant: 'wood',
  size: 'md'
});
woodBadge.mount(container);

// Simple status badge
const statusBadge = new Badge({
  label: 'Status',
  value: 'Active',
  variant: 'default',
  size: 'sm'
});
statusBadge.mount(container);

// Update badge value
woodBadge.update({ value: 200 });
```

---

## ProgressBar

Progress indicator with variants for different contexts (HP, hunger, etc.).

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | `0` | Current value |
| `max` | number | `100` | Maximum value |
| `variant` | string | `'default'` | Style: `default`, `danger`, `success`, `warning`, `hp`, `hunger`, `energy` |
| `size` | string | `'md'` | Size: `sm`, `md`, `lg` |
| `showLabel` | boolean | `true` | Show percentage/value |
| `label` | string | `null` | Custom label |
| `animated` | boolean | `false` | Enable transitions |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { ProgressBar } from './ui/components/ProgressBar.js';

// Health bar
const hpBar = new ProgressBar(container, {
  value: 75,
  max: 100,
  variant: 'hp',
  size: 'md',
  showLabel: true,
  label: 'HP',
  animated: true
});
hpBar.render();

// Update value (optimized, no full re-render)
hpBar.update(60);
hpBar.setValue(80);

// Get current value
const current = hpBar.getValue();
```

---

## Icon

SVG icon renderer with Lucide-style paths.

### Available Icons

**Building**: `wall`, `door`, `bed`, `storage`, `workbench`, `medical_bed`
**Actions**: `mine`, `harvest`, `plant`, `demolish`
**UI**: `pause`, `play`, `clock`, `close`, `check`, `alert`, `settings`
**Default**: `square` (fallback)

### Usage Examples

```javascript
import { renderIcon, Icon, AVAILABLE_ICONS } from './ui/components/Icon.js';

// Render as HTML string
const iconHtml = renderIcon('hammer', 'w-5 h-5');
element.innerHTML = iconHtml;

// As a class
const icon = new Icon('hammer', { className: 'w-6 h-6' });
const iconHtml = icon.render();

// Check available icons
console.log(AVAILABLE_ICONS); // ['wall', 'door', 'bed', ...]
```

---

## ResourcePanel

Container for displaying resource badges dynamically.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resources` | object | `{}` | Resource values `{ wood, ore, berry, food }` |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { ResourcePanel } from './ui/panels/ResourcePanel.js';

const panel = new ResourcePanel({
  resources: {
    wood: 150,
    ore: 45,
    berry: 30,
    food: 80
  }
});
panel.mount(container);

// Update resources
panel.update({
  resources: {
    wood: 140,
    ore: 50,
    berry: 25,
    food: 85
  }
});
```

---

## TopBar

Header bar with logo, resources, and game controls.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `state` | object | - | Game state (with resources) |
| `gameSpeed` | number | `1` | Current game speed |
| `isPaused` | boolean | `false` | Pause state |
| `onSpeedChange` | function | - | Speed change callback |
| `onPause` | function | - | Pause toggle callback |

### Usage Examples

```javascript
import { TopBar } from './ui/panels/TopBar.js';

const topBar = new TopBar({
  state: { resources: { wood: 100, berry: 20 } },
  gameSpeed: 1,
  isPaused: false,
  onSpeedChange: (speed) => console.log('Speed:', speed),
  onPause: () => console.log('Pause toggled')
});
topBar.mount(uiRoot);

// Update
topBar.update({
  state: { resources: { wood: 90, berry: 25 } },
  timeString: '08:00',
  day: 2,
  isPaused: true
});
```

---

## BuildPanel

Construction and action mode panel with priority controls.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `priority` | number | `5` | Default task priority (3=low, 5=medium, 7=high) |
| `onModeChange` | function | - | Callback when mode/building selected |
| `onPriorityChange` | function | - | Callback when priority changes |
| `className` | string | `''` | Additional CSS classes |

### Building Types

`wall`, `door`, `bed`, `storage`, `workbench`, `medical_bed`

### Action Modes

`mine`, `harvest`, `plant`, `demolish`

### Usage Examples

```javascript
import { BuildPanel } from './ui/panels/BuildPanel.js';

const panel = new BuildPanel({
  priority: 5,
  onModeChange: (mode) => {
    console.log('Mode:', mode);
    // mode: { type: 'build', building: 'wall' } or { type: 'action', mode: 'mine' }
  },
  onPriorityChange: (priority) => {
    console.log('Priority:', priority);
  }
});
panel.mount(uiRoot);
```

---

## PawnList

Displays colonist cards with status and desires.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pawns` | array | `[]` | Pawn objects with id, name, color, currentTask, desires |
| `selectedPawn` | object | `null` | Currently selected pawn |
| `onPawnClick` | function | - | Click callback |

### Usage Examples

```javascript
import { PawnList } from './ui/panels/PawnList.js';

const pawnList = new PawnList({
  pawns: [
    { id: 1, name: 'Alice', color: 0xff0000, currentTask: { label: 'Mining' }, desires: [] },
    { id: 2, name: 'Bob', color: 0x00ff00, currentTask: null, desires: [{ type: 'eat' }] }
  ],
  selectedPawn: null,
  onPawnClick: (pawn) => {
    console.log('Selected:', pawn.name);
    showInspector(pawn);
  }
});
pawnList.mount(uiRoot);

// Update selection
pawnList.update({
  pawns: updatedPawns,
  selectedPawn: pawns[0]
});
```

---

## TaskList

Shows active tasks with priority and progress.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tasks` | array | `[]` | Task objects with id, type, label, priority, status, progress, x, z |
| `className` | string | `''` | Additional CSS classes |

### Task Status Values

`queued`, `assigned`, `in_progress`, `completed`, `cancelled`

### Usage Examples

```javascript
import { TaskList } from './ui/panels/TaskList.js';

const taskList = new TaskList({
  tasks: [
    { id: 1, type: 'mine', label: 'Mine Ore', priority: 7, status: 'in_progress', progress: 45, x: 10, z: 15 },
    { id: 2, type: 'build', label: 'Build Wall', priority: 5, status: 'queued', x: 20, z: 25 }
  ]
});
taskList.mount(uiRoot);

// Update tasks
taskList.update({ tasks: updatedTasks });
```

---

## Inspector

Displays detailed information about selected entities (pawns or buildings).

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entity` | object | `null` | Entity to inspect (Pawn or Building) |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { Inspector } from './ui/panels/Inspector.js';
import { Pawn } from './js/entities/Pawn.js';

const inspector = new Inspector({
  entity: null // Initially empty
});
inspector.mount(uiRoot);

// Show pawn details
const pawn = new Pawn('Alice', 10, 15);
pawn.hp = 80;
pawn.maxHp = 100;
pawn.hunger = 25;
pawn.energy = 75;
pawn.skills = { building: 5.0, mining: 3.5 };

inspector.update({ entity: pawn });

// Clear inspector
inspector.update({ entity: null });
```

---

## EventLog

Scrollable log of game events.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logs` | array | `[]` | Array of log strings (newest first) |
| `className` | string | `''` | Additional CSS classes |

### Usage Examples

```javascript
import { EventLog } from './ui/panels/EventLog.js';

const eventLog = new EventLog({
  logs: [
    '06:00 - Day 1 started',
    '06:15 - Alice began mining',
    '06:30 - Bob planted berries'
  ]
});
eventLog.mount(uiRoot);

// Add new log
eventLog.update({
  logs: [...oldLogs, '07:00 - Harvest complete']
});
```

---

## UIManager

Central UI coordinator that manages all panels.

### API

```javascript
class UIManager {
  constructor(state, taskSystem)
  init()                          // Initialize all panels
  updateAll()                     // Update all panels
  updatePawns(pawns)              // Update pawn list
  updateTasks(tasks)              // Update task list
  showInspector(entity)           // Show entity details
  showEventLog(logs)              // Update event log
  setSelectedPawn(pawn)           // Select and show pawn
  showNotification(msg, type)     // Show toast notification
  destroy()                       // Clean up all panels
}
```

### Usage Example

```javascript
import { UIManager } from './js/ui/UIManager.js';

const uiManager = new UIManager(state, taskSystem);
uiManager.init();

// In game loop
function tick() {
  uiManager.updateAll();
}

// On pawn click
uiManager.setSelectedPawn(clickedPawn);

// Show notification
uiManager.showNotification('Construction complete', 'success');
```

---

## Color Tokens

Custom Tailwind colors for consistent theming:

```css
game-bg: #0f141f                    /* Main background */
game-panel: rgba(23, 26, 33, 0.88)  /* Panel background */
game-border: rgba(132, 158, 210, 0.42) /* Border color */
game-accent: #79b0ff                /* Primary accent */
game-text: #dde8ff                  /* Main text */
game-text-dim: #b0bfd8              /* Secondary text */
game-danger: #e86a7c                /* Error/danger */
game-success: #78d17a               /* Success */
game-warning: #f5a623               /* Warning */

wood: #d4a574                       /* Wood resource */
ore: #a8b5c4                        /* Ore resource */
berry: #c06c84                      /* Berry resource */
food: #f4a261                       /* Food resource */
```

---

## Best Practices

1. **Always unmount components** when done to prevent memory leaks
2. **Use `shouldUpdate()`** to optimize expensive components
3. **Bind events in `bindEvents()`** for automatic cleanup
4. **Escape dynamic content** to prevent XSS (see Button/Badge implementations)
5. **Prefer `update()` over re-mounting** for better performance
6. **Use `className` prop** sparingly - prefer variant props
7. **Test with disabled state** to ensure accessibility
