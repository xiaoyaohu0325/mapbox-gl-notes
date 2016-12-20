Mapbox GL JS自己定义了一个Evented类，用于触发事件和添加监听函数。它提供了以下方法：

* on(type: string, listener: Function)  监听某个事件
* off(type: string, listener: Function) 移除某个之前添加的监听函数
* once(type: string, listener: Function) 注册一个监听函数，但是这个监听函数执行一次后就会被移除
* fire(type: string, data) 触发一个事件
* listens(type: string) 检查该对象以及它的父对象是否包含特定事件的监听函数
* setEventedParent(parent: Evented, data) 设置父对象，使得该对象fire函数触发的事件会冒泡给父对象