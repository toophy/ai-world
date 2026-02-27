# Tailwind 在受限网络（含中国大陆）部署策略

## 背景
部分地区无法稳定访问 `https://cdn.tailwindcss.com`，会导致页面样式缺失。推荐优先使用**本地构建 / 本地静态文件**，避免运行时依赖外部 CDN。

## 可选方案（按推荐顺序）
1. **本地构建（推荐）**
   - 在 CI 或开发机编译 `tailwind.css`，部署时只发布产物。
   - 优点：最稳定、首屏快、可离线、无第三方故障影响。
2. **仓库内置静态 CSS（应急）**
   - 将项目需要的 utility class 预置在 `web/tailwind.css`。
   - 适合当前项目这种 class 集合相对可控的场景。
3. **多镜像 CDN 回退（仅兜底）**
   - 可按顺序尝试：`cdn.tailwindcss.com` → `unpkg/jsdelivr` → `npmmirror`。
   - 缺点：仍受网络与策略限制，不适合作为主路径。
4. **自建静态资源服务（企业/内网）**
   - 把 Tailwind 与依赖文件发布到自有 OSS/CDN（如 COS/OSS + CDN）。
   - 可结合内网源与白名单策略。

## 中国大陆建议
- **生产环境**：务必使用“本地构建 + 静态发布”。
- **开发环境**：如需镜像，建议使用企业 npm 镜像或私有制品库，不依赖浏览器端运行时 CDN。
- 若必须用公网 CDN，请至少实现多源回退并监控加载失败率。

## 本仓库当前修正
- `web/index.html` 移除了 Tailwind/DaisyUI 运行时 CDN 依赖，改为仅加载本地 CSS。
- `web/tailwind.css` 提供项目实际用到的 utility fallback（含 `game-*` 主题色与动画类）。

这保证了在无法访问 `cdn.tailwindcss.com` 的网络环境下，页面仍可正常渲染与交互。
