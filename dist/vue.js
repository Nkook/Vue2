(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    function initState(vm) {
      const opts = vm.$options; // 获取所有的选项
      // 3. 如果选项中有data属性，则做数据初始化
      if (opts.data) {
        initData(vm);
      }
    }
    // 4. 数据初始化
    function initData(vm) {
      let data = vm.$options.data; // data可能是函数和对象
      data = typeof data === 'function' ? data.call(vm) : data;
      console.log(data);
    }

    function initMixin(Vue) {
      // 就是给Vue增加init方法
      Vue.prototype._init = function (options) {
        // 用于初始化操作
        // vue vm.$options 就是获取用户的配置
        // 我们使用 vue的时候，所有以$开头的都是vue自己的属性。$nextTick $data $attr....
        // 1. 把这个options放在实例上，在其他的方法里也可以拿到了。
        const vm = this; // 将实例this赋值给vm
        vm.$options = options; // 将用户的选项挂载到实例上

        // 2. 初始化状态：data 事件 计算属性等
        initState(vm);
      };
    }

    // class类是将所有的方法都耦合在一起不好维护
    function Vue(options) {
      // options就是用户的选项
      this._init(options); // 默认就调用了init
    }

    // 把原型方法扩展成一个个函数
    initMixin(Vue); // 扩展了init方法

    return Vue;

}));
//# sourceMappingURL=vue.js.map
