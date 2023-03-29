// 重写数组中的部分方法，最后把重写的对象返回出去

// 1. 首先拿到原来的数组的方法，通过原型
let oldArrayProto = Array.prototype

// 2. 不能直接修改原来的，需要扩展出来一份。生成一份新的数组方法
// newArrayProto.__proto__ = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto) // Object.create() 方法用于创建一个新对象，使用现有的对象来作为新创建对象的原型（prototype）。


// 找到所有的变异方法，就是能修改原数组的方法
let methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
] // concat slice都不会改变原数组

// 3. 重写这个方法
methods.forEach(method => {
    // arr.push(1, 2, 3)
    newArrayProto[method] = function(...args) { // 这里重写了数组的方法
        // push.call(arr)
        // todo...
        const result = oldArrayProto[method].call(this, ...args) // 内部调用原来的方法，函数的劫持，叫做切片编程。这里的this谁调用方法push就指向谁，arr.push调用就指向arr
        
        console.log('method', method)
        // 5. 拿到实例上的observeArray方法: 这里的this指的是调用方法的，data调用的，指向data,从data上获取属性__ob__，这个属性指向Observer的实例，拿到实例对象，就可以用它身上的observeArray方法
        let ob = this.__ob__
        // 4. 需要对新增的 数据再次进行劫持
        let inserted
        switch (method) {
            case 'push':
            case 'unshift': // arr.unshift(1, 2, 3)
                inserted = args
                break;
            case 'splice': // arr.splice(0, 1, {a: 1}, {b: 2})
                inserted = args.slice(2) // 截取从索引2开始往后的数据
            default:
                break;
        }

        console.log(inserted) // 新增的内容
        if (inserted) {
            // 6. 对新增的内容再次进行观测：如何观测？还是通过前面的observeArray去观测，但是这里是拿不到observeArray的，
            // 只能拿到this，this指的是调用方法的对象，谁调用这些方法，this就是谁。在index.js可以看到data.__proto__ = newArrayProto，是data调用的这些方法，那么this指的就是data
            ob.observeArray(inserted)

        }


        // 11-4 
        // console.log('更新了')
        ob.dep.notify()
        
        return result
    }
})
