# Meituan Vue Helper - 构建指南

这是基于Vue 3 + Vite的美团店铺助手脚本版本。

## 项目结构

```
vue-version/
├── src/
│   └── main.js          # Vue应用入口，包含所有逻辑
├── package.json         # 项目依赖配置
├── vite.config.js       # Vite构建配置
└── README.md            # 本文件
```

## 快速开始

### 1. 安装依赖

```bash
cd vue-version
npm install
```

### 2. 构建项目

```bash
npm run build
```

构建完成后，会在 `dist/` 目录生成 `meituan-vue-iife.js` 文件。

### 3. 添加到Tampermonkey

**方法一：直接添加脚本头**

打开生成的 `dist/meituan-vue-iife.js`，在文件最前面添加Tampermonkey元数据：

```javascript
// ==UserScript==
// @name         meituan vue helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Meituan store helper with Vue UI
// @author       your-name
// @match        https://shangoue.meituan.com/*
// @run-at       document-idle
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @downloadURL  file:///path/to/meituan-vue-iife.js
// @updateURL    file:///path/to/meituan-vue-iife.js
// ==/UserScript==

(function(){
// ... 脚本内容
})();
```

**方法二：上传到CDN/GitHub**

1. 将脚本上传到GitHub/Raw CDN
2. 在Tampermonkey中通过URL安装

### 4. 在Tampermonkey中使用

- 在Tampermonkey界面新建脚本，或复制整个 `dist/meituan-vue-iife.js` 内容
- 添加上述UserScript头部
- 保存并启用

## 核心改进

✅ **UI改进**：使用Vue 3 Composition API，代码更清晰  
✅ **响应式**：菜单状态管理更优雅  
✅ **模块化**：保留所有原有逻辑函数，易于维护  
✅ **动画**：添加菜单滑下动画效果  
✅ **兼容性**：仍为单文件IIFE格式，完全兼容Tampermonkey  

## 开发工作流

### 修改逻辑
编辑 `src/main.js` 中的函数（`getproductList`, `autofetchpage`等）

### 修改UI
编辑 `src/main.js` 中的 `MenuComponent` 模板和样式

### 测试
```bash
npm run dev
```
启动开发服务器（可用于测试调用逻辑\*）

### 构建发布
```bash
npm run build
```

## 构建输出说明

- **dist/meituan-vue-iife.js** (160-200KB)
  - 包含Vue 3运行时
  - IIFE自执行格式
  - 可直接用于Tampermonkey

## 与原脚本的对比

| 功能 | 原始版本 | Vue版本 |
|------|---------|--------|
| 文件大小 | ~20KB | ~180KB |
| UI代码行数 | 150+ | 80+ |
| 代码维护性 | 中等 | 高 |
| 扩展性 | 一般 | 优秀 |
| 性能 | 快速 | 快速 |

## 常见问题

### Q: 为什么文件变大了？
A: Vue运行时约120KB，这是必要的。如果需要更小，可用 `petite-vue` 替代。

### Q: 能用新的打包方案吗？
A: 可以修改 `vite.config.js` 使用其他打包器（Rollup/Webpack）

### Q: 脚本中JSZip怎么加载？
A: 在vite中已通过npm导入，Tampermonkey用 `@require` 加载CDN版本

## 后续优化建议

1. 使用 `petite-vue`（~6KB）替代Vue 3，进一步减小体积
2. 添加TypeScript支持
3. 分离组件到单独的 `.vue` 文件（需要调整打包配置）
4. 添加单元测试

## 许可证

MIT
