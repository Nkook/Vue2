import { initState } from "./state"
// import { compileToFunction } from "./compiler/index" // 安装插件后就不需要写index了，会默认找
import { compileToFunction } from "./compiler"

export function initMixin(Vue) { // 就是给Vue增加init方法
    Vue.prototype._init = function(options) { // 用于初始化操作
        // vue vm.$options 就是获取用户的配置
        // 我们使用 vue的时候，所有以$开头的都是vue自己的属性。$nextTick $data $attr....
        // 1. 把这个options放在实例上，在其他的方法里也可以拿到了。
        const vm = this // 将实例this赋值给vm
        vm.$options = options // 将用户的选项挂载到实例上

        // 2. 初始化状态：data 事件 计算属性等
        initState(vm)

        // 7-1
        // 如果options有el，就去挂载我们的应用
        if(options.el) {
            vm.$mount(options.el) // 实现数据的挂载
        }
    }
    // 7-2
    Vue.prototype.$mount = function(el) {
        const vm = this 
        el = document.querySelector(el) // 获取元素，获取#app对应的节点
        // 要判断一下用户的options里有没有写template模版？有没有写render函数？没有的话就用<div id="app">
        let ops = vm.$options
        console.log(ops)
        // （1）如果没有render需要去拿到模版转成render，如果有render直接赋值给ops
        if (!ops.render) { // 先进行查找有没有render函数
            let template // 没有render看一下是否写了template，没写template采用外部的template
            if (!ops.template && el ) { // 没有写模版没有写render函数，就把el作为模版
                template = el.outerHTML
            } else {
                if(el) {
                    template = ops.template // 写了template,就用写了的template
                }
            }
            console.log(template) // <div id="app"><div>{{name}}</div><span>{{age}}</span></div>
            // 需要将模版编译成render函数
            if (template) {
                const render = compileToFunction(template) // 把模版放进来
                ops.render = render // jsx最终会被编译成h('xxx'), jsx是靠babel做的编译，有个插件plugin。？？？
            }
        }
        // （2）赋值render到vm.$options上
        ops.render // 最终可以获取render方法

        // script 标签引用的vue.global.js 这个编译过程是在浏览器运行的
        // runtime运行时是不包含模版编译的，整个编译时打包的时候通过loader来转义.vue文件的。用runtime的时候不能使用模版（指的是template: '<div>hello</div>'属性）
    }

} 

