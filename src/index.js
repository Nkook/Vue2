// class类是将所有的方法都耦合在一起不好维护
// vue通过构造函数的方式，在其构造函数prototype上去添加方法，可以在多个文件去操作

import { initMixin } from "./init"

function Vue(options) { // options就是用户的选项
    this._init(options) // 默认就调用了init
}

// 把原型方法扩展成一个个函数
initMixin(Vue) // 扩展了init方法

// 接入lifecycle.js
lifecycle(Vue) // 扩展lifecycle方法

export default Vue