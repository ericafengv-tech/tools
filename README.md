# 出行可达范围地图

基于高德地图的出行可达范围可视化工具，支持公共交通和驾车两种模式，帮助你了解从任意地点出发在指定时间内能到达的范围。

## 功能特性

### 🚌 公共交通模式
- 查询指定地点周围公交、地铁、磁悬浮、市域铁路线路
- 支持步行范围设置（200m - 2km）
- 支持骑行接驳（扩大可达范围）
- 时间范围筛选（显示指定时间内可到达的站点）

### 🚗 驾车模式
- 计算驾车可达范围（5-60分钟）
- 拥堵系数估算（自动/手动模式）
  - 自动模式：根据出发时间智能估算（早晚高峰、平峰、周末等）
  - 手动模式：滑块自由调节拥堵程度
- 支持驾车+地铁组合出行
- 未来出发时间设置

### 🎨 界面特性
- 深色/浅色主题切换
- 响应式设计
- 地址搜索与自动补全

## 在线使用

访问：**https://ericafengv-tech.github.io/tools/**

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 配置说明

首次使用需要配置高德地图 API Key：

1. 注册 [高德开放平台](https://lbs.amap.com/) 账号
2. 创建应用，获取 **JS API Key** 和 **安全密钥**
3. 在网站右上角设置中填入

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- NextUI
- Zustand
- 高德地图 JS API 2.0

## 致谢

本项目基于 [daibor/bus-route-radiation-map](https://github.com/daibor/bus-route-radiation-map) 二次开发。

## License

MIT
