# 听雨 (TingYu) 🌧️

**听雨** 是一款基于 Electron 和 React 构建的极简主义桌面音乐播放器。它旨在提供沉浸式的听觉体验，配合优雅的视觉效果，让你在喧嚣中找到一片宁静。

![App Icon](Icon-iOS-Default-1024x1024@1x.png)

## ✨ 特性

*   **极简设计**: 无边框窗口，沉浸式 UI，专注于音乐本身。
*   **动态视觉**: 内置动态雨滴背景 (RainCanvas)，随音乐律动。
*   **本地播放**: 支持拖拽或选择本地音频文件播放。
*   **原生体验**: 针对 macOS 优化的标题栏和系统集成。
*   **现代技术栈**: 使用最新的 Web 技术构建，性能卓越。

## 🛠️ 技术栈

*   **Core**: [Electron](https://www.electronjs.org/)
*   **UI Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 快速开始

### 环境要求

*   Node.js (推荐 v18+)
*   npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式运行

启动本地开发服务器和 Electron 窗口：

```bash
npm run dev
```

### 打包构建

构建生产环境应用 (macOS/Windows/Linux)：

```bash
npm run electron:build
```

构建产物将位于 `release` 目录下。

## 📂 项目结构

*   `electron/` - Electron 主进程代码
*   `src/` - React 渲染进程代码
*   `components/` - UI 组件 (播放器控制、播放列表、雨滴效果等)
*   `utils/` - 工具函数
*   `dist/` - Vite 构建输出
*   `release/` - Electron 打包输出

## 📄 许可证

[MIT](LICENSE)
