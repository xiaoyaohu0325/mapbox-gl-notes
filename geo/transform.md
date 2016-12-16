# 坐标之间的转换
在已知切片尺寸tileSize和切片级别n的情况下，经纬度坐标，像素坐标和切片坐标之间是可以互相转换的。值得一提的是，在矢量切片中，
切片级别n可以是一个小数，比如2.3。展现的时候就是把级别2的切片数据按一定比例进行放大，因为是矢量数据，所以这种放大并不会像栅格
切片那样降低地图的显示质量。

## 经纬度和像素坐标之间的转换
这个转换所使用的就是Web Mercator投影公式。给定切片尺寸tileSize和切片级别n，整个投影区域的大小`worldSize = tileSize * 2^n`。
经度和像素坐标之间是一个线性变换，将[-180, 180]区间的经度值转换成[0, worldSize]的像素值。

经度和像素坐标之间的转换
```
lngX(lng: number, worldSize: number) {
  return (180 + lng) * worldSize / 360;
}
```

纬度和像素坐标之间是一个非线性变换，公式`const y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));`。
对于纬度区间[-90, 90]，这个公式的值域是负无穷到正无穷。为了使投影后的值能够正常的表示，对纬度的范围作了一个限定，即[-85.051129, 85.051129]，这样计算得到的y值范围也是[-180, 180]，与经度的定义域一样。接下来y与像素坐标之间的转换也是简单的线性变换，唯一需要注意的是
y轴的正方向和纬度正方向是相反的，所以公式做了一个反转处理，即当纬度是最大值85.051129时，像素坐标为0，纬度取最小值-85.051129，像素坐标
是worldSize。

纬度和像素坐标的转换
```
latY(lat: number, worldSize: number) {
  const y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  return (180 - y) * worldSize / 360;
}
```

已知像素坐标，转换成经纬度时，就是上述两个函数的反函数计算：

```
xLng(x, worldSize) {
  return x * 360 / worldSize - 180;
}

yLat(y, worldSize) {
  const y2 = 180 - y * 360 / worldSize;
  return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}
```

# 经纬度和切片坐标的转换
## 经纬度转切片坐标
经纬度转切片坐标，就是给定一个经纬度，返回包含该点的切片的坐标。先将经纬度转成像素坐标，再根据像素坐标确定切片的位置。

```
locationCoordinate(lnglat) {
  return new Coordinate(
    this.lngX(lnglat.lng) / this.tileSize,
    this.latY(lnglat.lat) / this.tileSize,
    this.zoom).zoomTo(this.tileZoom);
}
```

其中this.zoom是当前地图的切片级别，可能是一个浮点数，比如2.3，而this.tileZoom是一个整数，表示当前地图是在这个切片级别上进行的放大操作。
如果this.zoom等于2.3，那么this.tileZoom应该等于2。

## 切片坐标转经纬度坐标
切片坐标转经纬度，就是给定一个切片坐标，返回该切片左上角顶点（原点）处的经纬度坐标。

```
coordinateLocation(coord) {
  const zoomedCoord = coord.zoomTo(this.zoom);
  return new LngLat(
      this.xLng(zoomedCoord.column * this.tileSize),
      this.yLat(zoomedCoord.row * this.tileSize));
}
```