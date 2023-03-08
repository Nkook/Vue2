(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    // 重写数组中的部分方法，最后把重写的对象返回出去

    // 1. 首先拿到原来的数组的方法，通过原型
    let oldArrayProto = Array.prototype;

    // 2. 不能直接修改原来的，需要扩展出来一份。生成一份新的数组方法
    // newArrayProto.__proto__ = oldArrayProto
    let newArrayProto = Object.create(oldArrayProto); // Object.create() 方法用于创建一个新对象，使用现有的对象来作为新创建对象的原型（prototype）。

    // 找到所有的变异方法，就是能修改原数组的方法
    let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice']; // concat slice都不会改变原数组

    // 3. 重写这个方法
    methods.forEach(method => {
      // arr.push(1, 2, 3)
      newArrayProto[method] = function (...args) {
        // 这里重写了数组的方法
        // push.call(arr)
        // todo...
        const result = oldArrayProto[method].call(this, ...args); // 内部调用原来的方法，函数的劫持，叫做切片编程。这里的this谁调用方法push就指向谁，arr.push调用就指向arr

        console.log('method', method);
        // 5. 拿到实例上的observeArray方法: 这里的this指的是调用方法的，data调用的，指向data,从data上获取属性__ob__，这个属性指向Observer的实例，拿到实例对象，就可以用它身上的observeArray方法
        let ob = this.__ob__;
        // 4. 需要对新增的 数据再次进行劫持
        let inserted;
        switch (method) {
          case 'push':
          case 'unshift':
            // arr.unshift(1, 2, 3)
            inserted = args;
            break;
          case 'splice':
            // arr.splice(0, 1, {a: 1}, {b: 2})
            inserted = args.slice(2);
        }
        console.log(inserted); // 新增的内容
        if (inserted) {
          // 6. 对新增的内容再次进行观测：如何观测？还是通过前面的observeArray去观测，但是这里是拿不到observeArray的，
          // 只能拿到this，this指的是调用方法的对象，谁调用这些方法，this就是谁。在index.js可以看到data.__proto__ = newArrayProto，是data调用的这些方法，那么this指的就是data
          ob.observeArray(inserted);
        }
        return result;
      };
    });

    function observe(data) {
      // 对data这个对象进行劫持
      // 5-1 判断是否是对象 // 只对对象进行劫持
      if (typeof data !== 'object' || data == null) {
        return;
      }
      // 6-5 如果data上有个属性叫__ob__，它是类Observer的实例，说明这个对象被监测过了，直接把实例返回，不需要再观测了
      if (data.__ob__ instanceof Observer) {
        return data.__ob__;
      }

      // 5-2 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
      // 在内部又创建了一个类，这个类专门去观测数据的。如果这个数据被观测过，那么它的实例就是这个类
      // 对data这个数据进行观测
      return new Observer(data);
    }

    // 5-3
    class Observer {
      constructor(data) {
        // 6-6 如果data是个对象的话，也会加一个__ob__属性，然后进入else中，去遍历每一项，遍历到__ob__发现是个对象；会再次进入到Observer中，再添加个_ob__这样就形成了死循环。？？？？【这里理解不透彻】
        // 不能让data作为对象循环的时候遍历到这个__ob__属性，把它变成不可枚举类型，就可以了
        Object.defineProperty(data, '__ob__', {
          value: this,
          enumerable: false // 将__ob__变成不可枚举（循环的时候无法获取到）
        });
        // // 6-4 // 在data上加一个自定义属性__ob__ 把this放上去，把，this指的是Observer的实例对象
        // data.__ob__ = this  // 给数据加了一个标识，如果数据上有__ob__则说明这个属性被观测过了
        // 6-1 对象可以遍历，数组有很多个，遍历会造成性能差。如果是数组，
        if (Array.isArray(data)) {
          // 6-3 这里可以重写数组中的方法 7个变异方法，是可以修改数组本身的。
          data.__proto__ = newArrayProto; // 需要保留数组原有的特性，并且可以重写部分方法
          this.observeArray(data); // 如果数组中放的是对象，可以监控到对象的变化。
        } else {
          // 5-3 对这个数据的每个属性都劫持
          // Object.defineProperty只能劫持已经存在的属性，后增的、或删除的是不知道的。（vue2里会为此单独写一些api $set $delete）
          // 遍历这个对象
          this.walk(data);
        }
      }

      // 5-3 遍历对象进行观测
      walk(data) {
        // 循环对象，重新定义属性，对属性依次劫持
        // 重新定义属性 （性能差，相当于把属性重写了）
        // defineReactive方法 把data这个数据定义成响应式的，属性是当前的key，值是当前的data[key]。这个方法没写在类里，写在外面可以导出，其他地方也可以使用。
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
      }
      // 6-2 遍历数组进行观测
      observeArray(data) {
        data.forEach(item => observe(item)); // 如果数组中存在引用类型，则劫持该项中的每一个属性
      }
    }

    // 5-4
    function defineReactive(target, key, value) {
      // 属性劫持。闭包，里面的函数使用外面的value，这个变量不能被销毁
      // 5-8 深度属性劫持。针对某个属性值还是个对象
      observe(value); // 对所有的对象都进行属性劫持。
      // 5-4
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
          observe(newValue); // 5-9 如果修改值的时候直接赋值个对象，对这个对象里的每个属性进行劫持
          value = newValue;
        }
      });
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
