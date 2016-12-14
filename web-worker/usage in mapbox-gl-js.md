在mapbox-gl-js中，Web Workers主要用来做两件事：

1. 通过XMLHttpRequest获取矢量切片的数据——得到的是二进制的.pbf数据。
2. 解析第1步得到的二进制数据，转成json格式的数据，供主线程使用。

这样，就把绝大部分的IO操作和复杂的逻辑运算放到了独立的Worker线程里，提升了性能。本文主要是探讨一下Web Workers在mapbox-gl-js中的实现机制。

# 加载矢量切片的接口
在mapbox-gl-js中矢量切片是通过`VectorTileSource`（source/vector_tile_source.js）的`loadTile(tile, callback)`方法加载的。tile对象提供了矢量切片的参数，包括`zoom level`, `column`, `row`, `tileSize`，`VectorTileSource`通过矢量切片的url和tile的参数，拼出该切片的url，请求切片数据。关于矢量切片的参数请参考[TODO: Add link here]。

加载矢量切片的几个关键方法
```
// VectorTileSource
loadTile(tile, callback) {
  ...
  tile.workerID = this.dispatcher.send('loadTile', params, done.bind(this));
  ...
  function done(err, data) {
    ...
    tile.loadVectorData(data, this.map.painter);
    ...
  }
}

// Tile
loadVectorData(data, painter) {
  ...
  this.collisionBoxArray = new CollisionBoxArray(data.collisionBoxArray);
  this.collisionTile = new CollisionTile(data.collisionTile, this.collisionBoxArray);
  this.symbolInstancesArray = new SymbolInstancesArray(data.symbolInstancesArray);
  this.symbolQuadsArray = new SymbolQuadsArray(data.symbolQuadsArray);
  this.featureIndex = new FeatureIndex(data.featureIndex, this.rawTileData, this.collisionTile);
  this.buckets = Bucket.deserialize(data.buckets, painter.style);
}
```

`this.dispatcher.send('loadTile', params, done.bind(this))`这段代码发送了一个命令，参数`'loadTile'`指定命令的类型，params封装了矢量切片的参数，而done是在获取到切片数据以后的回调函数。在回调函数中我们可以看到，data已经是一个处理好的json对象了，可以直接使用它的内部数据来创建需要的内容。其实不难想象send命令里要做的事情，一是获取二进制格式的矢量切片数据；而是把这个数据转换成我们想要的形式。

# Dispatcher和Actor
`Actor`(util/actor.js)对象是mapbox-gl-js中主线程和Worker线程之间沟通的桥梁。Actor本身还是一种设计模式的实现，有兴趣的可以深入了解一下这种设计模式[Actor disign pattern](http://en.wikipedia.org/wiki/Actor_model)。它的成员函数主要有两个：

```
send(type, data, callback, buffers, targetMapId)
receive(message)
```

非常容易让人迷惑的是这个Actor对象既出现在主线程里，又出现在Worker线程里，单看Actor的源代码，很难理解。

```
send(type, data, callback, buffers, targetMapId) {
    ...
    this.target.postMessage(...);
}

receive(message) {
  ...
  const done = (err, data, buffers) => {
      this.target.postMessage(...);
  };
}
```

比如这两段，在send函数里调用`this.target.postMessage`给Worker线程发消息这比较好理解；但是在receive函数里定义的回调函数done又调用了`this.target.postMessage`，难道又是向同一个Worker线程再发一个消息吗？No， 虽然两处的语句看上去是一样的，但是里面的`target`含义完全不同。send里的`this.target`是一个Worker对象，也就是说，它是从主线程向Worker线程发消息。而receive里的`this.target`指的是Worker线程里的self对象，它是从Worker线程把处理好的数据发回给主线程。

## 主线程里的Actors
主线程里的Actors是通过`Dispatcher`（util/dispatcher.js）管理的。每个Actor的target属性都指向一个Worker对象。

```
constructor(workerPool, parent) {
  this.workerPool = workerPool;
  this.actors = [];
  this.currentActor = 0;
  this.id = util.uniqueId();
  const workers = this.workerPool.acquire(this.id);
  for (let i = 0; i < workers.length; i++) {
      const worker = workers[i];
      const actor = new Actor(worker, parent, this.id);
      actor.name = `Worker ${i}`;
      this.actors.push(actor);
  }
}
```

从它的构造函数可以看出，Dispatcher就是从workerPool中获取一个Web Workers的数组，然后把每个Worker对象封装到Actor里。每个Actor的target都指向一个Worker。其中parent指向Style对象（style/style.js）。

Dispatcher的方法也比较简单，broadcast方法将消息向所有的Workers广播，而send方法把消息发送给其中的一个Worker对象。值得一提的是，send里用了一种轮询的方式，把任务依次分配给数组中的每个Worker对象。

## Worker线程里的Actor
Worker线程里实际运行的javascript文件是`source/worker.js`。在它的构造函数中新建了一个Actor对象：

```
class Worker {
  constructor(self) {
    ...
    this.actor = new Actor(self, this);
    ...
  }
  ...
}
```

在这个Actor里，target就是Worker线程里的self，而parent指向的是Worker本身。我们可以看到，在这个Worker对象里也定义了类似loadTile这样的方法。不同的是，它只是一个代理，在运行时，它会根据请求的矢量切片的类型，选择`VectorTileWorkerSource`或者`GeoJSONWorkerSource`调用相应的方法。以`VectorTileWorkerSource`为例，它的`loadTile(params, callback)`方法调用ajax的函数获取矢量切片数据，得到ArrayBuffer数据，然后通过`WorkerTile`(source/worker_tile.js)的parse函数将其解析成json格式的数据，这些都是在Worker线程里完成的。处理完以后，最后再由actor的postMessage方法把数据返回给主线程。