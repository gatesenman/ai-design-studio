# AI Design Studio · v1.0.0

类似 [lovart.ai](https://lovart.ai) 的 **AI 驱动设计桌面程序**，面向电商场景：左侧聊天、右侧无限画布，支持多家文生图 / 图生图模型、批量生成、电商长图分节连贯生成、以及 Skill 工作流管理。

> 项目 》画布 》画板 》AI 驱动设计

## ⬇️ 下载安装（v1.0.0）

前往 [Releases](https://github.com/gaosichun888/ai-design-studio/releases) 下载：

| 平台 | 安装包 |
| --- | --- |
| Windows | `AI Design Studio Setup 1.0.0.exe`（NSIS 安装程序） |
| Linux | `AI Design Studio-1.0.0.AppImage` |
| macOS | 从源码构建 dmg（见 [构建与打包](docs/wiki/构建与打包.md)） |

## 📚 文档 / Wiki

完整文档见 [`docs/wiki`](docs/wiki/Home.md)：
[功能总览](docs/wiki/功能总览.md) ·
[安装与使用](docs/wiki/安装与使用.md) ·
[生图模型配置](docs/wiki/生图模型配置.md) ·
[画布操作与快捷键](docs/wiki/画布操作与快捷键.md) ·
[长图分节生成](docs/wiki/长图分节生成.md) ·
[Skill 工作流](docs/wiki/Skill工作流.md) ·
[构建与打包](docs/wiki/构建与打包.md)

## ✨ 功能

- **左聊天 / 右画布** 布局，聊天面板宽度可拖拽调节。
- **无限自由画布**（基于 Fabric.js）：缩放（滚轮 / 工具栏）、平移（空格 + 拖拽 / 中键）、多选、拖拽、复制、图层上下移、删除、文字节点、画板模板（电商主图 800×800 / 详情页 / 海报 / Banner）。
- **多模型文生图 / 图生图**，统一模型选择器一键切换：
  - 🌍 国外：**ChatGPT 生图 gpt-image-1**、OpenAI **DALL·E 3**、Google **Imagen 3**
  - 🇨🇳 国内：阿里**通义万相**、字节**即梦 Seedream**、百度**文心一格**、智谱 **CogView**、腾讯**混元生图**、**MiniMax 海螺**、**硅基流动 SiliconFlow**（聚合 Kolors / FLUX）
- **批量生成**（1–20 张），结果自动在画布上网格排列。
- **长图分节生成**：电商详情页按「标题图 → 卖点 → 细节 → 场景 → 售后」分节生成，共享 seed + 统一风格 prompt 保证各段连贯，自动垂直拼接；可框选后「导出长图」合并为一张 PNG。
- **Skill 管理**：内置「电商主图 / 电商海报 / 电商详情页」三个工作流；支持新建 / 编辑 / 删除自定义 Skill（prompt 模板 + 变量 + 默认模型/尺寸/数量），内置 Skill 可「另存为自定义」后修改。
- **Brand Kit 品牌套件**：色彩 / 字体 / 风格说明，开启后自动注入生成 prompt 进行约束。
- **导出**：单图 / 选中导出 PNG，长图拼接导出。
- **MCoT 风格推理展示**：每次生成在对话中展示「解析意图 → 选择模型 → 应用约束 → 生成」的步骤。
- **Demo 模式**：未配置 API Key 时使用内置占位图生成，可先完整体验交互流程；配置 Key 后即调用真实模型。

## 🧱 技术栈

- Electron 33 + React 18 + TypeScript + Vite
- Fabric.js 6（画布）、Zustand（状态）、TailwindCSS（样式）、lucide-react（图标）
- 各厂商生图 API 在 **主进程** 调用（避免浏览器 CORS 与 Key 泄露）；渲染进程通过 IPC 通信。

## 📁 目录结构

```
electron/                Electron 主进程
  main.ts                创建窗口 + 注册 IPC
  preload.ts             安全暴露 API 给渲染进程
  services/
    store.ts             设置 / Skill 本地持久化
    files.ts             导出图片（保存对话框）
    providers/           各生图 provider 实现 + 调度
src/                     React 渲染进程
  components/            Chat / Canvas / Skill / Settings
  stores/                Zustand stores
  services/              api 抽象层 + demo 占位生成
shared/                  主进程与渲染进程共享的类型 / provider 元数据 / 内置 Skill
```

## 🚀 开发与运行

要求 Node ≥ 20（开发使用 v22）。

```bash
npm install

# 开发模式（启动 Vite + Electron，热重载）
npm run electron:dev

# 仅构建 Web 产物（dist + dist-electron）
npm run build:web

# 打包桌面安装包（dmg / nsis / AppImage）
npm run build

# 质量检查
npm run lint
npm run typecheck
```

## 🔑 配置模型 API Key

打开应用右上角「设置」→「API Keys」，按平台填写：

| 平台 | Key 字段 | 说明 |
| --- | --- | --- |
| ChatGPT 生图 / DALL·E 3 | `openai` | `sk-...`，支持自定义 Base URL（代理/中转） |
| Google Imagen | `google` | AI Studio API Key |
| 阿里通义万相 | `dashscope` | DashScope API Key |
| 字节即梦 Seedream | `volcengine` | 火山引擎 Ark API Key |
| 百度文心一格 | `baidu` | 千帆 v2 Bearer Token (`bce-v3/...`) |
| 智谱 CogView | `zhipu` | 智谱开放平台 Key |
| 腾讯混元生图 | `tencent` | 格式 `SecretId:SecretKey` |
| MiniMax 海螺 | `minimax` | MiniMax API Key |
| 硅基流动 SiliconFlow | `siliconflow` | `sk-...`（OpenAI 兼容，支持 Kolors 图生图，推荐新手） |

> 未配置 Key 的平台会自动回退到 Demo 占位生成，方便先体验完整流程。
> 各家 Key 获取详见 [生图模型配置](docs/wiki/生图模型配置.md)。

## ⌨️ 画布快捷键（共 14 项）

| 快捷键 | 功能 |
| --- | --- |
| Ctrl + Z | 撤销 |
| Ctrl + Shift + Z / Ctrl + Y | 重做 |
| Ctrl + C / V / X | 复制 / 粘贴 / 剪切 |
| Ctrl + D | 创建副本 |
| Ctrl + A | 全选 |
| Delete / Backspace | 删除选中 |
| 方向键 | 微移 1px（Shift 为 10px） |
| [ / ] | 下移 / 上移一层 |
| Ctrl + 0 | 重置缩放 100% |
| Ctrl + 1 | 适应内容 |
| Ctrl + = / Ctrl + - | 放大 / 缩小 |
| F | 缩放到选区 |
| 空格 + 拖拽 | 平移画布 |
| Esc | 取消选择 / 关闭菜单 |

详见 [画布操作与快捷键](docs/wiki/画布操作与快捷键.md)。
