// 1-6 导入定义好的创建元素节点和文本节点的方法
import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom";

// 1-9 根据虚拟节点创建新的真节点
function createElm(vnode){
    let {tag,data,children,text} = vnode;
    // 先根据标签创建
    if(typeof tag === 'string'){ // 标签
        vnode.el =  document.createElement(tag); // 创建标签并赋值到虚拟节点上：这里将真实节点和虚拟节点对应起来，后续如果修改属性了，可以直接找到虚拟节点对应的真实节点
        patchProps(vnode.el,data); // 更新这个标签上的属性
        children.forEach(child => { // 标签的孩子
            vnode.el.appendChild( createElm(child))
        });
    }else{ // 文本
        vnode.el = document.createTextNode(text) // 创建文本并赋值到虚拟节点上
    }
    return vnode.el // 返回真实节点
}
// 1-10 更新属性
function patchProps(el,props){
    for(let key in props){
        if(key === 'style'){ // style{color:'red'}
            for(let styleName in props.style){
                el.style[styleName] = props.style[styleName];
            }
        }else{
            el.setAttribute(key,props[key]);
        }
    }
}

// 1-8 既有渲染又有更新：更新传老的虚拟节点，同时传入新的节点
function patch(oldVNode,vnode) {
    // 需要把原来的给删掉，创建一个新的
    // 写的是初渲染流程 
    const isRealElement = oldVNode.nodeType;
    if(isRealElement){ // 如果有真实节点
        const elm = oldVNode; // 获取真实元素
        const parentElm = elm.parentNode; // 拿到父元素
        // 1-11
        let newElm =  createElm(vnode); // 根据虚拟节点创建新的真节点
        parentElm.insertBefore(newElm,elm.nextSibling); // 找个原来节点的下一个节点，并把新的放入老节点的下面。
        parentElm.removeChild(elm); // 删除老节点

        return newElm
    }else{
        // diff算法
    }
}

// 导出lifecycle
export function lifecycle(Vue) {
    // 在Vue原型上扩展两个方法，下面的vm实例就可以调用
    
    //  1-2 1-7 将vnode转化成真实dom
    Vue.prototype._update = function(vnode) {
        console.log('update', vnode)
        const vm = this;
        const el = vm.$el;

        // 1-7 patch既有初始化的功能  又有更新 
        vm.$el = patch(el,vnode); // 用vnode创建真实的dom，替换掉原来的el
    }

    // 这几个方法都和虚拟节点及后面的diff算法有关，把这些方法都移到一个包里，vdom文件中
    // 1-3  _c('div',{},...children) _c创建元素节点
    Vue.prototype._c = function() {
        return  createElementVNode(this,...arguments) // 实例和参数
     }
     // 1-4  _v(text)  _v创建文本节点
     Vue.prototype._v = function() {
         return createTextVNode(this,...arguments)
     }
     // 1-5  _s是变量转成字符串
     Vue.prototype._s = function(value) {
         if(typeof value !== 'object') return value
         return JSON.stringify(value)
     }
    
     // 1-1 渲染虚拟dom
    //  执行render的时候，会执行里面的v c s方法，并去vm上取值
     Vue.prototype._render = function() {
        // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
        return this.$options.render.call(this); // 这里的render是通过ast语法转义后生成的render方法如下注释部分。让with中的this指向vm。此时执行会报错因为_v,_c,_s方法都未定义，需要定义。
    }
}       
        // render
        // ƒ anonymous(
        //     ) {
        //     with(this){return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))}
        //     }

// 导出mountComponent方法
export function mountComponent(vm,el) { // 这里的el 是通过querySelector处理过的
    vm.$el = el; // 把el挂载到vm实例上
    // 1.调用render方法产生虚拟节点 虚拟DOM
    vm._update(vm._render()); // vm.$options.render() 执行编译好的render方法，执行完后返回虚拟节点。vm._update方法是把虚拟节点变成真实节点

    // 2.根据虚拟DOM产生真实DOM 

    // 3.插入到el元素中

    // 4. 属性和我们的视图关联起来 做到数据变化可以自动更新视图 （观察者模式）observe/watcher.js（10 节课 实现vue的依赖收集）
    const updateComponent = ()=> {
        vm._update(vm._render())
    }
    // 这个watcher是个渲染watcher，只要new就会去调用这个updateComponent，并进行取值渲染
    let wat = new Watcher(vm, updateComponent, true) // true用于标识是一个渲染watcher // new Watcher 会去执行class Watcher，里面进行页面渲染取值
    console.log('wat', Watcher)
}


// vue核心流程 
// 1） 创造了响应式数据  
// 2） 模板转换成ast语法树  
// 3) 将ast语法树转换了render函数 
// 4) 后续每次数据更新可以只执行render函数 (无需再次执行ast转化的过程) // 通过传入不同的数据，render函数就可以返回不同的虚拟节点。
// _render()函数根据数据创建最新的虚拟DOM节点（使用响应式数据）
// _update()根据生成的虚拟节点创造真实的DOM,重新渲染

