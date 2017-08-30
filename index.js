function isInSight(el) {
    const clientHeight = window.innerHeight // 获取屏幕可视窗口高度
    const scrollTop = document.body.scrollTop // 滚动条滚动的距离
        // el.offsetTop 元素相对于文档顶部的距离 
        // +100是为了提前加载
    return el.offsetTop <= clientHeight + scrollTop + 100
}

function isInSight1(el) {
    const bound = el.getBoundingClientRect()
    const clientHeight = window.innerHeight
    return bound.top <= clientHeight + 100
}

function loadImg(el) {
    if (!el.src) {
        const source = el.dataset.src
        el.src = source
        console.log(el.src)
        el.removeAttribute('data-src')
    }
}

function throttle(fn, mustRun = 500) {
    const timer = null
    let previous = null
    return function() {
        const now = new Date()
        const context = this
        const args = arguments
        if (!previous) {
            previous = now
        }
        const remaining = now - previous
        if (mustRun && remaining >= mustRun) {
            fn.apply(context, args)
            previous = now
        }
    }
}

function checkImgs2() {
    const imgs = document.querySelectorAll('img[data-src]')
    Array.from(imgs).forEach(el => {
        if (isInSight1(el)) {
            loadImg(el)
        }
    })

}

function checkImgs() {
    if (!window.hasOwnProperty('IntersectionObserver')) {
        alert('您的浏览器不资辞 IntersectionObserver')
        checkImgs2()
        window.onscroll = throttle(checkImgs2)
        return
    }
    const io = new IntersectionObserver(ioes => {
        ioes.forEach(ioe => {
            const el = ioe.target
            const intersectionRatio = ioe.intersectionRatio
            if (intersectionRatio > 0 && intersectionRatio <= 1) {
                loadImg(el)
            }
            el.onload = el.onerror = () => io.unobserve(el)
        })
    })

    const imgs = Array.from(document.querySelectorAll('img[data-src]'))
    imgs.forEach(item => io.observe(item))
}

function backToTop() {
    let time = setInterval(() => {
        let osTop = document.documentElement.scrollTop || document.body.scrollTop
        let speed = Math.floor(-osTop / 10)
        document.documentElement.scrollTop = document.body.scrollTop = osTop + speed
        if (osTop == 0) {
            clearInterval(time)
        }
    }, 10)
}
