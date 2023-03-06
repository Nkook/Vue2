import { observe } from "./observe/index"

export function initState(vm) {
    const opts = vm.$options // 获取所有的选项
    // 3. 如果选项中有data属性，则做数据初始化
    if (opts.data) {
        initData(vm)
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