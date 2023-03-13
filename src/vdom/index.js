// 专门用于构建虚拟dom的方法

// 1. h()  _c() 创建元素的虚拟节点
export function createElementVNode(vm, tag, data, ...children) {
    if (data == null) {
        data = {}
    }
    let key = data.key; // 属性的key值
    if (key) {
        delete data.key
    }
    return vnode(vm, tag, key, data, children); // 虚拟节点上有vm实例，标签，key，属性，孩子
}
// 3. _v();  创建文本的虚拟节点
export function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
}
// 和ast一样吗？ ast做的是语法层面的转化 他描述的是语法本身 (可以描述js css html)
// 2. 我们的虚拟dom 是描述的dom元素，可以增加一些自定义属性  (描述dom的)
// diff算法中有key
function vnode(vm, tag, key, data, children, text) {
    return {
        vm,
        tag,
        key,
        data,
        children,
        text
        // .... 事件 插槽 指令
    }
}