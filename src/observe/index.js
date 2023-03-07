
export function observe(data) {
    // 对data这个对象进行劫持
    // 5-1 判断是否是对象 // 只对对象进行劫持
    if (typeof data !== 'object' || data == null) {
        return
    }

    // 5-2 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
    // 在内部又创建了一个类，这个类专门去观测数据的。如果这个数据被观测过，那么它的实例就是这个类
    // 对data这个数据进行观测
    return new Observer(data)

}

// 5-3
class Observer {
    constructor(data) {
        // 对这个数据的每个属性都劫持
        // Object.defineProperty只能劫持已经存在的属性，后增的、或删除的是不知道的。（vue2里会为此单独写一些api $set $delete）
        // 遍历这个对象
        this.walk(data)
    }
    walk(data) { // 循环对象，重新定义属性，对属性依次劫持
        // 重新定义属性 （性能差，相当于把属性重写了）
        // defineReactive方法 把data这个数据定义成响应式的，属性是当前的key，值是当前的data[key]。这个方法没写在类里，写在外面可以导出，其他地方也可以使用。
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    }
}

// 5-4
export function defineReactive(target, key, value) { // 属性劫持。闭包，里面的函数使用外面的value，这个变量不能被销毁
    // 5-8 深度属性劫持。针对某个属性值还是个对象
    observe(value) // 对所有的对象都进行属性劫持。
    Object.defineProperty(target, key, {
        get() { // 取值的时候会执行get
            console.log('用户取值了')
            return value
        },
        set(newValue) { // 修改的时候会执行set
            console.log('用户设置值了')
            if (newValue === value) return
            observe(newValue) // 5-9 如果修改值的时候直接赋值个对象，对这个对象里的每个属性进行劫持
            value = newValue
        }
    })

}
