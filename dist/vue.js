(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    // 5-3
    class Observer {
      constructor(data) {
        // 对这个数据的每个属性都劫持
        // Object.defineProperty只能劫持已经存在的属性，后增的、或删除的是不知道的。（vue2里会为此单独写一些api $set $delete）
        // 遍历这个对象
        this.walk(data);
      }
      walk(data) {
        // 循环对象，重新定义属性，对属性依次劫持
        // 重新定义属性 （性能差，相当于把属性重写了）
        // defineReactive方法 把data这个数据定义成响应式的，属性是当前的key，值是当前的data[key]。这个方法没写在类里，写在外面可以导出，其他地方也可以使用。
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
      }
    }

    // 5-4
    function defineReactive(target, key, value) {
      // 属性劫持。闭包，里面的函数使用外面的value，这个变量不能被销毁
      // 5-8 深度属性劫持。针对某个属性值还是个对象
      observe(value); // 对所有的对象都进行属性劫持。
      Object.defineProperty(target, key, {
        get() {
          // 取值的时候会执行get
          console.log('用户取值了');
          return value;
        },
        set(newValue) {
          // 修改的时候会执行set
          console.log('用户设置值了');
          if (newValue === value) return;
          value = newValue;
        }
      });
    }
    function observe(data) {
      // 对data这个对象进行劫持
      // 5-1 判断是否是对象 // 只对对象进行劫持
      if (typeof data !== 'object' || data == null) {
        return;
      }

      // 5-2 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
      // 在内部又创建了一个类，这个类专门去观测数据的。如果这个数据被观测过，那么它的实例就是这个类
      // 对data这个数据进行观测
      return new Observer(data);
    }

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
      data = typeof data === 'function' ? data.call(vm) : data; // data是用户返回的对象
      console.log(data);

      // 5-5
      // 把对象放在了实例上，并对这个对象进行了观测。此时去打印vm，会发现有个_data属性下面有name和age及其对应的get和set；但是取值需要通过vm._data.name取，无法直接通过vm.name取值
      vm._data = data; // 我将返回的对象放到了_data上

      // 5. 对数据进行劫持
      // vue2采用了一个api defineProperty
      // 提供一个方法observe 去观测data数据: 响应式模块
      observe(data);

      // 5-6 想通过vm.xxx直接取值，需要将vm_data 用vm来代理就可以了。自己定义个方法
      for (let key in data) {
        proxy(vm, '_data', key); // 代理实例vm上的某个属性key叫_data。其实就是代理_data这个属性
      }
    }

    // 5-7
    function proxy(vm, target, key) {
      // 给vm对象，添加一个属性key，并给每个属性增加存取描述符属性
      Object.defineProperty(vm, key, {
        // vm.name
        get() {
          return vm[target][key]; // vm._data.name
        },

        set(newValue) {
          vm[target][key] = newValue;
        }
      });
    }

    // 到这里就有两次数据劫持，一次是把用户的数据进行了属性劫持，一次是代理，当取值的时候代理到了某个值

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
