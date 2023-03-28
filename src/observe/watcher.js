
// 10. 整个过程：
// 1）当我们渲染的时候会创建watcher，我们会把当前的渲染watcher放到全局dep.target上。
// 2）然后取值调用_render()；取值会走到index.js的get上；    this.getter = fn；fn是vm._update(vm._render())；
        // 在observe/index.js的 get方法上进行判断，当前属性的dep是否有target，有的话就让这个属性的收集器记住当前的watcher

import Dep from './dep'
console.log('Dep', Dep)


// 1. 需要区分是哪个watcher，每个组件都会有一个watcher，这样某个组件更新只需要更新这个组件的watcher就好。组件的特点：复用，方便维护，局部更新
// 每次创建一个watcher都给一个唯一的id
let id = 0

// 2. 创建一个watcher类（是个渲染的类）
class Watcher { // 不同组件有不同的watcher,每个组件都需要去创建一个watcher, 目前只有一个 渲染根实例的
    // vm是当前watcher是哪个实例，fn要做哪些事（渲染函数)，options是参数 
    constructor(vm, fn, options) {
        this.id = id++;
        // 7. 渲染watcher  // 8. 接着需要给每个属性增加dep创建observe/dep.js
        this.renderWatcher = options; // 这里做个标识是一个渲染watcher
        // 4. 把渲染的方法fn封装到了当前watcher中。这个函数是具备取值操作的，因为要渲染到页面上
        this.getter = fn; // getter意味着调用这个函数可以发生取值操作。fn是vm._update(vm._render())
        // 11. 收集dep: dep收集watcher的同时，让watcher也记录dep。// 后续我们实现计算属性，和一些清理工作需要用到
        //      去到dep.js中做处理 Dep.target.addDep(this)，把当前属性的dep传给watcher
        this.deps = [];
        // 13. 通过set对重复属性进行去重。如果一个属性在多个地方使用，不需要重复去收集watcher
        this.depsId = new Set();
        // 5. 页面初次渲染，如果首次传入进来fn但是不调用的话，那么页面第一次是无法渲染的。
        this.get();
    }
    // 12. 一个组件有多个属性，重复的属性也不用记录。去重
    // 这里实现了watcher收集dep，dep收集watcher，并进行了去重。
    addDep(dep) { 
        let id = dep.id;
        // 14. 这个id不是从0++的吗？那应该每次都不一样啊？？？怎么通过判断是否在这个集合呢？？？
        if (!this.depsId.has(id)) {
            this.deps.push(dep); // watcher记住这个dep 
            this.depsId.add(id); // 并将这个塞入depsId中，用于下次判断
            dep.addSub(this); // dep记住watcher。
        }
    }
    // 6. 首次取值需要调用 this.getter()也就是vm._update(vm._render()) 这个渲染方法
    get() {
        // 9. 在dep.js中增加个变量叫target。在执行watcher之前把这个watcher放到全局变量Dep上
        Dep.target = this // 把当前的watcher赋值给全局变量（类中的this指的都是当前的实例）；
        this.getter() // 调用_render()会取值，会去vm上取值；取值的时候
        Dep.target = null // 视图渲染完成后清空
    }
    // 15. 更新属性时需要调用更新
    // 这个watcher就可以理解为观察者，会观察某个属性。
    // 【每个属性有一个dep（属性就是被观察者），watcher就是观察者（属性变化了会通知观察者来更新），-> 观察者模式】
    update() {
        // queueWatcher(this); // 把当前的watcher 暂存起来
        this.get(); // 属性更新后， 重新渲染
    }
}

// 6. 需要让每个属性和watcher关联起来
/**
 * 需要给每个属性增加一个dep， 目的就是收集watcher
 * 一个组件对应一个watcher，一个组件中有多个属性，多个属性对应一个watcher
 * 一个属性有一个watcher，一个属性存在于多个组件中，一个属性对应多个watcher
 * 
 * （变量本身是和watcher没有关联的，想关联需要分配dep，让dep把watcher收集起来）
 * 多对多的关系
 */

// 3. 导出类，在3.index.html中进行 new Watcher并传入实例和回调函数
export default Watcher