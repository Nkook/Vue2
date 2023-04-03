import Dep from "./observe/dep";
import { observe } from "./observe/index"
import Watcher from "./observe/watcher";

export function initState(vm) {
    const opts = vm.$options // 获取所有的选项
    // 3. 如果选项中有data属性，则做数据初始化
    if (opts.data) {
        initData(vm)
    }

    // 第13节课计算属性
    if (opts.computed) {
        initComputed(vm);
    }
}
// 4. 数据初始化
function initData(vm) {
    let data = vm.$options.data // data可能是函数和对象
    data = typeof data === 'function' ? data.call(vm) : data // data是用户返回的对象
    console.log(data)

    // 5-5
    // 把对象放在了实例上，并对这个对象进行了观测。此时去打印vm，会发现有个_data属性下面有name和age及其对应的get和set；但是取值需要通过vm._data.name取，无法直接通过vm.name取值
    vm._data = data // 我将返回的对象放到了_data上

    // 5. 对数据进行劫持
    // vue2采用了一个api defineProperty
    // 提供一个方法observe 去观测data数据: 响应式模块
    observe(data)

    // 5-6 想通过vm.xxx直接取值，需要将vm_data 用vm来代理就可以了。自己定义个方法
    for(let key in data) {
        proxy(vm, '_data', key) // 代理实例vm上的某个属性key叫_data。其实就是代理_data这个属性
    }

}

// 5-7
function proxy(vm, target, key) {
    // 给vm对象，添加一个属性key，并给每个属性增加存取描述符属性
    Object.defineProperty(vm, key, { // vm.name
        get() {
            return vm[target][key]   // vm._data.name
        },
        set(newValue) {
            vm[target][key] = newValue
        }
    })
}
// 到这里就有两次数据劫持，一次是把用户的数据进行了属性劫持，一次是代理，当取值的时候代理到了某个值

// 第13节课 计算属性
function initComputed(vm) {
    // 取到用户写的所有的计算属性：存在两种写法
    const computed = vm.$options.computed;
    const watchers = vm._computedWatchers = {}; // 将计算属性watcher保存到vm上
    for (let key in computed) { // 根据是对象还是函数分别做处理。
        let userDef = computed[key];

        // 我们需要监控 计算属性中get的变化
        let fn = typeof userDef === 'function' ? userDef : userDef.get

        // 如果直接new Watcher 默认就会执行fn, 将属性和watcher对应起来 
        // 不希望fn立刻执行，希望取值的时候再执行，增加{ lazy: true }
        watchers[key] = new Watcher(vm, fn, { lazy: true }) // 一个计算属性对应一个watcher

        defineComputed(vm, key, userDef); // 定义的时候就给当前vm实例上增加一个fullname，值为一个函数
    }
}
function defineComputed(target, key, userDef) {
    // const getter = typeof userDef === 'function' ? userDef : userDef.get;
    const setter = userDef.set || (() => { })

    // 可以通过实例拿到对应的属性
    Object.defineProperty(target, key, {
        get: createComputedGetter(key), // 页面{{fullname}} 取值时就会走这个get。现在是每次取值都走一遍，需要根据属性值没有变化时，不再走get
        set: setter
    })
}
// 计算属性根本不会收集依赖 ，只会让自己的依赖属性去收集依赖
function createComputedGetter(key) {
    // 我们需要检测是否要执行这个getter
    return function () { 
        const watcher = this._computedWatchers[key]; // 获取到对应属性的watcher // this是当前的vm
        if (watcher.dirty) {
            // 如果是脏的就去执行 用户传入的 函数
            watcher.evaluate(); // 求值后 dirty变为了false ,下次就不求值了
        }
        if (Dep.target) { // 计算属性出栈后 还要渲染watcher， 我应该让计算属性watcher里面的属性 也去收集上一层watcher
            watcher.depend();
        }
        return watcher.value; // 最后返回的是watcher上的值
    }
}