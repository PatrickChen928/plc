# plc.js: 一款精准、简单获取访问全链路操作信息的工具

## 功能

- 记录访问的整条链路的起始点和终点
- 获取页面停留时间
- 获取页面某个模块的操作时间
- 过滤窗口隐藏时间
- 过滤窗口不聚焦时间
- 过滤鼠标未移动时间(2分钟)

## api

 方法名 | 参数 | 介绍
---|---|---
init | 1. page_uuid; 2. options | 初始化
getPlcId | - | 获取页面id
getStayDuration | childId?  | 获取停留时长
destoryPlc | - | 卸载该页面所有数据
createChildLifeCycle | childId | 创建子模块生命周期监控
stopChildLifeCycle | 1. childId; 2. clearDuration | 暂停子模块生命周期监控

