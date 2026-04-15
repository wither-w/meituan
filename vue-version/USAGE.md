# 📚 Vue版本使用指南

## 两种使用方法

### 方案 A：直接使用（推荐新手）⭐

最简单的方法，无需任何构建步骤。

#### 步骤：

1. **打开Tampermonkey**  
   - 在浏览器中打开Tampermonkey插件

2. **创建新脚本**  
   - 点击 `+` 按钮创建新脚本

3. **复制代码**  
   - 打开文件 `meituan-vue-final.user.js`
   - 全部复制内容到Tampermonkey编辑器

4. **保存并启用**  
   - Ctrl+S 保存
   - 刷新美团网页测试

**优点**：零配置，即插即用  
**缺点**：修改代码需要直接编辑UI部分

---

### 方案 B：完整开发工作流（推荐开发者）⭐⭐

使用Vue + Vite完整开发环境，便于维护和扩展。

#### 前置要求：

- Node.js >= 14
- npm 或 yarn

#### 步骤：

1. **安装依赖**

```bash
cd vue-version
npm install
```

2. **开发模式**（可选）

```bash
npm run dev
```

3. **构建项目**

```bash
npm run build
```

生成文件：`dist/meituan-vue-iife.js`

4. **在UserScript头部添加Tampermonkey元数据**

打开 `dist/meituan-vue-iife.js`，在最开头添加：

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
// ==/UserScript==
```

5. **在Tampermonkey中安装**

- 将完整文件添加到Tampermonkey新脚本
- 或上传到GitHub/CDN作为远程脚本

**优点**：完整开发环境，易于修改和维护  
**缺点**：需要Node.js环境和构建步骤

---

## 目录结构

```
vue-version/
├── src/
│   └── main.js                    # Vue应用源代码（可编辑）
├── dist/                          # 构建输出目录（自动生成）
│   └── meituan-vue-iife.js        # 最终脚本文件
├── meituan-vue-final.user.js      # 即插即用版本（已包含元数据）
├── package.json                   # 项目依赖配置
├── vite.config.js                # Vite构建配置
├── USAGE.md                       # 本文件
└── README.md                      # 技术文档
```

---

## 修改代码

### 修改 UI（按钮、菜单）

编辑 `src/main.js` 中的 `MenuComponent` 部分：

```javascript
const MenuComponent = {
    template: `
        <!-- 修改这里的HTML结构 -->
    `,
    setup() {
        // 修改这里的事件处理和状态管理
    }
}
```

### 修改样式

编辑 `src/main.js` 中的CSS样式部分：

```javascript
const styles = document.createElement('style');
styles.textContent = `
    /* 修改这里的CSS */
`;
```

### 修改逻辑函数

编辑 `src/main.js` 中的以下函数（均位于"原有逻辑函数"段落）：

- `getproductList()` - 商品导出逻辑
- `autofetchpage()` - 自动翻页逻辑
- `downsavepic()` - 图片下载逻辑
- 等等...

### 构建更新

修改后运行：

```bash
npm run build
```

---

## 核心功能说明

| 按钮 | 功能 | 触发逻辑 |
|------|------|--------|
| 工具按钮 | 主菜单 | 悬停显示/隐藏 |
| 商品列表 | 启用抓取并打开商品列表 | `window.__mtProductEable = true` |
| 自动翻页 | 设置分页为100条并翻页 | `autofetchpage()` |
| 下载 → 美团 | 导出商品信息为CSV | `getproductList()` |
| 下载 → 京东 | 开发中 | 暂未实现 |
| 下载 → 图片 | 下载商品图片为ZIP | `downsavepic()` + `toimageZip()` |

---

## 常见问题

### Q: 脚本不加载？

A: 检查：
- [ ] 美团网址是否正确（https://shangoue.meituan.com/*）
- [ ] Tampermonkey已启用
- [ ] 脚本已启用（左侧复选框勾选）
- 尝试刷新页面

### Q: 按钮点不了？

A: 
- 检查浏览器控制台（F12）是否有错误
- 确认Vue已正确加载（CDN版本检查网络）
- 尝试使用方案A的即插即用版本

### Q: 怎样删除脚本？

A: Tampermonkey → 找到脚本 → 点击垃圾桶图标

### Q: 能在手机上用吗？

A: 安装Violentmonkey（手机版Tampermonkey）即可使用

---

## 技术细节

- **Vue版本**: 3.4.21 (Global Build)
- **框架**: Composition API
- **打包器**: Vite
- **输出格式**: IIFE (自执行)
- **依赖**: JSZip (图片打包)

---

## 后续改进建议

- [ ] 添加设置面板（字体大小、位置调整等）
- [ ] 支持批量操作日志导出
- [ ] 添加进度条（翻页、下载进度）
- [ ] TypeScript类型支持
- [ ] 单元测试

---

## 版本历史

- **v1.0** (2026-04-12)
  - 原始脚本转换为Vue版本
  - UI重设计
  - 菜单动画优化

---

📞 有问题？检查控制台日志（F12→Console）获取调试信息
