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
    data = typeof data === 'function' ? data.call(vm) : data
    console.log(data)
}