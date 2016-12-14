Web Workers是html5规范中引入的概念，用于解决客户端JavaScript无法多线程的问题。每个Worker相当于一个独立的线程，
在这个线程里几乎可以运行任何javascript代码，比如一些逻辑运算，通过XMLHttpRequest发送异步请求。但是也有几个例外，
首先不能直接操作DOM；其次window变量提供的一部分默认方法和属性在Worker线程里没法使用，这是因为Worker线程运行的
全局环境和主线程是不同的，它不能通过window来访问全局变量，而要用self。

主流的浏览器（包括IE10）都支持Web Workers，要检查浏览器是否支持Web Workers，只要检查`typeof window.Worker`
是否是undefined。创建一个Worker非常简单，只需要提供在Worker线程中运行的javascript文件的路径即可，而且这个文件并不
需要先在html文件中加载: `var myWorker = new Worker('./afile.js');`

Worker线程与主线程之间以消息的方式通信，消息中的数据是拷贝而不是共享的。也就是说，对象先序列化，然后传给Worker线程，在
Worker线程中先反序列化，然后使用。反之亦然。大部分浏览器都是用[结构化拷贝算法](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/The_structured_clone_algorithm)来实现这个功能的。

下面是一个简单的例子：

message.html
```
<input id="inputElem" type="text" size="50">
<input id="sumBtn" type="button" value="sum"/>
<script type="text/javascript">
  var sumWorker = new Worker('./sum-worker.js');
  var btnElem = document.getElementById('sumBtn');
  var inputElem = document.getElementById('inputElem');

  btnElem.addEventListener('click', function() {
    sumWorker.postMessage(inputElem.value);
  });
  sumWorker.addEventListener('message', function(message) {
    alert(message.data);
  });
</script>
```

* 首先创建一个Worker对象，在Worker线程中要运行的是`sum-worker.js`中的代码。
* 用户在输入框中输入一串数字，以逗号间隔。点击“sum”按钮的时候，调用Worker实例的postMessage方法，把文本框的内容作为要传递的数据发送给Worker线程。
* 给Worker对象添加了一个'message'事件的监听函数，它负责监听从Worker线程发回来的消息。

sum-worker.js
```
self.addEventListener('message', function (message) {
  console.log('sum worker get message: ' + message.data);
  var inputs = message.data.split(',');
  var result = 0;
  for (var i=0;i<inputs.length;i++) {
    result += +inputs[i];
  }
  self.postMessage(result);
});
```

* 在Worker线程中不能通过window来访问全局变量，而要用self。
* 首先添加了一个'message'事件的监听函数，监听来自主线程用Worker对象的postMessage方法发来的消息。
* 将消息中的数据提取出来，做求和计算以后，再以postMessage方法把结果发给主线程。

从中也可以看出，主线程中的Worker对象和Worker线程是一一对应的。Worker对象的postMessage把消息发给对应的Worker线程，在worker线程中运行的代码通过全局的postMessage把消息发送给Worker对象。