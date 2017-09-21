# lazyload
Lazyload demo

[demo地址](https://lz5z.com/lazyload)

## 懒加载

Lazyload 可以加快网页访问速度，减少请求，实现思路就是判断图片元素是否可见来决定是否加载图片。当图片位于浏览器视口 (viewport) 中时，动态设置 `<img>` 标签的 src 属性，浏览器会根据 src 属性发送请求加载图片。

## 懒加载实现

首先不设置 src 属性，将图片真正的 url 放在另外一个属性 data-src 中，在图片即将进入浏览器可视区域之前，将 url 取出放到 src 中。

懒加载的关键是**如何判断图片处于浏览器可视范围内**，通常有三种方法：
<!--more-->

### 方法一

通过对比屏幕可视窗口高度和浏览器滚动距离与元素相对文档顶部的距离之间的关系，判断元素是否可见。


示意图如下：

<img src="./images/lazyload.svg" alt="lazyload.svg">

代码如下：

```javascript
function isInSight(el) {
    const clientHeight = window.innerHeight // 获取屏幕可视窗口高度
    const scrollTop = document.body.scrollTop // 浏览器窗口顶部与文档顶部之间的距离
    // el.offsetTop 元素相对于文档顶部的距离 
    // +100是为了提前加载
    return el.offsetTop <= clientHeight + scrollTop + 100
}
```

### 方法二

通过 getBoundingClientRect() 获取图片相对于浏览器视窗的位置

示意图如下：

<img src="./images/lazyload1.svg" alt="lazyload1.svg">

getBoundingClientRect() 方法返回一个 ClientRect 对象，里面包含元素的位置和大小的信息

```javascript
ClientRect {
	bottom: 596,
	height: 596,
	left: 0,
	right: 1920,
	top: 0,
	width: 1920
}
```

其中位置是相对于浏览器视图左上角而言。代码如下：

```javascript
function isInSight1(el) {
    const bound = el.getBoundingClientRect() 
    const clientHeight = window.innerHeight // 表示浏览器可视区域的高度
    // bound.top 表示图片到可视区域顶部距离
    // +100是为了提前加载
    return bound.top <= clientHeight + 100 
}
```

### 方法三

使用 IntersectionObserver API，观察元素是否可见。“可见”的本质是目标元素与 viewport 是否有交叉区，所以这个 API 叫做“交叉观察器”。

实现方式

```javascript
function loadImg(el) {
    if (!el.src) {
        const source = el.dataset.src
        el.src = source
        el.removeAttribute('data-src')
    }
}

const io = new IntersectionObserver(entries => {
	for (const entry of entries) {
        const el = entry.target
        const intersectionRatio = entry.intersectionRatio
        if (intersectionRatio > 0 && intersectionRatio <= 1) {
            loadImg(el)
        }
        el.onload = el.onerror = () => io.unobserve(el)
    }
})

function checkImgs() {
    const imgs = Array.from(document.querySelectorAll('img[data-src]'))
    imgs.forEach(item => io.observe(item))
}
```

## IntersectionObserver

IntersectionObserver 的作用就是检测一个元素是否可见，以及元素什么时候进入或者离开浏览器视口。

### 兼容性

- Chrome 51+（发布于 2016-05-25）
- Android 5+ （Chrome 56 发布于 2017-02-06）
- Edge 15 （2017-04-11）
- iOS 不支持

### Polyfill

WICG 提供了一个 [polyfill](https://github.com/w3c/IntersectionObserver)

### API

```javascript
const io = new IntersectionObserver(callback, option)
```

IntersectionObserver 是一个构造函数，接受两个参数，第一个参数是可见性变化时的回调函数，第二个参数定制了一些关于可见性的参数（可选），IntersectionObserver 实例化后返回一个观察器，可以指定观察哪些 DOM 节点。

下面是一个最简单的应用：

```javascript
// 1. 获取 img
const img = document.querySelector('img')
// 2. 实例化 IntersectionObserver，添加 img 出现在 viewport 瞬间的回调
const observer =  new IntersectionObserver(changes => { 
  console.log('我出现了！') 
});
// 3. 开始监听 img
observer.observe(img)
```

(1) callback

回调 callback 接受一个数组作为参数，数组元素是 IntersectionObserverEntry 对象。IntersectionObserverEntry 对象上有7个属性，

```javascript
IntersectionObserverEntry {
	time: 72.15500000000002, 
	rootBounds: ClientRect, 
	boundingClientRect: ClientRect, 
	intersectionRatio: 0.4502074718475342,
	intersectionRect: ClientRect, 
	isIntersecting: true,
	target: img
}
```
- boundingClientRect: 对 observe 的元素执行 getBoundingClientRect 的结果
- rootBounds: 对根视图执行 getBoundingClientRect 的结果
- intersectionRect: 目标元素与视口（或根元素）的交叉区域的信息
- target: observe 的对象，如上述代码就是 img
- time: 过了多久才出现在 viewport 内
- intersectionRatio：目标元素的可见比例，intersectionRect 占 boundingClientRect 的比例，完全可见时为1，完全不可见时小于等于0
- isIntersecting: 目标元素是否处于视口中

(2) option

假如我们需要特殊的触发条件，比如元素可见性为一半的时候触发，或者我们需要更改根元素，这时就需要配置第二个参数 option 了。

通过设置 option 的 threshold 改变回调函数的触发条件，threshold 是一个范围为0到1数组，默认值是[0]，也就是在元素可见高度变为0时就会触发。如果赋值为 [0, 0.5, 1]，那回调就会在元素可见高度是0%，50%，100%时，各触发一次回调。

```javascript
const observer =  new IntersectionObserver((changes) => { 
  console.log(changes.length); 
}, {
  root: null, 
  rootMargin: '20px', 
  threshold: [0, 0.5, 1]
});
```

root 参数默认是 null，也就是浏览器的 viewport，可以设置为其它元素，rootMargin 参数可以给 root 元素添加一个 margin，如 `rootMargin: '20px'` 时，回调会在元素出现前 20px 提前调用，消失后延迟 20px 调用回调。

(3) 观察器

```javascript
// 开始观察
io.observe(document.getElementById('root'))

// 观察多个 DOM 元素
io.observe(elementA)
io.observe(elementB)

// 停止观察
io.unobserve(element)

// 关闭观察器
io.disconnect()
```

### 使用 IntersectionObserver 优势

使用前两种方式实现 lazyload 都需要监听浏览器 scroll 事件，而且要对每个目标元素执行 getBoundingClientRect() 方法以获取所需信息，这些代码都在主线程上运行，所以可能造成性能问题。

Intersection Observer API 会注册一个回调方法，每当期望被监视的元素进入或者退出另外一个元素的时候(或者浏览器的视口)该回调方法将会被执行，或者两个元素的交集部分大小发生变化的时候回调方法也会被执行。通过这种方式，网站将不需要为了监听两个元素的交集变化而在主线程里面做任何操作，并且浏览器可以帮助我们优化和管理两个元素的交集变化。

## 参考资料

1. [原生 JS 实现最简单的图片懒加载](https://juejin.im/entry/599a78be6fb9a0247e424d67)
2. [IntersectionObserver](https://github.com/justjavac/the-front-end-knowledge-you-may-dont-know/issues/10)
3. [IntersectionObserver API 使用教程](http://www.ruanyifeng.com/blog/2016/11/intersectionobserver_api.html)
4. [MDN-Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API#Browser_compatibility)

---

> [lz5z.com](https://lz5z.com) &nbsp;&middot;&nbsp;
> GitHub [@Leo555](https://github.com/Leo555) &nbsp;&middot;&nbsp;
