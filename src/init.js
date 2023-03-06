import { initState } from "./state"

export function initMixin(Vue) { // 就是给Vue增加init方法
    Vue.prototype._init = function(options) { // 用于初始化操作
        // vue vm.$options 就是获取用户的配置
        // 我们使用 vue的时候，所有以$开头的都是vue自己的属性。$nextTick $data $attr....
        // 1. 把这个options放在实例上，在其他的方法里也可以拿到了。
        const vm = this // 将实例this赋值给vm
        vm.$options = options // 将用户的选项挂载到实例上

        // 2. 初始化状态：data 事件 计算属性等
        initState(vm)

    }
}

