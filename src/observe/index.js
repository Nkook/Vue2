import { newArrayProto } from './array'

export function observe(data) {
    // 对data这个对象进行劫持
    // 5-1 判断是否是对象 // 只对对象进行劫持
    if (typeof data !== 'object' || data == null) {
        return
    }
    // 6-5 如果data上有个属性叫__ob__，它是类Observer的实例，说明这个对象被监测过了，直接把实例返回，不需要再观测了
    if (data.__ob__ instanceof Observer) {
        return data.__ob__
    }

    // 5-2 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
    // 在内部又创建了一个类，这个类专门去观测数据的。如果这个数据被观测过，那么它的实例就是这个类
    // 对data这个数据进行观测
    return new Observer(data)

}

// 5-3
class Observer {
    constructor(data) {
        // 6-6 如果data是个对象的话，也会加一个__ob__属性，然后进入else中，去遍历每一项，遍历到__ob__发现是个对象；会再次进入到Observer中，再添加个_ob__这样就形成了死循环。？？？？【这里理解不透彻】
        // 不能让data作为对象循环的时候遍历到这个__ob__属性，把它变成不可枚举类型，就可以了
        Object.defineProperty(data, '__ob__', {
            value: this,
            enumerable: false // 将__ob__变成不可枚举（循环的时候无法获取到）
        })
        // // 6-4 // 在data上加一个自定义属性__ob__ 把this放上去，把，this指的是Observer的实例对象
        // data.__ob__ = this  // 给数据加了一个标识，如果数据上有__ob__则说明这个属性被观测过了
        // 6-1 对象可以遍历，数组有很多个，遍历会造成性能差。如果是数组，
        if (Array.isArray(data)) {
            // 6-3 这里可以重写数组中的方法 7个变异方法，是可以修改数组本身的。
            data.__proto__ = newArrayProto // 需要保留数组原有的特性，并且可以重写部分方法
            this.observeArray(data) // 如果数组中放的是对象，可以监控到对象的变化。
        } else {
            // 5-3 对这个数据的每个属性都劫持
            // Object.defineProperty只能劫持已经存在的属性，后增的、或删除的是不知道的。（vue2里会为此单独写一些api $set $delete）
            // 遍历这个对象
            this.walk(data)
        }
    }

    // 5-3 遍历对象进行观测
    walk(data) { // 循环对象，重新定义属性，对属性依次劫持
        // 重新定义属性 （性能差，相当于把属性重写了）
        // defineReactive方法 把data这个数据定义成响应式的，属性是当前的key，值是当前的data[key]。这个方法没写在类里，写在外面可以导出，其他地方也可以使用。
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    }
    // 6-2 遍历数组进行观测
    observeArray(data) {
        data.forEach(item => observe(item)) // 如果数组中存在引用类型，则劫持该项中的每一个属性
    }
}

// 5-4
export function defineReactive(target, key, value) { // 属性劫持。闭包，里面的函数使用外面的value，这个变量不能被销毁
    // 5-8 深度属性劫持。针对某个属性值还是个对象
    observe(value) // 对所有的对象都进行属性劫持。
    // 5-4
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
