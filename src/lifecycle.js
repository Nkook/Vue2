
// 导出lifecycle
export function lifecycle(Vue) {
    // 在Vue原型上扩展两个方法，下面的vm实例就可以调用
    Vue.prototype._update = function(vnode){ // 1-2 将vnode转化成真实dom
        
    }

    Vue.prototype._render = function(){ // 1-1 渲染虚拟dom
        
    }
}

// 导出mountComponent方法
export function mountComponent() {
    // 1.调用render方法产生虚拟节点 虚拟DOM

    vm._update(vm._render()); // vm.$options.render() 执行编译好的render方法，执行完后返回虚拟节点。vm._update方法是把虚拟节点变成真实节点

    // 2.根据虚拟DOM产生真实DOM 

    // 3.插入到el元素中
}


// vue核心流程 
// 1） 创造了响应式数据  
// 2） 模板转换成ast语法树  
// 3) 将ast语法树转换了render函数 
// 4) 后续每次数据更新可以只执行render函数 (无需再次执行ast转化的过程) // 通过传入不同的数据，render函数就可以返回不同的虚拟节点。
// render函数会去产生虚拟节点（使用响应式数据）
// 根据生成的虚拟节点创造真实的DOM

